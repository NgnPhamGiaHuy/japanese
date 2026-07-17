/**
 * @file FlashcardMistakeReview
 * High-intensity recovery mode for cards failed in the current session.
 * Leverages AI to provide "Memory Tips" (mnemonics) to repair broken neural links.
 */

"use client";

import { useMemo, useState } from "react";

import { AlertCircle, Brain, Check, Lightbulb, Loader2 } from "lucide-react";

import useAIExplanation from "@/features/ai/hooks/useAIExplanation";
import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";
import { playSfx, sequence, speak } from "@/shared/audio";
import { Button, EmptyState } from "@/shared/components/ui";
import { shuffleArray } from "@/shared/utils";
import FlashcardAudioButton from "./FlashcardAudioButton";
import GradeButtons from "./GradeButtons";
import McChoiceGrid from "./McChoiceGrid";
import StudyProgressHeader from "./StudyProgressHeader";
import StudySummaryScreen from "./StudySummaryScreen";
import { useCardSessionState } from "../hooks/useCardSessionState";
import { useRevealPronunciation } from "../hooks/useRevealPronunciation";
import { getAudioText, resolveCardFaces } from "../utils";

import type { CardWithProgress, Grade } from "../domain";
import type { Lesson, StudyStats } from "../types";

/**
 * FlashcardMistakeReview — targeted re-exposure with AI-generated explanations.
 *
 * @remarks
 * **Design Rationale:**
 * - **Isolation**: Focuses exclusively on cards failed in the preceding Practice/Learn session.
 * - **Deep Encoding**: Automatically generates AI "Memory Tips" (mnemonics) when the card is revealed to provide a new mental hook.
 * - **Validation**: Uses MC mode (when distractors exist) as a low-stakes check before moving to full recall.
 */

interface FlashcardMistakeReviewProps {
    /** The deck metadata */
    lesson: Lesson;
    /** The subset of missed cards */
    cards: CardWithProgress[];
    /** Manual exit handler */
    onClose: () => void;
    /** Persistent state updater */
    onAnswer: (card: CardWithProgress, grade: Grade) => Promise<void>;
    /** Session completion callback */
    onComplete: (stats: StudyStats) => void;
}

/**
 * FlashcardMistakeReview Component
 *
 * @example
 * <FlashcardMistakeReview lesson={deck} cards={fails} onComplete={handleRedeem} />
 */
