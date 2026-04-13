"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import useGameSession from "@/features/game/hooks/useGameSession";
import { comboMultiplier } from "@/features/game/logic/combo";
import { getValidRomaji } from "@/shared/utils/romaji";
import { useQuizEngine } from "./useQuizEngine";

import type { ChallengeMode, DropWord, KanaChar, SurvivalPhase } from "../types/kana.types";

/** Time Attack: seconds removed on each wrong answer. */
export const TIME_ATTACK_WRONG_PENALTY_SEC = 10;

/**
 * Max seconds granted per correct — must stay **below** {@link TIME_ATTACK_WRONG_PENALTY_SEC}
 * so mistakes drain the clock and runs always end.
 */
export const TIME_ATTACK_MAX_STREAK_BONUS_SEC = 2;

/** Bonus after a correct answer (uses streak *after* this hit). Capped under wrong penalty. */
const timeAttackStreakBonusSec = (streakAfterCorrect: number): number =>
    Math.min(TIME_ATTACK_MAX_STREAK_BONUS_SEC, 1 + streakAfterCorrect);

interface UseSurvivalGameProps {
    dataset: KanaChar[];
    alphabet: string;
    userId: string | null;
    userName: string;
    currentBest?: number;
    onSaveScore: (score: number, name: string, modeKey: string) => void;
}

