/**
 * usePracticeNavigation — Manages navigation and mode state
 *
 * @remarks
 * Handles sequential/random navigation and practice mode switching.
 * Resets index when alphabet changes.
 */

import { useEffect, useState } from "react";

import { playAudio } from "@/shared/utils";

import type { KanaChar } from "@/features/kana/types";
import type { PracticeMode } from "../types";

export function usePracticeNavigation(
    dataset: KanaChar[],
    alphabet: "hiragana" | "katakana" | "both",
) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRandom, setIsRandom] = useState(false);
    const [practiceMode, setPracticeMode] = useState<PracticeMode>(1);
    const [prevAlphabet, setPrevAlphabet] = useState(alphabet);

    // Reset index when alphabet changes
    if (alphabet !== prevAlphabet) {
        setPrevAlphabet(alphabet);
        setCurrentIndex(0);
    }

    const char = dataset[currentIndex];

    // Auto-play audio in recall mode (mode 3)
    useEffect(() => {
        if (practiceMode === 3 && char) playAudio(char.char);
    }, [currentIndex, practiceMode, char]);

    const getRandomIndex = () => {
        let idx = Math.floor(Math.random() * dataset.length);
        while (idx === currentIndex && dataset.length > 1) {
            idx = Math.floor(Math.random() * dataset.length);
        }
        return idx;
    };

    const navigate = (dir: 1 | -1) => {
        if (isRandom) {
            setCurrentIndex(getRandomIndex());
        } else {
            setCurrentIndex((i) => (i + dir + dataset.length) % dataset.length);
        }
    };

    const cycleMode = () => {
        setPracticeMode((m) => (m >= 3 ? 1 : ((m + 1) as PracticeMode)));
    };

    const toggleRandom = () => setIsRandom((r) => !r);

    return {
        currentIndex,
        isRandom,
        practiceMode,
        char,
        navigate,
        cycleMode,
        toggleRandom,
    };
}
