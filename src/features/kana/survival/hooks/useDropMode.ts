/**
 * @file useDropMode
 * Drop Mode (real-time falling characters, requestAnimationFrame loop) —
 * split out of useSurvivalGame.ts (E11-T4). Drop Mode's own header comment
 * already called out that it "remains self-contained" since it's
 * incompatible with GameEngine's Q&A loop — this split makes that boundary
 * a real module boundary instead of just a comment.
 *
 * Takes the parent's shared refs/setters as params rather than owning them,
 * since game-over handling (score save, session end, activity log, phase
 * transition) must stay consistent across all three challenge modes.
 */
"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { comboMultiplier } from "@/features/game";
import { logKanaSurvivalCompleted } from "@/features/kana/actions";
import { useKanaQuizSession } from "@/features/kana/hooks";
import { auth } from "@/lib/firebase";
import { playSfx, sequence } from "@/shared/audio";
import { getValidRomaji } from "@/shared/utils";

import type { KanaChar } from "@/features/kana/types";
import type { DropWord, SurvivalPhase } from "../types";

interface UseDropModeParams {
    dataset: KanaChar[];
    alphabet: string;
    userId: string | null;
    phase: SurvivalPhase;
    challengeMode: "infinity" | "time" | "drop";
    isGameOverRef: React.RefObject<boolean>;
    setPhase: (phase: SurvivalPhase) => void;
    setLives: React.Dispatch<React.SetStateAction<number>>;
    setErrorFlash: (flash: boolean) => void;
    setLastPoints: (points: number) => void;
    setPointsAnimKey: (key: number) => void;
    onSaveScoreRef: React.RefObject<(score: number, name: string, modeKey: string) => void>;
    endSessionRef: React.RefObject<(score: number) => Promise<void>>;
    syncScoreRef: React.RefObject<(score: number) => void>;
    userNameRef: React.RefObject<string>;
    localNameRef: React.RefObject<string>;
    activeModeKeyRef: React.RefObject<string>;
    engine: ReturnType<typeof useKanaQuizSession>;
}

