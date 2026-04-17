/**
 * KanaLearn — Main learning mode component
 *
 * @remarks
 * Root component for kana learning feature.
 * Orchestrates navigation, progress display, and character cards.
 */

"use client";

import { useKanaDataset } from "@/features/kana/hooks";
import { useUserProgress } from "@/features/user/hooks";
import { ScreenHeader } from "@/shared/components/layout";
import { useAppStore } from "@/store";
import { LearnCard } from "./LearnCard";
import { LearnControls } from "./LearnControls";
import { LearnProgress } from "./LearnProgress";
import { useLearnNavigation } from "../hooks";

export function KanaLearn() {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { markLearned } = useUserProgress();
    const { globalAutoPlay } = useAppStore();

    const { currentIndex, isRandom, char, next, prev, toggleRandom } = useLearnNavigation(
        dataset,
        alphabet,
        globalAutoPlay,
        markLearned,
    );

    if (!char) return null;

    return (
        <div className="min-h-dvh bg-[#F7F7F8] pb-28">
            <ScreenHeader title="Learn" backHref="/kana" />
            <div className="animate-in fade-in mx-auto max-w-2xl px-4 pt-4 duration-300">
                <LearnProgress
                    currentIndex={currentIndex}
                    total={dataset.length}
                    themeColor={themeColor}
                    isRandom={isRandom}
                    onToggleRandom={toggleRandom}
                />

                <div className="flex flex-col items-center py-6">
                    <LearnCard char={char} themeColor={themeColor} />
                </div>

                <LearnControls alphabet={alphabet} onPrev={prev} onNext={next} />
            </div>
        </div>
    );
}
