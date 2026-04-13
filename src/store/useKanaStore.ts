import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AlphabetMode } from "@/features/kana/types/kana.types";

interface KanaState {
    alphabet: AlphabetMode;
    setAlphabet: (mode: AlphabetMode) => void;
}

export const useKanaStore = create<KanaState>()(
    persist(
        (set) => ({
            alphabet: "hiragana",
            setAlphabet: (alphabet) => set({ alphabet }),
        }),
        {
            name: "kana-ui-state",
            partialize: (state) => ({ alphabet: state.alphabet }),
        },
    ),
);
