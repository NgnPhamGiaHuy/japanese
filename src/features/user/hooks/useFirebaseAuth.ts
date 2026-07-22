"use client";

import { useEffect } from "react";

import { browserLocalPersistence, onIdTokenChanged, setPersistence } from "firebase/auth";

import { deliverPendingNotifications } from "@/features/notifications";
import { logUserLogin } from "@/features/user/services/auth-logging.service";
import { useAppStore } from "@/lib/app-store";
import { auth } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { createSessionAction, revokeSessionAction } from "../actions/session.actions";

/**
 * Firebase Auth integration hook.
 *
 * **Architecture:**
 * - Uses `onIdTokenChanged` for auth state + cookie management
 * - Delegates login logging to server-side deduplication service
 *
 * **Why this approach:**
 * 1. `onIdTokenChanged` handles both sign-in AND token refresh
 * 2. Server-side deduplication prevents spam from:
 *    - React remounts (Strict Mode, navigation)
 *    - Token refresh (~every 1 hour)
 *    - Page refresh
 *    - Multiple concurrent requests
 * 3. Firestore transaction ensures atomic check-and-set
 * 4. 30-minute session window balances accuracy vs spam prevention
 *
 * **Previous failed approaches:**
 * - Module-level variables → Reset on navigation
 * - sessionStorage → Doesn't survive all edge cases
 * - onAuthStateChanged → Still fires multiple times
 * - Client-side guards → Race conditions, not reliable
 *
 * **Current solution:** Server-side session tracking with Firestore transactions
 */
export function useFirebaseAuth() {
    const { setUser, setAuthReady } = useAppStore();

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence).catch((err) =>
            console.error("[Firebase] Persistence error:", err),
        );

        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (user) {
                let token: string | null = null;
                try {
                    token = await user.getIdToken();
                    const result = await createSessionAction(token);
                    if (!result.ok) {
                        console.error(
                            "[useFirebaseAuth] createSessionAction failed:",
                            result.error,
                        );
                        enqueueClientLog(() => user.getIdToken(), {
                            action: ActivityAction.SESSION_MINT_FAILED,
                            entityType: "auth",
                            entityId: user.uid,
                            level: "error",
                            metadata: { source: "onIdTokenChanged", error: result.error },
                        });
                    }
                } catch (err) {
                    console.error("[useFirebaseAuth] session mint round-trip failed:", err);
                }
                setUser(user);

                // Delegate login logging to server-side with deduplication
                // This handles session restoration on page load/refresh
                if (token) {
                    logUserLogin(token, {
                        uid: user.uid,
                        displayName: user.displayName ?? undefined,
                        email: user.email ?? undefined,
                        provider: user.providerData[0]?.providerId ?? "unknown",
                    }).catch((err) => {
                        console.error("[useFirebaseAuth] logUserLogin failed:", err);
                        enqueueClientLog(() => user.getIdToken(), {
                            action: ActivityAction.LOGIN_LOG_FAILED,
                            entityType: "auth",
                            entityId: user.uid,
                            level: "error",
                            metadata: { source: "onIdTokenChanged", error: String(err) },
                        });
                    });
                }

                // Deliver pending notifications
                if (user.email) {
                    deliverPendingNotifications(user.uid, user.email).catch((err) => {
                        console.error("[useFirebaseAuth] deliverPendingNotifications failed:", err);
                        enqueueClientLog(() => user.getIdToken(), {
                            action: ActivityAction.NOTIFICATION_DELIVERY_FAILED,
                            entityType: "notification",
                            entityId: user.uid,
                            level: "error",
                            metadata: { error: String(err) },
                        });
                    });
                }
            } else {
                // User logged out (handled by signOut() function, which already
                // revokes the session — this is a defensive, idempotent backstop
                // in case onIdTokenChanged fires user:null via some other path).
                void revokeSessionAction();
                setUser(null);
            }
            setAuthReady(true);
        });

        return unsubscribe;
    }, [setUser, setAuthReady]);
}
