"use client";

import { useEffect, useReducer } from "react";

import { fetchPublicLessons } from "../services";

import type { Lesson } from "../types";

interface PublicLessonsState {
    lessons: Lesson[];
    loading: boolean;
    error: string | null;
}

type Action =
    | { type: "RESET" }
    | { type: "SET"; lessons: Lesson[] }
    | { type: "ERROR"; error: string };

function reducer(state: PublicLessonsState, action: Action): PublicLessonsState {
    switch (action.type) {
        case "RESET":
            return { lessons: [], loading: true, error: null };
        case "SET":
            return { lessons: action.lessons, loading: false, error: null };
        case "ERROR":
            return { lessons: [], loading: false, error: action.error };
        default:
            return state;
    }
}

/**
 * One-time fetch hook for globally public/discoverable decks.
 * Ordered by cloneCount descending (most popular first).
 */
export function usePublicLessons(pageLimit = 20) {
    const [state, dispatch] = useReducer(reducer, {
        lessons: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        dispatch({ type: "RESET" });

        let cancelled = false;

        fetchPublicLessons(pageLimit)
            .then((lessons) => {
                if (!cancelled) dispatch({ type: "SET", lessons });
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("[usePublicLessons] Firestore error:", err);
                    dispatch({ type: "ERROR", error: "Could not load public decks." });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [pageLimit]);

    return state;
}
