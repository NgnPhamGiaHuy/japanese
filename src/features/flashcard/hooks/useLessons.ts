"use client";

import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "@/lib/app-store";
import { logDeckCreated, logDeckDeleted, logDeckUpdated } from "../actions/activity-log.actions";
import { useLessonsContext } from "../context/LessonsContext";
import * as LessonService from "../services";

import type { OrderChange } from "@/features/flashcard/utils";
import type { DeckAccessRole, FlashCard, Lesson } from "../types";

/**
 * Real-time hook for the current user's flashcard lessons/decks.
 *
 * @remarks
 * The read half (`lessons`, `sharedLessons`, `loading`, `error`) comes from
 * the single shared subscription in `LessonsProvider` (ADR-113, T-113b) —
 * mounting this hook N times opens zero additional Firestore listeners. The
 * write actions below are unchanged: one-shot writes delegated to
 * `LessonService`, not listeners, so there was never a multiplication cost
 * to centralize.
 *
 * @returns Metadata-level state and management actions for current user's lessons.
 */
export function useLessons() {
    const user = useAppStore((s) => s.user);
    const { lessons, sharedLessons, loading, error } = useLessonsContext();

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
            const lesson = lessons.find((l) => l.id === id);
            await LessonService.deleteLessonWithCards(user.uid, id);
            try {
                const token = await user.getIdToken();
                void logDeckDeleted(token, user.uid, id, lesson?.title ?? "");
            } catch {
                // Non-blocking
            }
        },
        [user, lessons],
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

    const reorderLessons = useCallback(
        async (ownerId: string, changes: OrderChange[]): Promise<void> => {
            if (!user) return;
            await LessonService.reorderLessons(ownerId, changes);
        },
        [user],
    );

    return {
        lessons,
        sharedLessons,
        loading,
        error,
        updateLesson,
        deleteLesson,
        saveFullLesson,
        shareLesson,
        updateLessonRoles,
        reorderLessons,
    };
}

const PUBLIC_LESSONS_PAGE_SIZE = 30;

/**
 * Real-time hook for publicly discoverable flashcard decks from all users.
 *
 * @remarks
 * Subscribes to all lessons where `isPublic === true` via a collectionGroup
 * query, bounded at a growing `limit()` (ADR-114, T-114a) rather than
 * streaming the entire public-deck corpus. `loadMore()` grows the live
 * window and resubscribes — the same grow-window mechanism
 * NotificationsContext already uses for its own bounded realtime channel,
 * not a new pagination style.
 * Excludes the current user's own decks (they already appear in "My Decks").
 * Safe to call when unauthenticated — returns an empty list.
 */
export function usePublicLessons() {
    const user = useAppStore((s) => s.user);
    const [publicLessons, setPublicLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(PUBLIC_LESSONS_PAGE_SIZE);

    const loadMore = useCallback(() => {
        setLoadingMore(true);
        setPageSize((n) => n + PUBLIC_LESSONS_PAGE_SIZE);
    }, []);

    // Render-time reset: whenever the user identity changes, mark loading
    // immediately and reset the page size, instead of a synchronous setState
    // at the top of the effect below.
    const [prevUid, setPrevUid] = useState(user?.uid ?? null);
    if ((user?.uid ?? null) !== prevUid) {
        setPrevUid(user?.uid ?? null);
        setLoading(true);
        setPageSize(PUBLIC_LESSONS_PAGE_SIZE);
    }

    useEffect(() => {
        const unsub = LessonService.subscribePublicLessons(
            user?.uid ?? null,
            (lessons) => {
                setPublicLessons(lessons);
                setLoading(false);
                setLoadingMore(false);
            },
            (err) => {
                console.error("[usePublicLessons]", err);
                setError("Failed to load public decks");
                setLoading(false);
                setLoadingMore(false);
            },
            pageSize,
        );
        return unsub;
    }, [user?.uid, pageSize]);

    // A full page came back, so the collection may extend further — a short
    // page means we've reached the end (mirrors NotificationsContext's
    // identical heuristic).
    const hasMore = publicLessons.length >= pageSize;

    return { publicLessons, loading, loadingMore, hasMore, loadMore, error };
}
