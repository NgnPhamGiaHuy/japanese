"use client";

import { useEffect, useRef } from "react";

import { browserLocalPersistence, onIdTokenChanged, setPersistence } from "firebase/auth";

import { deliverPendingNotifications } from "@/features/notifications";
import { auth } from "@/lib/firebase";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils";
import { useAppStore } from "@/store";

// Module-level ref so it survives component remounts / page navigations.
// This prevents duplicate login logs on every hard navigation.
let _lastLoggedUid: string | null = null;

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

                // Log login only on first appearance across the entire session,
                // not on token refresh or component remount.
                if (user.uid !== _lastLoggedUid) {
                    _lastLoggedUid = user.uid;
                    if (token) {
                        enqueueClientLog(() => Promise.resolve(token!), {
                            action: ActivityAction.LOGIN,
                            entityType: "auth",
                            entityId: user.uid,
                            level: "info",
                            metadata: {
                                logType: "AUTH",
                                userName: user.displayName ?? undefined,
                                userEmail: user.email ?? undefined,
                                provider: user.providerData[0]?.providerId ?? "unknown",
                            },
                        });
                    }

                    // Deliver any pending notifications (email invites) on first login
                    if (user.email) {
                        deliverPendingNotifications(user.uid, user.email).catch(() => {});
                    }
                }
            } else {
                clearAuthCookie();
                setUser(null);
                _lastLoggedUid = null;
            }
            setAuthReady(true);
        });

        return unsubscribe;
    }, [setUser, setAuthReady]);
}
