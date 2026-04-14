"use client";

import { useEffect } from "react";

import { browserLocalPersistence, onIdTokenChanged, setPersistence } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { clearAuthCookie, setAuthCookie } from "@/shared/utils";
import { useAppStore } from "@/store";

/**
 * Bootstraps Firebase auth persistence and subscribes to token changes.
 * - `onIdTokenChanged` fires on: initial load, sign-in, sign-out, and each
 *    automatic token refresh (~every 1 hour). This keeps the auth cookie
 *    in sync without manual refresh logic.
 * Must be called once — inside the root Providers component.
 */
export function useFirebaseAuth() {
    const { setUser, setAuthReady } = useAppStore();

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence).catch((err) =>
            console.error("[Firebase] Persistence error:", err),
        );

        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (user) {
                try {
                    const token = await user.getIdToken();
                    setAuthCookie(token);
                } catch {
                    clearAuthCookie();
                }
                setUser(user);
            } else {
                clearAuthCookie();
                setUser(null);
            }
            setAuthReady(true);
        });

        return unsubscribe;
    }, [setUser, setAuthReady]);
}
