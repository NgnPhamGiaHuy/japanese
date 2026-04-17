/**
 * @file useFlashcardLoader Hook
 *
 * @remarks
 * Unified hook for loading flashcard data from any source.
 * Handles loading states, errors, and provides consistent API.
 */

"use client";

import { useEffect, useState } from "react";

import { useAppStore } from "@/store";
import { loadFlashcardData } from "./flashcard-loader";
import { useCards, useLessons } from "../hooks";

import type { FlashcardData, FlashcardLoaderState, FlashcardSource } from "./types";

/**
 * Module-level cache for shared deck data.
 *
 * @remarks
 * Session-scoped (cleared on full page reload). Prevents redundant Firestore
 * reads when navigating between game-mode routes for the same shareId.
 * Keyed by shareId string.
 */
const sharedDataCache = new Map<string, FlashcardData>();

/**
 * Loads flashcard data from the specified source.
 *
 * @param source - Data source (personal or shared)
 * @returns Loading state with data
 *
 * @example
 * ```tsx
 * // Personal deck
 * const loader = useFlashcardLoader({ type: "personal", lessonId: "abc123" });
 *
 * // Shared deck
 * const loader = useFlashcardLoader({ type: "shared", shareId: "xyz789" });
 *
 * if (loader.isLoading) return <Loading />;
 * if (loader.isNotFound) return <NotFound />;
 * if (loader.isReady) return <Game data={loader.data} />;
 * ```
 */
export function useFlashcardLoader(source: FlashcardSource): FlashcardLoaderState {
    const { user, isAuthReady } = useAppStore();
    const [state, setState] = useState<FlashcardLoaderState>({
        data: null,
        isLoading: true,
        isReady: false,
        isNotFound: false,
        error: null,
    });

    // For personal decks, we need to load lessons and cards first
    const { lessons, loading: lessonsLoading } = useLessons();
    const { cards, loading: cardsLoading } = useCards(
        source.type === "personal" ? source.lessonId : "",
    );

    useEffect(() => {
        let cancelled = false;

        // Personal deck: wait for lessons and cards to load
        if (source.type === "personal") {
            if (lessonsLoading || cardsLoading) {
                setState({
                    data: null,
                    isLoading: true,
                    isReady: false,
                    isNotFound: false,
                    error: null,
                });
                return;
            }

            loadFlashcardData(source, lessons, cards, user?.uid, user)
                .then((data) => {
                    if (cancelled) return;

                    if (!data) {
                        setState({
                            data: null,
                            isLoading: false,
                            isReady: false,
                            isNotFound: true,
                            error: null,
                        });
                    } else {
                        setState({
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

                    setState({
                        data: null,
                        isLoading: false,
                        isReady: false,
                        isNotFound: false,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                });

            return;
        }

        // Shared deck: defer until Firebase auth has resolved to avoid false 404s
        // on slow networks where the user object arrives after mount.
        if (source.type === "shared") {
            if (!isAuthReady) return;

            const { shareId } = source;

            // Serve from cache when available — prevents redundant Firestore reads
            // when navigating between game-mode routes for the same shareId.
            const cached = sharedDataCache.get(shareId);
            if (cached) {
                setState({
                    data: cached,
                    isLoading: false,
                    isReady: true,
                    isNotFound: false,
                    error: null,
                });
                return;
            }

            setState({
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
                        setState({
                            data: null,
                            isLoading: false,
                            isReady: false,
                            isNotFound: true,
                            error: null,
                        });
                    } else {
                        sharedDataCache.set(shareId, data);
                        setState({
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

                    // Preserve typed SharedLoadError instances so callers can
                    // distinguish network/quota failures from not-found conditions.
                    setState({
                        data: null,
                        isLoading: false,
                        isReady: false,
                        isNotFound: false,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                });
        }

        return () => {
            cancelled = true;
        };
    }, [
        source.type,
        source.type === "personal"
            ? source.lessonId
            : source.type === "shared"
              ? source.shareId
              : "",
        lessonsLoading,
        cardsLoading,
        lessons,
        cards,
        user?.uid,
        isAuthReady,
    ]);

    return state;
}
