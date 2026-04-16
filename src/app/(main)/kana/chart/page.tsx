"use client";

import { Fragment, useMemo, useState } from "react";

import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import type { ChartBlock } from "@/features/kana/data";
import { buildChartBlocks, CHART_SECTION_TITLES, HIRAGANA_DATA, KATAKANA_DATA, } from "@/features/kana/data";
import { useKanaDataset } from "@/features/kana/hooks";
import { useUserProgress } from "@/features/user/hooks";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { playAudio } from "@/shared/utils";
import { useKanaStore } from "@/store";
import type { KanaChar } from "@/features/kana/types";

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
        return <div className="aspect-square w-full rounded-xl border-2 border-transparent" />;
    }

    const isMulti = item.char.length > 1;

    return (
        <motion.div
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            className="aspect-square w-full"
        >
            <Button
                onClick={() => playAudio(item.char)}
                className={`flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-b-4 transition-colors duration-150 active:translate-y-[1px] active:border-b-2 md:rounded-2xl ${
                    learned ? learnedBorder : "border-gray-200 bg-white hover:border-gray-300"
                }`}
            >
                <span
                    style={{
                        fontSize: isMulti
                            ? "clamp(0.6rem, 3.5cqi, 1.25rem)"
                            : "clamp(0.9rem, 4.5cqi, 1.75rem)",
                        lineHeight: 1,
                    }}
                    className={`font-medium ${learned ? learnedText : "text-[#3c3c3c]"}`}
                >
                    {item.char}
                </span>

                {showRomaji && (
                    <span
                        style={{ fontSize: "clamp(0.45rem, 1.8cqi, 0.625rem)" }}
                        className={`mt-0.5 w-full truncate text-center font-bold ${
                            learned ? learnedRomaji : "text-[#afafaf]"
                        }`}
                    >
                        {item.romaji}
                    </span>
                )}
            </Button>
        </motion.div>
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
                    className="pb-1 text-center text-[9px] font-black tracking-wide text-gray-400 uppercase sm:text-[10px] md:text-xs"
                >
                    {h}
                </div>
            ))}

            {block.rows.map((row, ri) => (
                <Fragment key={`${blockKeyPrefix}-${ri}-${row.label}`}>
                    <div className="flex items-center justify-end text-[9px] font-black text-gray-400 tabular-nums sm:text-[10px] md:text-xs">
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
    );
}

export default function KanaChartPage() {
    const [showRomaji, setShowRomaji] = useState(true);
    const { alphabet } = useKanaStore();
    const { userData } = useUserProgress();
    const { themeColor } = useKanaDataset();

    const isLearned = (char: string) => userData.learnedChars?.includes(char) ?? false;
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
        const out: { title: string; hiragana?: ChartBlock; katakana?: ChartBlock }[] = [];
        for (const title of CHART_SECTION_TITLES) {
            const hiragana = hiraBlocks.find((b) => b.title === title);
            const katakana = kataBlocks.find((b) => b.title === title);
            if (hiragana || katakana) out.push({ title, hiragana, katakana });
        }
        return out;
    }, [isBoth, hiraBlocks, kataBlocks]);

    const headingColorSingle = alphabet === "katakana" ? "text-[#1cb0f6]" : "text-[#58cc02]";

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8]">
            <ScreenHeader
                title="Character Chart"
                backHref="/kana"
                rightWrapperClassName="flex items-center justify-end min-w-0 shrink-0"
                right={
                    <Button
                        variant="ghost"
                        onClick={() => setShowRomaji((v) => !v)}
                        className={`!flex !items-center !gap-1.5 !rounded-xl !border-2 !px-3 !py-1.5 !text-[10px] !font-bold shadow-none transition-all hover:shadow-none active:translate-y-0 md:!text-xs ${
                            !showRomaji
                                ? "!border-[#ea2b2b] !bg-[#ffdfe0] !text-[#ea2b2b]"
                                : `${themeColor.primaryLightBg} ${themeColor.text} ${themeColor.primaryBorder}`
                        }`}
                        icon={showRomaji ? Eye : EyeOff}
                        iconSize={14}
                    >
                        <span className="hidden sm:inline">Romaji</span>
                    </Button>
                }
            />

            <div className="animate-in fade-in mx-auto w-full max-w-2xl px-3 pt-6 pb-28 duration-300 sm:px-4">
                {isBoth && (
                    <p className="mx-auto mb-4 max-w-sm text-center text-[10px] font-bold text-[#afafaf] md:text-xs">
                        Hiragana and katakana for the same sounds are grouped by section. Extended
                        loanword katakana appears only under Katakana.
                    </p>
                )}

                <div className="flex flex-col gap-4 md:gap-6">
                    {combinedSections &&
                        combinedSections.map(({ title, hiragana, katakana }) => (
                            <div
                                key={title}
                                className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 md:p-6"
                            >
                                <h2 className="mb-3 border-b-2 border-gray-100 pb-2.5 text-base font-black tracking-widest text-[#ce82ff] uppercase sm:text-lg md:text-xl">
                                    {title}
                                </h2>
                                <div className="flex flex-col gap-4 md:gap-6">
                                    {hiragana && (
                                        <div>
                                            <h3 className="mb-2 text-[10px] font-black tracking-widest text-[#58cc02] uppercase md:text-xs">
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
                                            <h3 className="mb-2 text-[10px] font-black tracking-widest text-[#1cb0f6] uppercase md:text-xs">
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
                                className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5 md:p-6"
                            >
                                <h2
                                    className={`mb-3 border-b-2 border-gray-100 pb-2.5 text-base font-black tracking-widest uppercase sm:text-lg md:text-xl ${headingColorSingle}`}
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
