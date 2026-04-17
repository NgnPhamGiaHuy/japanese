/**
 * useLearnNavigation — Manages navigation state and logic
 *
 * @remarks
 * Handles sequential and random navigation through kana dataset.
 * Marks characters as learned and triggers audio playback.
 */

import { useEffect, useState } from "react";

import { playAudio } from "@/shared/utils";

import type { KanaChar } from "@/features/kana/types";

export function useLearnNavigation(
    dataset: KanaChar[],
    alphabet: "hiragana" | "katakana" | "both",
    globalAutoPlay: boolean,
    markLearned: (char: string) => void,
) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRandom, setIsRandom] = useState(false);
    const [prevAlphabet, setPrevAlphabet] = useState(alphabet);

    // Reset index when alphabet changes
    if (alphabet !== prevAlphabet) {
        setPrevAlphabet(alphabet);
        setCurrentIndex(0);
    }

    const char = dataset[currentIndex];

    // Auto-play audio when character changes
    useEffect(() => {
        if (globalAutoPlay && char) playAudio(char.char);
    }, [currentIndex, char, globalAutoPlay]);

    const getRandomIndex = () => {
        let idx = Math.floor(Math.random() * dataset.length);
        while (idx === currentIndex && dataset.length > 1) {
            idx = Math.floor(Math.random() * dataset.length);
        }
        return idx;
    };

    const next = () => {
        if (char) markLearned(char.char);
        if (isRandom) {
            setCurrentIndex(getRandomIndex());
        } else {
            setCurrentIndex((i) => (i + 1) % dataset.length);
        }
    };

    const prev = () => {
        if (isRandom) {
            setCurrentIndex(getRandomIndex());
        } else {
            setCurrentIndex((i) => (i - 1 + dataset.length) % dataset.length);
        }
    };

    const toggleRandom = () => setIsRandom((v) => !v);

    return {
        currentIndex,
        isRandom,
        char,
        next,
        prev,
        toggleRandom,
    };
}
