/**
 * @file FlashcardLearn
 * Recall-based introduction mode. Shows only the Front_Face until the user
 * taps "Show Answer", then reveals the Back_Face with four SM-2 grade buttons.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { BookOpen, Volume2, X } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor, playAudio, playSFX } from "@/shared/utils";
import { useAppStore } from "@/store";
import { gradeCard } from "../services";
import { getAudioText, reinsertCard, resolveCardFaces } from "../utils";

import type { Lesson, StudyStats } from "../types";
import type { CardWithProgress, Grade } from "../../domain";

interface FlashcardLearnProps {
    lesson: Lesson;
    userId: string;
    cards: CardWithProgress[];
    onClose: () => void;
    onAnswer: (card: CardWithProgress, grade: Grade) => Promise<void>;
    onComplete: (stats: StudyStats) => void;
}

const FlashcardLearn = ({
    lesson,
    userId,
    cards,
    onClose,
    onAnswer,
    onComplete,
}: FlashcardLearnProps) => {
    const { globalAutoPlay } = useAppStore();
    const themeHex = lesson.themeColor || "#1cb0f6";

    /** Local queue state — initialized from cards prop, supports Again re-insertion */
    const [queue, setQueue] = useState<CardWithProgress[]>(() => [...cards]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
        mistakeCardIds: [],
    });
    const [showSummary, setShowSummary] = useState(false);
    const showAnswerRef = useRef<HTMLButtonElement>(null);
    const prevRevealedRef = useRef(false);

    useEffect(() => {
        const justRevealed = revealed && !prevRevealedRef.current;
        if (justRevealed && globalAutoPlay) {
            const card = queue[currentIndex];
            if (card) playAudio(getAudioText(card));
        }
        prevRevealedRef.current = revealed;
    }, [revealed, globalAutoPlay, queue, currentIndex]);

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

    const card = queue[currentIndex];
    if (!card) return null;

    const faces = resolveCardFaces(card, "learn");
    const displayFront = faces.front.clozeTemplate ?? faces.front.primary ?? "";
    const back = faces.back;
    const progress = (currentIndex / queue.length) * 100;

    const handleShowAnswer = () => {
        playSFX("click");
        setRevealed(true);
    };

    const handleGrade = (grade: Grade) => {
        const knew = grade === "Good" || grade === "Easy";
        const nextMistakes = knew ? stats.mistakeCardIds : [...stats.mistakeCardIds, card.id];
        setStats({
            correct: stats.correct + (knew ? 1 : 0),
            incorrect: stats.incorrect + (!knew ? 1 : 0),
            mistakeCardIds: nextMistakes,
        });
        playSFX(knew ? "correct" : "wrong");

        // Advance UI immediately — writes are fire-and-forget
        if (grade === "Again") {
            setQueue(reinsertCard(queue, currentIndex));
            setRevealed(false);
        } else {
            setRevealed(false);
            if (currentIndex < queue.length - 1) {
                setCurrentIndex((i) => i + 1);
            } else {
                setShowSummary(true);
            }
        }

        void gradeCard(userId, card.id, card, grade, card.lessonId, userId).catch(() => {});
        void onAnswer(card, grade).catch(() => {});
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
                    {currentIndex + 1}/{queue.length}
                </span>
            </header>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-6">
                {/* Card face */}
                <div className="relative flex w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white p-8 text-center shadow-sm">
                    <Button
                        variant="ghost"
                        onClick={() => playAudio(getAudioText(card))}
                        className="absolute top-4 right-4 !rounded-full bg-gray-100 !p-2 shadow-none hover:shadow-none active:translate-y-0"
                        icon={Volume2}
                        iconClassName="h-5 w-5 text-gray-400"
                    />

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

                    {/* Front face — always visible */}
                    <div className="flex w-full flex-1 flex-col items-center justify-center px-2 py-4">
                        <h1 className="w-full text-center text-4xl leading-tight font-black wrap-break-word text-[#3c3c3c] select-text sm:text-5xl">
                            {displayFront}
                        </h1>
                    </div>

                    {/* Back face — revealed after "Show Answer" */}
                    {revealed && (
                        <>
                            <div className="my-4 h-px w-full bg-gray-100" />

                            <p
                                className="text-2xl font-black sm:text-3xl"
                                style={{ color: themeHex }}
                            >
                                {back.meaning}
                            </p>

                            {back.example && (
                                <div className="mt-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 text-left">
                                    <p className="text-sm font-bold text-[#3c3c3c] sm:text-base">
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

                            {back.mnemonic && (
                                <div className="mt-3 w-full rounded-2xl border-2 border-[#ffe5c7] bg-[#fff8f0] p-3 text-left">
                                    <p className="text-xs font-bold text-[#ff9600]">
                                        💡 {back.mnemonic}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Controls */}
                {!revealed ? (
                    <button
                        ref={showAnswerRef}
                        onClick={handleShowAnswer}
                        className="w-full rounded-[1.5rem] border-2 border-b-8 border-gray-200 bg-white py-4 text-lg font-black text-[#3c3c3c] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
                        style={{ "--tw-ring-color": themeHex } as React.CSSProperties}
                    >
                        Show Answer
                    </button>
                ) : (
                    <div className="grid w-full grid-cols-2 gap-3">
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
                )}
            </div>
        </div>
    );
};

export default FlashcardLearn;
