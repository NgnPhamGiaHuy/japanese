"use client";

import { useEffect } from "react";

import { browserLocalPersistence, onIdTokenChanged, setPersistence } from "firebase/auth";

import { deliverPendingNotifications } from "@/features/notifications";
import { auth } from "@/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils";
import { useAppStore } from "@/store";
import { logUserLogin } from "@/features/user/services/auth-logging.service";

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
                    setAuthCookie(token);
                } catch {
                    clearAuthCookie();
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
                    }).catch(() => {});
                }

                // Deliver pending notifications
                if (user.email) {
                    deliverPendingNotifications(user.uid, user.email).catch(() => {});
                }
            } else {
                // User logged out (handled by signOut() function)
                clearAuthCookie();
                setUser(null);
            }
            setAuthReady(true);
        });

        return unsubscribe;
    }, [setUser, setAuthReady]);
}