export const useSurvivalGame = ({
    dataset,
    alphabet,
    userId,
    userName,
    currentBest = 0,
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
    useEffect(() => {
        challengeModeRef.current = challengeMode;
    }, [challengeMode]);

    const activeModeKey =
        challengeMode === "infinity"
            ? `infinity_${alphabet}`
            : challengeMode === "time"
              ? `time_${timeMinutes}_${alphabet}`
              : `drop_${alphabet}`;

    // ── Firebase session ─────────────────────────────────────────────────────
    const { startSession, syncScore, endSession } = useGameSession({
        userId,
        userName: userName || localName || "Player",
        gameMode: activeModeKey,
        currentBest,
    });

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

    const engine = useQuizEngine(dataset, { comboScoring: true, onCorrectCombo });

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
            onSaveScore(finalScore, userName || localName, activeModeKey);
            endSession(finalScore);
            setPhase("gameover");
        }
    }, [
        timeLeft,
        phase,
        challengeMode,
        activeModeKey,
        engine.score,
        userName,
        localName,
        onSaveScore,
        endSession,
    ]);

    // ── Live score sync → Firestore (debounced via useGameSession) ────────────
    useEffect(() => {
        if (phase === "playing") {
            syncScore(engine.score);
        }
    }, [engine.score, phase, syncScore]);

    // ── Game start ───────────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        engine.resetEngine();
        setLives(3);
        setErrorFlash(false);
        setLastPoints(0);
        isGameOverRef.current = false;
        dropScore.current = 0;
        dropStreak.current = 0;
        if (challengeMode === "time") {
            const initial = timeMinutes * 60;
            setTimeLeft(initial);
            setTimeAttackPeak(initial);
        } else {
            setTimeLeft(0);
        }
        engine.generateQuestion();
        setPhase("playing");
        // Create Firebase session asynchronously
        startSession();
    }, [challengeMode, timeMinutes, engine, startSession]);

    // ── Answer handling ───────────────────────────────────────────────────────
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
                    onSaveScore(finalScore, userName || localName, activeModeKey);
                    endSession(finalScore);
                    setPhase("gameover");
                    return;
                }
            }
            engine.processAnswer(isCorrect, () => {
                if (!isGameOverRef.current) engine.generateQuestion();
            });
        },
        [challengeMode, lives, engine, userName, localName, activeModeKey, onSaveScore, endSession],
    );

    // ── Drop game state ───────────────────────────────────────────────────────
    const dropState = useRef({
        words: [] as DropWord[],
        activeId: null as string | null,
        lastTime: 0,
        startTime: 0,
        lastSpawn: 0,
    });
    const [dropTick, setDropTick] = useState(0);
    const rafRef = useRef<number>(0);
    const dropScore = useRef(0);
    const dropStreak = useRef(0);

    const updateDropGame = useCallback(
        (time: number) => {
            if (isGameOverRef.current) return;
            const state = dropState.current;
            if (!state.lastTime) state.lastTime = time;
            if (!state.startTime) state.startTime = time;

            const delta = Math.min(time - state.lastTime, 100);
            state.lastTime = time;
            const elapsed = (time - state.startTime) / 1000;

            const speed = (1.5 + Math.min(10.5, elapsed * 0.04)) / 1000;
            const spawnInterval = Math.max(600, 4000 - elapsed * 25);
            const maxWords = Math.min(12, 2 + Math.floor(elapsed / 12));

            if (time - (state.lastSpawn || 0) > spawnInterval && state.words.length < maxWords) {
                const allowedGroups = [
                    "vowels",
                    "k-row",
                    "s-row",
                    "t-row",
                    "n-row",
                    "h-row",
                    "m-row",
                    "y-row",
                    "r-row",
                    "w-row",
                    "n-misc",
                ];
                if (elapsed > 30) allowedGroups.push("dakuten", "handakuten");
                if (elapsed > 60) allowedGroups.push("yōon", "yōon-voiced");
                if (elapsed > 90) allowedGroups.push("extended", "extended-yōon");

                const pool = dataset.filter((c) => allowedGroups.includes(c.group));
                const charData = pool[Math.floor(Math.random() * pool.length)];
                const lanes = [15, 30, 45, 60, 75, 85];
                let lane = lanes[Math.floor(Math.random() * lanes.length)];
                const last = state.words[state.words.length - 1];
                if (last && Math.abs(last.x - lane) < 10)
                    lane = lanes[(lanes.indexOf(lane) + 1) % lanes.length];

                state.words.push({
                    id: Math.random().toString(36).substring(2, 11),
                    char: charData.char,
                    validOptions: getValidRomaji(charData.romaji),
                    typed: "",
                    x: lane,
                    y: -10,
                });
                state.lastSpawn = time;
            }

            let lost = 0;
            for (let i = state.words.length - 1; i >= 0; i--) {
                state.words[i].y += speed * delta;
                if (state.words[i].y > 105) {
                    if (state.activeId === state.words[i].id) state.activeId = null;
                    state.words.splice(i, 1);
                    lost++;
                }
            }

            if (lost > 0) {
                dropStreak.current = 0;
                setLives((l) => {
                    const n = l - lost;
                    if (n <= 0 && !isGameOverRef.current) {
                        isGameOverRef.current = true;
                        const finalScore = dropScore.current;
                        onSaveScore(finalScore, userName || localName, activeModeKey);
                        endSession(finalScore);
                        setPhase("gameover");
                    }
                    return n;
                });
                setErrorFlash(true);
                setTimeout(() => setErrorFlash(false), 200);
            }

            setDropTick((t) => t + 1);
            if (!isGameOverRef.current) rafRef.current = requestAnimationFrame(updateDropGame);
        },
        [dataset, userName, localName, activeModeKey, onSaveScore, endSession],
    );

    useEffect(() => {
        if (phase === "playing" && challengeMode === "drop") {
            dropState.current = {
                words: [],
                activeId: null,
                lastTime: 0,
                startTime: 0,
                lastSpawn: 0,
            };
            dropScore.current = 0;
            dropStreak.current = 0;
            rafRef.current = requestAnimationFrame(updateDropGame);
        }
        return () => cancelAnimationFrame(rafRef.current);
    }, [phase, challengeMode, updateDropGame]);

    const handleDropTyping = useCallback(
        (inputChar: string) => {
            if (!inputChar.match(/[a-z]/)) return;
            const state = dropState.current;
            let hit = false;

            if (state.activeId) {
                const target = state.words.find((w) => w.id === state.activeId);
                if (target) {
                    const newTyped = target.typed + inputChar;
                    const still = target.validOptions.filter((o) => o.startsWith(newTyped));
                    if (still.length > 0) {
                        target.typed = newTyped;
                        target.validOptions = still;
                        hit = true;
                        if (still.some((o) => o === newTyped)) {
                            state.words = state.words.filter((w) => w.id !== target.id);
                            state.activeId = null;
                            dropStreak.current += 1;
                            const pts = comboMultiplier(dropStreak.current);
                            dropScore.current += pts;
                            setLastPoints(pts);
                            setPointsAnimKey(Date.now());
                            engine.setStatus("correct");
                        }
                    }
                }
            } else {
                const possible = state.words.filter(
                    (w) => w.y > 0 && w.validOptions.some((o) => o.startsWith(inputChar)),
                );
                if (possible.length > 0) {
                    possible.sort((a, b) => b.y - a.y);
                    const target = possible[0];
                    target.typed = inputChar;
                    target.validOptions = target.validOptions.filter((o) =>
                        o.startsWith(inputChar),
                    );
                    state.activeId = target.id;
                    hit = true;
                    if (target.validOptions.some((o) => o === inputChar)) {
                        state.words = state.words.filter((w) => w.id !== target.id);
                        state.activeId = null;
                        dropStreak.current += 1;
                        const pts = comboMultiplier(dropStreak.current);
                        dropScore.current += pts;
                        setLastPoints(pts);
                        setPointsAnimKey(Date.now());
                    }
                }
            }

            if (!hit) {
                dropStreak.current = 0;
                engine.setStatus("wrong");
                setErrorFlash(true);
                setTimeout(() => setErrorFlash(false), 200);
            }
            setDropTick((t) => t + 1);
        },
        [engine],
    );
    useEffect(() => {
        if (phase === "playing" && challengeMode === "drop") {
            syncScore(dropScore.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dropTick, phase, challengeMode, syncScore]);

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
