"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, Volume2, ChevronRight, Shuffle } from "lucide-react";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useKanaStore } from "@/store/useKanaStore";
import { useAppStore } from "@/store/useAppStore";
import { KanaAppShell, KanaStrokeAnimation } from "@/features/kana/components";
import { Button } from "@/shared/components/ui";
import { playAudio } from "@/shared/utils/audio";
import { PRINT_FONT, HANDWRITING_FONT } from "@/shared/constants/fonts";

export default function KanaLearnPage() {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { markLearned } = useKanaStore();
    const { useHandwriting, globalAutoPlay } = useAppStore();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRandom, setIsRandom] = useState(false);

    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;
    const char = dataset[currentIndex];
    const isMulti = char?.char.length > 1;

    const [prevAlphabet, setPrevAlphabet] = useState(alphabet);
    if (alphabet !== prevAlphabet) {
        setPrevAlphabet(alphabet);
        setCurrentIndex(0);
    }

    useEffect(() => {
        if (globalAutoPlay && char) playAudio(char.char);
    }, [currentIndex, char, globalAutoPlay]);

    const next = () => {
        if (char) markLearned(char.char);
        if (isRandom) {
            let idx = Math.floor(Math.random() * dataset.length);
            while (idx === currentIndex && dataset.length > 1)
                idx = Math.floor(Math.random() * dataset.length);
            setCurrentIndex(idx);
        } else {
            setCurrentIndex((i) => (i + 1) % dataset.length);
        }
    };

    const prev = () => {
        if (isRandom) {
            let idx = Math.floor(Math.random() * dataset.length);
            while (idx === currentIndex && dataset.length > 1)
                idx = Math.floor(Math.random() * dataset.length);
            setCurrentIndex(idx);
        } else {
            setCurrentIndex((i) => (i - 1 + dataset.length) % dataset.length);
        }
    };

    if (!char) return null;

    return (
        <KanaAppShell>
            <div className="flex flex-col h-full min-h-0 items-center py-2 sm:py-4 max-w-3xl mx-auto w-full overflow-y-auto hide-scrollbar animate-in fade-in duration-300">
                {/* Top nav */}
                <div className="w-full flex items-center justify-between gap-2 sm:gap-4 mb-2 md:mb-8 px-4 shrink-0">
                    <Link href="/kana">
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            className="px-2 md:px-3 py-1.5 md:py-2"
                        />
                    </Link>
                    <div className="flex-1 hidden sm:block h-2.5 md:h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                            style={{
                                width: `${((currentIndex + 1) / dataset.length) * 100}%`,
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <span
                            className={`text-[10px] md:text-sm font-black flex items-center gap-1 shrink-0 ${themeColor.text}`}
                        >
                            {currentIndex + 1} / {dataset.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsRandom(!isRandom)}
                            className={`flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 border-2 shrink-0 ${
                                isRandom
                                    ? `${themeColor.primaryLightBg} ${themeColor.primaryBorder} ${themeColor.text} shadow-sm`
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            <Shuffle
                                size={14}
                                strokeWidth={isRandom ? 3 : 2}
                            />
                            <span className="hidden sm:inline">
                                {isRandom ? "Random" : "Sequential"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile progress */}
                <div className="w-full px-4 sm:hidden mb-4 shrink-0">
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden w-full">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                        style={{
                            width: `${((currentIndex + 1) / dataset.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

                {/* Card */}
                <div className="flex-1 flex flex-col items-center justify-center w-full px-4 my-auto shrink-0">
                <div className="w-full max-w-sm md:max-w-lg bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 border-b-8 border-gray-200 shadow-sm flex flex-col items-center relative">
                    <span className="absolute top-4 left-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {char.group}
                    </span>
                    <button
                        onClick={() => playAudio(char.char)}
                        className={`absolute top-4 right-4 p-2 bg-gray-50 rounded-full border-2 border-gray-100 hover:bg-gray-100 active:scale-95 transition-transform ${themeColor.text}`}
                    >
                        <Volume2 size={20} strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center justify-center min-h-[140px] md:min-h-[220px] mt-10 mb-6 w-full">
                        {isMulti ? (
                            <span
                                className="text-[5rem] md:text-[8rem] font-medium text-[#3c3c3c] leading-none select-none drop-shadow-sm"
                                style={{ fontFamily: activeFont }}
                            >
                                {char.char}
                            </span>
                        ) : (
                            <div className="w-32 h-32 md:w-48 md:h-48">
                                <KanaStrokeAnimation
                                    charStr={char.char}
                                    activeFont={activeFont}
                                    svgClassName="w-full h-full"
                                    strokeColor={themeColor.primary}
                                />
                            </div>
                        )}
                    </div>
                    <div className="text-center w-full border-t-2 border-gray-100 pt-4">
                        <p className="text-[#afafaf] text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                            Romaji
                        </p>
                        <p className="text-4xl md:text-6xl font-black text-[#3c3c3c] uppercase tracking-wider">
                            {char.romaji}
                        </p>
                    </div>
                </div>
            </div>

                {/* Controls */}
                <div className="w-full max-w-sm md:max-w-lg flex justify-between mt-6 gap-3 shrink-0 px-4 pb-4">
                    <Button
                        variant="outline"
                        onClick={prev}
                        className="flex-1 py-3.5 md:py-5 text-base md:text-xl"
                    >
                        Prev
                    </Button>
                    <Button
                        alphabet={alphabet}
                        onClick={next}
                        className="flex-1 py-3.5 md:py-5 text-base md:text-xl"
                    >
                        Next <ChevronRight size={24} strokeWidth={3} />
                    </Button>
                </div>
            </div>
        </KanaAppShell>
    );
}
