"use server";

import { ActivityAction } from "@/lib/logging/actions.enum";
import { logUserActionServer } from "@/lib/logging/user-actions";

// ─── Kana Quiz ─────────────────────────────────────────────────────────────────

/**
 * Logs a completed kana quiz session.
 *
 * @param idToken  - Firebase ID token of the learner.
 * @param userId   - UID of the learner.
 * @param alphabet - Active alphabet: "hiragana" | "katakana" | "both".
 * @param stats    - Final session stats.
 */
export async function logKanaQuizCompleted(
    idToken: string,
    userId: string,
    alphabet: string,
    stats: { score: number; total: number; mode: string },
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.KANA_QUIZ_COMPLETED,
        entityType: "study",
        entityId: `kana_quiz_${alphabet}`,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", alphabet, ...stats },
    });
}

// ─── Kana Survival ─────────────────────────────────────────────────────────────

/**
 * Logs a completed kana survival session.
 *
 * @param idToken       - Firebase ID token of the learner.
 * @param userId        - UID of the learner.
 * @param alphabet      - Active alphabet: "hiragana" | "katakana" | "both".
 * @param challengeMode - Sub-mode: "infinity" | "time" | "drop".
 * @param stats         - Final session stats.
 */
export async function logKanaSurvivalCompleted(
    idToken: string,
    userId: string,
    alphabet: string,
    challengeMode: string,
    stats: { score: number; modeKey: string },
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.KANA_SURVIVAL_COMPLETED,
        entityType: "study",
        entityId: `kana_survival_${challengeMode}_${alphabet}`,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", alphabet, challengeMode, ...stats },
    });
}

// ─── Kana Practice ─────────────────────────────────────────────────────────────

/**
 * Logs a completed kana practice session.
 *
 * @param idToken  - Firebase ID token of the learner.
 * @param userId   - UID of the learner.
 * @param alphabet - Active alphabet: "hiragana" | "katakana" | "both".
 * @param stats    - Final session stats.
 */
export async function logKanaPracticeCompleted(
    idToken: string,
    userId: string,
    alphabet: string,
    stats: { cardsReviewed: number; mode: string },
): Promise<void> {
    await logUserActionServer(idToken, {
        action: ActivityAction.KANA_PRACTICE_COMPLETED,
        entityType: "study",
        entityId: `kana_practice_${alphabet}`,
        level: "info",
        userId,
        metadata: { logType: "USER_ACTION", alphabet, ...stats },
    });
}
