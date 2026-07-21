/**
 * Kana Survival Mode session hook.
 *
 * @remarks
 * Orchestrates three challenge modes:
 * - Infinity: 3 lives, survive as long as possible
 * - Time Attack: countdown timer, streaks add time, wrong answers cost seconds
 * - Drop: real-time falling characters typed via keyboard (useDropMode.ts —
 *   a requestAnimationFrame loop incompatible with GameEngine's Q&A loop, so
 *   it's a separate hook this one composes rather than a branch inline here;
 *   see useDropMode.ts's header. Split out at E11-T4.)
 *
 * Uses the engine's session infrastructure (useGameSession) for Firestore sync
 * with the same stable-ref pattern used across all game mode hooks.
 */

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useGameSession } from "@/features/game";
import { auth } from "@/lib/firebase";
import { useDropMode } from "./useDropMode";
import { useKanaQuizSession } from "./useKanaQuizSession";
import { logKanaSurvivalCompleted } from "../actions";

import type { ChallengeMode, KanaChar, SurvivalPhase } from "../types";

/** Seconds removed from the clock on each wrong answer in Time Attack. */
export const TIME_ATTACK_WRONG_PENALTY_SEC = 10;

/**
 * Maximum seconds added per correct answer in Time Attack.
 * Kept below {@link TIME_ATTACK_WRONG_PENALTY_SEC} so the clock always runs out.
 */
export const TIME_ATTACK_MAX_STREAK_BONUS_SEC = 2;

/** Bonus seconds after a correct answer, capped below the wrong penalty. */
const timeAttackStreakBonusSec = (streakAfterCorrect: number): number =>
    Math.min(TIME_ATTACK_MAX_STREAK_BONUS_SEC, 1 + streakAfterCorrect);

interface UseSurvivalGameProps {
    dataset: KanaChar[];
    alphabet: string;
    userId: string | null;
    userName: string;
    onSaveScore: (score: number, name: string, modeKey: string) => void;
}

/**
 * Survival Mode session controller.
 *
 * @remarks
 * Manages the full lifecycle of a survival session:
 * - Mode selection (infinity / time / drop)
 * - Lives tracking and game-over detection
 * - Time Attack countdown with streak bonuses
 * - Drop Mode (delegated to useDropMode) with progressive difficulty
 * - Firestore session sync via useGameSession
 */
