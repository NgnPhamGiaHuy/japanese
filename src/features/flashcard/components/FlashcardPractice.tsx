/**
 * @file FlashcardPractice
 * Core SRS-integrated study mode implementing mixed-modality pedagogy.
 * Dynamically switches between recognition (MC) and recall (Flip) based on card data.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Check, Lightbulb, RefreshCw, Volume2, X } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import { useAppStore } from "@/store";
import { getDailyProgress, incrementDailyReviewCount, reinsertCard } from "../logic/learningEngine";
import { gradeCard } from "../services/card.service";
import { getAudioText, resolveCardFaces } from "../utils/displayEngine";

import type { Grade } from "../services/card.service";
import type { FlashCard, Lesson, StudyStats } from "../types";

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
    cards: FlashCard[];
    /** Triggered on manual exit */
    onClose: () => void;
    /** Persistence handler for SRS state updates */
    onAnswer: (card: FlashCard, grade: Grade) => Promise<void>;
    /** Final transition to reward/summary screen */
    onComplete: (stats: StudyStats) => void;
}

/**
 * FlashcardPractice Component
 *
 * @example
 * <FlashcardPractice lesson={lesson} cards={dueCards} userId={uid} onAnswer={handleSrs} />
 */
export const FlashcardPractice = ({
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
    const [queue, setQueue] = useState<FlashCard[]>(() => [...cards]);
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
        // Re-shuffle only when current index changes to prevent choices jumping on state updates
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    /** Flag determining if the current card should be presented as a Quiz or a Flip-card */
    const isMCMode = mcChoices !== null && mcChoices.length === 4;

    if (cards.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-4xl border-b-8 border-gray-200 bg-white text-gray-400 shadow-sm">
                    <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">All caught up!</h2>
                <p className="mb-8 font-bold text-[#afafaf]">
                    No cards are due for practice right now.
                </p>
                <Button onClick={onClose} variant="secondary" className="px-8 py-3">
                    Go Back
                </Button>
            </div>
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

    /**
     * Advancement Orchestrator for flip mode.
     * Handles grade, re-insertion for Again, daily count increment, and queue advancement.
     */
    const handleGrade = async (grade: Grade) => {
        const knew = grade === "Good" || grade === "Easy";
        const nextMistakes = knew ? stats.mistakeCardIds : [...stats.mistakeCardIds, card.id];
        const nextStats: StudyStats = {
            correct: stats.correct + (knew ? 1 : 0),
            incorrect: stats.incorrect + (!knew ? 1 : 0),
            mistakeCardIds: nextMistakes,
        };
        setStats(nextStats);
        setIsFlipped(false);
        setHintVisible(false);
        setMcSelected(null);
        if (knew) {
            playSFX("correct");
        } else {
            playSFX("wrong");
        }

        await gradeCard(userId, card.id, card, grade);
        await incrementDailyReviewCount(userId);
        await onAnswer(card, grade);

        if (grade === "Again") {
            // Re-insert 3–5 positions ahead in the queue
            const newQueue = reinsertCard(queue, currentIndex);
            setQueue(newQueue);
            // currentIndex stays the same — the next card is now at the same index
        } else {
            if (currentIndex < queue.length - 1) {
                setCurrentIndex((i) => i + 1);
            } else {
                setShowSummary(true);
            }
        }
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
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div
                    className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 shadow-sm"
                    style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
                >
                    <RefreshCw size={48} className="text-white" strokeWidth={3} />
                </div>
                <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">Practice Done!</h2>
                <p className="mb-8 text-lg font-bold text-[#afafaf]">
                    Accuracy: <span className="font-black text-[#3c3c3c]">{accuracy}%</span>
                </p>
                <div className="mb-10 flex w-full max-w-sm gap-4">
                    <div className="flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#58cc02]">{stats.correct}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Correct
                        </div>
                    </div>
                    <div className="flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#ff9600]">{stats.incorrect}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Review
                        </div>
                    </div>
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <header className="flex items-center justify-between p-4">
                <Button variant="ghost" onClick={onClose} icon={X} className="px-3 py-2" />
                <div className="mx-4 flex-1">
                    <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full transition-all duration-300"
                            style={{ width: `${progress}%`, backgroundColor: themeHex }}
                        />
                    </div>
                </div>
                <span className="w-12 text-right text-sm font-black text-[#afafaf]">
                    {currentIndex + 1}/{queue.length}
                </span>
            </header>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-4 sm:p-6">
                {/* ── Multiple-choice (Recognition Mode) ── */}
                {isMCMode ? (
                    <div className="flex w-full flex-col gap-5">
                        <div className="relative flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white px-6 py-8 text-center shadow-sm sm:rounded-[3rem]">
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
                                    iconClassName={hintVisible ? "" : "text-[#afafaf]"}
                                    style={hintVisible ? { color: themeHex } : {}}
                                />
                            )}

                            {headerHint && (
                                <span className="mb-2 text-lg font-bold tracking-widest text-[#afafaf]">
                                    {headerHint}
                                </span>
                            )}
                            <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-2">
                                <h1 className="w-full text-center text-3xl leading-tight font-black wrap-break-word text-[#3c3c3c] select-none sm:text-4xl md:text-5xl">
                                    {displayFront}
                                </h1>
                                {altSubtitle && (
                                    <p className="mt-2 text-lg font-bold text-[#afafaf]">
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
                            <p className="mt-3 text-[10px] font-black tracking-widest text-gray-300 uppercase">
                                Choose the correct meaning
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {mcChoices!.map((choice) => {
                                const isSelected = mcSelected === choice;
                                const isCorrect = choice === card.meaning;
                                let style: React.CSSProperties = {
                                    backgroundColor: "white",
                                    borderBottomColor: "#e5e7eb",
                                };
                                let v: "primary" | "secondary" = "secondary";
                                if (mcSelected !== null) {
                                    if (isCorrect) {
                                        v = "primary";
                                        style = {
                                            backgroundColor: "#58cc02",
                                            borderBottomColor: "#58a700",
                                        };
                                    } else if (isSelected) {
                                        v = "primary";
                                        style = {
                                            backgroundColor: "#ff4b4b",
                                            borderBottomColor: "#ea2b2b",
                                        };
                                    } else {
                                        style = {
                                            backgroundColor: "white",
                                            borderBottomColor: "#e5e7eb",
                                            opacity: 0.5,
                                        };
                                    }
                                }
                                return (
                                    <Button
                                        key={choice}
                                        onClick={() => handleMCSelect(choice)}
                                        disabled={mcSelected !== null}
                                        variant={v}
                                        className={`!px-4 !py-4 !text-left !text-sm !leading-snug !font-bold shadow-none transition-all hover:shadow-none ${mcSelected !== null && !isCorrect && !isSelected ? "opacity-50" : ""}`}
                                        style={style}
                                        color={
                                            mcSelected !== null && (isCorrect || isSelected)
                                                ? "white"
                                                : mcSelected !== null
                                                  ? "#afafaf"
                                                  : "#3c3c3c"
                                        }
                                    >
                                        {choice}
                                    </Button>
                                );
                            })}
                        </div>
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm backface-hidden hover:-translate-y-1 hover:shadow-md">
                                {headerHint && (
                                    <span className="mb-2 shrink-0 text-xl font-bold tracking-widest text-[#afafaf]">
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
                                        className={`w-full text-center leading-tight font-black wrap-break-word text-[#3c3c3c] select-none ${card.imageUrl ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl md:text-5xl"}`}
                                    >
                                        {displayFront}
                                    </h1>
                                    {altSubtitle && (
                                        <p className="mt-2 text-lg font-bold text-[#afafaf]">
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
                                        className="absolute bottom-6 left-6 !flex !items-center !gap-1.5 !rounded-xl border-2 border-gray-100 bg-gray-50 !px-3 !py-1.5 !text-[10px] !font-black tracking-wide uppercase shadow-none hover:shadow-none"
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
                            <div className="absolute inset-0 flex rotate-y-180 flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm backface-hidden sm:rounded-[3rem] sm:p-8">
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(getAudioText(card));
                                    }}
                                    className="absolute top-4 right-4 z-10 shrink-0 !rounded-full bg-gray-100 !p-2 shadow-none hover:shadow-none active:translate-y-0"
                                    icon={Volume2}
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
                                            <p className="text-sm font-bold wrap-break-word text-[#3c3c3c] sm:text-base md:text-lg">
                                                {back.example}
                                            </p>
                                        </div>
                                    )}
                                    {back.usageNote && (
                                        <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
                                            <span className="text-[10px] font-black tracking-wide text-[#afafaf] uppercase">
                                                Usage
                                            </span>
                                            <span className="text-xs font-bold text-[#3c3c3c]">
                                                {back.usageNote}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Four-button Grade UI — visible only after flip */}
                        <div
                            className={`mt-6 grid w-full grid-cols-2 gap-3 transition-opacity duration-300 sm:mt-10 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                aria-label="Again — card will repeat soon"
                                onClick={() => void handleGrade("Again")}
                                className="rounded-[1.25rem] border-2 border-b-8 border-[#ea2b2b]/60 bg-[#ff4b4b] py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b4b] focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
                            >
                                Again
                            </button>
                            <button
                                aria-label="Hard — interval shortened"
                                onClick={() => void handleGrade("Hard")}
                                className="rounded-[1.25rem] border-2 border-b-8 border-[#e07000]/60 bg-[#ff9600] py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9600] focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
                            >
                                Hard
                            </button>
                            <button
                                aria-label="Good — normal interval"
                                onClick={() => void handleGrade("Good")}
                                className="rounded-[1.25rem] border-2 border-b-8 border-[#58a700]/60 bg-[#58cc02] py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58cc02] focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
                            >
                                Good
                            </button>
                            <button
                                aria-label="Easy — interval extended"
                                onClick={() => void handleGrade("Easy")}
                                className="rounded-[1.25rem] border-2 border-b-8 border-[#0090c0]/60 py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1cb0f6] focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
                                style={{ backgroundColor: themeHex }}
                            >
                                Easy
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FlashcardPractice;
