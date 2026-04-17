"use client";

import { useMemo } from "react";

import MatchCard from "./MatchCard";

import type { MatchCardSurface } from "./MatchCard";
import type { MatchItem } from "../../../core/hooks/useMatchGameStore";

interface MatchGridProps {
    cells: MatchItem[];
    selectedIds: string[];
    matchedPairIds: string[];
    shakeCellIds: string[];
    processing: boolean;
    onCellPress: (cellId: string) => void;
}

function cellSurface(
    cell: MatchItem,
    ctx: {
        selectedIds: Set<string>;
        matchedPairs: Set<string>;
        shake: Set<string>;
    },
): MatchCardSurface {
    if (!cell.isDistractor && cell.pairId && ctx.matchedPairs.has(cell.pairId)) return "matched";
    if (ctx.shake.has(cell.id)) return "error";
    if (ctx.selectedIds.has(cell.id)) return "selected";
    return "default";
}

const MatchGrid = ({
    cells,
    selectedIds,
    matchedPairIds,
    shakeCellIds,
    processing,
    onCellPress,
}: MatchGridProps) => {
    const cols = useMemo(() => {
        const n = cells.length;
        if (n <= 8) return "grid-cols-2 sm:grid-cols-4";
        if (n <= 16) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-4";
        return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";
    }, [cells.length]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const matchedSet = useMemo(() => new Set(matchedPairIds), [matchedPairIds]);
    const shakeSet = useMemo(() => new Set(shakeCellIds), [shakeCellIds]);

    return (
        <div
            className={`mx-auto grid w-full max-w-3xl flex-1 content-start gap-2.5 overflow-y-auto p-1 ${cols}`}
        >
            {cells.map((cell) => {
                const isMatched =
                    !cell.isDistractor && cell.pairId != null && matchedSet.has(cell.pairId);
                const surface = cellSurface(cell, {
                    selectedIds: selectedSet,
                    matchedPairs: matchedSet,
                    shake: shakeSet,
                });
                const disabled = isMatched || processing;

                return (
                    <MatchCard
                        key={cell.id}
                        label={cell.value}
                        surface={surface}
                        disabled={disabled}
                        onPress={() => onCellPress(cell.id)}
                        tabIndex={disabled ? -1 : 0}
                    />
                );
            })}
        </div>
    );
};

export default MatchGrid;
