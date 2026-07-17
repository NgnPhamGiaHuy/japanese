/**
 * @file FlashcardLearn
 * Recall-based introduction mode. Shows only the Front_Face until the user
 * taps "Show Answer", then reveals the Back_Face with four SM-2 grade buttons.
 */

"use client";

import { useRef, useState } from "react";

import { BookOpen } from "lucide-react";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";
import { playSfx, speak } from "@/shared/audio";
import { Button, EmptyState } from "@/shared/components/ui";
import FlashcardAudioButton from "./FlashcardAudioButton";
import GradeButtons from "./GradeButtons";
import StudyProgressHeader from "./StudyProgressHeader";
import StudySummaryScreen from "./StudySummaryScreen";
import { useCardSessionState } from "../hooks/useCardSessionState";
import { useRevealPronunciation } from "../hooks/useRevealPronunciation";
import { getAudioText, resolveCardFaces } from "../utils";

import type { CardWithProgress, Grade } from "../domain";
import type { Lesson, StudyStats } from "../types";

interface FlashcardLearnProps {
    lesson: Lesson;
    cards: CardWithProgress[];
    onClose: () => void;
    onAnswer: (card: CardWithProgress, grade: Grade) => Promise<void>;
    onComplete: (stats: StudyStats) => void;
}

const FlashcardLearn = ({ lesson, cards, onClose, onAnswer, onComplete }: FlashcardLearnProps) => {
    const themeHex = lesson.themeColor || DEFAULT_DECK_THEME_COLOR;

    const { card, currentIndex, queue, progress, stats, showSummary, submitGrade } =
        useCardSessionState(cards, onAnswer);
    const [revealed, setRevealed] = useState(false);
    const showAnswerRef = useRef<HTMLButtonElement>(null);

    useRevealPronunciation(revealed, card, "flashcard-learn");

    if (cards.length === 0) {
        return (
            <EmptyState
                fullScreen
                rotateIcon={false}
                icon={BookOpen}
                iconStrokeWidth={2.5}
                iconBg="bg-white"
                iconBorder="border-gray-200"
                iconTextColor="text-gray-400"
                title="Nothing to learn!"
                description="All cards have already been introduced."
                action={
                    <Button onClick={onClose} variant="secondary" className="px-8 py-3">
                        Go Back
                    </Button>
                }
            />
        );
    }

    if (!card) return null;

    const faces = resolveCardFaces(card, "learn");
    const displayFront = faces.front.clozeTemplate ?? faces.front.primary ?? "";
    const back = faces.back;

    const handleShowAnswer = () => {
        playSfx("click");
        setRevealed(true);
    };

    const handleGrade = (grade: Grade) => {
        setRevealed(false);
        submitGrade(grade);
    };

    if (showSummary) {
        const xpEarned = stats.correct * 2;
        return (
            <StudySummaryScreen
                icon={BookOpen}
                title="Lesson Complete!"
                subtitle={`You learned ${cards.length} new card${cards.length !== 1 ? "s" : ""}.`}
                themeHex={themeHex}
                stats={[
                    { value: stats.correct, label: "Got It", color: "var(--color-hiragana)" },
                    { value: stats.incorrect, label: "Study More", color: "var(--color-survival)" },
                ]}
                xpEarned={xpEarned}
                onComplete={() => onComplete(stats)}
            />
        );
    }

    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            <StudyProgressHeader
                onClose={onClose}
                current={currentIndex + 1}
                total={queue.length}
                progress={progress}
                color={themeHex}
            />

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-6">
                {/* Card face */}
                <div className="rounded-5xl relative flex w-full flex-col items-center justify-center border-2 border-b-8 border-gray-200 bg-white p-8 text-center shadow-sm">
                    <FlashcardAudioButton
                        onPlay={() =>
                            speak(getAudioText(card), {
                                trigger: "user",
                                source: "flashcard-learn",
                            })
                        }
                        iconClassName="h-5 w-5 text-gray-400"
                    />

                    {card.imageUrl && (
                        <div className="mb-4 h-32 w-full overflow-hidden rounded-2xl">
                            <img
                                src={card.imageUrl}
                                alt={displayFront}
                                className="h-full w-full object-contain"
                                crossOrigin="anonymous"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    )}

                    {/* Front face — always visible */}
                    <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-4">
                        <h1 className="text-text w-full text-center text-4xl leading-tight font-black wrap-break-word select-text sm:text-5xl">
                            {displayFront}
                        </h1>
                    </div>

                    {/* Back face — revealed after "Show Answer" */}
                    {revealed && (
                        <>
                            <div className="my-4 h-px w-full bg-gray-100" />

                            <p
                                className="text-2xl font-black sm:text-3xl"
                                style={{ color: themeHex }}
                            >
                                {back.meaning}
                            </p>

                            {back.example && (
                                <div className="mt-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left">
                                    <p className="text-text text-sm font-bold sm:text-base">
                                        {back.example}
                                    </p>
                                </div>
                            )}

                            {back.usageNote && (
                                <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
                                    <span className="text-muted text-xs font-black tracking-wide uppercase">
                                        Usage
                                    </span>
                                    <span className="text-text text-xs font-bold">
                                        {back.usageNote}
                                    </span>
                                </div>
                            )}

                            {back.mnemonic && (
                                <div className="mt-3 w-full rounded-2xl border-2 border-[#ffe5c7] bg-[#fff8f0] p-3 text-left">
                                    <p className="text-survival text-xs font-bold">
                                        💡 {back.mnemonic}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Controls */}
                {!revealed ? (
                    <button
                        ref={showAnswerRef}
                        onClick={handleShowAnswer}
                        className="text-text w-full rounded-3xl border-2 border-b-8 border-gray-200 bg-white py-4 text-lg font-black shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
                        style={{ "--tw-ring-color": themeHex } as React.CSSProperties}
                    >
                        Show Answer
                    </button>
                ) : (
                    <GradeButtons onGrade={handleGrade} themeHex={themeHex} />
                )}
            </div>
        </div>
    );
};

export default FlashcardLearn;
