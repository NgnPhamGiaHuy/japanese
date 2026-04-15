import { create } from "zustand";

/** Half of a content pair, or a lone distractor tile. */
export interface MatchItem {
    id: string;
    value: string;
    /** Present only for real pair halves; both cells of a card share the same id */
    pairId?: string;
    isDistractor?: boolean;
}

type MatchGridState = {
    grid: MatchItem[];
    selectedIds: string[];
    /** Solved real pair ids */
    matchedPairIds: string[];
    processing: boolean;
    shakeCellIds: string[];
};

type MatchGridActions = {
    initGrid: (items: MatchItem[]) => void;
    setSelected: (ids: string[]) => void;
    addMatchedPairId: (pairId: string) => void;
    setProcessing: (value: boolean) => void;
    setShake: (ids: string[]) => void;
    clearShake: () => void;
};

export const useMatchGameStore = create<MatchGridState & MatchGridActions>((set) => ({
    grid: [],
    selectedIds: [],
    matchedPairIds: [],
    processing: false,
    shakeCellIds: [],

    initGrid: (items) =>
        set({
            grid: items,
            selectedIds: [],
            matchedPairIds: [],
            processing: false,
            shakeCellIds: [],
        }),

    setSelected: (ids) => set({ selectedIds: ids }),
    addMatchedPairId: (pairId) =>
        set((s) => ({
            matchedPairIds: s.matchedPairIds.includes(pairId)
                ? s.matchedPairIds
                : [...s.matchedPairIds, pairId],
            selectedIds: [],
        })),
    setProcessing: (value) => set({ processing: value }),
    setShake: (ids) => set({ shakeCellIds: ids }),
    clearShake: () => set({ shakeCellIds: [] }),
}));
