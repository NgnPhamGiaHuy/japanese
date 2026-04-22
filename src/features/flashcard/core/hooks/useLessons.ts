"use client";

import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "@/store";
import { logDeckCreated, logDeckDeleted, logDeckUpdated } from "../actions/activity-log.actions";
import * as LessonService from "../services";

import type { DeckAccessRole, FlashCard, Lesson } from "../types";

/**
 * Internal state for the lessons collection.
 */
interface LessonsState {
    /** Array of user's own lesson/deck metadata */
    lessons: Lesson[];
    /** Array of lessons shared with the user */
    sharedLessons: Lesson[];
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
 * 1. **RT Sync**: Opens `onSnapshot` listeners for both personal and shared decks.
 * 2. **Auto-Cleanup**: Automatically unsubscribes when the UID changes or component unmounts.
 * 3. **Service-Only**: All write operations are delegated to `LessonService`.
 *
 * @returns Metadata-level state and management actions for current user's lessons.
 */
export function useLessons() {
    const user = useAppStore((s) => s.user);

    const [state, setState] = useState<LessonsState>({
        lessons: [],
        sharedLessons: [],
        loading: !!user,
        error: null,
    });

    useEffect(() => {
        setState({
            lessons: [],
            sharedLessons: [],
            loading: !!user,
            error: null,
        });

        if (!user) return;

        // Subscribe to personal lessons
        const unsubPersonal = LessonService.subscribeLessons(
            user.uid,
            (lessons) => setState((prev) => ({ ...prev, lessons, loading: false, error: null })),
            (err) => {
                console.error("[useLessons] Personal lessons error:", err);
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    error: "Could not load your lessons.",
                }));
            },
        );

        // Subscribe to shared lessons
        const unsubShared = LessonService.subscribeSharedLessons(
            user.uid,
            (sharedLessons) =>
                setState((prev) => ({ ...prev, sharedLessons, loading: false, error: null })),
            (err) => {
                console.error("[useLessons] Shared lessons error:", err);
            },
        );

        return () => {
            unsubPersonal();
            unsubShared();
        };
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
            // Capture title before deletion for the audit log
            const lesson = state.lessons.find((l) => l.id === id);
            await LessonService.deleteLessonWithCards(user.uid, id);
            try {
                const token = await user.getIdToken();
                void logDeckDeleted(token, user.uid, id, lesson?.title ?? "");
            } catch {
                // Non-blocking
            }
        },
        [user, state.lessons],
    );

    /**
     * Saves a lesson + its full card set.  For existing lessons, a diff
     * determines which cards to create / update / delete — no destructive
     * full-replace.
     */
    const saveFullLesson = useCallback(
        async (lesson: Lesson, cards: FlashCard[], isNew: boolean): Promise<void> => {
            if (!user) return;
            const ownerId = lesson.ownerId ?? lesson.userId ?? user.uid;
            const isFunctionalOwner = ownerId === user.uid;
            const lessonToSave: Lesson = isNew
                ? {
                      ...lesson,
                      ownerId,
                      userId: ownerId, // legacy compatibility
                      ownerName: user.displayName ?? null,
                      ownerAvatar: user.photoURL ?? null,
                  }
                : {
                      ...lesson,
                      ownerId,
                      userId: ownerId, // keep legacy compat even during updates
                      ...(isFunctionalOwner
                          ? {
                                ownerName: user.displayName ?? null,
                                ownerAvatar: user.photoURL ?? null,
                            }
                          : {}),
                  };

            await LessonService.saveLessonWithCards(ownerId, lessonToSave, cards, isNew);

            try {
                const token = await user.getIdToken();
                if (isNew) {
                    void logDeckCreated(token, user.uid, lesson.id, lesson.title);
                } else {
                    void logDeckUpdated(token, user.uid, lesson.id, lesson.title);
                }
            } catch {
                // Non-blocking
            }
        },
        [user],
    );

    /**
     * Toggles public sharing for a lesson.  Generates a stable shareId,
     * writes `isPublic`, `allowLinkAccess`, and `publicRole` to Firestore.
     *
     * Delegates entirely to the service — no Firebase calls here.
     */
    const shareLesson = useCallback(
        async (
            lessonId: string,
            allowLinkAccess: boolean,
            publicRole: Lesson["publicRole"],
            isPublic?: boolean,
        ): Promise<void> => {
            if (!user) return;
            await LessonService.shareLessonSettings(
                user.uid,
                lessonId,
                allowLinkAccess,
                publicRole,
                user.uid,
                user.displayName ?? null,
                user.photoURL ?? null,
                isPublic,
            );
        },
        [user],
    );

    const updateLessonRoles = useCallback(
        async (
            lessonId: string,
            roles: Record<string, DeckAccessRole>,
            collaborators: string[],
        ): Promise<void> => {
            if (!user) return;
            await LessonService.updateLessonRoles(
                user.uid,
                lessonId,
                roles,
                collaborators,
                user.uid,
                user.displayName ?? null,
                user.photoURL ?? null,
            );
        },
        [user],
    );

    const reorderLesson = useCallback(
        async (ownerId: string, lessonId: string, newOrder: number): Promise<void> => {
            if (!user) return;
            await LessonService.reorderLesson(ownerId, lessonId, newOrder);
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
        reorderLesson,
    };
}

/**
 * Real-time hook for publicly discoverable flashcard decks from all users.
 *
 * @remarks
 * Subscribes to all lessons where `isPublic === true` via a collectionGroup query.
 * Excludes the current user's own decks (they already appear in "My Decks").
 * Safe to call when unauthenticated — returns an empty list.
 */
export function usePublicLessons() {
    const user = useAppStore((s) => s.user);
    const [publicLessons, setPublicLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsub = LessonService.subscribePublicLessons(
            user?.uid ?? null,
            (lessons) => {
                setPublicLessons(lessons);
                setLoading(false);
            },
            (err) => {
                console.error("[usePublicLessons]", err);
                setError("Failed to load public decks");
                setLoading(false);
            },
        );
        return unsub;
    }, [user?.uid]);

    return { publicLessons, loading, error };
}
