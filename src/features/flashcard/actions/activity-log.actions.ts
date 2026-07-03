"use server";

import { ActivityAction } from "@/lib/logging/actions.enum";
import { logUserActionServer } from "@/lib/logging/user-actions";

// ─── Deck actions ─────────────────────────────────────────────────────────────

export async function logDeckCreated(
    idToken: string,
    userId: string,
    deckId: string,
    title: string,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.DECK_CREATED,
        entityType: "deck",
        entityId: deckId,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", title },
    });
}

export async function logDeckUpdated(
    idToken: string,
    userId: string,
    deckId: string,
    title: string,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.DECK_UPDATED,
        entityType: "deck",
        entityId: deckId,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", title },
    });
}

export async function logDeckDeleted(
    idToken: string,
    userId: string,
    deckId: string,
    title: string,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.DECK_DELETED,
        entityType: "deck",
        entityId: deckId,
        level: "warn",
        userId,
        metadata: { logType: "USER_ACTION", title },
    });
}

// ─── Study session actions ────────────────────────────────────────────────────

export async function logStudySessionCompleted(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
    stats: { correct: number; total: number; mode: string },
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.STUDY_SESSION_COMPLETED,
        entityType: "study",
        entityId: deckId,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", deckTitle, ...stats },
    });
}

export async function logStudyProgressReset(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.STUDY_PROGRESS_RESET,
        entityType: "study",
        entityId: deckId,
        level: "warn",
        userId,
        metadata: { logType: "USER_ACTION", deckTitle },
    });
}

// ─── Game mode actions ────────────────────────────────────────────────────────

export async function logMatchGameCompleted(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
    stats: { score: number; timeMs: number; tier: string },
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.MATCH_GAME_COMPLETED,
        entityType: "study",
        entityId: deckId,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", deckTitle, ...stats },
    });
}

export async function logSpeedGameCompleted(
    idToken: string,
    userId: string,
    deckId: string,
    deckTitle: string,
    stats: { score: number; timeMs: number; tier: string },
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.SPEED_GAME_COMPLETED,
        entityType: "study",
        entityId: deckId,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", deckTitle, ...stats },
    });
}
