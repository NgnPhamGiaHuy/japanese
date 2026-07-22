"use client";

/**
 * @file UserProgressContext.tsx
 *
 * Lifts the Firestore onSnapshot subscription for user progress (XP, streak,
 * lesson counts, learned chars, per-char stats) to a single context mounted
 * once at the app-shell level — the same pattern NotificationsContext
 * already established for the notifications inbox (ADR-113, T-113a).
 *
 * WHY THIS IS NEEDED
 * ──────────────────
 * Without this, every one of useUserProgress's 10 call sites opened its own
 * independent onSnapshot listener against the same document — 10 mounted
 * consumers meant 10 live Firestore connections streaming identical data,
 * multiplying connection cost, client memory, and read-quota billing for no
 * benefit (R-1). With this context, one listener is opened per signed-in
 * user and every consumer reads the same already-populated state.
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import { subscribeUserProgress } from "../services";
import { INITIAL_USER_DATA } from "../types";

import type { UserData } from "../types";

interface UserProgressContextValue {
    userData: UserData;
    loading: boolean;
}

const UserProgressContext = createContext<UserProgressContextValue>({
    userData: INITIAL_USER_DATA,
    loading: true,
});

export function UserProgressProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAppStore();
    const currentUid = user?.uid ?? null;

    const [state, setState] = useState<{ uid: string | null; data: UserData }>({
        uid: null,
        data: INITIAL_USER_DATA,
    });
    const [loading, setLoading] = useState(true);
    // Tracks which uid the current `state` belongs to, so a user switch (or
    // logout→login as someone else) doesn't briefly show the previous user's
    // cached progress before the new subscription's first snapshot arrives.
    const loadedUidRef = useRef<string | null>(null);

    useEffect(() => {
        // On logout the render-time `effectiveLoading` guard below already
        // yields false (currentUid is null), so there's nothing to
        // subscribe to and no loading state to clear beyond the ref.
        if (!currentUid) {
            loadedUidRef.current = null;
            return;
        }
        const uid = currentUid;
        // Only (re-)enter the loading state on an actual uid change — this
        // is also what keeps the synchronous setState conditional rather
        // than unconditional (react-hooks/set-state-in-effect), matching
        // NotificationsContext's identical guard.
        if (loadedUidRef.current !== uid) {
            setLoading(true);
        }

        const unsub = subscribeUserProgress(
            uid,
            (data) => {
                loadedUidRef.current = uid;
                setState({ uid, data });
                setLoading(false);
            },
            () => setLoading(false),
        );

        return unsub;
    }, [currentUid]);

    // Only trust cached data that belongs to the CURRENT user — on an A → B
    // switch, `state` still holds A's data until B's first snapshot arrives.
    const userData = state.uid === currentUid ? state.data : INITIAL_USER_DATA;
    const effectiveLoading = currentUid ? loading : false;

    return (
        <UserProgressContext.Provider value={{ userData, loading: effectiveLoading }}>
            {children}
        </UserProgressContext.Provider>
    );
}

/** Returns the shared progress-read state. Must be used inside `<UserProgressProvider>`. */
export function useUserProgressContext(): UserProgressContextValue {
    return useContext(UserProgressContext);
}
