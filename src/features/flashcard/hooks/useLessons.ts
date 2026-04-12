"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAppStore } from "@/store/useAppStore";

import * as LessonService from "../services/lesson.service";

import type { Lesson } from "../types/flashcard.types";

interface LessonsState {
    lessons: Lesson[];
    loading: boolean;
    error: string | null;
}

/**
 * Real-time hook for the current user's flashcard lessons.
 *
 * Opens an `onSnapshot` listener on mount (and whenever `user` changes).
 * All write operations delegate to the service layer — no Firebase SDK
 * calls are made directly in this hook or in UI components.
 */
export function useLessons() {
    const user = useAppStore((s) => s.user);

    const [state, setState] = useState<LessonsState>({
        lessons: [],
        loading: true,
        error: null,
    });

    // Stable ref so callbacks always see the current lessons without being
    // re-created on every render (avoids unnecessary re-subscriptions).
    const lessonsRef = useRef<Lesson[]>([]);
    lessonsRef.current = state.lessons;

    useEffect(() => {
        if (!user) {
            setState({ lessons: [], loading: false, error: null });
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        const unsubscribe = LessonService.subscribeLessons(
            user.uid,
            (lessons) => setState({ lessons, loading: false, error: null }),
            (err) => {
                console.error("[useLessons] Firestore error:", err);
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: "Could not load your lessons. Please check your connection and try again.",
                }));
            },
        );

        return unsubscribe;
    }, [user]);

    // ── Write helpers ────────────────────────────────────────────────────

    const createLesson = useCallback(
        async (lesson: Omit<Lesson, "id">): Promise<void> => {
            if (!user) return;
            await LessonService.createLesson(user.uid, lesson);
            // onSnapshot will push the new lesson into state automatically.
        },
        [user],
    );

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
            await LessonService.deleteLesson(user.uid, id);
        },
        [user],
    );

    /**
     * Records a correct / incorrect result for one card in a lesson.
     * The current cards array is read from the stable ref to avoid
     * stale-closure issues inside game callbacks.
     */
    const recordCardResult = useCallback(
        async (lessonId: string, cardId: string, knew: boolean): Promise<void> => {
            if (!user) return;
            const lesson = lessonsRef.current.find((l) => l.id === lessonId);
            if (!lesson) return;
            await LessonService.recordCardResult(user.uid, lessonId, lesson.cards, cardId, knew);
        },
        [user],
    );

    return {
        ...state,
        createLesson,
        updateLesson,
        deleteLesson,
        recordCardResult,
    };
}
