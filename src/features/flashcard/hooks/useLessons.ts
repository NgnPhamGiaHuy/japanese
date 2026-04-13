"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAppStore } from "@/store/useAppStore";
import * as LessonService from "../services/lesson.service";

import type { FlashCard, Lesson } from "../types/flashcard.types";

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

    // Stable ref so callbacks always see the latest lessons without causing
    // re-subscriptions on every render.
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

    const updateLesson = useCallback(
        async (lesson: Lesson): Promise<void> => {
            if (!user) return;
            await LessonService.updateLesson(user.uid, lesson);
        },
        [user],
    );

    /**
     * Deletes a lesson and all its cards (including Storage images).
     * Uses `deleteLessonWithCards` — never leaves orphaned cards.
     */
    const deleteLesson = useCallback(
        async (id: string): Promise<void> => {
            if (!user) return;
            await LessonService.deleteLessonWithCards(user.uid, id);
        },
        [user],
    );

    /**
     * Saves a lesson + its full card set.  For existing lessons, a diff
     * determines which cards to create / update / delete — no destructive
     * full-replace.
     */
    const saveFullLesson = useCallback(
        async (lesson: Lesson, cards: FlashCard[], isNew: boolean): Promise<void> => {
            if (!user) return;
            await LessonService.saveLessonWithCards(user.uid, lesson, cards, isNew);
        },
        [user],
    );

    /**
     * Toggles public sharing for a lesson.  Generates a stable shareId,
     * writes `isPublic` and `publicRole` to Firestore.
     *
     * Delegates entirely to the service — no Firebase calls here.
     */
    const shareLesson = useCallback(
        async (
            lessonId: string,
            isPublic: boolean,
            publicRole: Lesson["publicRole"],
        ): Promise<void> => {
            if (!user) return;
            await LessonService.shareLessonSettings(user.uid, lessonId, isPublic, publicRole);
        },
        [user],
    );

    return {
        ...state,
        updateLesson,
        deleteLesson,
        saveFullLesson,
        shareLesson,
    };
}
