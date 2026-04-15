"use client";

import { useEffect, useReducer } from "react";

import { useAppStore } from "@/store";
import { subscribeSharedWithMe } from "../services";

import type { Lesson } from "../types";

interface SharedWithMeState {
    lessons: Lesson[];
    loading: boolean;
    error: string | null;
}

type Action =
    | { type: "RESET"; hasUser: boolean }
    | { type: "SET"; lessons: Lesson[] }
    | { type: "ERROR"; error: string };

function reducer(state: SharedWithMeState, action: Action): SharedWithMeState {
    switch (action.type) {
        case "RESET":
            return { lessons: [], loading: action.hasUser, error: null };
        case "SET":
            return { lessons: action.lessons, loading: false, error: null };
        case "ERROR":
            return { lessons: [], loading: false, error: action.error };
        default:
            return state;
    }
}

/**
 * Real-time hook for decks explicitly shared with the current user.
 * Excludes decks the user owns — only shows decks where they are a collaborator.
 */
export function useSharedWithMe() {
    const user = useAppStore((s) => s.user);

    const [state, dispatch] = useReducer(reducer, {
        lessons: [],
        loading: !!user,
        error: null,
    });

    useEffect(() => {
        dispatch({ type: "RESET", hasUser: !!user });

        if (!user) return;

        const unsubscribe = subscribeSharedWithMe(
            user.uid,
            (lessons) => dispatch({ type: "SET", lessons }),
            (err) => {
                console.error("[useSharedWithMe] Firestore error:", err);
                dispatch({ type: "ERROR", error: "Could not load shared decks." });
            },
        );

        return unsubscribe;
    }, [user?.uid]);

    return state;
}
