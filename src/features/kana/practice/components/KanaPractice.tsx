/**
 * KanaPractice — Main practice mode component
 *
 * @remarks
 * Root component for kana practice feature.
 * Orchestrates navigation, mode switching, and canvas display.
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ChevronRight } from "lucide-react";

import { useKanaDataset, useKanaPlayDeck } from "@/features/kana/hooks";
import { Button } from "@/shared/components/ui";
import { PracticeCanvasArea } from "./PracticeCanvasArea";
import { PracticeHeader } from "./PracticeHeader";
import { PRACTICE_MODES } from "../types";

import type { PracticeMode } from "../types";

export function KanaPractice() {
    const t = useTranslations("Common");
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const [practiceMode, setPracticeMode] = useState<PracticeMode>("trace");
    const { char, isRandom, next, prev, playCurrent, autoPlayCurrent, toggleRandom } =
        useKanaPlayDeck({
            dataset,
            alphabet,
            // Recall mode is listen-and-write, so navigation speaks. The learner's auto-play
            // setting is enforced downstream by the audio manager.
            speakOnNavigate: practiceMode === "recall",
        });

    const cycleMode = () => {
        const nextIndex = (PRACTICE_MODES.indexOf(practiceMode) + 1) % PRACTICE_MODES.length;
        const nextMode = PRACTICE_MODES[nextIndex];
        setPracticeMode(nextMode);
        if (nextMode === "recall") autoPlayCurrent();
    };

    if (!char) return null;

    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            <PracticeHeader
                mode={practiceMode}
                char={char}
                isRandom={isRandom}
                themeColor={themeColor}
                onModeChange={cycleMode}
                onRandomToggle={toggleRandom}
            />

            <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto px-4 py-4">
                <PracticeCanvasArea
                    char={char}
                    mode={practiceMode}
                    themeColor={themeColor}
                    onPlay={playCurrent}
                />
                <div className="mt-4 flex w-full max-w-sm shrink-0 justify-between gap-2 px-2 sm:px-0 md:mt-6 md:max-w-3xl md:gap-4">
                    <Button
                        variant="outline"
                        onClick={prev}
                        className="flex-1 py-2.5 text-sm md:py-4 md:text-lg"
                    >
                        {t("prev")}
                    </Button>
                    <Button
                        alphabet={alphabet}
                        onClick={next}
                        className="flex-1 py-2.5 text-sm md:py-4 md:text-lg"
                    >
                        {t("next")} <ChevronRight size={20} strokeWidth={3} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
