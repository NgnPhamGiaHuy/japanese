"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { HIRAGANA_DATA } from "@/features/kana/data/hiragana";
import { KATAKANA_DATA } from "@/features/kana/data/katakana";
import {
    buildChartBlocks,
    CHART_SECTION_TITLES,
    type ChartBlock,
} from "@/features/kana/data/chartLayouts";
import type { KanaChar } from "@/features/kana/types/kana.types";
import { KanaAppShell } from "@/features/kana/components";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useKanaStore } from "@/store/useKanaStore";
import Button from "@/shared/components/ui/Button";
import { PRINT_FONT } from "@/shared/constants/fonts";
import { playAudio } from "@/shared/utils/audio";

function ChartCell({
    item,
    showRomaji,
    learned,
    isH,
}: {
    item: KanaChar | null;
    showRomaji: boolean;
    learned: boolean;
    isH: boolean;
}) {
    const learnedBorder = isH
        ? "border-[#58cc02] bg-[#f0fce6]"
        : "border-[#1cb0f6] bg-[#f0f9ff]";
    const learnedText = isH ? "text-[#46a302]" : "text-[#149fdf]";
    const learnedRomaji = isH ? "text-[#58a700]" : "text-[#1899d6]";

    if (!item) {
        return (
            <div className="aspect-square min-h-[48px] md:min-h-[56px] rounded-xl md:rounded-2xl border-2 border-transparent border-b-4 border-b-transparent" />
        );
    }

    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => playAudio(item.char)}
            className={`flex flex-col items-center justify-center aspect-square min-h-[48px] md:min-h-[56px] rounded-xl md:rounded-2xl transition-colors border-2 border-b-4 ${
                learned
                    ? learnedBorder
                    : "bg-white border-gray-200 hover:border-gray-300"
            }`}
        >
            <span
                style={{ fontFamily: PRINT_FONT }}
                className={`text-lg md:text-2xl font-medium leading-none ${learned ? learnedText : "text-[#3c3c3c]"}`}
            >
                {item.char}
            </span>
            {showRomaji && (
                <span
                    className={`text-[9px] md:text-[10px] font-bold mt-0.5 md:mt-1 max-w-[95%] truncate px-0.5 ${learned ? learnedRomaji : "text-[#afafaf]"}`}
                >
                    {item.romaji}
                </span>
            )}
        </motion.button>
    );
}

