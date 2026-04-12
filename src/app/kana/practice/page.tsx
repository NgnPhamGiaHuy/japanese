"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ChevronRight,
    Eye,
    Shuffle,
    PenTool,
    Brain,
    Volume2,
} from "lucide-react";
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { useAppStore } from "@/store/useAppStore";
import {
    DrawingCanvas,
    KanaAppShell,
    KanaStrokeAnimation,
} from "@/features/kana/components";
import { Button } from "@/shared/components/ui";
import { playAudio } from "@/shared/utils/audio";
import { PRINT_FONT, HANDWRITING_FONT } from "@/shared/constants/fonts";

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

    const modeLabel =
        practiceMode === 1 ? "Trace" : practiceMode === 2 ? "Copy" : "Recall";
    const instruction =
        practiceMode === 1
            ? "Step 1: Trace the character"
            : practiceMode === 2
              ? "Step 2: Draw with reference"
              : "Step 3: Draw from memory";

    return (
        <KanaAppShell>
            <div className="flex flex-col h-full min-h-0 items-center justify-between py-2 sm:py-4 overflow-y-auto hide-scrollbar">
                {/* Header */}
                <div className="w-full max-w-3xl flex justify-between items-center mb-2 md:mb-4 shrink-0 px-2 sm:px-0">
                    <Link href="/kana">
                        <Button
                            variant="ghost"
                            icon={ArrowLeft}
                            className="px-2 md:px-3 py-1.5 md:py-2"
                        />
                    </Link>
                    <span className="text-[10px] md:text-xs font-black text-[#afafaf] tracking-widest uppercase truncate px-2">
                        Draw: {practiceMode === 3 ? "???" : char.romaji}
                    </span>
                    <div className="flex items-center gap-1 md:gap-2">
                    <button
                        onClick={() =>
                            setPracticeMode((m) =>
                                m >= 3 ? 1 : ((m + 1) as 1 | 2 | 3)
                            )
                        }
                        className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 border-2 shrink-0 bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    >
                        {practiceMode === 1 ? (
                            <PenTool size={14} />
                        ) : practiceMode === 2 ? (
                            <Eye size={14} />
                        ) : (
                            <Brain size={14} />
                        )}
                        <span className="hidden sm:inline">
                            Mode: {modeLabel}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsRandom((r) => !r)}
                        className={`flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 border-2 shrink-0 ${
                            isRandom
                                ? `${themeColor.primaryLightBg} ${themeColor.text} ${themeColor.primaryBorder} shadow-sm`
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        <Shuffle size={14} strokeWidth={isRandom ? 3 : 2} />
                        <span className="hidden sm:inline">
                            {isRandom ? "Random" : "Sequential"}
                        </span>
                    </button>
                </div>
            </div>

                {/* Canvas area */}
                <div className="flex-1 flex flex-col items-center justify-center w-full px-2 my-auto">
                <div className="flex gap-3 md:gap-8 items-center flex-col md:flex-row w-full max-w-sm md:max-w-3xl justify-center bg-white p-3 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-b-8 border-gray-200 shadow-sm shrink-0">
                    <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto bg-gray-50 rounded-xl md:rounded-[1.5rem] p-2 md:p-4 shrink-0 md:h-[260px] md:justify-center relative">
                        <span className="text-[#afafaf] text-xs font-bold hidden md:block">
                            Reference
                        </span>
                        {practiceMode === 3 ? (
                            <div className="w-16 h-16 md:w-32 md:h-32 bg-white rounded-lg md:rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-300 shadow-sm shrink-0">
                                <span className="text-3xl md:text-5xl font-black">
                                    ?
                                </span>
                            </div>
                        ) : (
                            <div className="w-16 h-16 md:w-32 md:h-32 bg-white rounded-lg md:rounded-2xl border-2 border-gray-100 flex items-center justify-center shadow-sm shrink-0">
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
                            className={`ml-auto md:ml-0 p-2 md:p-3 bg-white ${themeColor.text} rounded-full border-2 border-gray-100 hover:bg-gray-50 active:scale-95 transition-transform hover:scale-105`}
                        >
                            <Volume2 size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center w-full md:w-auto">
                        <span className="text-gray-500 font-bold mb-2 text-xs md:text-sm">
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

                <div className="w-full max-w-sm md:max-w-3xl flex justify-between mt-4 md:mt-6 gap-2 md:gap-4 px-2 sm:px-0 shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="flex-1 py-2.5 md:py-4 text-sm md:text-lg"
                    >
                        Prev
                    </Button>
                    <Button
                        alphabet={alphabet}
                        onClick={() => navigate(1)}
                        className="flex-1 py-2.5 md:py-4 text-sm md:text-lg"
                    >
                        Next <ChevronRight size={20} strokeWidth={3} />
                    </Button>
                </div>
            </div>
        </KanaAppShell>
    );
}
