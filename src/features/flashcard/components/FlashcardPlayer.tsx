"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { FlashCard, Lesson, StudyStats } from "../types/flashcard.types";

interface FlashcardPlayerProps {
    lesson: Lesson;
    onClose: () => void;
    onComplete: () => void;
    onCardResult: (lessonId: string, cardId: string, knew: boolean) => void;
}

const FlashcardPlayer = ({ lesson, onClose, onComplete, onCardResult }: FlashcardPlayerProps) => {
    const [queue] = useState<FlashCard[]>(() => [...lesson.cards].sort(() => Math.random() - 0.5));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
    });
    const [showSummary, setShowSummary] = useState(false);

    if (queue.length === 0) {
        return (
            <div className="p-6 text-center font-bold">
                No cards found.
                <br />
                <Button onClick={onClose} className="mx-auto mt-4">
                    Go back
                </Button>
            </div>
        );
    }

    const card = queue[currentIndex];
    const progress = (currentIndex / queue.length) * 100;

    const handleAnswer = (knew: boolean) => {
        setStats((prev) => ({
            correct: prev.correct + (knew ? 1 : 0),
            incorrect: prev.incorrect + (!knew ? 1 : 0),
        }));
        onCardResult(lesson.id, card.id, knew);
        setIsFlipped(false);
        if (currentIndex < queue.length - 1) setCurrentIndex((i) => i + 1);
        else setShowSummary(true);
    };

    if (showSummary) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F7F8] p-6">
                <div className="mb-6 flex h-24 w-24 -rotate-6 transform items-center justify-center rounded-[2rem] border-b-8 border-[#58a700] bg-[#58cc02] text-white shadow-sm">
                    <Check size={56} strokeWidth={4} />
                </div>
                <h2 className="mb-2 text-4xl font-black text-[#3c3c3c]">Great Job!</h2>
                <p className="mb-8 text-lg font-bold text-[#afafaf]">
                    You&apos;ve completed this deck.
                </p>
                <div className="mb-12 flex w-full max-w-sm gap-4">
                    <div className="flex-1 rounded-[1.5rem] border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#58cc02]">{stats.correct}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Knew It
                        </div>
                    </div>
                    <div className="flex-1 rounded-[1.5rem] border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl font-black text-[#ff9600]">{stats.incorrect}</div>
                        <div className="mt-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Review
                        </div>
                    </div>
                </div>
                <Button
                    variant="primary"
                    color="blue"
                    onClick={onComplete}
                    className="w-full max-w-xs py-5 text-xl"
                >
                    Collect +50 XP
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
                            className="h-full bg-[#1cb0f6] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <span className="w-12 text-right text-sm font-black text-[#afafaf]">
                    {currentIndex + 1}/{queue.length}
                </span>
            </header>

            <div className="perspective-1000 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-6">
                <div
                    className={`preserve-3d relative aspect-[3/4] w-full cursor-pointer transition-all duration-500 ${isFlipped ? "rotate-y-180" : ""}`}
                    onClick={() => !isFlipped && setIsFlipped(true)}
                >
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[3rem] border-2 border-b-8 border-gray-200 bg-white p-8 text-center shadow-sm transition-transform backface-hidden hover:-translate-y-2 hover:shadow-md">
                        {card.furigana && (
                            <span className="mb-4 text-2xl font-bold tracking-widest text-[#afafaf]">
                                {card.furigana}
                            </span>
                        )}
                        <h1 className="text-[6rem] leading-tight font-medium text-[#3c3c3c] select-none">
                            {card.kanji}
                        </h1>
                        <p className="absolute bottom-8 animate-pulse text-sm font-black tracking-widest text-gray-300 uppercase">
                            Tap to reveal
                        </p>
                    </div>
                    <div className="absolute inset-0 flex rotate-y-180 flex-col items-center justify-center rounded-[3rem] border-2 border-b-8 border-gray-200 bg-white p-8 text-center shadow-sm backface-hidden">
                        <h2 className="mb-6 text-4xl leading-tight font-black text-[#1cb0f6]">
                            {card.meaning}
                        </h2>
                        {card.example && (
                            <div className="mt-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-5">
                                <p className="text-lg font-bold text-[#3c3c3c]">{card.example}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className={`mt-10 flex w-full gap-4 transition-opacity duration-300 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        variant="secondary"
                        color="orange"
                        onClick={() => handleAnswer(false)}
                        className="flex-1 py-5 text-xl"
                    >
                        Review Again
                    </Button>
                    <Button
                        variant="primary"
                        color="green"
                        onClick={() => handleAnswer(true)}
                        className="flex-1 py-5 text-xl"
                    >
                        Got It
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FlashcardPlayer;
