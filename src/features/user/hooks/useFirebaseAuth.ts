"use client";

import { useEffect } from "react";

import { browserLocalPersistence, onIdTokenChanged, setPersistence } from "firebase/auth";

import { deliverPendingNotifications } from "@/features/notifications";
import { auth } from "@/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils";
import { useAppStore } from "@/store";

export function useFirebaseAuth() {
    const { setUser, setAuthReady } = useAppStore();

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence).catch((err) =>
            console.error("[Firebase] Persistence error:", err),
        );

        let lastUid: string | null = null;

        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    setAuthCookie(token);
                } catch {
                    clearAuthCookie();
                }
                setUser(user);

                // Deliver any pending notifications (email invites) on first login
                if (user.email && user.uid !== lastUid) {
                    lastUid = user.uid;
                    deliverPendingNotifications(user.uid, user.email).catch(() => {});
                }
            } else {
                clearAuthCookie();
                setUser(null);
                lastUid = null;
            }
            setAuthReady(true);
        });

        return unsubscribe;
    }, [setUser, setAuthReady]);
}