const FlashcardMistakeReview = ({
    lesson,
    cards,
    onClose,
    onAnswer,
    onComplete,
}: FlashcardMistakeReviewProps) => {
    const themeHex = lesson.themeColor || DEFAULT_DECK_THEME_COLOR;

    const { card, currentIndex, queue, progress, stats, showSummary, submitGrade } =
        useCardSessionState(cards, onAnswer);
    const [isFlipped, setIsFlipped] = useState(false);

    useRevealPronunciation(isFlipped, card, "flashcard-mistake-review");

    const mcChoices = useMemo<string[] | null>(() => {
        const d = card?.distractors;
        if (!d || d.length < 3) return null;
        return shuffleArray([card.meaning, ...d.slice(0, 3)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    const [mcSelected, setMcSelected] = useState<string | null>(null);

    /** Load AI explanation (mnemonic) as soon as the card is flipped or answered */
    const { explanation, loading: aiLoading } = useAIExplanation(
        card,
        card ? getAudioText(card) : "",
        isFlipped || !!mcSelected,
    );

    if (cards.length === 0) {
        return (
            <EmptyState
                fullScreen
                rotateIcon={false}
                icon={Check}
                iconBg="bg-white"
                iconBorder="border-gray-200"
                iconTextColor="text-hiragana"
                title="No mistakes to review!"
                description="You nailed everything. Keep it up!"
                action={
                    <Button onClick={onClose} variant="secondary" className="px-8 py-3">
                        Go Back
                    </Button>
                }
            />
        );
    }

    // Guard for fast transition between states
    if (!card) return null;

    const faces = resolveCardFaces(card, "mistake-review");
    const displayFront = faces.front.clozeTemplate ?? faces.front.primary ?? "";
    const back = faces.back;
    const displayHint = back.hint || null;
    const altSubtitle = back.alternatives.find((value) => value !== displayFront) || null;
    const headerHint = displayHint && displayHint !== altSubtitle ? displayHint : null;

    /** @param playCue - False when the multiple-choice path already sounded the answer. */
    const handleGrade = (grade: Grade, playCue = true) => {
        setIsFlipped(false);
        setMcSelected(null);
        submitGrade(grade, { playCue });
    };

    const handleMCSelect = (choice: string) => {
        if (mcSelected !== null) return;
        setMcSelected(choice);
        const correct = choice === card.meaning;
        const grade: Grade = correct ? "Good" : "Again";

        // The answer is already revealed, so speaking it is reinforcement, not a leak.
        void sequence("flashcard-mc", [
            { sfx: correct ? "correct" : "wrong" },
            { waitForTail: correct ? "correct" : "wrong" },
            {
                speak: {
                    text: getAudioText(card),
                    options: { trigger: "auto", source: "flashcard-mistake-review-mc" },
                },
            },
        ]);

        /** Short delay for visual feedback before auto-advancing */
        setTimeout(() => {
            void handleGrade(grade, false);
        }, 900);
    };

    // ── Summary (Redemption Summary) ──────────────────────────────────────────
    if (showSummary) {
        const xpEarned = stats.correct * 3;
        return (
            <StudySummaryScreen
                icon={Brain}
                iconStrokeWidth={2.5}
                title="Review Done!"
                subtitle={`You revisited ${cards.length} difficult card${cards.length !== 1 ? "s" : ""}.`}
                themeHex={themeHex}
                stats={[
                    { value: stats.correct, label: "Fixed", color: "var(--color-hiragana)" },
                    { value: stats.incorrect, label: "Still hard", color: "var(--color-survival)" },
                ]}
                xpEarned={xpEarned}
                onComplete={() => onComplete(stats)}
            />
        );
    }

    // ── Player UI ────────────────────────────────────────────────────────────
    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            <StudyProgressHeader
                onClose={onClose}
                current={currentIndex + 1}
                total={queue.length}
                progress={progress}
                color="var(--color-danger)"
            />

            {/* Visual Guard: Mistake Mode Badge */}
            <div className="border-danger-bg bg-danger-bg text-danger mx-auto flex items-center gap-2 rounded-xl border px-4 py-1.5 text-xs font-black uppercase">
                <AlertCircle size={12} />
                Reviewing your mistakes
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-4 sm:p-6">
                {mcChoices && mcChoices.length === 4 ? (
                    /* Recognition Mode: Select the meaning you missed previously */
                    <div className="flex w-full flex-col gap-5">
                        <div className="rounded-5xl border-danger/20 flex w-full flex-col items-center justify-center border-2 border-b-8 bg-white px-6 py-8 text-center shadow-sm">
                            {headerHint && (
                                <span className="text-muted mb-2 text-lg font-bold tracking-widest">
                                    {headerHint}
                                </span>
                            )}
                            <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-2">
                                <h1 className="text-text w-full text-center text-3xl leading-tight font-black wrap-break-word select-text sm:text-4xl md:text-5xl">
                                    {displayFront}
                                </h1>
                                {altSubtitle && (
                                    <p className="text-muted mt-2 text-lg font-bold">
                                        {altSubtitle}
                                    </p>
                                )}
                            </div>
                            <p className="mt-3 text-xs font-black tracking-widest text-gray-300 uppercase">
                                Choose the correct meaning
                            </p>
                        </div>
                        <McChoiceGrid
                            choices={mcChoices}
                            correctAnswer={card.meaning}
                            selected={mcSelected}
                            onSelect={handleMCSelect}
                            textColorMode="innerSpan"
                        />
                    </div>
                ) : (
                    /* Recall Mode: Flip and study AI-generated Memory Tips */
                    <>
                        <div
                            className={`perspective-1000 preserve-3d relative flex aspect-3/4 w-full cursor-pointer flex-col justify-center transition-all duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                            onClick={() => {
                                playSfx("click");
                                setIsFlipped((f) => !f);
                            }}
                        >
                            {/* Front (Recall Trigger) */}
                            <div className="rounded-5xl border-danger/20 absolute inset-0 flex flex-col items-center justify-center border-2 border-b-8 bg-white p-6 text-center shadow-sm backface-hidden hover:-translate-y-1 hover:shadow-md">
                                {headerHint && (
                                    <span className="text-muted mb-2 shrink-0 text-xl font-bold tracking-widest">
                                        {headerHint}
                                    </span>
                                )}
                                <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-4">
                                    <h1 className="text-text w-full text-center text-3xl leading-tight font-black wrap-break-word select-text sm:text-4xl md:text-5xl">
                                        {displayFront}
                                    </h1>
                                    {altSubtitle && (
                                        <p className="text-muted mt-2 text-lg font-bold">
                                            {altSubtitle}
                                        </p>
                                    )}
                                </div>
                                <p className="absolute bottom-6 animate-pulse text-xs font-black tracking-widest text-gray-300 uppercase">
                                    Tap to reveal
                                </p>
                            </div>

                            {/* Back (Memory Encoding with AI Aid) */}
                            <div className="rounded-5xl border-danger/20 absolute inset-0 flex rotate-y-180 flex-col items-center justify-center border-2 border-b-8 bg-white p-6 text-center shadow-sm backface-hidden sm:p-8">
                                <FlashcardAudioButton
                                    onPlay={() =>
                                        speak(getAudioText(card), {
                                            trigger: "user",
                                            source: "flashcard-mistake-review",
                                        })
                                    }
                                    stopPropagation
                                    className="transition-colors"
                                    iconClassName="h-5 w-5 text-gray-500"
                                />

                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-10 pb-4">
                                    <h2
                                        className="mb-4 text-2xl leading-tight font-black wrap-break-word sm:text-3xl md:text-4xl"
                                        style={{ color: themeHex }}
                                    >
                                        {back.meaning}
                                    </h2>
                                    {back.example && (
                                        <div className="mt-2 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left">
                                            <p className="text-text text-sm font-bold sm:text-base">
                                                {back.example}
                                            </p>
                                        </div>
                                    )}

                                    {/* Mnemonic Generation Area */}
                                    <div className="mt-4 w-full rounded-2xl border-2 border-[#ffe5c7] bg-[#fff8f0] p-4 text-left">
                                        <div className="text-survival mb-2 flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                                            <Lightbulb size={12} />
                                            Memory Tip
                                        </div>
                                        {aiLoading ? (
                                            <div className="text-muted flex items-center gap-2 text-sm">
                                                <Loader2 size={14} className="animate-spin" />
                                                Generating tip…
                                            </div>
                                        ) : explanation ? (
                                            <p className="text-text text-sm font-bold">
                                                {explanation}
                                            </p>
                                        ) : (
                                            <p className="text-muted text-sm">No tip available.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Four-button Grade UI — visible only after flip */}
                        <div
                            className={`mt-6 transition-opacity duration-300 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GradeButtons onGrade={handleGrade} themeHex={themeHex} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FlashcardMistakeReview;
