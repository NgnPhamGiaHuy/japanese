"use client";

import { useCallback, useEffect, useReducer } from "react";

import { useAppStore } from "@/store";
import * as LessonService from "../services";

import type { FlashCard, Lesson } from "../types";

interface LessonsState {
    lessons: Lesson[];
    loading: boolean;
    error: string | null;
}

type Action =
    | { type: "RESET"; hasUser: boolean }
    | { type: "SET"; lessons: Lesson[] }
    | { type: "ERROR"; error: string };

function reducer(state: LessonsState, action: Action): LessonsState {
    switch (action.type) {
        case "RESET":
            return { lessons: [], loading: action.hasUser, error: null };
        case "SET":
            return { lessons: action.lessons, loading: false, error: null };
        case "ERROR":
            return { ...state, loading: false, error: action.error };
        default:
            return state;
    }
}

/**
 * Real-time hook for the current user's flashcard lessons/decks.
 */
export function useLessons() {
    const user = useAppStore((s) => s.user);

    const [state, dispatch] = useReducer(reducer, {
        lessons: [],
        loading: !!user,
        error: null,
    });

    useEffect(() => {
        // Dispatch is not setState — dispatching from an effect is safe and
        // does not trigger the react-hooks/set-state-in-effect lint rule.
        dispatch({ type: "RESET", hasUser: !!user });

        if (!user) return;

        const unsubscribe = LessonService.subscribeLessons(
            user.uid,
            (lessons) => dispatch({ type: "SET", lessons }),
            (err) => {
                console.error("[useLessons] Firestore error:", err);
                dispatch({
                    type: "ERROR",
                    error: "Could not load your lessons. Please check your connection and try again.",
                });
            },
        );

        return unsubscribe;
    }, [user?.uid]);

    // ── Write helpers ────────────────────────────────────────────────────

    const updateLesson = useCallback(
        async (lesson: Lesson): Promise<void> => {
            if (!user) return;
            await LessonService.updateLesson(user.uid, lesson);
        },
        [user],
    );

    const deleteLesson = useCallback(
        async (id: string): Promise<void> => {
            if (!user) return;
            await LessonService.deleteLessonWithCards(user.uid, id);
        },
        [user],
    );

    const saveFullLesson = useCallback(
        async (lesson: Lesson, cards: FlashCard[], isNew: boolean): Promise<void> => {
            if (!user) return;
            const targetUserId = lesson.userId || user.uid;
            const lessonWithOwner: Lesson = isNew
                ? {
                      ...lesson,
                      owner: lesson.owner ?? {
                          displayName: user.displayName ?? null,
                          photoURL: user.photoURL ?? null,
                      },
                  }
                : lesson;
            await LessonService.saveLessonWithCards(targetUserId, lessonWithOwner, cards, isNew);
        },
        [user],
    );

    const updateVisibility = useCallback(
        async (
            lessonId: string,
            visibility: Lesson["visibility"],
            publicRole: Lesson["publicRole"],
        ): Promise<void> => {
            if (!user) return;
            await LessonService.updateLessonVisibility(user.uid, lessonId, visibility, publicRole);
        },
        [user],
    );

    const updateLessonRoles = useCallback(
        async (
            lessonId: string,
            roles: Record<string, "owner" | "editor" | "commenter" | "viewer">,
            collaborators: string[],
        ): Promise<void> => {
            if (!user) return;
            await LessonService.updateLessonRoles(user.uid, lessonId, roles, collaborators);
        },
        [user],
    );

    return {
        ...state,
        updateLesson,
        deleteLesson,
        saveFullLesson,
        updateVisibility,
        updateLessonRoles,
    };
}
