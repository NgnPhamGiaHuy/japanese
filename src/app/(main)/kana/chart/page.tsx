"use client";

import { Fragment, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { buildChartBlocks, CHART_SECTION_TITLES } from "@/features/kana/data/chartLayouts";
import { HIRAGANA_DATA } from "@/features/kana/data/hiragana";
import { KATAKANA_DATA } from "@/features/kana/data/katakana";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { ScreenHeader } from "@/shared/components/layout";
import { PRINT_FONT } from "@/shared/constants/fonts";
import { playAudio } from "@/shared/utils/audio";
import { useKanaStore } from "@/store/useKanaStore";

import type { ChartBlock } from "@/features/kana/data/chartLayouts";
import type { KanaChar } from "@/features/kana/types/kana.types";

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
    const learnedBorder = isH ? "border-[#58cc02] bg-[#f0fce6]" : "border-[#1cb0f6] bg-[#f0f9ff]";
    const learnedText = isH ? "text-[#46a302]" : "text-[#149fdf]";
    const learnedRomaji = isH ? "text-[#58a700]" : "text-[#1899d6]";

    if (!item) {
        return (
            <div className="aspect-square min-h-[48px] rounded-xl border-2 border-b-4 border-transparent border-b-transparent md:min-h-[56px] md:rounded-2xl" />
        );
    }

    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => playAudio(item.char)}
            className={`flex aspect-square min-h-[48px] flex-col items-center justify-center rounded-xl border-2 border-b-4 transition-colors md:min-h-[56px] md:rounded-2xl ${
                learned ? learnedBorder : "border-gray-200 bg-white hover:border-gray-300"
            }`}
        >
            <span
                style={{ fontFamily: PRINT_FONT }}
                className={`text-lg leading-none font-medium md:text-2xl ${learned ? learnedText : "text-[#3c3c3c]"}`}
            >
                {item.char}
            </span>
            {showRomaji && (
                <span
                    className={`mt-0.5 max-w-[95%] truncate px-0.5 text-[9px] font-bold md:mt-1 md:text-[10px] ${learned ? learnedRomaji : "text-[#afafaf]"}`}
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
                        className="py-0.5 text-center text-[10px] font-black tracking-wide text-gray-400 uppercase md:text-xs"
                    >
                        {h}
                    </div>
                ))}
                {block.rows.map((row, ri) => (
                    <Fragment key={`${blockKeyPrefix}-${ri}-${row.label}`}>
                        <div className="flex items-center justify-end pr-1 text-[10px] font-black text-gray-500 tabular-nums md:text-xs">
                            {row.label}
                        </div>
                        {row.cells.map((cell, ci) => (
                            <ChartCell
                                key={`${blockKeyPrefix}-${ri}-${ci}`}
                                item={cell}
                                showRomaji={showRomaji}
                                learned={cell ? isLearned(cell.char) : false}
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

    const hiraBlocks = useMemo(() => buildChartBlocks(HIRAGANA_DATA, false), []);
    const kataBlocks = useMemo(() => buildChartBlocks(KATAKANA_DATA, true), []);

    const singleBlocks = useMemo(() => {
        if (isBoth) return null;
        return buildChartBlocks(
            alphabet === "katakana" ? KATAKANA_DATA : HIRAGANA_DATA,
            alphabet === "katakana",
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

    const headingClassSingle = alphabet === "katakana" ? "text-[#1cb0f6]" : "text-[#58cc02]";

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8]">
            <ScreenHeader
                title="Character Chart"
                backHref="/kana"
                rightWrapperClassName="flex items-center justify-end min-w-0 shrink-0"
                right={
                    <button
                        type="button"
                        onClick={() => setShowRomaji(!showRomaji)}
                        className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 md:text-xs ${
                            !showRomaji
                                ? "border-[#ea2b2b] bg-[#ffdfe0] text-[#ea2b2b]"
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
                }
            />
            <div className="animate-in fade-in mx-auto max-w-4xl px-4 pt-6 pb-28 duration-300">
                {isBoth && (
                    <p className="mx-auto mb-4 max-w-md text-center text-[10px] font-bold text-[#afafaf] md:text-xs">
                        Hiragana and katakana for the same sounds are grouped by section. Extended
                        loanword katakana appears only under Katakana.
                    </p>
                )}

                <div className="flex flex-col gap-8 md:gap-10">
                    {combinedSections &&
                        combinedSections.map(({ title, hiragana, katakana }) => (
                            <div
                                key={title}
                                className="rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white p-5 shadow-sm md:p-8"
                            >
                                <h2 className="mb-4 border-b-2 border-gray-100 pb-3 text-xl font-black tracking-widest text-[#ce82ff] uppercase md:mb-6 md:pb-4 md:text-2xl">
                                    {title}
                                </h2>
                                <div className="flex flex-col gap-6 md:gap-8">
                                    {hiragana && (
                                        <div>
                                            <h3 className="mb-3 pl-0.5 text-xs font-black tracking-widest text-[#58cc02] uppercase md:text-sm">
                                                Hiragana
                                            </h3>
                                            <ChartBlockGrid
                                                block={hiragana}
                                                showRomaji={showRomaji}
                                                isLearned={isLearned}
                                                isH
                                                blockKeyPrefix={`${title}-h`}
                                            />
                                        </div>
                                    )}
                                    {katakana && (
                                        <div>
                                            <h3 className="mb-3 pl-0.5 text-xs font-black tracking-widest text-[#1cb0f6] uppercase md:text-sm">
                                                Katakana
                                            </h3>
                                            <ChartBlockGrid
                                                block={katakana}
                                                showRomaji={showRomaji}
                                                isLearned={isLearned}
                                                isH={false}
                                                blockKeyPrefix={`${title}-k`}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                    {!isBoth &&
                        singleBlocks?.map((block) => (
                            <div
                                key={block.title}
                                className="rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white p-5 shadow-sm md:p-8"
                            >
                                <h2
                                    className={`mb-4 border-b-2 border-gray-100 pb-3 text-xl font-black tracking-widest uppercase md:mb-6 md:pb-4 md:text-2xl ${headingClassSingle}`}
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
    );
}
