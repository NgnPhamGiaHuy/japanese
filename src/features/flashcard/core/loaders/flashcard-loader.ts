/**
 * @file Flashcard Data Loader
 *
 * @remarks
 * Provides unified data loading for both personal and shared flashcard decks.
 * Abstracts away the differences between data sources.
 */

import { matchGameMode, speedGameMode } from "@/features/game/modes";
import { getSharedLesson } from "../services/shared.service";

import type { User } from "firebase/auth";
import type { FlashcardData, FlashcardSource } from "./types";
import type { FlashCard, Lesson } from "../types";

/**
 * Loads flashcard data from the specified source.
 *
 * @param source - Data source (personal or shared)
 * @param lessons - Personal lessons (required for personal source)
 * @param cards - Personal cards (required for personal source)
 * @param currentUserId - Current user ID (for shared deck access control)
 * @param currentUser - Current user object (for shared deck access control)
 * @returns Unified flashcard data or null if not found
 */
export async function loadFlashcardData(
    source: FlashcardSource,
    lessons?: Lesson[],
    cards?: FlashCard[],
    currentUserId?: string,
    currentUser?: User | null,
): Promise<FlashcardData | null> {
    // Personal deck loading
    if (source.type === "personal") {
        if (!lessons || !cards) {
            throw new Error("Personal source requires lessons and cards");
        }

        const lesson = lessons.find((l) => l.id === source.lessonId);
        if (!lesson) {
            return null;
        }

        return {
            cards,
            lesson,
            gameMode: (mode: string) => {
                switch (mode) {
                    case "match":
                        return matchGameMode(source.lessonId);
                    case "speed":
                        return speedGameMode(source.lessonId);
                    case "study":
                        return `flashcard_study_${source.lessonId}`;
                    default:
                        return `flashcard_${mode}_${source.lessonId}`;
                }
            },
            returnPath: `/flashcard/${source.lessonId}`,
            source,
        };
    }

    // Shared deck loading
    if (source.type === "shared") {
        try {
            console.log("[FlashcardLoader] Loading shared deck:", source.shareId);
            const result = await getSharedLesson(source.shareId, currentUserId, currentUser);

            if (!result) {
                console.log("[FlashcardLoader] Shared deck not found:", source.shareId);
                return null;
            }

            console.log("[FlashcardLoader] Shared deck loaded successfully:", {
                shareId: source.shareId,
                lessonTitle: result.lesson.title,
                cardCount: result.cards.length,
            });

            return {
                cards: result.cards,
                lesson: result.lesson,
                gameMode: (mode: string) => {
                    switch (mode) {
                        case "match":
                            return matchGameMode(source.shareId);
                        case "speed":
                            return speedGameMode(source.shareId);
                        case "study":
                            return `flashcard_study_${source.shareId}`;
                        default:
                            return `flashcard_${mode}_shared_${source.shareId}`;
                    }
                },
                returnPath: `/flashcard/shared/${source.shareId}`,
                source,
            };
        } catch (error) {
            console.error("[FlashcardLoader] Failed to load shared lesson:", error);
            return null;
        }
    }

    return null;
}
