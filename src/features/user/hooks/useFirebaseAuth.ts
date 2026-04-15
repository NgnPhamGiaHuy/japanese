"use client";

import { useEffect } from "react";

import { browserLocalPersistence, onIdTokenChanged, setPersistence } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { deliverPendingNotifications } from "@/features/notifications";
import { APP_ID, auth, db } from "@/lib/firebase";
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

                // Write/refresh public profile so other users can resolve owner names
                setDoc(
                    doc(db, "artifacts", APP_ID, "userProfiles", user.uid),
                    {
                        displayName: user.displayName ?? null,
                        photoURL: user.photoURL ?? null,
                        updatedAt: Date.now(),
                    },
                    { merge: true },
                ).catch(() => {});

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
