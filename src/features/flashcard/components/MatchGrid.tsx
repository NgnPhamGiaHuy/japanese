"use client";

import { useMemo } from "react";

import MatchCard from "./MatchCard";

import type { MatchCardSurface } from "./MatchCard";
import type { Grade } from "../services/card.service";
import type { MatchItem } from "../stores/useMatchGameStore";

interface MatchGridProps {
    cells: MatchItem[];
    selectedIds: string[];
    matchedPairIds: string[];
    shakeCellIds: string[];
    processing: boolean;
    onCellPress: (cellId: string) => void;
    /** The pairId currently revealed (answer tile + grade buttons visible). Requirement 7.2 */
    revealedPairId: string | null;
    /** Called when a grade button is pressed for the revealed pair. Requirement 7.3 */
    onGrade?: (pairId: string, grade: Grade) => void;
}

const GRADE_BUTTONS: { grade: Grade; label: string; ariaLabel: string; color: string }[] = [
    {
        grade: "Again",
        label: "Again",
        ariaLabel: "Again — card will repeat soon",
        color: "bg-[#ea2b2b] hover:bg-[#c72424] text-white",
    },
    {
        grade: "Hard",
        label: "Hard",
        ariaLabel: "Hard — card will be reviewed sooner",
        color: "bg-[#ff9600] hover:bg-[#e08500] text-white",
    },
    {
        grade: "Good",
        label: "Good",
        ariaLabel: "Good — card will be reviewed on schedule",
        color: "bg-[#58cc02] hover:bg-[#4ab302] text-white",
    },
    {
        grade: "Easy",
        label: "Easy",
        ariaLabel: "Easy — card interval will increase",
        color: "bg-[#1cb0f6] hover:bg-[#18a0de] text-white",
    },
];

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
    revealedPairId,
    onGrade,
}: MatchGridProps) => {
    // Only show stimulus tiles (-a suffix) in the grid; answer tiles (-b) are hidden
    // until their pair is revealed. Requirement 7.1, 7.4
    const stimulusCells = useMemo(
        () => cells.filter((c) => c.isDistractor || (c.pairId && c.id.endsWith("-a"))),
        [cells],
    );

    const cols = useMemo(() => {
        const n = stimulusCells.length;
        if (n <= 4) return "grid-cols-2";
        if (n <= 8) return "grid-cols-2 sm:grid-cols-4";
        if (n <= 16) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-4";
        return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";
    }, [stimulusCells.length]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const matchedSet = useMemo(() => new Set(matchedPairIds), [matchedPairIds]);
    const shakeSet = useMemo(() => new Set(shakeCellIds), [shakeCellIds]);

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Stimulus tile grid — always visible (Requirement 7.1) */}
            <div
                className={`mx-auto grid w-full max-w-3xl flex-1 content-start gap-2.5 overflow-y-auto p-1 ${cols}`}
            >
                {stimulusCells.map((cell) => {
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
                            // Stimulus tiles are keyboard-navigable (Requirement 7.4)
                            tabIndex={disabled ? -1 : 0}
                        />
                    );
                })}
            </div>

            {/* Revealed answer tile + grade buttons (Requirement 7.2, 7.3) */}
            {revealedPairId !== null &&
                (() => {
                    const answerCell = cells.find(
                        (c) =>
                            !c.isDistractor && c.pairId === revealedPairId && c.id.endsWith("-b"),
                    );
                    if (!answerCell) return null;
                    return (
                        <div className="mx-auto flex w-full max-w-sm flex-col gap-3 px-4">
                            {/* Answer tile */}
                            <div className="rounded-2xl border-2 border-[#ce82ff] bg-[#f8f0ff] p-4 text-center font-black text-[#ce82ff] shadow-md">
                                <span className="text-base leading-snug">{answerCell.value}</span>
                            </div>

                            {/* Grade buttons (Requirement 7.3) */}
                            <div className="grid grid-cols-4 gap-2">
                                {GRADE_BUTTONS.map(({ grade, label, ariaLabel, color }) => (
                                    <button
                                        key={grade}
                                        type="button"
                                        aria-label={ariaLabel}
                                        className={`rounded-xl px-2 py-3 text-xs font-black transition-colors ${color}`}
                                        onClick={() => onGrade?.(revealedPairId, grade)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
};

export default MatchGrid;
