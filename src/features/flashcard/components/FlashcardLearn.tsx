/**
 * @file FlashcardLearn
 * Kana-first introduction mode. Exposes vocabulary progressively:
 * kana → meaning → kanji (only when the learner is ready).
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { BookOpen, Lightbulb, Volume2, X } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor, playAudio } from "@/shared/utils";
import { useAppStore } from "@/store";
import { getAudioText, resolveDisplay } from "../utils/displayEngine";

import type { FlashCard, Lesson, StudyStats } from "../types";

interface FlashcardLearnProps {
    lesson: Lesson;
    cards: FlashCard[];
    onClose: () => void;
    onAnswer: (card: FlashCard, knew: boolean) => Promise<void>;
    onComplete: (stats: StudyStats) => void;
}

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
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });
    const [showSummary, setShowSummary] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const prevRevealedRef = useRef(false);

    useEffect(() => {
        const justRevealed = revealed && !prevRevealedRef.current;
        if (justRevealed && globalAutoPlay) {
            const card = cards[currentIndex];
            if (card) playAudio(getAudioText(card));
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
                    All cards have already been introduced.
                </p>
                <Button onClick={onClose} variant="secondary" className="px-8 py-3">
                    Go Back
                </Button>
            </div>
        );
    }

    const card = cards[currentIndex];
    if (!card) return null;

    const display = resolveDisplay(card, { mode: "learn", difficulty: card.difficulty ?? 1 });
    const displayFront = display.question;
    const displayHint = display.hint || null;
    const altSubtitle = card.alternatives.find((value) => value !== displayFront) || null;
    const headerHint = displayHint && displayHint !== altSubtitle ? displayHint : null;
    const progress = (currentIndex / cards.length) * 100;

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

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-6">
                <div className="relative flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-8 text-center shadow-sm">
                    {card.hint && (
                        <Button
                            variant="ghost"
                            onClick={() => setHintVisible((v) => !v)}
                            className="absolute top-4 left-4 !flex !items-center !gap-1.5 !rounded-xl border-2 border-gray-100 bg-gray-50 !px-3 !py-1.5 !text-[10px] !font-black tracking-wide uppercase shadow-none hover:shadow-none"
                            color={hintVisible ? themeHex : "#afafaf"}
                            icon={Lightbulb}
                        >
                            Hint
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        onClick={() => playAudio(getAudioText(card))}
                        className="absolute top-4 right-4 !rounded-full bg-gray-100 !p-2 shadow-none hover:shadow-none active:translate-y-0"
                        icon={Volume2}
                        iconClassName="h-5 w-5 text-gray-400"
                    />

                    {/* Furigana — only in mixed stage */}
                    {headerHint && (
                        <span className="mb-1 text-lg font-bold tracking-widest text-[#afafaf]">
                            {headerHint}
                        </span>
                    )}

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

                    {/* Primary display — stage-aware */}
                    <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-4">
                        <h1 className="w-full text-center text-4xl leading-tight font-black break-words text-[#3c3c3c] select-none sm:text-5xl">
                            {displayFront}
                        </h1>
                        {altSubtitle && (
                            <p className="mt-2 text-lg font-bold text-[#afafaf]">{altSubtitle}</p>
                        )}
                    </div>

                    <div className="my-4 h-px w-full bg-gray-100" />

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
