"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, Lightbulb, Volume2, X } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { shuffleArray } from "@/shared/utils/array";
import { playAudio } from "@/shared/utils/audio";
import { hexToThemeColor } from "@/shared/utils/colors";
import { useAppStore } from "@/store/useAppStore";
import { useSRS } from "../hooks/useSRS";

import type { FlashCard, Lesson, StudyMode, StudyStats } from "../types/flashcard.types";

interface FlashcardPlayerProps {
    lesson: Lesson;
    cards: FlashCard[];
    mode: StudyMode;
    onClose: () => void;
    onComplete: (stats: StudyStats) => void;
}

const FlashcardPlayer = ({ lesson, cards, mode, onClose, onComplete }: FlashcardPlayerProps) => {
    const { processReview } = useSRS(cards);
    const { globalAutoPlay } = useAppStore();
    const themeHex = lesson.themeColor || "#1cb0f6";

    const [queue, setQueue] = useState<FlashCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [stats, setStats] = useState<StudyStats>({ correct: 0, incorrect: 0 });
    const [showSummary, setShowSummary] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Hint visibility for the current card
    const [hintVisible, setHintVisible] = useState(false);
    // Which MC choice was selected (null = not yet answered)
    const [mcSelected, setMcSelected] = useState<string | null>(null);

    useEffect(() => {
        if (initialized) return;
        let selected: FlashCard[] = [];
        if (mode === "learn") {
            selected = cards.filter((c) => c.repetitions === 0);
        } else if (mode === "review") {
            selected = cards.filter((c) => c.nextReviewAt <= Date.now() && c.repetitions > 0);
        } else if (mode === "test") {
            selected = shuffleArray(cards);
        }
        setQueue(selected);
        setInitialized(true);
    }, [cards, mode, initialized]);

    // Reset per-card UI state when moving to next card
    useEffect(() => {
        setHintVisible(false);
        setMcSelected(null);
        setIsFlipped(false);
    }, [currentIndex]);

    const card = queue[currentIndex];

    const mcChoices = useMemo<string[] | null>(() => {
        if (mode !== "test") return null;
        const d = card?.distractors;
        if (!d || d.length < 3) return null;
        return shuffleArray([card.meaning, ...d.slice(0, 3)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, mode]);

    const isMCMode = mcChoices !== null && mcChoices.length === 4;

    // Auto-play audio when card is flipped
    useEffect(() => {
        if (isFlipped && globalAutoPlay && card?.kanji) {
            playAudio(card.kanji);
        }
    }, [isFlipped, globalAutoPlay, card]);

    if (!initialized) return null;

    if (queue.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-4xl border-b-8 border-gray-200 bg-white text-gray-400 shadow-sm">
                    <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">All caught up!</h2>
                <p className="mb-8 font-bold text-[#afafaf]">
                    No cards available for this mode right now.
                </p>
                <Button onClick={onClose} variant="secondary" className="px-8 py-3">
                    Go Back
                </Button>
            </div>
        );
    }

    const progress = (currentIndex / queue.length) * 100;

    const advance = async (knew: boolean) => {
        setStats((prev) => ({
            correct: prev.correct + (knew ? 1 : 0),
            incorrect: prev.incorrect + (!knew ? 1 : 0),
        }));
        if (mode !== "test") {
            await processReview(card, knew);
        }
        if (currentIndex < queue.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setShowSummary(true);
        }
    };

    const handleAnswer = (knew: boolean) => void advance(knew);

    // Multiple-choice selection handler
    const handleMCSelect = (choice: string) => {
        if (mcSelected !== null) return; // already answered
        setMcSelected(choice);
        const correct = choice === card.meaning;
        // Short delay so learner sees the feedback colour before advancing
        setTimeout(() => handleAnswer(correct), 750);
    };

    // ── Summary screen ─────────────────────────────────────────────────────────
    if (showSummary) {
        const xpEarned = mode === "test" ? stats.correct * 5 : stats.correct * 2;
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div
                    className="mb-6 flex h-24 w-24 -rotate-6 transform items-center justify-center rounded-4xl border-b-8 shadow-sm"
                    style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
                >
                    <Check size={56} className="text-white" strokeWidth={4} />
                </div>
                <h2 className="mb-2 text-4xl font-black text-[#3c3c3c]">Session Complete!</h2>
                <p className="mb-8 text-lg font-bold text-[#afafaf]">
                    [{mode.toUpperCase()}] Deck finished.
                </p>
                <div className="mb-12 flex w-full max-w-sm gap-4">
                    <div className="flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#58cc02]">{stats.correct}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Knew It
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

    // ── Main player ────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            {/* Progress header */}
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
                {/* ── Multiple-choice mode (test + distractors present) ── */}
                {isMCMode ? (
                    <div className="flex w-full flex-col gap-5">
                        {/* Card question */}
                        <div className="relative flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white px-6 py-8 text-center shadow-sm sm:rounded-[3rem]">
                            {/* Hint button */}
                            {card.hint && (
                                <button
                                    type="button"
                                    onClick={() => setHintVisible((v) => !v)}
                                    className="absolute top-4 left-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-2 transition-colors hover:bg-gray-100"
                                    title="Show hint"
                                >
                                    <Lightbulb
                                        size={16}
                                        style={{
                                            color: hintVisible ? themeHex : "#afafaf",
                                        }}
                                    />
                                </button>
                            )}

                            {card.furigana && (
                                <span className="mb-2 text-lg font-bold tracking-widest text-[#afafaf]">
                                    {card.furigana}
                                </span>
                            )}
                            <h1 className="text-5xl font-black text-[#3c3c3c] uppercase select-none sm:text-6xl">
                                {card.kanji}
                            </h1>

                            {/* Hint reveal */}
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

                        {/* MC choice grid */}
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
                    /* ── Standard flip mode (learn / review, or test without distractors) ── */
                    <>
                        <div
                            className={`perspective-1000 preserve-3d relative flex aspect-3/4 w-full cursor-pointer flex-col justify-center transition-all duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                            onClick={() => setIsFlipped((f) => !f)}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm transition-transform backface-hidden hover:-translate-y-1 hover:shadow-md sm:rounded-[3rem] sm:p-8 sm:hover:-translate-y-2">
                                {mode !== "test" && card.furigana && (
                                    <span className="mb-2 shrink-0 text-xl font-bold tracking-widest text-[#afafaf] sm:mb-4 sm:text-2xl">
                                        {card.furigana}
                                    </span>
                                )}
                                {card.imageUrl ? (
                                    <div className="mb-4 h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:mb-6 sm:h-40">
                                        <img
                                            key={card.imageUrl}
                                            src={card.imageUrl}
                                            alt={card.kanji}
                                            className="h-full w-full object-contain"
                                            crossOrigin="anonymous"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                ) : null}

                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-2 pb-8 sm:pb-10">
                                    <h1
                                        className={`leading-tight font-black wrap-break-word text-[#3c3c3c] uppercase select-none ${card.imageUrl ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl md:text-6xl"}`}
                                    >
                                        {card.kanji}
                                    </h1>
                                </div>

                                {/* Hint toggle — bottom-left, stops flip propagation */}
                                {card.hint && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setHintVisible((v) => !v);
                                        }}
                                        className="absolute bottom-6 left-6 flex items-center gap-1.5 rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-black tracking-wide uppercase transition-colors hover:bg-gray-100 sm:bottom-8 sm:left-8"
                                        style={{ color: hintVisible ? themeHex : "#afafaf" }}
                                    >
                                        <Lightbulb size={11} />
                                        Hint
                                    </button>
                                )}

                                {hintVisible && card.hint ? (
                                    <div
                                        className="absolute right-0 bottom-6 left-0 mx-6 rounded-2xl px-4 py-2.5 text-center text-xs font-bold text-white sm:bottom-8 sm:mx-8"
                                        style={{ backgroundColor: themeHex }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        💡 {card.hint}
                                    </div>
                                ) : (
                                    <p className="absolute bottom-6 shrink-0 animate-pulse text-xs font-black tracking-widest text-gray-300 uppercase sm:bottom-8 sm:text-sm">
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
                                    className="absolute top-4 right-4 z-10 shrink-0 rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 sm:top-6 sm:right-6 sm:p-3"
                                >
                                    <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>

                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-10 pb-4 sm:pt-4">
                                    {mode === "test" && card.furigana && (
                                        <span className="mb-2 text-lg font-bold text-gray-400 sm:text-xl">
                                            {card.furigana}
                                        </span>
                                    )}

                                    <h2 className="mb-4 text-2xl leading-tight font-black wrap-break-word text-[#1cb0f6] sm:mb-6 sm:text-3xl md:text-4xl">
                                        {card.meaning}
                                    </h2>

                                    {card.example && (
                                        <div className="mt-2 w-full shrink-0 rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left sm:mt-4 sm:p-5">
                                            <p className="text-sm font-bold wrap-break-word text-[#3c3c3c] sm:text-base md:text-lg">
                                                {card.example}
                                            </p>
                                        </div>
                                    )}

                                    {/* Usage note */}
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

                        {/* Flip mode answer buttons */}
                        <div
                            className={`mt-6 flex w-full gap-2 transition-opacity duration-300 sm:mt-10 sm:gap-4 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="secondary"
                                color="orange"
                                onClick={() => handleAnswer(false)}
                                className="flex-1 py-4 text-lg sm:py-5 sm:text-xl"
                            >
                                {mode === "test" ? "Incorrect" : "Review Again"}
                            </Button>
                            <Button
                                variant="primary"
                                color="green"
                                onClick={() => handleAnswer(true)}
                                className="flex-1 py-4 text-lg sm:py-5 sm:text-xl"
                            >
                                {mode === "test" ? "Correct" : "Got It"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FlashcardPlayer;
