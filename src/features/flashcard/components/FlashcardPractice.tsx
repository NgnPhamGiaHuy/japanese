/**
 * @file FlashcardPractice
 * Core SRS-integrated study mode implementing mixed-modality pedagogy.
 * Dynamically switches between recognition (MC) and recall (Flip) based on card data.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Check, Lightbulb, RefreshCw, X } from "lucide-react";

import { StatGrid } from "@/features/game/components";
import { useAppStore } from "@/lib/app-store";
import { Button, EmptyState } from "@/shared/components/ui";
import { hexToThemeColor, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import FlashcardAudioButton from "./FlashcardAudioButton";
import GradeButtons from "./GradeButtons";
import McChoiceGrid from "./McChoiceGrid";
import { getDailyProgress, gradeCard } from "../services";
import { getAudioText, reinsertCard, resolveCardFaces } from "../utils";

import type { CardWithProgress, Grade } from "../domain";
import type { Lesson, StudyStats } from "../types";

/**
 * FlashcardPractice — SRS-integrated mixed-modality session.
 *
 * @remarks
 * **Design Rationale (Quizlet "Learn" inspired):**
 * - **Recognition Stage (MC)**: If a card has AI-generated distractors, it starts as Multiple Choice to build initial familiarity.
 * - **Recall Stage (Flip)**: For deep memory retrieval, cards without distractors (or advanced ones) use the traditional flip mechanic.
 * - **SRS Feedback**: Both modes feed performance data back to the SRS algorithm.
 * - **Saliency**: Hints are present but "hidden" by default to encourage active recall effort before providing a crutch.
 */

interface FlashcardPracticeProps {
    /** The deck metadata */
    lesson: Lesson;
    /** The userId of the authenticated user */
    userId: string;
    /** The batch of cards due for review */
    cards: CardWithProgress[];
    /** Triggered on manual exit */
    onClose: () => void;
    /** Persistence handler for SRS state updates */
    onAnswer: (card: CardWithProgress, grade: Grade) => Promise<void>;
    /** Final transition to reward/summary screen */
    onComplete: (stats: StudyStats) => void;
}

/**
 * FlashcardPractice Component
 *
 * @example
 * <FlashcardPractice lesson={lesson} cards={dueCards} userId={uid} onAnswer={handleSrs} />
 */
