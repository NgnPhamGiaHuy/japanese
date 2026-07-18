"use server";

import { ActivityAction } from "@/lib/logging/actions.enum";
import { logActivity } from "@/lib/logging/activity";

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
    await logActivity(
        idToken,
        userId,
        ActivityAction.KANA_QUIZ_COMPLETED,
        "study",
        `kana_quiz_${alphabet}`,
        { alphabet, ...stats },
    );
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
    await logActivity(
        idToken,
        userId,
        ActivityAction.KANA_SURVIVAL_COMPLETED,
        "study",
        `kana_survival_${challengeMode}_${alphabet}`,
        { alphabet, challengeMode, ...stats },
    );
}
