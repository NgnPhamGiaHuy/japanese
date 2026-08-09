"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { matchGameMode } from "@/features/flashcard/games/match";
import { speedGameMode } from "@/features/flashcard/games/speed";
import { useAppStore } from "@/lib/app-store";
import { loadFlashcardData } from "./flashcard-loader";
import { useCardsWithProgress } from "../hooks/useCardsWithProgress";
import { useLessons } from "../hooks/useLessons";

import type { FlashcardData, FlashcardLoaderState, FlashcardSource } from "./types";

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

    // ── Shared deck: one-time load, cached for the life of the query client ─
    const shareId = source.type === "shared" ? source.shareId : "";

    const sharedQuery = useQuery({
        queryKey: ["shared-flashcard", shareId, user?.uid ?? null],
        queryFn: async () => {
            try {
                return await loadFlashcardData(source, undefined, undefined, user?.uid, user);
            } catch (err) {
                throw err instanceof Error ? err : new Error(String(err));
            }
        },
        enabled: source.type === "shared" && !!shareId && isAuthReady,
        staleTime: Infinity,
        retry: false,
    });

    // ── Return correct state per source type ──────────────────────────────
    if (source.type === "shared") {
        // Wait for auth to resolve — avoids false 404 on slow networks
        if (!isAuthReady || sharedQuery.isLoading) {
            return { data: null, isLoading: true, isReady: false, isNotFound: false, error: null };
        }
        if (sharedQuery.error) {
            return {
                data: null,
                isLoading: false,
                isReady: false,
                isNotFound: false,
                error: sharedQuery.error,
            };
        }
        if (!sharedQuery.data) {
            return { data: null, isLoading: false, isReady: false, isNotFound: true, error: null };
        }
        return {
            data: sharedQuery.data,
            isLoading: false,
            isReady: true,
            isNotFound: false,
            error: null,
        };
    }

    // Personal deck — settle the loading flags FIRST, then treat absent data as
    // not-found, exactly as the shared branch above does.
    //
    // `!personalData` used to be folded into this expression, which made "the
    // lesson does not exist" indistinguishable from "the lesson has not loaded
    // yet". personalData is null precisely when the id is absent from the
    // user's lessons, so it stayed null forever, isLoading stayed true forever,
    // and the not-found branch below was unreachable: a deleted deck or a stale
    // bookmark rendered a spinner that never resolved.
    const isLoading = lessonsLoading || cardsLoading;
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
