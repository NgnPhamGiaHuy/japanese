"use client";

import { useEffect, useState } from "react";

import { ChevronRight, Shuffle, Volume2 } from "lucide-react";

import { KanaStrokeAnimation } from "@/features/kana/components";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { HANDWRITING_FONT, PRINT_FONT } from "@/shared/constants/fonts";
import { playAudio } from "@/shared/utils/audio";
import { useAppStore } from "@/store/useAppStore";

export default function KanaLearnPage() {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { markLearned } = useUserProgress();
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
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader title="Learn" backHref="/kana" />
            <div className="animate-in fade-in mx-auto max-w-2xl px-4 pt-4 duration-300">
                <div className="mb-4 flex w-full items-center justify-between gap-2 pt-2 sm:gap-4">
                    <div className="hidden w-10 shrink-0 sm:block" aria-hidden />
                    <div className="hidden h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200 sm:block">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                            style={{
                                width: `${((currentIndex + 1) / dataset.length) * 100}%`,
                            }}
                        />
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0 md:gap-3">
                        <span
                            className={`flex shrink-0 items-center gap-1 text-[10px] font-black md:text-sm ${themeColor.text}`}
                        >
                            {currentIndex + 1} / {dataset.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsRandom(!isRandom)}
                            className={`flex shrink-0 items-center gap-1 rounded-lg border-2 px-2 py-1.5 text-[10px] font-bold transition-all active:scale-95 md:rounded-xl md:px-3 md:py-2 md:text-xs ${
                                isRandom
                                    ? `${themeColor.primaryLightBg} ${themeColor.primaryBorder} ${themeColor.text} shadow-sm`
                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <Shuffle size={14} strokeWidth={isRandom ? 3 : 2} />
                            <span className="hidden sm:inline">
                                {isRandom ? "Random" : "Sequential"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile progress */}
                <div className="mb-4 w-full sm:hidden">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${themeColor.bg}`}
                            style={{
                                width: `${((currentIndex + 1) / dataset.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Card */}
                <div className="flex flex-col items-center py-6">
                    <div className="relative flex w-full flex-col items-center rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm md:rounded-[3rem] md:p-10">
                        <span className="absolute top-4 left-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                            {char.group}
                        </span>
                        <button
                            onClick={() => playAudio(char.char)}
                            className={`absolute top-4 right-4 rounded-full border-2 border-gray-100 bg-gray-50 p-2 transition-transform hover:bg-gray-100 active:scale-95 ${themeColor.text}`}
                        >
                            <Volume2 size={20} strokeWidth={2.5} />
                        </button>
                        <div className="mt-10 mb-6 flex min-h-[140px] w-full items-center justify-center md:min-h-[220px]">
                            {isMulti ? (
                                <span
                                    className="text-[5rem] leading-none font-medium text-[#3c3c3c] drop-shadow-sm select-none md:text-[8rem]"
                                    style={{ fontFamily: activeFont }}
                                >
                                    {char.char}
                                </span>
                            ) : (
                                <div className="h-32 w-32 md:h-48 md:w-48">
                                    <KanaStrokeAnimation
                                        charStr={char.char}
                                        activeFont={activeFont}
                                        svgClassName="w-full h-full"
                                        strokeColor={themeColor.primary}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="w-full border-t-2 border-gray-100 pt-4 text-center">
                            <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#afafaf] uppercase">
                                Romaji
                            </p>
                            <p className="text-4xl font-black tracking-wider text-[#3c3c3c] uppercase md:text-6xl">
                                {char.romaji}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="mt-2 flex justify-between gap-3">
                    <Button
                        variant="outline"
                        onClick={prev}
                        className="flex-1 py-3.5 text-base md:py-5 md:text-xl"
                    >
                        Prev
                    </Button>
                    <Button
                        alphabet={alphabet}
                        onClick={next}
                        className="flex-1 py-3.5 text-base md:py-5 md:text-xl"
                    >
                        Next <ChevronRight size={24} strokeWidth={3} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
