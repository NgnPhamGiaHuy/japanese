"use client";

import { use, useState, useMemo, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { X, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { Button } from "@/shared/components/ui";

export default function SpeedQuizPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { lessons } = useLessons();
    const { addXP } = useUserProgress();
    const router = useRouter();

    const lesson = lessons.find((l) => l.id === id);

    const [cards] = useState(() =>
        lesson ? [...lesson.cards].sort(() => Math.random() - 0.5) : []
    );
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

    const currentCard = cards[currentIndex];
    const options = useMemo(() => {
        if (!currentCard) return [];
        const pool = lesson.cards
            .map((c) => c.meaning)
            .filter((m) => m !== currentCard.meaning);
        // eslint-disable-next-line react-hooks/purity
        const opts = [
            currentCard.meaning,
            ...pool.sort(() => Math.random() - 0.5).slice(0, 3),
        ];
        // eslint-disable-next-line react-hooks/purity
        return opts.sort(() => Math.random() - 0.5);
    }, [currentCard, lesson]);

    useEffect(() => {
        if (timeLeft > 0 && !gameOver) {
            const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
            return () => clearTimeout(t);
        } else if (timeLeft === 0) setGameOver(true);
    }, [timeLeft, gameOver]);

    const handleAnswer = (selected: string) => {
        if (status !== "idle") return;
        setSelectedOpt(selected);
        const correct = selected === currentCard.meaning;
        setStatus(correct ? "correct" : "wrong");
        if (correct) setScore((s) => s + 1);
        setTimeout(() => {
            setStatus("idle");
            setSelectedOpt(null);
            if (currentIndex < cards.length - 1) setCurrentIndex((i) => i + 1);
            else setGameOver(true);
        }, 800);
    };

    if (!lesson) return notFound();
    if (lesson.cards.length < 4) {
        return (
            <div className="p-6 text-center pt-24 font-bold">
                Need at least 4 cards to play Speed Quiz.
                <br />
                <br />
                <Button onClick={() => router.back()} className="mx-auto">
                    Go Back
                </Button>
            </div>
        );
    }

    if (gameOver) {
        const { innerWidth: width, innerHeight: height } = typeof window !== "undefined" ? window : { innerWidth: 500, innerHeight: 500 };
        return (
            <div className="fixed inset-0 bg-[#F7F7F8] z-50 flex flex-col items-center justify-center p-6 overflow-hidden">
                <Confetti width={width} height={height} recycle={false} numberOfPieces={300} gravity={0.2} colors={["#ff9600", "#1cb0f6", "#58cc02", "#ce82ff"]} />
                <motion.div 
                    initial={{ scale: 0, rotate: -20 }} 
                    animate={{ scale: 1, rotate: -6 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-24 h-24 bg-[#ff9600] text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border-b-8 border-[#cc7800]"
                >
                    <Zap size={56} className="animate-bounce" strokeWidth={3} />
                </motion.div>
                <h2 className="text-4xl font-black text-[#3c3c3c] mb-2">
                    Time&apos;s Up!
                </h2>
                <p className="text-xl font-bold text-[#afafaf] mb-12">
                    You scored{" "}
                    <span className="text-[#ff9600] text-3xl mx-2">
                        {score}
                    </span>{" "}
                    points.
                </p>
                <Button
                    variant="primary"
                    color="orange"
                    onClick={() => {
                        addXP(score * 10);
                        router.push(`/flashcard/${id}`);
                    }}
                    className="w-full max-w-xs text-xl py-5"
                >
                    Collect {score * 10} XP
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#F7F7F8] z-50 flex flex-col">
            <header className="flex justify-between items-center p-4">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    icon={X}
                    className="px-3 py-2"
                />
                <div
                    className={`flex items-center gap-2 font-black text-2xl ${timeLeft <= 5 ? "text-[#ea2b2b] animate-pulse" : "text-[#ff9600]"}`}
                >
                    <Clock size={24} strokeWidth={3} />
                    <span>00:{timeLeft.toString().padStart(2, "0")}</span>
                </div>
                <div className="w-12 font-black text-2xl text-right text-[#afafaf]">
                    {score}
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
                <div
                    className={`text-center mb-12 w-full ${status === "wrong" ? "animate-shake" : ""}`}
                >
                    {currentCard.furigana && (
                        <p className="text-[#afafaf] font-bold text-xl mb-2 tracking-widest">
                            {currentCard.furigana}
                        </p>
                    )}
                    <h1 className="text-[6rem] font-medium text-[#3c3c3c] leading-none drop-shadow-sm">
                        {currentCard.kanji}
                    </h1>
                </div>
                <div className="w-full grid gap-4">
                    {options.map((opt, i) => {
                        let state =
                            "bg-white text-[#3c3c3c] border-gray-200 hover:bg-gray-50 hover:-translate-y-1 hover:shadow-md hover:border-gray-300";
                        if (status !== "idle") {
                            if (opt === currentCard.meaning)
                                state =
                                    "bg-[#58cc02] text-white border-[#58a700] translate-y-[2px] border-b-2 z-10";
                            else if (opt === selectedOpt && status === "wrong")
                                state =
                                    "bg-[#ffdfe0] text-[#ea2b2b] border-[#ea2b2b] translate-y-[2px] border-b-2";
                            else
                                state =
                                    "bg-white border-gray-200 text-gray-300 opacity-50";
                        }
                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                disabled={status !== "idle"}
                                className={`min-h-[80px] border-2 border-b-4 py-4 rounded-2xl transition-all duration-150 select-none font-black text-xl shadow-sm ${state}`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
