"use client";

import { useState } from "react";
import type { Lesson, FlashCard, StudyStats } from "../types/flashcard.types";
import { Button } from "@/shared/components/ui";
import { Check, X } from "lucide-react";

interface FlashcardPlayerProps {
    lesson: Lesson;
    onClose: () => void;
    onComplete: () => void;
    onCardResult: (lessonId: string, cardId: string, knew: boolean) => void;
}

export default function FlashcardPlayer({
    lesson,
    onClose,
    onComplete,
    onCardResult,
}: FlashcardPlayerProps) {
    const [queue] = useState<FlashCard[]>(() =>
        [...lesson.cards].sort(() => Math.random() - 0.5)
    );
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [stats, setStats] = useState<StudyStats>({
        correct: 0,
        incorrect: 0,
    });
    const [showSummary, setShowSummary] = useState(false);

    if (queue.length === 0) {
        return (
            <div className="p-6 font-bold text-center">
                No cards found.
                <br />
                <Button onClick={onClose} className="mt-4 mx-auto">
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
            <div className="fixed inset-0 bg-[#F7F7F8] z-50 flex flex-col items-center justify-center p-6">
                <div className="w-24 h-24 bg-[#58cc02] text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border-b-8 border-[#58a700] transform -rotate-6">
                    <Check size={56} strokeWidth={4} />
                </div>
                <h2 className="text-4xl font-black text-[#3c3c3c] mb-2">
                    Great Job!
                </h2>
                <p className="text-[#afafaf] font-bold text-lg mb-8">
                    You&apos;ve completed this deck.
                </p>
                <div className="flex gap-4 w-full max-w-sm mb-12">
                    <div className="flex-1 bg-white p-6 rounded-[1.5rem] shadow-sm text-center border-2 border-b-8 border-gray-200">
                        <div className="text-5xl font-black text-[#58cc02]">
                            {stats.correct}
                        </div>
                        <div className="text-[10px] font-black text-[#afafaf] uppercase tracking-widest mt-2">
                            Knew It
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-6 rounded-[1.5rem] shadow-sm text-center border-2 border-b-8 border-gray-200">
                        <div className="text-5xl font-black text-[#ff9600]">
                            {stats.incorrect}
                        </div>
                        <div className="text-[10px] font-black text-[#afafaf] uppercase tracking-widest mt-2">
                            Review
                        </div>
                    </div>
                </div>
                <Button
                    variant="primary"
                    color="blue"
                    onClick={onComplete}
                    className="w-full max-w-xs text-xl py-5"
                >
                    Collect +50 XP
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#F7F7F8] z-50 flex flex-col">
            <header className="flex justify-between items-center p-4">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    icon={X}
                    className="px-3 py-2"
                />
                <div className="flex-1 mx-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#1cb0f6] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <span className="text-sm font-black text-[#afafaf] w-12 text-right">
                    {currentIndex + 1}/{queue.length}
                </span>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto perspective-1000">
                <div
                    className={`relative w-full aspect-[3/4] transition-all duration-500 preserve-3d cursor-pointer ${isFlipped ? "rotate-y-180" : ""}`}
                    onClick={() => !isFlipped && setIsFlipped(true)}
                >
                    <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-sm border-2 border-b-8 border-gray-200 flex flex-col items-center justify-center p-8 text-center hover:-translate-y-2 hover:shadow-md transition-transform">
                        {card.furigana && (
                            <span className="text-2xl text-[#afafaf] font-bold mb-4 tracking-widest">
                                {card.furigana}
                            </span>
                        )}
                        <h1 className="text-[6rem] font-medium text-[#3c3c3c] leading-tight select-none">
                            {card.kanji}
                        </h1>
                        <p className="absolute bottom-8 text-sm text-gray-300 font-black uppercase tracking-widest animate-pulse">
                            Tap to reveal
                        </p>
                    </div>
                    <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-sm border-2 border-b-8 border-gray-200 flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                        <h2 className="text-4xl font-black text-[#1cb0f6] mb-6 leading-tight">
                            {card.meaning}
                        </h2>
                        {card.example && (
                            <div className="mt-4 p-5 bg-gray-50 rounded-2xl w-full border-2 border-gray-100">
                                <p className="text-[#3c3c3c] font-bold text-lg">
                                    {card.example}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className={`w-full mt-10 flex gap-4 transition-opacity duration-300 ${isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        variant="secondary"
                        color="orange"
                        onClick={() => handleAnswer(false)}
                        className="flex-1 text-xl py-5"
                    >
                        Review Again
                    </Button>
                    <Button
                        variant="primary"
                        color="green"
                        onClick={() => handleAnswer(true)}
                        className="flex-1 text-xl py-5"
                    >
                        Got It
                    </Button>
                </div>
            </div>
        </div>
    );
}