export const useSurvivalGame = ({
    dataset,
    alphabet,
    userId,
    userName,
    onSaveScore,
}: UseSurvivalGameProps) => {
    const [phase, setPhase] = useState<SurvivalPhase>("setup");
    const [challengeMode, setChallengeMode] = useState<ChallengeMode>("infinity");
    const [timeMinutes, setTimeMinutes] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [lives, setLives] = useState(3);
    const [localName, setLocalName] = useState("");
    const [errorFlash, setErrorFlash] = useState(false);
    const [lastPoints, setLastPoints] = useState(0);
    const [pointsAnimKey, setPointsAnimKey] = useState(0);
    const [timeAttackPeak, setTimeAttackPeak] = useState(0);

    const isGameOverRef = useRef(false);
    const challengeModeRef = useRef(challengeMode);

    const activeModeKey =
        challengeMode === "infinity"
            ? `infinity_${alphabet}`
            : challengeMode === "time"
              ? `time_${timeMinutes}_${alphabet}`
              : `drop_${alphabet}`;

    const { startSession, syncScore, endSession } = useGameSession({
        userId,
        userName: userName || localName || "Player",
        gameMode: activeModeKey,
    });

    // Stable refs — keeps callbacks current without triggering session rebuilds.
    const syncScoreRef = useRef(syncScore);
    const endSessionRef = useRef(endSession);
    const onSaveScoreRef = useRef(onSaveScore);
    const userNameRef = useRef(userName);
    const localNameRef = useRef(localName);
    const activeModeKeyRef = useRef(activeModeKey);

    /**
     * Keeps all callback refs current after every render.
     *
     * @remarks
     * useLayoutEffect runs synchronously before the browser paints, ensuring
     * refs are fresh before any subsequent effect or event handler reads them.
     */
    useLayoutEffect(() => {
        syncScoreRef.current = syncScore;
        endSessionRef.current = endSession;
        onSaveScoreRef.current = onSaveScore;
        userNameRef.current = userName;
        localNameRef.current = localName;
        activeModeKeyRef.current = activeModeKey;
        challengeModeRef.current = challengeMode;
    });

    /**
     * Quiz engine for infinity and time attack modes.
     *
     * @remarks
     * Combo scoring enabled — streaks multiply points.
     * Time Attack bonus is applied inside onCorrectCombo.
     */
    const onCorrectCombo = useCallback((info: { points: number; streak: number }) => {
        setLastPoints(info.points);
        setPointsAnimKey(Date.now());
        if (challengeModeRef.current !== "time") return;
        const bonus = timeAttackStreakBonusSec(info.streak);
        setTimeLeft((t) => {
            const next = t + bonus;
            setTimeAttackPeak((p) => Math.max(p, next));
            return next;
        });
    }, []);

    const engine = useKanaQuizSession({
        dataset,
        gameMode: activeModeKey,
        userId,
        displayName: userName || localName,
        onCorrectCombo,
        session: { startSession, syncScore, endSession },
    });

    const { dropState, dropScore, dropStreak, dropTick, resetDrop, handleDropTyping } = useDropMode(
        {
            dataset,
            alphabet,
            userId,
            phase,
            challengeMode,
            isGameOverRef,
            setPhase,
            setLives,
            setErrorFlash,
            setLastPoints,
            setPointsAnimKey,
            onSaveScoreRef,
            endSessionRef,
            syncScoreRef,
            userNameRef,
            localNameRef,
            activeModeKeyRef,
            engine,
        },
    );

    // ── Time-attack countdown ─────────────────────────────────────────────────
    useEffect(() => {
        if (
            phase !== "playing" ||
            challengeMode !== "time" ||
            timeLeft <= 0 ||
            isGameOverRef.current
        )
            return;

        const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, [phase, challengeMode, timeLeft]);

    // ── Time-attack expiry → game over ────────────────────────────────────────
    useEffect(() => {
        if (
            phase === "playing" &&
            challengeMode === "time" &&
            timeLeft === 0 &&
            !isGameOverRef.current
        ) {
            isGameOverRef.current = true;
            const finalScore = engine.score;
            onSaveScoreRef.current(
                finalScore,
                userNameRef.current || localNameRef.current,
                activeModeKeyRef.current,
            );
            void endSessionRef.current(finalScore);
            if (userId) {
                void auth.currentUser?.getIdToken().then((token) =>
                    logKanaSurvivalCompleted(token, userId, alphabet, "time", {
                        score: finalScore,
                        modeKey: activeModeKeyRef.current,
                    }),
                );
            }
            setPhase("gameover");
        }
    }, [timeLeft, phase, challengeMode, engine.score, userId, alphabet]);

    // ── Game start ───────────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        engine.resetEngine();
        setLives(3);
        setErrorFlash(false);
        setLastPoints(0);
        isGameOverRef.current = false;
        resetDrop();

        if (challengeMode === "time") {
            const initial = timeMinutes * 60;
            setTimeLeft(initial);
            setTimeAttackPeak(initial);
        } else {
            setTimeLeft(0);
        }

        engine.generateQuestion();
        setPhase("playing");
        void startSession();
    }, [challengeMode, timeMinutes, engine, startSession, resetDrop]);

    // ── Answer handling (infinity / time) ────────────────────────────────────
    const handleAnswer = useCallback(
        (isCorrect: boolean) => {
            if (!isCorrect && challengeMode === "time") {
                setTimeLeft((t) => Math.max(0, t - TIME_ATTACK_WRONG_PENALTY_SEC));
            }

            if (!isCorrect && challengeMode === "infinity") {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0 && !isGameOverRef.current) {
                    isGameOverRef.current = true;
                    const finalScore = engine.score;
                    onSaveScoreRef.current(
                        finalScore,
                        userNameRef.current || localNameRef.current,
                        activeModeKeyRef.current,
                    );
                    void endSessionRef.current(finalScore);
                    if (userId) {
                        void auth.currentUser?.getIdToken().then((token) =>
                            logKanaSurvivalCompleted(token, userId, alphabet, "infinity", {
                                score: finalScore,
                                modeKey: activeModeKeyRef.current,
                            }),
                        );
                    }
                    setPhase("gameover");
                    return;
                }
            }

            engine.processAnswer(isCorrect, () => {
                if (!isGameOverRef.current) engine.generateQuestion();
            });
        },
        [challengeMode, lives, engine, userId, alphabet],
    );

    return {
        phase,
        setPhase,
        challengeMode,
        setChallengeMode,
        timeMinutes,
        setTimeMinutes,
        timeLeft,
        timeAttackPeak,
        lives,
        localName,
        setLocalName,
        errorFlash,
        lastPoints,
        pointsAnimKey,
        activeModeKey,
        engine,
        dropState,
        dropScore,
        dropStreak,
        dropTick,
        startGame,
        handleAnswer,
        handleDropTyping,
    };
};
