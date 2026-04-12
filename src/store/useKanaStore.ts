import { create } from "zustand";
import { persist } from "zustand/middleware";

import { clearCharStats } from "@/shared/utils/stats";

import type { AlphabetMode } from "@/features/kana/types/kana.types";

interface KanaState {
    alphabet: AlphabetMode;
    learnedChars: string[];
    bestScores: Record<string, number>;
    // Actions
    setAlphabet: (mode: AlphabetMode) => void;
    markLearned: (char: string) => void;
    resetProgress: () => void;
    setBestScores: (scores: Record<string, number>) => void;
    updateBestScore: (key: string, score: number) => void;
}

export const useKanaStore = create<KanaState>()(
    persist(
        (set) => ({
            alphabet: "hiragana",
            learnedChars: [],
            bestScores: {},
            setAlphabet: (alphabet) => set({ alphabet }),
            markLearned: (char) =>
                set((s) => ({
                    learnedChars: s.learnedChars.includes(char)
                        ? s.learnedChars
                        : [...s.learnedChars, char],
                })),
            resetProgress: () => {
                clearCharStats();
                set({ learnedChars: [] });
            },
            setBestScores: (bestScores) => set({ bestScores }),
            updateBestScore: (key, score) =>
                set((s) => ({
                    bestScores: {
                        ...s.bestScores,
                        [key]: Math.max(s.bestScores[key] ?? 0, score),
                    },
                })),
        }),
        { name: "kana-progress" },
    ),
);
