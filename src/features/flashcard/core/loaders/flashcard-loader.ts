/**
 * @file Flashcard Data Loader
 *
 * @remarks
 * Provides unified data loading for both personal and shared flashcard decks.
 * Abstracts away the differences between data sources.
 */

import { matchGameMode, speedGameMode } from "@/features/game/modes";
import { getSharedLesson } from "../services";

import type { User } from "firebase/auth";
import type { FlashcardData, FlashcardSource } from "./types";
import type { Lesson } from "../types";
import type { CardWithProgress } from "../../domain";

/**
 * Loads flashcard data from the specified source.
 *
 * @remarks
 * Unified loader supporting both personal and shared decks.
 * For shared decks, loads content from owner + progress from viewer.
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
    cards?: CardWithProgress[],
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
            ownerId: lesson.ownerId ?? currentUserId ?? "",
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

    // Shared deck loading — content from owner, progress from viewer
    if (source.type === "shared") {
        try {
            const result = await getSharedLesson(source.shareId, currentUserId, currentUser);

            if (!result) {
                return null;
            }

            return {
                cards: result.cards,
                lesson: result.lesson,
                ownerId: result.meta.sourceUserId,
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
