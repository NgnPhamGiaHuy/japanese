"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Check, Lightbulb, RefreshCw, Volume2, X } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor, playAudio, shuffleArray } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { FlashCard, Lesson, StudyStats } from "../types/flashcard.types";

/**
 * FlashcardPractice — SRS-integrated mixed-modality session.
 *
 * Design rationale (Quizlet "Learn" inspired):
 *  - Cards with AI distractors → Multiple Choice (recognition)
 *  - Cards without distractors → Flip (recall)
 *  - Both modes update SRS after each answer
 *  - Hint is available but subtly hidden to encourage recall first
 */

interface FlashcardPracticeProps {
    lesson: Lesson;
    cards: FlashCard[];
    onClose: () => void;
    onAnswer: (card: FlashCard, knew: boolean) => Promise<void>;
    onComplete: (stats: StudyStats) => void;
}

export const FlashcardPractice = ({
    lesson,
    cards,
    onClose,
    onAnswer,
    onComplete,
}: FlashcardPracticeProps) => {
    const { globalAutoPlay } = useAppStore();
    const themeHex = lesson.themeColor || "#1cb0f6";

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });
    const [showSummary, setShowSummary] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const [mcSelected, setMcSelected] = useState<string | null>(null);
    const prevFlippedRef = useRef(false);

    // (Per-card UI resets are handled in `advance` to avoid cascading renders)

    // Auto-play on flip
    useEffect(() => {
        const justFlipped = isFlipped && !prevFlippedRef.current;
        if (justFlipped && globalAutoPlay) {
            const card = cards[currentIndex];
            if (card?.kanji) playAudio(card.kanji);
        }
        prevFlippedRef.current = isFlipped;
    }, [isFlipped, globalAutoPlay, cards, currentIndex]);

    const card = cards[currentIndex];

    // Build MC choices if distractors are available
    const mcChoices = useMemo<string[] | null>(() => {
        const d = card?.distractors;
        if (!d || d.length < 3) return null;
        return shuffleArray([card.meaning, ...d.slice(0, 3)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

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

    // Prevents runtime crashes if UI transitions faster than state updates
    if (!card) return null;

    const progress = (currentIndex / cards.length) * 100;

    const advance = async (knew: boolean) => {
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
        await onAnswer(card, knew);
        if (currentIndex < cards.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setShowSummary(true);
        }
    };

    const handleMCSelect = (choice: string) => {
        if (mcSelected !== null) return;
        setMcSelected(choice);
        const correct = choice === card.meaning;
        setTimeout(() => void advance(correct), 750);
    };

    // ── Summary ─────────────────────────────────────────────────────────────
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

    // ── Main player ──────────────────────────────────────────────────────────
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
                    {currentIndex + 1}/{cards.length}
                </span>
            </header>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-4 sm:p-6">
                {/* ── Multiple-choice ── */}
                {isMCMode ? (
                    <div className="flex w-full flex-col gap-5">
                        <div className="relative flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white px-6 py-8 text-center shadow-sm sm:rounded-[3rem]">
                            {card.hint && (
                                <button
                                    type="button"
                                    onClick={() => setHintVisible((v) => !v)}
                                    className="absolute top-4 left-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-2 transition-colors hover:bg-gray-100"
                                    title="Show hint"
                                >
                                    <Lightbulb
                                        size={16}
                                        style={{ color: hintVisible ? themeHex : "#afafaf" }}
                                    />
                                </button>
                            )}
                            {card.furigana && (
                                <span className="mb-2 text-lg font-bold tracking-widest text-[#afafaf]">
                                    {card.furigana}
                                </span>
                            )}
                            <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-2">
                                <h1 className="w-full text-center text-3xl leading-tight font-black break-words text-[#3c3c3c] uppercase select-none sm:text-4xl md:text-5xl">
                                    {card.kanji}
                                </h1>
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
                                    borderColor: "#e5e7eb",
                                    color: "#3c3c3c",
                                };
                                if (mcSelected !== null) {
                                    if (isCorrect) {
                                        style = {
                                            backgroundColor: "#58cc02",
                                            borderColor: "#58a700",
                                            color: "white",
                                        };
                                    } else if (isSelected) {
                                        style = {
                                            backgroundColor: "#ff4b4b",
                                            borderColor: "#ea2b2b",
                                            color: "white",
                                        };
                                    } else {
                                        style = {
                                            backgroundColor: "white",
                                            borderColor: "#e5e7eb",
                                            color: "#afafaf",
                                            opacity: 0.5,
                                        };
                                    }
                                }
                                return (
                                    <button
                                        key={choice}
                                        type="button"
                                        onClick={() => handleMCSelect(choice)}
                                        disabled={mcSelected !== null}
                                        className="rounded-2xl border-2 border-b-4 px-4 py-4 text-left text-sm leading-snug font-bold transition-all"
                                        style={style}
                                    >
                                        {choice}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* ── Flip mode ── */
                    <>
                        <div
                            className={`perspective-1000 preserve-3d relative flex aspect-3/4 w-full cursor-pointer flex-col justify-center transition-all duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                            onClick={() => setIsFlipped((f) => !f)}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm backface-hidden hover:-translate-y-1 hover:shadow-md">
                                {card.furigana && (
                                    <span className="mb-2 shrink-0 text-xl font-bold tracking-widest text-[#afafaf]">
                                        {card.furigana}
                                    </span>
                                )}
                                {card.imageUrl && (
                                    <div className="mb-4 h-32 w-full shrink-0 overflow-hidden rounded-2xl">
                                        <img
                                            src={card.imageUrl}
                                            alt={card.kanji}
                                            className="h-full w-full object-contain"
                                            crossOrigin="anonymous"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                )}
                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-2 pb-8">
                                    <h1
                                        className={`w-full text-center leading-tight font-black break-words text-[#3c3c3c] uppercase select-none ${card.imageUrl ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl md:text-5xl"}`}
                                    >
                                        {card.kanji}
                                    </h1>
                                </div>

                                {card.hint && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setHintVisible((v) => !v);
                                        }}
                                        className="absolute bottom-6 left-6 flex items-center gap-1.5 rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-black tracking-wide uppercase transition-colors hover:bg-gray-100"
                                        style={{ color: hintVisible ? themeHex : "#afafaf" }}
                                    >
                                        <Lightbulb size={11} />
                                        Hint
                                    </button>
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

                            {/* Back */}
                            <div className="absolute inset-0 flex rotate-y-180 flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm backface-hidden sm:rounded-[3rem] sm:p-8">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(card.kanji);
                                    }}
                                    className="absolute top-4 right-4 z-10 shrink-0 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
                                >
                                    <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-10 pb-4 sm:pt-4">
                                    <h2
                                        className="mb-4 text-2xl leading-tight font-black wrap-break-word sm:mb-6 sm:text-3xl md:text-4xl"
                                        style={{ color: themeHex }}
                                    >
                                        {card.meaning}
                                    </h2>
                                    {card.example && (
                                        <div className="mt-2 w-full shrink-0 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left sm:mt-4 sm:p-5">
                                            <p className="text-sm font-bold wrap-break-word text-[#3c3c3c] sm:text-base md:text-lg">
                                                {card.example}
                                            </p>
                                        </div>
                                    )}
                                    {card.usageNote && (
                                        <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
                                            <span className="text-[10px] font-black tracking-wide text-[#afafaf] uppercase">
                                                Usage
                                            </span>
                                            <span className="text-xs font-bold text-[#3c3c3c]">
                                                {card.usageNote}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Answer buttons — fade in after flip */}
                        <div
                            className={`mt-6 flex w-full gap-2 transition-opacity duration-300 sm:mt-10 sm:gap-4 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="secondary"
                                color="orange"
                                onClick={() => void advance(false)}
                                className="flex-1 py-4 text-lg"
                            >
                                Review Again
                            </Button>
                            <Button
                                variant="primary"
                                color="green"
                                onClick={() => void advance(true)}
                                className="flex-1 py-4 text-lg"
                            >
                                Got It ✓
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FlashcardPractice;
