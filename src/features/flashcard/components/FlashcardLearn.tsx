/**
 * @file FlashcardLearn
 * The "zero pressure" introduction mode for new flashcards.
 * Focuses on initial exposure and vocabulary building.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { BookOpen, Lightbulb, Volume2, X } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor, playAudio } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { FlashCard, Lesson, StudyStats } from "../types";

/**
 * FlashcardLearn — "zero pressure" introduction mode.
 *
 * @remarks
 * **Philosophy (Anki/Duolingo inspired):**
 * - **Full Disclosure**: Shows the full card immediately (no mystery / mystery-meat navigation).
 * - **Pronunciation First**: Auto-plays audio upon exposure to reinforce the link between sound and script.
 * - **Self-Assessment**: Users decide if they "Got It" or need more repetition.
 * - **Scaffolding**: Furigana is always visible to help with reading.
 */

interface FlashcardLearnProps {
    /** The deck metadata */
    lesson: Lesson;
    /** The subset of cards to be introduced */
    cards: FlashCard[];
    /** Triggered when the user manually exits the session */
    onClose: () => void;
    /** Callback for each card's self-assessment */
    onAnswer: (card: FlashCard, knew: boolean) => Promise<void>;
    /** Final callback when the entire batch is completed */
    onComplete: (stats: StudyStats) => void;
}

/**
 * FlashcardLearn Component
 *
 * @example
 * <FlashcardLearn lesson={myDeck} cards={newCards} onComplete={handleFinish} />
 */
export const FlashcardLearn = ({
    lesson,
    cards,
    onClose,
    onAnswer,
    onComplete,
}: FlashcardLearnProps) => {
    const { globalAutoPlay } = useAppStore();
    const themeHex = lesson.themeColor || "#1cb0f6";

    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);

    /** Accumulator for session results, tracked for the final reward screen */
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });

    const [showSummary, setShowSummary] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);

    /** Ref-based tracking to prevent redundant audio triggers on re-renders */
    const prevRevealedRef = useRef(false);

    /**
     * Pronunciation Reinforcement
     * Plays audio automatically when a card is revealed if globalAutoPlay is enabled.
     */
    useEffect(() => {
        const justRevealed = revealed && !prevRevealedRef.current;
        if (justRevealed && globalAutoPlay) {
            const card = cards[currentIndex];
            if (card?.kanji) playAudio(card.kanji);
        }
        prevRevealedRef.current = revealed;
    }, [revealed, globalAutoPlay, cards, currentIndex]);

    if (cards.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-4xl border-b-8 border-gray-200 bg-white text-gray-400 shadow-sm">
                    <BookOpen size={48} strokeWidth={2.5} />
                </div>
                <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">Nothing to learn!</h2>
                <p className="mb-8 font-bold text-[#afafaf]">
                    All cards in this deck have already been introduced.
                </p>
                <Button onClick={onClose} variant="secondary" className="px-8 py-3">
                    Go Back
                </Button>
            </div>
        );
    }

    const card = cards[currentIndex];

    // Safety guard for state transitions during unmount/cleanup
    if (!card) return null;

    const progress = (currentIndex / cards.length) * 100;

    /**
     * Session Advancement
     * Records the answer in Firestore through `onAnswer` and moves to the next card/summary.
     */
    const advance = async (knew: boolean) => {
        const nextMistakes = knew ? stats.mistakeCardIds : [...stats.mistakeCardIds, card.id];
        const nextStats: StudyStats = {
            correct: stats.correct + (knew ? 1 : 0),
            incorrect: stats.incorrect + (!knew ? 1 : 0),
            mistakeCardIds: nextMistakes,
        };
        setStats(nextStats);
        setRevealed(false);
        setHintVisible(false);
        await onAnswer(card, knew);
        if (currentIndex < cards.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setShowSummary(true);
        }
    };

    // ── Summary (Reward State) ────────────────────────────────────────────────
    if (showSummary) {
        const xpEarned = stats.correct * 2;
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div
                    className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 shadow-sm"
                    style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
                >
                    <BookOpen size={48} className="text-white" strokeWidth={3} />
                </div>
                <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">Lesson Complete!</h2>
                <p className="mb-8 text-lg font-bold text-[#afafaf]">
                    You learned {cards.length} new card{cards.length !== 1 ? "s" : ""}.
                </p>
                <div className="mb-10 flex w-full max-w-sm gap-4">
                    <div className="flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#58cc02]">{stats.correct}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Got It
                        </div>
                    </div>
                    <div className="flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#ff9600]">{stats.incorrect}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Study More
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

    // ── Main Card View ───────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            {/* Header with Navigation and Progress */}
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

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-6">
                {/* Front Face - Note: Learn mode shows everything by default */}
                <div className="relative flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-8 text-center shadow-sm sm:rounded-[3rem]">
                    {/* Interactive Scaffolding: Hints and Audio */}
                    {card.hint && (
                        <button
                            type="button"
                            onClick={() => setHintVisible((v) => !v)}
                            className="absolute top-4 left-4 flex items-center gap-1.5 rounded-xl border-2 border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-black tracking-wide uppercase transition-colors hover:bg-gray-100"
                            style={{ color: hintVisible ? themeHex : "#afafaf" }}
                        >
                            <Lightbulb size={11} />
                            Hint
                        </button>
                    )}

                    <button
                        onClick={() => playAudio(card.kanji)}
                        className="hover:bg-200 absolute top-4 right-4 rounded-full bg-gray-100 p-2 text-gray-400 transition-colors"
                    >
                        <Volume2 className="h-5 w-5" />
                    </button>

                    {card.furigana && (
                        <span className="mb-2 text-xl font-bold tracking-widest text-[#afafaf]">
                            {card.furigana}
                        </span>
                    )}

                    {card.imageUrl && (
                        <div className="mb-4 h-32 w-full overflow-hidden rounded-2xl">
                            <img
                                src={card.imageUrl}
                                alt={card.kanji}
                                className="h-full w-full object-contain"
                                crossOrigin="anonymous"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    )}
                    <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-4">
                        <h1 className="w-full text-center text-3xl leading-tight font-black break-words text-[#3c3c3c] uppercase select-none sm:text-4xl md:text-5xl">
                            {card.kanji}
                        </h1>
                    </div>

                    <div className="my-4 h-px w-full bg-gray-100" />

                    {/* Meta Data: Meaning, Examples, Usage */}
                    <p className="text-2xl font-black sm:text-3xl" style={{ color: themeHex }}>
                        {card.meaning}
                    </p>

                    {card.example && (
                        <div className="mt-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left">
                            <p className="text-sm font-bold text-[#3c3c3c] sm:text-base">
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

                    {hintVisible && card.hint && (
                        <div
                            className="mt-4 w-full rounded-2xl px-4 py-2.5 text-sm font-bold text-white"
                            style={{ backgroundColor: themeHex }}
                        >
                            💡 {card.hint}
                        </div>
                    )}
                </div>

                {/* Self-Assessment Interaction */}
                <div className="flex w-full gap-3">
                    <Button
                        variant="secondary"
                        color="orange"
                        onClick={() => void advance(false)}
                        className="flex-1 py-4 text-lg"
                    >
                        Study More
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
            </div>
        </div>
    );
};

export default FlashcardLearn;
