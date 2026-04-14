"use client";

import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "@/store";
import * as LessonService from "../services";

import type { FlashCard, Lesson } from "../types";

/**
 * Internal state for the lessons collection.
 */
interface LessonsState {
    /** Array of lesson/deck metadata */
    lessons: Lesson[];
    /** True during initial hydration from Firestore */
    loading: boolean;
    /** Connectivity or permission error messages */
    error: string | null;
}

/**
 * Real-time hook for the current user's flashcard lessons/decks.
 *
 * @remarks
 * Orchestration details:
 * 1. **RT Sync**: Opens an `onSnapshot` listener on mount.
 * 2. **Auto-Cleanup**: Automatically unsubscribes when the UID changes or component unmounts.
 * 3. **Service-Only**: All write operations are delegated to `LessonService` to ensure
 *    architectural purity and single-source-of-truth logic for complex operations (like atomic saves).
 *
 * @returns Metadata-level state and management actions for current user's lessons.
 */
export function useLessons() {
    const user = useAppStore((s) => s.user);

    const [state, setState] = useState<LessonsState>({
        lessons: [],
        loading: !!user,
        error: null,
    });

    const [prevUserId, setPrevUserId] = useState(user?.uid);
    if (user?.uid !== prevUserId) {
        setPrevUserId(user?.uid);
        setState({
            lessons: [],
            loading: !!user,
            error: null,
        });
    }

    useEffect(() => {
        if (!user) return;

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
    }, [user?.uid]);

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
            const targetUserId = lesson.userId || user.uid;
            await LessonService.saveLessonWithCards(targetUserId, lesson, cards, isNew);
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
            allowLinkAccess: boolean,
            publicRole: Lesson["publicRole"],
        ): Promise<void> => {
            if (!user) return;
            await LessonService.shareLessonSettings(
                user.uid,
                lessonId,
                allowLinkAccess,
                publicRole,
            );
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
        shareLesson,
        updateLessonRoles,
    };
}