export function useDropMode({
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
}: UseDropModeParams) {
    // dropScore/dropStreak are state (not refs) — SurvivalDropScreen reads
    // them directly during render (currentScore/streak props), and a ref
    // mutation wouldn't reliably show up there since ref writes don't
    // trigger a re-render on their own.
    const [dropScore, setDropScore] = useState(0);
    const [dropStreak, setDropStreak] = useState(0);
    const [dropTick, setDropTick] = useState(0);
    const dropState = useRef({
        words: [] as DropWord[],
        activeId: null as string | null,
        lastTime: 0,
        startTime: 0,
        lastSpawn: 0,
    });
    const rafRef = useRef<number>(0);

    const resetDrop = useCallback(() => {
        setDropScore(0);
        setDropStreak(0);
    }, []);

    /**
     * Sounds a completed word: cue always, pronunciation only when there is room for it.
     *
     * @remarks
     * Drop mode used to fire the click cue, the correct cue and a pronunciation in the same tick,
     * on every completed word. A fast typist finishing words under a second apart cancelled each
     * pronunciation mid-utterance, so the mode produced a stream of clipped syllables. The
     * `ignore-if-busy` policy keeps the cue instant while letting the voice finish what it
     * started — the reward is the cue; the pronunciation is a bonus when the pace allows.
     */
    const announceCompletedWord = useCallback((char: string) => {
        playSfx("correct");
        void sequence(
            "survival-drop-feedback",
            [
                { waitForTail: "correct" },
                { speak: { text: char, options: { trigger: "auto", source: "survival-drop" } } },
            ],
            { policy: "ignore-if-busy" },
        );
    }, []);

    /**
     * RAF loop for Drop Mode.
     *
     * @remarks
     * Spawns falling characters with progressive difficulty:
     * - Speed increases over time
     * - Spawn interval decreases
     * - More complex character groups unlock after 30/60/90 seconds
     *
     * Words that fall off screen cost a life. Lives reaching 0 ends the game.
     *
     * Does one frame's work and returns — the requestAnimationFrame recursion
     * that drives the loop lives in the effect below (via a latest-callback
     * ref), not here, so this can freely depend on state like dropScore
     * without that dependency change restarting the loop.
     */
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
                    id: crypto.randomUUID(),
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
                setDropStreak(0);
                setLives((l) => {
                    const n = l - lost;
                    if (n <= 0 && !isGameOverRef.current) {
                        isGameOverRef.current = true;
                        const finalScore = dropScore;
                        onSaveScoreRef.current(
                            finalScore,
                            userNameRef.current || localNameRef.current,
                            activeModeKeyRef.current,
                        );
                        void endSessionRef.current(finalScore);
                        if (userId) {
                            void auth.currentUser?.getIdToken().then((token) =>
                                logKanaSurvivalCompleted(token, userId, alphabet, "drop", {
                                    score: finalScore,
                                    modeKey: activeModeKeyRef.current,
                                }),
                            );
                        }
                        setPhase("gameover");
                    }
                    return n;
                });
                setErrorFlash(true);
                setTimeout(() => setErrorFlash(false), 200);
            }

            setDropTick((t) => t + 1);
        },
        [
            alphabet,
            dataset,
            userId,
            dropScore,
            isGameOverRef,
            setLives,
            setPhase,
            setErrorFlash,
            onSaveScoreRef,
            endSessionRef,
            userNameRef,
            localNameRef,
            activeModeKeyRef,
        ],
    );

    // Latest-callback ref: the RAF loop below always invokes the freshest
    // updateDropGame without needing it as an effect dependency — otherwise
    // every dropScore change (i.e. every completed word) would tear down and
    // restart the whole loop instead of just continuing it.
    const updateDropGameRef = useRef(updateDropGame);
    useLayoutEffect(() => {
        updateDropGameRef.current = updateDropGame;
    });

    useEffect(() => {
        if (phase === "playing" && challengeMode === "drop") {
            // dropScore/dropStreak are already reset by startGame (via
            // resetDrop), the only path that sets phase to "playing" — no
            // need to reset again here.
            dropState.current = {
                words: [],
                activeId: null,
                lastTime: 0,
                startTime: 0,
                lastSpawn: 0,
            };

            const loop = (time: number) => {
                updateDropGameRef.current(time);
                if (!isGameOverRef.current) rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(rafRef.current);
    }, [phase, challengeMode, isGameOverRef]);

    /**
     * Handles keyboard input for Drop Mode.
     *
     * @remarks
     * Matches typed characters against falling words' valid romaji options.
     * Activates the lowest (most urgent) matching word on first keypress.
     * Completes a word when the full romaji is typed.
     */
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
                        playSfx("click");
                        hit = true;
                        if (still.some((o) => o === newTyped)) {
                            state.words = state.words.filter((w) => w.id !== target.id);
                            state.activeId = null;
                            const newStreak = dropStreak + 1;
                            const pts = comboMultiplier(newStreak);
                            announceCompletedWord(target.char);
                            setDropStreak(newStreak);
                            setDropScore((s) => s + pts);
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
                    playSfx("click");
                    hit = true;
                    if (target.validOptions.some((o) => o === inputChar)) {
                        state.words = state.words.filter((w) => w.id !== target.id);
                        state.activeId = null;
                        const newStreak = dropStreak + 1;
                        const pts = comboMultiplier(newStreak);
                        announceCompletedWord(target.char);
                        setDropStreak(newStreak);
                        setDropScore((s) => s + pts);
                        setLastPoints(pts);
                        setPointsAnimKey(Date.now());
                    }
                }
            }

            if (!hit) {
                setDropStreak(0);
                // A keypress can only be "wrong" if there was something to type. Without this
                // guard, tapping keys before the first character spawns scolds the player.
                if (state.words.length > 0) {
                    playSfx("wrong");
                    engine.setStatus("wrong");
                    setErrorFlash(true);
                    setTimeout(() => setErrorFlash(false), 200);
                }
            }
            setDropTick((t) => t + 1);
        },
        [announceCompletedWord, engine, dropStreak, setPointsAnimKey, setLastPoints, setErrorFlash],
    );

    // ── Drop score sync ───────────────────────────────────────────────────────
    // Depends on dropScore directly now that it's state, not dropTick (which
    // ticked on every animation frame — far more often than the score, which
    // only actually changes once per completed word).
    useEffect(() => {
        if (phase === "playing" && challengeMode === "drop") {
            syncScoreRef.current(dropScore);
        }
    }, [dropScore, phase, challengeMode, syncScoreRef]);

    return {
        dropState,
        dropScore,
        dropStreak,
        dropTick,
        resetDrop,
        handleDropTyping,
    };
}
