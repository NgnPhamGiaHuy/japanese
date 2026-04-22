"use client";

import { useEffect, useMemo, useState } from "react";

import { matchGameMode, speedGameMode } from "@/features/game/modes";
import { useAppStore } from "@/store";
import { loadFlashcardData } from "./flashcard-loader";
import { useCardsWithProgress } from "../hooks/useCardsWithProgress";
import { useLessons } from "../hooks/useLessons";

import type { FlashcardData, FlashcardLoaderState, FlashcardSource } from "./types";

/** Session-scoped cache for shared deck metadata (cleared on full page reload). */
const sharedDataCache = new Map<string, FlashcardData>();

/**
 * Loads flashcard data and keeps cards live via real-time subscriptions.
 *
 * @remarks
 * **Personal decks:**
 * - Lesson metadata resolved once from useLessons
 * - Cards subscribed live via useCardsWithProgress (content + progress)
 * - data.cards always reflects current DB state — no stale snapshot
 * - Status counts (new/due/mistakes) update immediately after grading
 *
 * **Shared decks:**
 * - Full load via getSharedLesson (one-time, cached per session)
 * - Progress is merged at load time via getSharedLesson
 *
 * @param source - Data source (personal or shared)
 */
export function useFlashcardLoader(source: FlashcardSource): FlashcardLoaderState {
    const { user, isAuthReady } = useAppStore();

    // ── Personal deck: live cards ──────────────────────────────────────────
    const { lessons, loading: lessonsLoading } = useLessons();

    const lessonId = source.type === "personal" ? source.lessonId : "";
    // ownerId for personal deck = current user; resolved after lessons load
    const lesson = useMemo(
        () => (source.type === "personal" ? lessons.find((l) => l.id === lessonId) : undefined),
        [lessons, lessonId, source.type],
    );
    const ownerId = lesson?.ownerId ?? user?.uid ?? "";

    // Live cards — real-time subscription to both content and progress
    const { cards, loading: cardsLoading } = useCardsWithProgress(lessonId, ownerId);

    // ── Personal deck: stable FlashcardData (metadata only, cards are live) ─
    const personalData = useMemo<FlashcardData | null>(() => {
        if (source.type !== "personal") return null;
        if (!lesson) return null;

        return {
            cards, // live reference — updates on every progress change
            lesson,
            ownerId,
            gameMode: (mode: string) => {
                switch (mode) {
                    case "match":
                        return matchGameMode(lessonId);
                    case "speed":
                        return speedGameMode(lessonId);
                    case "study":
                        return `flashcard_study_${lessonId}`;
                    default:
                        return `flashcard_${mode}_${lessonId}`;
                }
            },
            returnPath: `/flashcard/${lessonId}`,
            source,
        };
        // cards intentionally excluded — it's a live ref, not a dep that should
        // rebuild the whole object. The object is stable; cards inside it updates.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lesson, ownerId, lessonId, source.type]);

    // ── Shared deck: one-time load with session cache ──────────────────────
    const [sharedState, setSharedState] = useState<FlashcardLoaderState>({
        data: null,
        isLoading: source.type === "shared",
        isReady: false,
        isNotFound: false,
        error: null,
    });

    const shareId = source.type === "shared" ? source.shareId : "";

    useEffect(() => {
        if (source.type !== "shared" || !shareId) return;
        // Wait for auth to resolve — avoids false 404 on slow networks
        if (!isAuthReady) return;

        const cached = sharedDataCache.get(shareId);
        if (cached) {
            setSharedState({
                data: cached,
                isLoading: false,
                isReady: true,
                isNotFound: false,
                error: null,
            });
            return;
        }

        let cancelled = false;
        setSharedState({
            data: null,
            isLoading: true,
            isReady: false,
            isNotFound: false,
            error: null,
        });

        loadFlashcardData(source, undefined, undefined, user?.uid, user)
            .then((data) => {
                if (cancelled) return;
                if (!data) {
                    setSharedState({
                        data: null,
                        isLoading: false,
                        isReady: false,
                        isNotFound: true,
                        error: null,
                    });
                } else {
                    sharedDataCache.set(shareId, data);
                    setSharedState({
                        data,
                        isLoading: false,
                        isReady: true,
                        isNotFound: false,
                        error: null,
                    });
                }
            })
            .catch((error) => {
                if (cancelled) return;
                setSharedState({
                    data: null,
                    isLoading: false,
                    isReady: false,
                    isNotFound: false,
                    error: error instanceof Error ? error : new Error(String(error)),
                });
            });

        return () => {
            cancelled = true;
        };
        // user object intentionally omitted — uid is the stable identity key
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shareId, isAuthReady, user?.uid]);

    // ── Return correct state per source type ──────────────────────────────
    if (source.type === "shared") return sharedState;

    // Personal deck
    const isLoading = lessonsLoading || cardsLoading || !personalData;
    if (isLoading) {
        return { data: null, isLoading: true, isReady: false, isNotFound: false, error: null };
    }
    if (!personalData) {
        return { data: null, isLoading: false, isReady: false, isNotFound: true, error: null };
    }

    // Inject live cards into the stable data object before returning
    // This avoids rebuilding the whole object on every card update
    personalData.cards = cards;

    return { data: personalData, isLoading: false, isReady: true, isNotFound: false, error: null };
}
