"use client";

/**
 * @file LessonsContext.tsx
 *
 * Lifts the two Firestore onSnapshot subscriptions behind `useLessons`
 * (personal decks + shared decks) to a single context mounted once at the
 * app-shell level — the same pattern NotificationsContext and
 * UserProgressContext already established (ADR-113, T-113b).
 *
 * WHY THIS IS NEEDED
 * ──────────────────
 * `useLessons()` had 10 call sites across the app. Several co-mount in the
 * SAME render tree: `FlashcardDashboard` calls it directly, and ALSO renders
 * `useDashboardState()` and `useDashboardModals()`, both of which call it
 * independently — three redundant `useLessons()` calls, six onSnapshot
 * listeners (2 each), for the exact same two entities, from one page.
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import { subscribeLessons, subscribeSharedLessons } from "../services";

import type { Lesson } from "../types";

interface LessonsContextValue {
    lessons: Lesson[];
    sharedLessons: Lesson[];
    loading: boolean;
    error: string | null;
}

const EMPTY: Lesson[] = [];

const LessonsContext = createContext<LessonsContextValue>({
    lessons: EMPTY,
    sharedLessons: EMPTY,
    loading: true,
    error: null,
});

export function LessonsProvider({ children }: { children: React.ReactNode }) {
    const user = useAppStore((s) => s.user);
    const currentUid = user?.uid ?? null;

    const [state, setState] = useState<{
        uid: string | null;
        lessons: Lesson[];
        sharedLessons: Lesson[];
        error: string | null;
    }>({ uid: null, lessons: EMPTY, sharedLessons: EMPTY, error: null });
    const [loading, setLoading] = useState(true);
    const loadedUidRef = useRef<string | null>(null);

    useEffect(() => {
        // On logout the render-time `effectiveLoading`/`lessons` guards below
        // already yield false/EMPTY (currentUid is null), so there's nothing
        // to subscribe to and no state to clear beyond the ref.
        if (!currentUid) {
            loadedUidRef.current = null;
            return;
        }
        const uid = currentUid;
        if (loadedUidRef.current !== uid) {
            setLoading(true);
        }

        const unsubPersonal = subscribeLessons(
            uid,
            (lessons) => {
                loadedUidRef.current = uid;
                setState((prev) => ({ ...prev, uid, lessons, error: null }));
                setLoading(false);
            },
            (err) => {
                console.error("[LessonsContext] Personal lessons error:", err);
                setState((prev) => ({ ...prev, uid, error: "Could not load your lessons." }));
                setLoading(false);
            },
        );

        const unsubShared = subscribeSharedLessons(
            uid,
            (sharedLessons) => setState((prev) => ({ ...prev, uid, sharedLessons })),
            (err) => {
                console.error("[LessonsContext] Shared lessons error:", err);
            },
        );

        return () => {
            unsubPersonal();
            unsubShared();
        };
    }, [currentUid]);

    // Only trust cached data that belongs to the CURRENT user — on an A → B
    // switch, `state` still holds A's data until B's first snapshot arrives.
    const belongsToCurrentUser = state.uid === currentUid;
    const lessons = belongsToCurrentUser ? state.lessons : EMPTY;
    const sharedLessons = belongsToCurrentUser ? state.sharedLessons : EMPTY;
    const error = belongsToCurrentUser ? state.error : null;
    const effectiveLoading = currentUid ? loading : false;

    return (
        <LessonsContext.Provider
            value={{ lessons, sharedLessons, loading: effectiveLoading, error }}
        >
            {children}
        </LessonsContext.Provider>
    );
}

/** Returns the shared lessons-read state. Must be used inside `<LessonsProvider>`. */
export function useLessonsContext(): LessonsContextValue {
    return useContext(LessonsContext);
}
