"use client";

import { useEffect, useState } from "react";
import { Brain, ChevronRight, Eye, PenTool, Shuffle, Volume2 } from "lucide-react";

import { DrawingCanvas, KanaStrokeAnimation } from "@/features/kana/components";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { HANDWRITING_FONT, PRINT_FONT } from "@/shared/constants/fonts";
import { playAudio } from "@/shared/utils/audio";
import { useAppStore } from "@/store/useAppStore";

export default function KanaPracticePage() {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { useHandwriting } = useAppStore();
    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRandom, setIsRandom] = useState(false);
    const [practiceMode, setPracticeMode] = useState<1 | 2 | 3>(1);

    const char = dataset[currentIndex];
    const [prevAlphabet, setPrevAlphabet] = useState(alphabet);
    if (alphabet !== prevAlphabet) {
        setPrevAlphabet(alphabet);
        setCurrentIndex(0);
    }
    useEffect(() => {
        if (practiceMode === 3 && char) playAudio(char.char);
    }, [currentIndex, practiceMode, char]);

    const navigate = (dir: 1 | -1) => {
        if (isRandom) {
            let idx = Math.floor(Math.random() * dataset.length);
            while (idx === currentIndex && dataset.length > 1)
                idx = Math.floor(Math.random() * dataset.length);
            setCurrentIndex(idx);
        } else {
            setCurrentIndex((i) => (i + dir + dataset.length) % dataset.length);
        }
    };

    if (!char) return null;

    const modeLabel = practiceMode === 1 ? "Trace" : practiceMode === 2 ? "Copy" : "Recall";
    const instruction =
        practiceMode === 1
            ? "Step 1: Trace the character"
            : practiceMode === 2
              ? "Step 2: Draw with reference"
              : "Step 3: Draw from memory";

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <ScreenHeader
                title={`Draw: ${practiceMode === 3 ? "???" : char.romaji}`}
                backHref="/kana"
                rightWrapperClassName="flex items-center justify-end gap-1 md:gap-2 shrink-0 min-w-0"
                right={
                    <>
                        <button
                            type="button"
                            onClick={() =>
                                setPracticeMode((m) => (m >= 3 ? 1 : ((m + 1) as 1 | 2 | 3)))
                            }
                            className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-gray-200 bg-white px-2 py-1.5 text-[10px] font-bold text-gray-500 transition-all hover:bg-gray-50 active:scale-95 md:rounded-xl md:px-3 md:py-2 md:text-xs"
                        >
                            {practiceMode === 1 ? (
                                <PenTool size={14} />
                            ) : practiceMode === 2 ? (
                                <Eye size={14} />
                            ) : (
                                <Brain size={14} />
                            )}
                            <span className="hidden sm:inline">Mode: {modeLabel}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRandom((r) => !r)}
                            className={`flex shrink-0 items-center gap-1 rounded-lg border-2 px-2 py-1.5 text-[10px] font-bold transition-all active:scale-95 md:rounded-xl md:px-3 md:py-2 md:text-xs ${
                                isRandom
                                    ? `${themeColor.primaryLightBg} ${themeColor.text} ${themeColor.primaryBorder} shadow-sm`
                                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <Shuffle size={14} strokeWidth={isRandom ? 3 : 2} />
                            <span className="hidden sm:inline">
                                {isRandom ? "Random" : "Sequential"}
                            </span>
                        </button>
                    </>
                }
            />

            <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto px-4 py-4">
                {/* Canvas area */}
                <div className="my-auto flex w-full flex-1 flex-col items-center justify-center px-2">
                    <div className="flex w-full max-w-sm shrink-0 flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-b-8 border-gray-200 bg-white p-3 shadow-sm md:max-w-3xl md:flex-row md:gap-8 md:rounded-[2.5rem] md:p-8">
                        <div className="relative flex w-full shrink-0 flex-row items-center gap-3 rounded-xl bg-gray-50 p-2 md:h-[260px] md:w-auto md:flex-col md:justify-center md:rounded-[1.5rem] md:p-4">
                            <span className="hidden text-xs font-bold text-[#afafaf] md:block">
                                Reference
                            </span>
                            {practiceMode === 3 ? (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-100 bg-white text-gray-300 shadow-sm md:h-32 md:w-32 md:rounded-2xl">
                                    <span className="text-3xl font-black md:text-5xl">?</span>
                                </div>
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-gray-100 bg-white shadow-sm md:h-32 md:w-32 md:rounded-2xl">
                                    <KanaStrokeAnimation
                                        charStr={char.char}
                                        activeFont={activeFont}
                                        svgClassName="w-[80%] h-[80%]"
                                        strokeColor={themeColor.primary}
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => playAudio(char.char)}
                                className={`ml-auto bg-white p-2 md:ml-0 md:p-3 ${themeColor.text} rounded-full border-2 border-gray-100 transition-transform hover:scale-105 hover:bg-gray-50 active:scale-95`}
                            >
                                <Volume2 size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                        <div className="flex w-full flex-col items-center md:w-auto">
                            <span className="mb-2 text-xs font-bold text-gray-500 md:text-sm">
                                {instruction}
                            </span>
                            <DrawingCanvas
                                char={char.char}
                                activeFont={activeFont}
                                showGuide={practiceMode === 1}
                                stepKey={practiceMode}
                                strokeColor={themeColor.primary}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex w-full max-w-sm shrink-0 justify-between gap-2 px-2 sm:px-0 md:mt-6 md:max-w-3xl md:gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="flex-1 py-2.5 text-sm md:py-4 md:text-lg"
                    >
                        Prev
                    </Button>
                    <Button
                        alphabet={alphabet}
                        onClick={() => navigate(1)}
                        className="flex-1 py-2.5 text-sm md:py-4 md:text-lg"
                    >
                        Next <ChevronRight size={20} strokeWidth={3} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
