/**
 * @file useQuizState.browser.test.tsx
 * Regression coverage for the kana quiz's two-counter contract.
 *
 * The quiz conflated a combo-weighted SCORE with a QUESTION count. An answer is
 * worth `comboMultiplier(streak)` points — 1, then 2 at a streak of 5 — but the
 * completion check read `session.score + (isCorrect ? 1 : 0)` and compared it
 * against `targetScore`, which the rest of the feature treats as 20 QUESTIONS.
 * The run overshot: the HUD passed "21/20" and the results screen claimed a
 * perfect 24/20 after a run with wrong answers, while the persisted score
 * disagreed with the displayed one. `session` was typed `any`, so types alone
 * could not have caught it — this behavioural test is the net.
 *
 * Composes the REAL engine with the REAL phase controller: the defect lived in
 * the contract BETWEEN them. `comboMultiplier` stays real for the same reason —
 * it is what makes the counters diverge. Only leaf dependencies are stubbed; the
 * Firestore session uses the engine's own `session` injection seam.
 */
import { act } from "react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { useKanaQuizSession } from "@/features/kana/hooks";
import { useQuizState } from "./useQuizState";

import type { KanaChar } from "@/features/kana/types";

// ─── Leaf mocks ──────────────────────────────────────────────────────────────

const endSession = vi.fn(async () => {});
const syncScore = vi.fn();
const startSession = vi.fn(async () => {});
const injectedSession = { startSession, syncScore, endSession };

const { recordCharStat } = vi.hoisted(() => ({ recordCharStat: vi.fn() }));
vi.mock("@/features/user", () => ({
    useUserProgress: () => ({ userData: { charStats: {} }, recordCharStat }),
}));

vi.mock("@/shared/audio", () => ({
    playSfx: vi.fn(),
    sequence: vi.fn(async () => {}),
    speak: vi.fn(),
}));

// Stubbed whole: the real module calls getAuth(app) at import time, which
// throws auth/invalid-api-key without a live config. `db`/`APP_ID` are listed
// because other modules in this graph import them from here.
vi.mock("@/lib/firebase", () => ({
    auth: { currentUser: { getIdToken: async () => "test-id-token" } },
    db: {},
    storage: {},
    googleProvider: {},
    firebaseAI: {},
    APP_ID: "test-app",
}));

const { logKanaQuizCompleted } = vi.hoisted(() => ({
    logKanaQuizCompleted: vi.fn(async () => {}),
}));
vi.mock("../../actions", () => ({ logKanaQuizCompleted }));

// ─── Fixture ─────────────────────────────────────────────────────────────────

/** Small deterministic dataset — enough distinct romaji for distractor building. */
const DATASET: KanaChar[] = [
    { char: "あ", romaji: "a", group: "vowels" },
    { char: "い", romaji: "i", group: "vowels" },
    { char: "う", romaji: "u", group: "vowels" },
    { char: "え", romaji: "e", group: "vowels" },
    { char: "お", romaji: "o", group: "vowels" },
    { char: "か", romaji: "ka", group: "k-row" },
];

/** The longest feedback delay in the engine — a wrong answer's. */
const FEEDBACK_MS = 1600;

/** The real engine driving the real phase controller — the seam under test. */
function useQuizHarness() {
    const session = useKanaQuizSession({
        dataset: DATASET,
        gameMode: "kana_quiz_test",
        userId: "u1",
        displayName: "Tester",
        session: injectedSession,
    });
    const state = useQuizState({
        dataset: DATASET,
        alphabet: "hiragana",
        userId: "u1",
        session,
    });
    return { session, state };
}

const setup = () => renderHook(useQuizHarness);

type Rendered = { current: ReturnType<typeof useQuizHarness> };

/** Answers the current question, then lets the feedback timeout advance the loop. */

async function answer(result: Rendered, correct: boolean) {
    const question = result.current.session.question!;
    const option = correct ? { romaji: question.romaji } : { romaji: `${question.romaji}__wrong` };
    await act(async () => {
        result.current.state.handleMCAnswer(option);
    });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(FEEDBACK_MS);
    });
}

describe("kana quiz — score and question count are separate counters", () => {
    beforeEach(() => {
        // React's `act` refuses to run unless the environment opts in. The
        // browser tier has no jsdom-style test setup doing this for us.
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        vi.useFakeTimers();
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("counts questions asked and answers correct independently of the combo-weighted score", async () => {
        const { result } = await setup();
        await act(async () => result.current.state.startQuiz("choice"));

        for (let i = 0; i < 5; i++) await answer(result, true);

        // Five correct answers = five questions, five correct...
        expect(result.current.session.answered).toBe(5);
        expect(result.current.session.correctCount).toBe(5);
        // ...but MORE than five points: comboMultiplier steps up to 2 at a
        // streak of 5. That divergence is the bug — the old code compared this
        // score against a 20-QUESTION target.
        expect(result.current.session.score).toBeGreaterThan(5);
    });

    it("counts a wrong answer as a question asked, and does not count it as correct", async () => {
        const { result } = await setup();
        await act(async () => result.current.state.startQuiz("choice"));

        await answer(result, true);
        await answer(result, false);

        expect(result.current.session.answered).toBe(2);
        expect(result.current.session.correctCount).toBe(1);
        expect(result.current.session.streak).toBe(0);
    });

    it("ends after exactly targetScore QUESTIONS, not when points reach the target", async () => {
        const { result } = await setup();
        await act(async () => result.current.state.startQuiz("choice"));

        const target = result.current.session.targetScore;

        // All correct, so the combo score races ahead of the question count.
        for (let i = 0; i < target - 1; i++) {
            await answer(result, true);
            expect(result.current.state.phase).toBe("playing");
        }

        // The score passed the target well before the last question — the old
        // `score + 1 >= targetScore` check would have ended the run long ago.
        expect(result.current.session.score).toBeGreaterThan(target);
        expect(result.current.state.phase).toBe("playing");

        await answer(result, true);

        expect(result.current.session.answered).toBe(target);
        expect(result.current.state.phase).toBe("done");
    });

    it("persists the combo score to the game session, and logs the question tally", async () => {
        const { result } = await setup();
        await act(async () => result.current.state.startQuiz("choice"));

        const target = result.current.session.targetScore;
        // Miss every fourth question so the tally is provably below the target.
        for (let i = 0; i < target; i++) await answer(result, i % 4 !== 3);

        const expectedCorrect = result.current.session.correctCount;
        expect(expectedCorrect).toBeLessThan(target);

        // The leaderboard ranks on the combo score the player actually saw —
        // NOT the tally, and not a separately recomputed `score + 1`.
        expect(endSession).toHaveBeenCalledTimes(1);
        expect(endSession).toHaveBeenCalledWith(result.current.session.score);

        // The activity log records accuracy, so its score/total must be
        // questions-correct out of questions-asked to mean anything.
        expect(logKanaQuizCompleted).toHaveBeenCalledWith(
            expect.anything(),
            "u1",
            "hiragana",
            expect.objectContaining({ score: expectedCorrect, total: target }),
        );
    });

    it("resets both counters when a new run starts", async () => {
        const { result } = await setup();
        await act(async () => result.current.state.startQuiz("choice"));
        for (let i = 0; i < 3; i++) await answer(result, true);
        expect(result.current.session.answered).toBe(3);

        await act(async () => result.current.state.startQuiz("choice"));

        expect(result.current.session.answered).toBe(0);
        expect(result.current.session.correctCount).toBe(0);
        expect(result.current.session.score).toBe(0);
    });
});
