"use client";

import { useEffect } from "react";
import {
    browserLocalPersistence,
    onAuthStateChanged,
    setPersistence,
    signInAnonymously,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";

/**
 * Bootstraps Firebase anonymous auth and subscribes to auth state changes.
 * Must be called once — in the root layout's client provider.
 */
export function useFirebaseAuth() {
    const { setUser, setAuthReady } = useAppStore();

    useEffect(() => {
        const init = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                await signInAnonymously(auth);
            } catch (err) {
                console.error("[Firebase] Auth init error:", err);
            } finally {
                setAuthReady(true);
            }
        };

        init();
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));

        return () => unsubscribe?.();
    }, [setUser, setAuthReady]);
}
