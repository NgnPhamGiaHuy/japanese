/**
 * @file FlashcardMistakeReview
 * High-intensity recovery mode for cards failed in the current session.
 * Leverages AI to provide "Memory Tips" (mnemonics) to repair broken neural links.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AlertCircle, Brain, Check, Lightbulb, Loader2, Volume2, X } from "lucide-react";

import { useAICard } from "@/features/ai";
import { Button } from "@/shared/components/ui";
import { hexToThemeColor, playAudio, playSFX, shuffleArray } from "@/shared/utils";
import { useAppStore } from "@/store";
import { reinsertCard } from "../logic/learningEngine";
import { gradeCard } from "../services/card.service";
import { getAudioText, resolveCardFaces } from "../utils/displayEngine";

import type { Grade } from "../services/card.service";
import type { FlashCard, Lesson, StudyStats } from "../types";

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
    cards: FlashCard[];
    /** Manual exit handler */
    onClose: () => void;
    /** Persistent state updater */
    onAnswer: (card: FlashCard, grade: Grade) => Promise<void>;
    /** Session completion callback */
    onComplete: (stats: StudyStats) => void;
}

/**
 * Custom hook for lazy-loading AI mnemonics.
 * Triggers generation only when the card is first revealed to optimize token usage.
 * Resets when the card changes so each card gets its own fresh tip.
 *
 * @param card - The target card
 * @param revealed - Reveal flag (trigger)
 */
const useAIExplanation = (card: FlashCard | undefined, revealed: boolean) => {
    const { generate, status, error } = useAICard();
    const aiLoading = status === "loading";
    const [explanation, setExplanation] = useState<string | null>(null);

    // Reset explanation whenever the card changes so the previous card's tip
    // doesn't bleed into the next card.
    useEffect(() => {
        setExplanation(null);
    }, [card?.id]);

    useEffect(() => {
        if (!revealed || !card) return;
        // Don't re-fetch if we already have a tip for this card
        if (explanation !== null) return;
        if (card.hint) {
            setExplanation(card.hint);
        } else {
            generate(getAudioText(card)).then((result) => {
                if (result?.hint) setExplanation(result.hint);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealed, card?.id]);

    return { explanation, loading: aiLoading, error };
};

/**
 * FlashcardMistakeReview Component
 *
 * @example
 * <FlashcardMistakeReview lesson={deck} cards={fails} userId={uid} onComplete={handleRedeem} />
 */
export const FlashcardMistakeReview = ({
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
    const [queue, setQueue] = useState<FlashCard[]>(() => [...cards]);
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
    const { explanation, loading: aiLoading } = useAIExplanation(card, isFlipped || !!mcSelected);

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

    // Guard for fast transition between states
    if (!card) return null;

    const faces = resolveCardFaces(card, "mistake-review");
    const displayFront = faces.front.clozeTemplate ?? faces.front.primary ?? "";
    const back = faces.back;
    const displayHint = back.hint || null;
    const altSubtitle = back.alternatives.find((value) => value !== displayFront) || null;
    const headerHint = displayHint && displayHint !== altSubtitle ? displayHint : null;
    const progress = (currentIndex / queue.length) * 100;

    /**
     * Session Flow Control
     * Triggers SRS update and either advances or completes the session.
     * NOTE: Does NOT call incrementDailyReviewCount — mistake-review cards were already counted.
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
        if (knew) {
            playSFX("correct");
        } else {
            playSFX("wrong");
        }
        setIsFlipped(false);
        setMcSelected(null);

        await gradeCard(userId, card.id, card, grade);
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
        /** Short delay for visual feedback before auto-advancing */
        setTimeout(() => {
            void handleGrade(grade);
        }, 900);
    };

    // ── Summary (Redemption Summary) ──────────────────────────────────────────
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

    // ── Player UI ────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            {/* Header: Error-themed progress bar */}
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
                    {currentIndex + 1}/{queue.length}
                </span>
            </header>

            {/* Visual Guard: Mistake Mode Badge */}
            <div className="mx-auto flex items-center gap-2 rounded-xl border border-[#ffdfe0] bg-[#ffdfe0] px-4 py-1.5 text-xs font-black text-[#ea2b2b] uppercase">
                <AlertCircle size={12} />
                Reviewing your mistakes
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-4 sm:p-6">
                {mcChoices && mcChoices.length === 4 ? (
                    /* Recognition Mode: Select the meaning you missed previously */
                    <div className="flex w-full flex-col gap-5">
                        <div className="flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-[#ea2b2b]/20 bg-white px-6 py-8 text-center shadow-sm">
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
                                        className={`!px-4 !py-4 !text-left !text-sm !font-bold shadow-none transition-all hover:shadow-none ${mcSelected !== null && !isCorrect && !isSelected ? "opacity-50" : ""}`}
                                        style={style}
                                    >
                                        <span
                                            style={{
                                                color:
                                                    mcSelected !== null && (isCorrect || isSelected)
                                                        ? "white"
                                                        : mcSelected !== null
                                                          ? "#afafaf"
                                                          : "#3c3c3c",
                                            }}
                                        >
                                            {choice}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-[#ea2b2b]/20 bg-white p-6 text-center shadow-sm backface-hidden hover:-translate-y-1 hover:shadow-md">
                                {headerHint && (
                                    <span className="mb-2 shrink-0 text-xl font-bold tracking-widest text-[#afafaf]">
                                        {headerHint}
                                    </span>
                                )}
                                <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-4">
                                    <h1 className="w-full text-center text-3xl leading-tight font-black wrap-break-word text-[#3c3c3c] select-none sm:text-4xl md:text-5xl">
                                        {displayFront}
                                    </h1>
                                    {altSubtitle && (
                                        <p className="mt-2 text-lg font-bold text-[#afafaf]">
                                            {altSubtitle}
                                        </p>
                                    )}
                                </div>
                                <p className="absolute bottom-6 animate-pulse text-xs font-black tracking-widest text-gray-300 uppercase">
                                    Tap to reveal
                                </p>
                            </div>

                            {/* Back (Memory Encoding with AI Aid) */}
                            <div className="absolute inset-0 flex rotate-y-180 flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-[#ea2b2b]/20 bg-white p-6 text-center shadow-sm backface-hidden sm:p-8">
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(getAudioText(card));
                                    }}
                                    className="absolute top-4 right-4 !rounded-full bg-gray-100 !p-2 shadow-none transition-colors hover:shadow-none active:translate-y-0"
                                    variant="ghost"
                                    icon={Volume2}
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
                                            <p className="text-sm font-bold text-[#3c3c3c] sm:text-base">
                                                {back.example}
                                            </p>
                                        </div>
                                    )}

                                    {/* Mnemonic Generation Area */}
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

                        {/* Four-button Grade UI — visible only after flip */}
                        <div
                            className={`mt-6 grid w-full grid-cols-2 gap-3 transition-opacity duration-300 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
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

export default FlashcardMistakeReview;
