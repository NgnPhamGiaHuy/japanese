/**
 * @file FlashcardMistakeReview
 * High-intensity recovery mode for cards failed in the current session.
 * Leverages AI to provide "Memory Tips" (mnemonics) to repair broken neural links.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AlertCircle, Brain, Check, Lightbulb, Loader2, X } from "lucide-react";

import useAIExplanation from "@/features/ai/hooks/useAIExplanation";
import { StatGrid } from "@/features/game/components";
import { useAppStore } from "@/lib/app-store";
import { Button, EmptyState } from "@/shared/components/ui";
import { hexToThemeColor, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import FlashcardAudioButton from "./FlashcardAudioButton";
import GradeButtons from "./GradeButtons";
import McChoiceGrid from "./McChoiceGrid";
import { gradeCard } from "../services";
import { getAudioText, reinsertCard, resolveCardFaces } from "../utils";

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
    /** The userId of the authenticated user */
    userId: string;
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
 * <FlashcardMistakeReview lesson={deck} cards={fails} userId={uid} onComplete={handleRedeem} />
 */
const FlashcardMistakeReview = ({
    lesson,
    userId,
    cards,
    onClose,
    onAnswer,
    onComplete,
}: FlashcardMistakeReviewProps) => {
    const themeHex = lesson.themeColor || "#1cb0f6";
    const { globalAutoPlay } = useAppStore();

    /** Local queue state — initialized from cards prop, supports Again re-insertion */
    const [queue, setQueue] = useState<CardWithProgress[]>(() => [...cards]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    /** Local session stats for reward calculation */
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });

    const [showSummary, setShowSummary] = useState(false);

    const card = queue[currentIndex];

    // Play audio when the card is flipped to the back face
    const prevFlippedRef = useRef(false);
    useEffect(() => {
        const justFlipped = isFlipped && !prevFlippedRef.current;
        if (justFlipped && globalAutoPlay && card) {
            playAudio(getAudioText(card));
        }
        prevFlippedRef.current = isFlipped;
    }, [isFlipped, globalAutoPlay, card]);

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
    const progress = (currentIndex / queue.length) * 100;

    const handleGrade = (grade: Grade) => {
        const knew = grade === "Good" || grade === "Easy";
        const nextMistakes = knew ? stats.mistakeCardIds : [...stats.mistakeCardIds, card.id];
        setStats({
            correct: stats.correct + (knew ? 1 : 0),
            incorrect: stats.incorrect + (!knew ? 1 : 0),
            mistakeCardIds: nextMistakes,
        });
        playSFX(knew ? "correct" : "wrong");
        setIsFlipped(false);
        setMcSelected(null);

        // Advance UI immediately — writes are fire-and-forget
        if (grade === "Again") {
            setQueue(reinsertCard(queue, currentIndex));
        } else {
            if (currentIndex < queue.length - 1) {
                setCurrentIndex((i) => i + 1);
            } else {
                setShowSummary(true);
            }
        }

        void gradeCard(userId, card.id, card, grade, card.lessonId, userId).catch(() => {});
        void onAnswer(card, grade).catch(() => {});
    };

    const handleMCSelect = (choice: string) => {
        if (mcSelected !== null) return;
        setMcSelected(choice);
        const correct = choice === card.meaning;
        const grade: Grade = correct ? "Good" : "Again";
        /** Short delay for visual feedback before auto-advancing */
        setTimeout(() => {
            void handleGrade(grade);
        }, 900);
    };

    // ── Summary (Redemption Summary) ──────────────────────────────────────────
    if (showSummary) {
        const xpEarned = stats.correct * 3;
        return (
            <div className="bg-bg fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
                <div
                    className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 shadow-sm"
                    style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
                >
                    <Brain size={48} className="text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-text mb-1 text-4xl font-black">Review Done!</h2>
                <p className="text-muted mb-8 text-lg font-bold">
                    You revisited {cards.length} difficult card{cards.length !== 1 ? "s" : ""}.
                </p>
                <div className="mb-10 w-full max-w-sm">
                    <StatGrid
                        variant="large"
                        className="flex w-full gap-4"
                        stats={[
                            {
                                value: stats.correct,
                                label: "Fixed",
                                color: "var(--color-hiragana)",
                            },
                            {
                                value: stats.incorrect,
                                label: "Still hard",
                                color: "var(--color-survival)",
                            },
                        ]}
                    />
                </div>
                <Button
                    variant="primary"
                    color={hexToThemeColor(themeHex)}
                    onClick={() => onComplete(stats)}
                    className="w-full max-w-xs py-5 text-xl"
                >
                    Collect +{xpEarned} XP
                </Button>
            </div>
        );
    }

    // ── Player UI ────────────────────────────────────────────────────────────
    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            {/* Header: Error-themed progress bar */}
            <header className="flex items-center justify-between p-4">
                <Button variant="ghost" size="icon" onClick={onClose} icon={X} aria-label="Close" />
                <div className="mx-4 flex-1">
                    <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full transition-all duration-300"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: "var(--color-danger)",
                            }}
                        />
                    </div>
                </div>
                <span className="text-muted w-12 text-right text-sm font-black">
                    {currentIndex + 1}/{queue.length}
                </span>
            </header>

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
                                playSFX("click");
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
                                    onPlay={() => playAudio(getAudioText(card))}
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
