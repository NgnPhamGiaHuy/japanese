"use server";

import { ActivityAction } from "@/lib/logging/actions.enum";
import { logActivity } from "@/lib/logging/activity";

// ─── Deck actions ─────────────────────────────────────────────────────────────

export async function logDeckCreated(
    idToken: string,
    userId: string,
    deckId: string,
    title: string,
): Promise<void> {
    await logActivity(idToken, userId, ActivityAction.DECK_CREATED, "deck", deckId, { title });
}

export async function logDeckUpdated(
    idToken: string,
    userId: string,
    deckId: string,
    title: string,
): Promise<void> {
    await logActivity(idToken, userId, ActivityAction.DECK_UPDATED, "deck", deckId, { title });
}

export async function logDeckDeleted(
    idToken: string,
    userId: string,
    deckId: string,
    title: string,
): Promise<void> {
    await logActivity(
        idToken,
        userId,
        ActivityAction.DECK_DELETED,
        "deck",
        deckId,
        { title },
        "warn",
    );
}

// ─── Study session actions ────────────────────────────────────────────────────

export async function logStudySessionCompleted(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
    stats: { correct: number; total: number; mode: string },
): Promise<void> {
    await logActivity(idToken, userId, ActivityAction.STUDY_SESSION_COMPLETED, "study", deckId, {
        deckTitle,
        ...stats,
    });
}

export async function logStudyProgressReset(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
): Promise<void> {
    await logActivity(
        idToken,
        userId,
        ActivityAction.STUDY_PROGRESS_RESET,
        "study",
        deckId,
        { deckTitle },
        "warn",
    );
}

// ─── Game mode actions ────────────────────────────────────────────────────────

export async function logMatchGameCompleted(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
    stats: { score: number; timeMs: number; tier: string },
): Promise<void> {
    await logActivity(idToken, userId, ActivityAction.MATCH_GAME_COMPLETED, "study", deckId, {
        deckTitle,
        ...stats,
    });
}

export async function logSpeedGameCompleted(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
    stats: { score: number; timeMs: number; tier: string },
): Promise<void> {
    await logActivity(idToken, userId, ActivityAction.SPEED_GAME_COMPLETED, "study", deckId, {
        deckTitle,
        ...stats,
    });
}