function ChartBlockGrid({
    block,
    showRomaji,
    isLearned,
    isH,
    blockKeyPrefix,
}: {
    block: ChartBlock;
    showRomaji: boolean;
    isLearned: (char: string) => boolean;
    isH: boolean;
    blockKeyPrefix: string;
}) {
    const n = block.headers.length;
    const narrow = n === 3 ? "max-w-xl mx-auto" : "";

    return (
        <div className={narrow}>
            <div
                className="grid gap-1.5 md:gap-2"
                style={{
                    gridTemplateColumns: `minmax(1.5rem,auto) repeat(${n}, minmax(0,1fr))`,
                }}
            >
                <div />
                {block.headers.map((h) => (
                    <div
                        key={h}
                        className="text-center text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-wide py-0.5"
                    >
                        {h}
                    </div>
                ))}
                {block.rows.map((row, ri) => (
                    <Fragment key={`${blockKeyPrefix}-${ri}-${row.label}`}>
                        <div className="text-[10px] md:text-xs font-black text-gray-500 flex items-center justify-end pr-1 tabular-nums">
                            {row.label}
                        </div>
                        {row.cells.map((cell, ci) => (
                            <ChartCell
                                key={`${blockKeyPrefix}-${ri}-${ci}`}
                                item={cell}
                                showRomaji={showRomaji}
                                learned={
                                    cell ? isLearned(cell.char) : false
                                }
                                isH={isH}
                            />
                        ))}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

export default function KanaChartPage() {
    const [showRomaji, setShowRomaji] = useState(true);
    const { learnedChars, alphabet } = useKanaStore();
    const { themeColor } = useKanaDataset();

    const isLearned = (char: string) => learnedChars.includes(char);
    const isBoth = alphabet === "both";

    const hiraBlocks = useMemo(
        () => buildChartBlocks(HIRAGANA_DATA, false),
        []
    );
    const kataBlocks = useMemo(
        () => buildChartBlocks(KATAKANA_DATA, true),
        []
    );

    const singleBlocks = useMemo(() => {
        if (isBoth) return null;
        return buildChartBlocks(
            alphabet === "katakana" ? KATAKANA_DATA : HIRAGANA_DATA,
            alphabet === "katakana"
        );
    }, [alphabet, isBoth]);

    const combinedSections = useMemo(() => {
        if (!isBoth) return null;
        const out: {
            title: string;
            hiragana?: ChartBlock;
            katakana?: ChartBlock;
        }[] = [];
        for (const title of CHART_SECTION_TITLES) {
            const hiragana = hiraBlocks.find((b) => b.title === title);
            const katakana = kataBlocks.find((b) => b.title === title);
            if (hiragana || katakana) {
                out.push({ title, hiragana, katakana });
            }
        }
        return out;
    }, [isBoth, hiraBlocks, kataBlocks]);

    const headingClassSingle =
        alphabet === "katakana"
            ? "text-[#1cb0f6]"
            : "text-[#58cc02]";

    return (
        <KanaAppShell>
            <div className="flex flex-col h-full min-h-0 py-2 sm:py-4 animate-in fade-in duration-300">
                <div className="w-full flex justify-between items-center mb-3 md:mb-6 shrink-0 px-2 sm:px-0 max-w-4xl mx-auto">
                    <Link href="/kana">
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            className="px-2 md:px-3 py-1.5 md:py-2"
                        />
                    </Link>
                    <span className="text-[10px] md:text-sm font-black text-gray-500 tracking-widest uppercase">
                        Character Chart
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowRomaji(!showRomaji)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold transition-all border-2 active:scale-95 ${
                            !showRomaji
                                ? "bg-[#ffdfe0] text-[#ea2b2b] border-[#ea2b2b]"
                                : `${themeColor.primaryLightBg} ${themeColor.text} ${themeColor.primaryBorder}`
                        }`}
                    >
                        {showRomaji ? (
                            <Eye size={14} strokeWidth={3} />
                        ) : (
                            <EyeOff size={14} strokeWidth={3} />
                        )}
                        <span className="hidden sm:inline">Romaji</span>
                    </button>
                </div>

                {isBoth && (
                    <p className="text-[10px] md:text-xs font-bold text-[#afafaf] text-center max-w-md mx-auto px-4 mb-2">
                        Hiragana and katakana for the same sounds are grouped
                        by section. Extended loanword katakana appears only
                        under Katakana.
                    </p>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-2 sm:px-1 pb-6 w-full">
                    <div className="max-w-3xl mx-auto flex flex-col gap-8 md:gap-10">
                        {combinedSections &&
                            combinedSections.map(
                                ({ title, hiragana, katakana }) => (
                                    <div
                                        key={title}
                                        className="bg-white p-5 md:p-8 rounded-[2rem] shadow-sm border-2 border-b-4 border-gray-200"
                                    >
                                        <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6 border-b-2 border-gray-100 pb-3 md:pb-4 tracking-widest uppercase text-[#ce82ff]">
                                            {title}
                                        </h2>
                                        <div className="flex flex-col gap-6 md:gap-8">
                                            {hiragana && (
                                                <div>
                                                    <h3 className="text-xs md:text-sm font-black text-[#58cc02] uppercase tracking-widest mb-3 pl-0.5">
                                                        Hiragana
                                                    </h3>
                                                    <ChartBlockGrid
                                                        block={hiragana}
                                                        showRomaji={
                                                            showRomaji
                                                        }
                                                        isLearned={isLearned}
                                                        isH
                                                        blockKeyPrefix={`${title}-h`}
                                                    />
                                                </div>
                                            )}
                                            {katakana && (
                                                <div>
                                                    <h3 className="text-xs md:text-sm font-black text-[#1cb0f6] uppercase tracking-widest mb-3 pl-0.5">
                                                        Katakana
                                                    </h3>
                                                    <ChartBlockGrid
                                                        block={katakana}
                                                        showRomaji={
                                                            showRomaji
                                                        }
                                                        isLearned={isLearned}
                                                        isH={false}
                                                        blockKeyPrefix={`${title}-k`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}

                        {!isBoth &&
                            singleBlocks?.map((block) => (
                                <div
                                    key={block.title}
                                    className="bg-white p-5 md:p-8 rounded-[2rem] shadow-sm border-2 border-b-4 border-gray-200"
                                >
                                    <h2
                                        className={`text-xl md:text-2xl font-black mb-4 md:mb-6 border-b-2 border-gray-100 pb-3 md:pb-4 tracking-widest uppercase ${headingClassSingle}`}
                                    >
                                        {block.title}
                                    </h2>
                                    <ChartBlockGrid
                                        block={block}
                                        showRomaji={showRomaji}
                                        isLearned={isLearned}
                                        isH={alphabet === "hiragana"}
                                        blockKeyPrefix={block.title}
                                    />
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </KanaAppShell>
    );
}
