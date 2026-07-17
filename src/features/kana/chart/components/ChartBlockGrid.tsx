/**
 * ChartBlockGrid — Grid layout for a single chart block (e.g., Basic, Dakuten)
 *
 * @remarks
 * Renders headers and rows of kana characters in a responsive grid.
 * Handles both hiragana and katakana display.
 */

"use client";

import { Fragment } from "react";

import { ChartCell } from "./ChartCell";

import type { ChartBlockGridProps } from "../types";

export function ChartBlockGrid({
    block,
    showRomaji,
    isLearned,
    isHiragana,
    blockKeyPrefix,
    playLabel,
}: ChartBlockGridProps) {
    const n = block.headers.length;

    return (
        <div
            className="grid w-full gap-1 sm:gap-1.5 md:gap-2"
            style={{
                gridTemplateColumns: `1.5rem repeat(${n}, 1fr)`,
            }}
        >
            <div />
            {block.headers.map((h) => (
                <div
                    key={h}
                    className="pb-1 text-center text-xs font-black tracking-wide text-gray-400 uppercase sm:text-xs md:text-xs"
                >
                    {h}
                </div>
            ))}

            {block.rows.map((row, ri) => (
                <Fragment key={`${blockKeyPrefix}-${ri}-${row.label}`}>
                    <div className="flex items-center justify-end text-xs font-black text-gray-400 tabular-nums sm:text-xs md:text-xs">
                        {row.label}
                    </div>

                    {row.cells.map((cell, ci) => (
                        <ChartCell
                            key={`${blockKeyPrefix}-${ri}-${ci}`}
                            item={cell}
                            showRomaji={showRomaji}
                            learned={cell ? isLearned(cell.char) : false}
                            isHiragana={isHiragana}
                            playLabel={playLabel}
                        />
                    ))}
                </Fragment>
            ))}
        </div>
    );
}