const FlashcardPractice = ({
    lesson,
    userId,
    cards,
    onClose,
    onAnswer,
    onComplete,
}: FlashcardPracticeProps) => {
    const { globalAutoPlay } = useAppStore();
    const themeHex = lesson.themeColor || "#1cb0f6";

    /** Local queue state — initialized from cards prop, supports Again re-insertion */
    const [queue, setQueue] = useState<CardWithProgress[]>(() => [...cards]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    /** Tracking session performance for XP calculation and summary */
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });

    const [showSummary, setShowSummary] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);

    /** Local state for the multiple-choice selection animation */
    const [mcSelected, setMcSelected] = useState<string | null>(null);
    const prevFlippedRef = useRef(false);

    /** Fetch daily progress on mount for informational purposes */
    useEffect(() => {
        if (userId) {
            void getDailyProgress(userId);
        }
    }, [userId]);

    /**
     * Pronunciation Reinforcement
     * Plays audio upon "reveal" (flipping the card) to bond visual memory with sound.
     */
    useEffect(() => {
        const justFlipped = isFlipped && !prevFlippedRef.current;
        if (justFlipped && globalAutoPlay) {
            const card = queue[currentIndex];
            if (card) playAudio(getAudioText(card));
        }
        prevFlippedRef.current = isFlipped;
    }, [isFlipped, globalAutoPlay, queue, currentIndex]);

    const card = queue[currentIndex];

    /**
     * Multiple Choice Choice Generation
     *
     * @remarks
     * Derived from card distractors.
     * We limit to 3 distractors + 1 correct answer to maintain high density but low cognitive overload.
     */
    const mcChoices = useMemo<string[] | null>(() => {
        const d = card?.distractors;
        if (!d || d.length < 3) return null;
        return shuffleArray([card.meaning, ...d.slice(0, 3)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    /** Flag determining if the current card should be presented as a Quiz or a Flip-card */
    const isMCMode = mcChoices !== null && mcChoices.length === 4;

    if (cards.length === 0) {
        return (
            <EmptyState
                fullScreen
                rotateIcon={false}
                icon={Check}
                iconBg="bg-white"
                iconBorder="border-gray-200"
                iconTextColor="text-gray-400"
                title="All caught up!"
                description="No cards are due for practice right now."
                action={
                    <Button onClick={onClose} variant="secondary" className="px-8 py-3">
                        Go Back
                    </Button>
                }
            />
        );
    }

    // Safety guard for transition logic
    if (!card) return null;

    const faces = resolveCardFaces(card, "practice");
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
        setIsFlipped(false);
        setHintVisible(false);
        setMcSelected(null);
        playSFX(knew ? "correct" : "wrong");

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

        // Persist to Firestore in the background — never blocks card advance
        void gradeCard(userId, card.id, card, grade, card.lessonId, lesson.ownerId).catch(() => {});
        void onAnswer(card, grade).catch(() => {});
    };

    const handleMCSelect = (choice: string) => {
        if (mcSelected !== null) return;
        setMcSelected(choice);
        const correct = choice === card.meaning;
        const grade: Grade = correct ? "Good" : "Again";
        /** Short delay to allow user to see the success/error colors before advancing */
        setTimeout(() => void handleGrade(grade), 750);
    };

    // ── Summary (XP and Accuracy Report) ───────────────────────────────────
    if (showSummary) {
        const xpEarned = stats.correct * 3;
        const accuracy =
            stats.correct + stats.incorrect > 0
                ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
                : 0;
        return (
            <div className="bg-bg fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
                <div
                    className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 shadow-sm"
                    style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
                >
                    <RefreshCw size={48} className="text-white" strokeWidth={3} />
                </div>
                <h2 className="text-text mb-1 text-4xl font-black">Practice Done!</h2>
                <p className="text-muted mb-8 text-lg font-bold">
                    Accuracy: <span className="text-text font-black">{accuracy}%</span>
                </p>
                <div className="mb-10 w-full max-w-sm">
                    <StatGrid
                        variant="large"
                        className="flex w-full gap-4"
                        stats={[
                            {
                                value: stats.correct,
                                label: "Correct",
                                color: "var(--color-hiragana)",
                            },
                            {
                                value: stats.incorrect,
                                label: "Review",
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

    // ── Session UI ───────────────────────────────────────────────────────────
    return (
        <div className="bg-bg fixed inset-0 z-50 flex flex-col">
            <header className="flex items-center justify-between p-4">
                <Button variant="ghost" size="icon" onClick={onClose} icon={X} aria-label="Close" />
                <div className="mx-4 flex-1">
                    <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${progress}%`, backgroundColor: themeHex }}
                        />
                    </div>
                </div>
                <span className="text-muted w-12 text-right text-sm font-black">
                    {currentIndex + 1}/{queue.length}
                </span>
            </header>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-4 sm:p-6">
                {/* ── Multiple-choice (Recognition Mode) ── */}
                {isMCMode ? (
                    <div className="flex w-full flex-col gap-5">
                        <div className="rounded-5xl sm:rounded-6xl relative flex w-full flex-col items-center justify-center border-2 border-b-8 border-gray-200 bg-white px-6 py-8 text-center shadow-sm">
                            {card.hint && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        playSFX("click");
                                        setHintVisible((v) => !v);
                                    }}
                                    className="absolute top-4 left-4 !rounded-xl border-2 border-gray-100 bg-gray-50 !p-2 shadow-none transition-colors hover:bg-gray-100 hover:shadow-none"
                                    title="Show hint"
                                    icon={Lightbulb}
                                    iconClassName={hintVisible ? "" : "text-muted"}
                                    style={hintVisible ? { color: themeHex } : {}}
                                />
                            )}

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
                            {hintVisible && card.hint && (
                                <div
                                    className="mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
                                    style={{ backgroundColor: themeHex }}
                                >
                                    💡 {card.hint}
                                </div>
                            )}
                            <p className="mt-3 text-xs font-black tracking-widest text-gray-300 uppercase">
                                Choose the correct meaning
                            </p>
                        </div>

                        <McChoiceGrid
                            choices={mcChoices!}
                            correctAnswer={card.meaning}
                            selected={mcSelected}
                            onSelect={handleMCSelect}
                            textColorMode="buttonColorProp"
                            tileClassName="!leading-snug"
                        />
                    </div>
                ) : (
                    /* ── Flip mode (Recall Mode) ── */
                    <>
                        <div
                            className={`perspective-1000 preserve-3d relative flex aspect-3/4 w-full cursor-pointer flex-col justify-center transition-all duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                            onClick={() => {
                                playSFX("click");
                                setIsFlipped((f) => !f);
                            }}
                        >
                            {/* Front Side */}
                            <div className="rounded-5xl absolute inset-0 flex flex-col items-center justify-center border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm backface-hidden hover:-translate-y-1 hover:shadow-md">
                                {headerHint && (
                                    <span className="text-muted mb-2 shrink-0 text-xl font-bold tracking-widest">
                                        {headerHint}
                                    </span>
                                )}
                                {card.imageUrl && (
                                    <div className="mb-4 h-32 w-full shrink-0 overflow-hidden rounded-2xl">
                                        <img
                                            src={card.imageUrl}
                                            alt={displayFront}
                                            className="h-full w-full object-contain"
                                            crossOrigin="anonymous"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                )}
                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-2 pb-8">
                                    <h1
                                        className={`text-text w-full text-center leading-tight font-black wrap-break-word select-text ${card.imageUrl ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl md:text-5xl"}`}
                                    >
                                        {displayFront}
                                    </h1>
                                    {altSubtitle && (
                                        <p className="text-muted mt-2 text-lg font-bold">
                                            {altSubtitle}
                                        </p>
                                    )}
                                </div>

                                {card.hint && (
                                    <Button
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playSFX("click");
                                            setHintVisible((v) => !v);
                                        }}
                                        className="absolute bottom-6 left-6 !flex !items-center !gap-1.5 !rounded-xl border-2 border-gray-100 bg-gray-50 !px-3 !py-1.5 !text-xs !font-black tracking-wide uppercase shadow-none hover:shadow-none"
                                        color={hintVisible ? themeHex : "#afafaf"}
                                        icon={Lightbulb}
                                    >
                                        Hint
                                    </Button>
                                )}

                                {hintVisible && card.hint ? (
                                    <div
                                        className="absolute right-0 bottom-6 left-0 mx-6 rounded-2xl px-4 py-2.5 text-center text-xs font-bold text-white"
                                        style={{ backgroundColor: themeHex }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        💡 {card.hint}
                                    </div>
                                ) : (
                                    <p className="absolute bottom-6 shrink-0 animate-pulse text-xs font-black tracking-widest text-gray-300 uppercase">
                                        Tap to reveal
                                    </p>
                                )}
                            </div>

                            {/* Back Side */}
                            <div className="rounded-5xl sm:rounded-6xl absolute inset-0 flex rotate-y-180 flex-col items-center justify-center border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm backface-hidden sm:p-8">
                                <FlashcardAudioButton
                                    onPlay={() => playAudio(getAudioText(card))}
                                    stopPropagation
                                    className="z-10 shrink-0"
                                    iconClassName="h-5 w-5 sm:h-6 sm:w-6 text-gray-500"
                                />

                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-10 pb-4 sm:pt-4">
                                    <h2
                                        className="mb-4 text-2xl leading-tight font-black wrap-break-word sm:mb-6 sm:text-3xl md:text-4xl"
                                        style={{ color: themeHex }}
                                    >
                                        {back.meaning}
                                    </h2>
                                    {back.example && (
                                        <div className="mt-2 w-full shrink-0 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left sm:mt-4 sm:p-5">
                                            <p className="text-text text-sm font-bold wrap-break-word sm:text-base md:text-lg">
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
                                </div>
                            </div>
                        </div>

                        {/* Four-button Grade UI — visible only after flip */}
                        <div
                            className={`mt-6 transition-opacity duration-300 sm:mt-10 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
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

export default FlashcardPractice;
