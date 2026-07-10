/**
 * KanaLearn — Main learning mode component
 *
 * @remarks
 * Root component for kana learning feature.
 * Orchestrates navigation, progress display, and character cards.
 */

"use client";

import { useRef } from "react";

import { ChevronRight } from "lucide-react";

import { useKanaDataset, useKanaPlayDeck } from "@/features/kana/hooks";
import { useUserProgress } from "@/features/user/hooks";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { LearnCard } from "./LearnCard";
import { LearnProgress } from "./LearnProgress";

export function KanaLearn() {
    const { dataset, alphabet, themeColor } = useKanaDataset();
    const { markLearned } = useUserProgress();
    const markedThisSession = useRef(new Set<string>());

    const { char, currentIndex, isRandom, next, prev, playCurrent, toggleRandom } = useKanaPlayDeck(
        {
            dataset,
            alphabet,
            // Learn mode always speaks on navigation; the auto-play setting is applied downstream.
            speakOnNavigate: true,
            onVisit: (visitedChar) => {
                if (markedThisSession.current.has(visitedChar.char)) return;
                markedThisSession.current.add(visitedChar.char);
                void markLearned(visitedChar.char);
            },
        },
    );

    if (!char) return null;

    return (
        <div className="bg-bg min-h-dvh pb-28">
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
                    <LearnCard char={char} themeColor={themeColor} onPlay={playCurrent} />
                </div>

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
