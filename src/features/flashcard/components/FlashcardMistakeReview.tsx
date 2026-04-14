"use client";

import { useEffect, useMemo, useState } from "react";

import { AlertCircle, Brain, Check, Lightbulb, Loader2, Volume2, X } from "lucide-react";

import { useAICard } from "@/features/ai";
import { Button } from "@/shared/components/ui";
import { hexToThemeColor, playAudio, shuffleArray } from "@/shared/utils";

import type { FlashCard, Lesson, StudyStats } from "../types";

/**
 * FlashcardMistakeReview — targeted re-exposure with AI-generated explanations.
 *
 * Design rationale:
 *  - Shows only cards the learner got wrong in a recent session.
 *  - On the back face, an AI explanation is loaded automatically to help
 *    them understand WHY they were wrong (memory encoding).
 *  - Updates SRS so that Firestore reflects genuinely weak cards.
 */

interface FlashcardMistakeReviewProps {
    lesson: Lesson;
    cards: FlashCard[];
    onClose: () => void;
    onAnswer: (card: FlashCard, knew: boolean) => Promise<void>;
    onComplete: (stats: StudyStats) => void;
}

/** Lazy-loaded AI explanation for a single card. */
const useAIExplanation = (card: FlashCard | undefined, revealed: boolean) => {
    const { generate, status, error } = useAICard();
    const aiLoading = status === "loading";
    const [explanation, setExplanation] = useState<string | null>(null);

    useEffect(() => {
        if (!revealed || !card || explanation) return;
        if (card.hint) {
            setExplanation(card.hint);
        } else {
            generate(card.kanji).then((result) => {
                if (result?.hint) setExplanation(result.hint);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealed, card?.kanji]);

    return { explanation, loading: aiLoading, error };
};

export const FlashcardMistakeReview = ({
    lesson,
    cards,
    onClose,
    onAnswer,
    onComplete,
}: FlashcardMistakeReviewProps) => {
    const themeHex = lesson.themeColor || "#1cb0f6";

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });
    const [showSummary, setShowSummary] = useState(false);

    // Multiple-choice choices for mistake cards using their distractors
    const card = cards[currentIndex];

    const mcChoices = useMemo<string[] | null>(() => {
        const d = card?.distractors;
        if (!d || d.length < 3) return null;
        return shuffleArray([card.meaning, ...d.slice(0, 3)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    const [mcSelected, setMcSelected] = useState<string | null>(null);

    // Load AI explanation when the card is revealed
    const { explanation, loading: aiLoading } = useAIExplanation(card, isFlipped);

    // (Per-card UI resets are handled in `advance` to avoid cascading renders)

    if (cards.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-4xl border-b-8 border-gray-200 bg-white text-[#58cc02] shadow-sm">
                    <Check size={48} strokeWidth={3} />
                </div>
                <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">No mistakes to review!</h2>
                <p className="mb-8 font-bold text-[#afafaf]">You nailed everything. Keep it up!</p>
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
        // Reveal flip to show explanation even in MC mode
        setTimeout(() => {
            void advance(correct);
        }, 900);
    };

    // ── Summary ─────────────────────────────────────────────────────────────
    if (showSummary) {
        const xpEarned = stats.correct * 3;
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div
                    className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 shadow-sm"
                    style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
                >
                    <Brain size={48} className="text-white" strokeWidth={2.5} />
                </div>
                <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">Review Done!</h2>
                <p className="mb-8 text-lg font-bold text-[#afafaf]">
                    You revisited {cards.length} difficult card{cards.length !== 1 ? "s" : ""}.
                </p>
                <div className="mb-10 flex w-full max-w-sm gap-4">
                    <div className="flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#58cc02]">{stats.correct}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Fixed
                        </div>
                    </div>
                    <div className="flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#ff9600]">{stats.incorrect}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Still hard
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
                            style={{ width: `${progress}%`, backgroundColor: "#ea2b2b" }}
                        />
                    </div>
                </div>
                <span className="w-12 text-right text-sm font-black text-[#afafaf]">
                    {currentIndex + 1}/{cards.length}
                </span>
            </header>

            {/* "Reviewing mistakes" badge */}
            <div className="mx-auto flex items-center gap-2 rounded-xl border border-[#ffdfe0] bg-[#ffdfe0] px-4 py-1.5 text-xs font-black text-[#ea2b2b] uppercase">
                <AlertCircle size={12} />
                Reviewing your mistakes
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-4 sm:p-6">
                {mcChoices && mcChoices.length === 4 ? (
                    /* MC mode with visible distractors */
                    <div className="flex w-full flex-col gap-5">
                        <div className="flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-[#ea2b2b]/20 bg-white px-6 py-8 text-center shadow-sm">
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
                            <p className="mt-3 text-[10px] font-black tracking-widest text-gray-300 uppercase">
                                Choose the correct meaning
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {mcChoices.map((choice) => {
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
                                        className="rounded-2xl border-2 border-b-4 px-4 py-4 text-left text-sm font-bold transition-all"
                                        style={style}
                                    >
                                        {choice}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Flip mode with AI explanation on back */
                    <>
                        <div
                            className={`perspective-1000 preserve-3d relative flex aspect-3/4 w-full cursor-pointer flex-col justify-center transition-all duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                            onClick={() => setIsFlipped((f) => !f)}
                        >
                            {/* Front */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-[#ea2b2b]/20 bg-white p-6 text-center shadow-sm backface-hidden hover:-translate-y-1 hover:shadow-md">
                                {card.furigana && (
                                    <span className="mb-2 shrink-0 text-xl font-bold tracking-widest text-[#afafaf]">
                                        {card.furigana}
                                    </span>
                                )}
                                <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-4">
                                    <h1 className="w-full text-center text-3xl leading-tight font-black break-words text-[#3c3c3c] uppercase select-none sm:text-4xl md:text-5xl">
                                        {card.kanji}
                                    </h1>
                                </div>
                                <p className="absolute bottom-6 animate-pulse text-xs font-black tracking-widest text-gray-300 uppercase">
                                    Tap to reveal
                                </p>
                            </div>

                            {/* Back — with AI explanation */}
                            <div className="absolute inset-0 flex rotate-y-180 flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-[#ea2b2b]/20 bg-white p-6 text-center shadow-sm backface-hidden sm:p-8">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(card.kanji);
                                    }}
                                    className="absolute top-4 right-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
                                >
                                    <Volume2 className="h-5 w-5" />
                                </button>
                                <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto px-2 pt-10 pb-4">
                                    <h2
                                        className="mb-4 text-2xl leading-tight font-black wrap-break-word sm:text-3xl md:text-4xl"
                                        style={{ color: themeHex }}
                                    >
                                        {card.meaning}
                                    </h2>
                                    {card.example && (
                                        <div className="mt-2 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left">
                                            <p className="text-sm font-bold text-[#3c3c3c] sm:text-base">
                                                {card.example}
                                            </p>
                                        </div>
                                    )}

                                    {/* AI explanation / hint */}
                                    <div className="mt-4 w-full rounded-2xl border-2 border-[#ffe5c7] bg-[#fff8f0] p-4 text-left">
                                        <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-[#ff9600] uppercase">
                                            <Lightbulb size={12} />
                                            Memory Tip
                                        </div>
                                        {aiLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-[#afafaf]">
                                                <Loader2 size={14} className="animate-spin" />
                                                Generating tip…
                                            </div>
                                        ) : explanation ? (
                                            <p className="text-sm font-bold text-[#3c3c3c]">
                                                {explanation}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-[#afafaf]">
                                                No tip available.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`mt-6 flex w-full gap-2 transition-opacity duration-300 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="secondary"
                                color="orange"
                                onClick={() => void advance(false)}
                                className="flex-1 py-4 text-lg"
                            >
                                Still Hard
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

export default FlashcardMistakeReview;
