import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameEngine } from "./GameEngine";

import type { FlashCard } from "@/features/flashcard/types";

function makeCard(id: string): FlashCard {
    return {
        id,
        lessonId: "lesson-1",
        primary: `primary-${id}`,
        alternatives: [],
        meaning: `meaning-${id}`,
        example: "",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: 0,
    };
}

/**
 * Regression test for a bug where submitAnswer() called timer.stop() before
 * reading timer.getElapsed()/getRemaining(). Both getters key off
 * TimerController's `intervalId`, which stop() clears — so evaluation always
 * read 0 elapsed / full remaining, handing out the maximum speed bonus
 * regardless of actual response time.
 */
describe("GameEngine.submitAnswer — timer read ordering", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("scores a slow correct answer lower than a near-instant one", () => {
        const cards = Array.from({ length: 6 }, (_, i) => makeCard(`c${i}`));

        const fastEngine = new GameEngine({
            cards,
            onScoreSync: () => {},
            onSessionEnd: async () => {},
        });
        fastEngine.startGame();
        const fastQuestion = fastEngine.getState().currentQuestion;
        expect(fastQuestion).not.toBeNull();
        fastEngine.submitAnswer(fastQuestion!.answer);
        const fastState = fastEngine.getState();
        fastEngine.destroy();

        const slowEngine = new GameEngine({
            cards,
            onScoreSync: () => {},
            onSessionEnd: async () => {},
        });
        slowEngine.startGame();
        const slowState0 = slowEngine.getState();
        const slowQuestion = slowState0.currentQuestion;
        expect(slowQuestion).not.toBeNull();

        // Answer well into the question's time limit, but before it expires.
        vi.advanceTimersByTime(Math.floor(slowState0.timeLimit * 1000 * 0.8));

        slowEngine.submitAnswer(slowQuestion!.answer);
        const slowState = slowEngine.getState();
        slowEngine.destroy();

        expect(fastState.correctCount).toBe(1);
        expect(slowState.correctCount).toBe(1);
        // Before the fix, both scores were identical (max speed bonus every time,
        // since elapsed always read 0). After the fix, the slow answer scores less.
        expect(slowState.score).toBeLessThan(fastState.score);
        expect(slowState.score).toBeGreaterThan(0);
    });
});
