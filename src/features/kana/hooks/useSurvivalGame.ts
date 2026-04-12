"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuizEngine } from "./useQuizEngine";
import { playAudio } from "@/shared/utils/audio";
import { getValidRomaji } from "@/shared/utils/romaji";
import type {
    KanaChar,
    ChallengeMode,
    SurvivalPhase,
    DropWord,
} from "../types/kana.types";

interface UseSurvivalGameProps {
    dataset: KanaChar[];
    alphabet: string;
    onSaveScore: (score: number, name: string, modeKey: string) => void;
}

export function useSurvivalGame({
    dataset,
    alphabet,
    onSaveScore,
}: UseSurvivalGameProps) {
    const [phase, setPhase] = useState<SurvivalPhase>("setup");
    const [challengeMode, setChallengeMode] =
        useState<ChallengeMode>("infinity");
    const [timeMinutes, setTimeMinutes] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [lives, setLives] = useState(3);
    const [localName, setLocalName] = useState("");
    const [errorFlash, setErrorFlash] = useState(false);
    const [lastPoints, setLastPoints] = useState(0);
    const [pointsAnimKey, setPointsAnimKey] = useState(0);

    const isGameOverRef = useRef(false);
    const scoreRef = useRef(0);

    const engine = useQuizEngine(dataset);

    const activeModeKey =
        challengeMode === "infinity"
            ? `infinity_${alphabet}`
            : challengeMode === "time"
              ? `time_${timeMinutes}_${alphabet}`
              : `drop_${alphabet}`;

    // Time-attack countdown
    useEffect(() => {
        if (
            phase !== "playing" ||
            challengeMode !== "time" ||
            timeLeft <= 0 ||
            isGameOverRef.current
        )
            return;
        const timer = setInterval(
            () => setTimeLeft((t) => Math.max(0, t - 1)),
            1000
        );
        return () => clearInterval(timer);
    }, [phase, challengeMode, timeLeft]);

    useEffect(() => {
        if (
            phase === "playing" &&
            challengeMode === "time" &&
            timeLeft === 0 &&
            !isGameOverRef.current
        ) {
            isGameOverRef.current = true;
            onSaveScore(engine.score, localName, activeModeKey);
            setPhase("gameover");
        }
    }, [
        timeLeft,
        phase,
        challengeMode,
        activeModeKey,
        engine.score,
        localName,
        onSaveScore,
    ]);

    const startGame = useCallback(() => {
        engine.resetEngine();
        setLives(3);
        setErrorFlash(false);
        setLastPoints(0);
        isGameOverRef.current = false;
        scoreRef.current = 0;
        setTimeLeft(challengeMode === "time" ? timeMinutes * 60 : 0);
        engine.generateQuestion();
        setPhase("playing");
    }, [challengeMode, timeMinutes, engine]);

    const onCorrectAnswer = useCallback(() => {
        const multiplier = Math.floor(engine.streak / 5) + 1;
        setLastPoints(multiplier);
        setPointsAnimKey(Date.now());
    }, [engine.streak]);

    const handleAnswer = useCallback(
        (isCorrect: boolean) => {
            if (isCorrect) onCorrectAnswer();
            else if (challengeMode === "infinity") {
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0 && !isGameOverRef.current) {
                    isGameOverRef.current = true;
                    onSaveScore(engine.score, localName, activeModeKey);
                    setPhase("gameover");
                    return;
                }
            }
            engine.processAnswer(isCorrect, () => {
                if (!isGameOverRef.current) engine.generateQuestion();
            });
        },
        [
            challengeMode,
            lives,
            engine,
            localName,
            activeModeKey,
            onSaveScore,
            onCorrectAnswer,
        ]
    );

    // Drop game state
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

            if (
                time - (state.lastSpawn || 0) > spawnInterval &&
                state.words.length < maxWords
            ) {
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
                if (elapsed > 90)
                    allowedGroups.push("extended", "extended-yōon");

                const pool = dataset.filter((c) =>
                    allowedGroups.includes(c.group)
                );
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
                    if (state.activeId === state.words[i].id)
                        state.activeId = null;
                    state.words.splice(i, 1);
                    lost++;
                }
            }

            if (lost > 0) {
                setLives((l) => {
                    const n = l - lost;
                    if (n <= 0 && !isGameOverRef.current) {
                        isGameOverRef.current = true;
                        onSaveScore(
                            dropScore.current,
                            localName,
                            activeModeKey
                        );
                        setPhase("gameover");
                    }
                    return n;
                });
                setErrorFlash(true);
                setTimeout(() => setErrorFlash(false), 200);
            }

            setDropTick((t) => t + 1);
            if (!isGameOverRef.current)
                rafRef.current = requestAnimationFrame(updateDropGame);
        },
        [dataset, localName, activeModeKey, onSaveScore]
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
                    const still = target.validOptions.filter((o) =>
                        o.startsWith(newTyped)
                    );
                    if (still.length > 0) {
                        target.typed = newTyped;
                        target.validOptions = still;
                        hit = true;
                        if (still.some((o) => o === newTyped)) {
                            state.words = state.words.filter(
                                (w) => w.id !== target.id
                            );
                            state.activeId = null;
                            dropScore.current += 1;
                            engine.setStatus("correct");
                            playAudio(target.char);
                        }
                    }
                }
            } else {
                const possible = state.words.filter(
                    (w) =>
                        w.y > 0 &&
                        w.validOptions.some((o) => o.startsWith(inputChar))
                );
                if (possible.length > 0) {
                    possible.sort((a, b) => b.y - a.y);
                    const target = possible[0];
                    target.typed = inputChar;
                    target.validOptions = target.validOptions.filter((o) =>
                        o.startsWith(inputChar)
                    );
                    state.activeId = target.id;
                    hit = true;
                    if (target.validOptions.some((o) => o === inputChar)) {
                        state.words = state.words.filter(
                            (w) => w.id !== target.id
                        );
                        state.activeId = null;
                        dropScore.current += 1;
                        playAudio(target.char);
                    }
                }
            }

            if (!hit) {
                engine.setStatus("wrong");
                setErrorFlash(true);
                setTimeout(() => setErrorFlash(false), 200);
            }
            setDropTick((t) => t + 1);
        },
        [engine]
    );

    return {
        phase,
        setPhase,
        challengeMode,
        setChallengeMode,
        timeMinutes,
        setTimeMinutes,
        timeLeft,
        lives,
        localName,
        setLocalName,
        errorFlash,
        lastPoints,
        pointsAnimKey,
        activeModeKey,
        engine,
        dropState,
        dropTick,
        startGame,
        handleAnswer,
        handleDropTyping,
    };
}
