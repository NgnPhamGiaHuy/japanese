"use client";

import { notFound, useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "react-confetti";

import { motion } from "framer-motion";
import { Clock, X, Zap } from "lucide-react";

import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { Leaderboard } from "@/features/game/components";
import { saveGameResult } from "@/features/game/services/game.service";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store/useAppStore";

import type { FlashCard } from "@/features/flashcard/types/flashcard.types";

function hashString(str: string): number {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed: number): () => number {
    return () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleWithRng<T>(items: T[], rand: () => number): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const GAME_MODE = "flashcard_speed";

export default function SpeedQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { lessons, loading } = useLessons();
    const { addXP } = useUserProgress();
    const { user } = useAppStore();
    const router = useRouter();
    const savedScoreRef = useRef(false);

    const lesson = lessons.find((l) => l.id === id);

    const cards = useMemo((): FlashCard[] => {
        if (!lesson) return [];
        const rng = mulberry32(hashString(`${lesson.id}:deck`));
        return shuffleWithRng([...lesson.cards], rng);
    }, [lesson]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

    const currentCard = cards[currentIndex];

    const options = useMemo(() => {
        if (!currentCard || !lesson) return [];
        const pool = lesson.cards.map((c) => c.meaning).filter((m) => m !== currentCard.meaning);
        const pickRng = mulberry32(
            hashString(`${lesson.id}:${currentCard.id}:${currentIndex}:pick`),
        );
        const shuffledPool = shuffleWithRng(pool, pickRng);
        const four = [currentCard.meaning, ...shuffledPool.slice(0, 3)];
        const orderRng = mulberry32(
            hashString(`${lesson.id}:${currentCard.id}:${currentIndex}:order`),
        );
        return shuffleWithRng(four, orderRng);
    }, [currentCard, lesson, currentIndex]);

    useEffect(() => {
        if (gameOver || timeLeft <= 0) return;
        const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, gameOver]);

    useEffect(() => {
        if (timeLeft !== 0 || gameOver) return;
        const raf = requestAnimationFrame(() => setGameOver(true));
        return () => cancelAnimationFrame(raf);
    }, [timeLeft, gameOver]);

    // Save score to leaderboard once when the game ends
    useEffect(() => {
        if (!gameOver || savedScoreRef.current || !user || score <= 0) return;
        savedScoreRef.current = true;
        saveGameResult({
            userId: user.uid,
            displayName: user.displayName ?? "Player",
            gameMode: GAME_MODE,
            score,
        }).catch((err) => console.error("[SpeedQuiz] Score save error:", err));
    }, [gameOver, user, score]);

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

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff9600]" />
            </div>
        );
    }
    if (!lesson) return notFound();
    if (lesson.cards.length < 4) {
        return (
            <div className="p-6 pt-24 text-center font-bold">
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
        const { innerWidth: width, innerHeight: height } =
            typeof window !== "undefined" ? window : { innerWidth: 500, innerHeight: 500 };
        return (
            <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]">
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={300}
                    gravity={0.2}
                    colors={["#ff9600", "#1cb0f6", "#58cc02", "#ce82ff"]}
                />
                <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-8">
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: -6 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border-b-8 border-[#cc7800] bg-[#ff9600] text-white shadow-sm"
                    >
                        <Zap size={48} className="animate-bounce" strokeWidth={3} />
                    </motion.div>
                    <h2 className="mb-1 text-4xl font-black text-[#3c3c3c]">Time&apos;s Up!</h2>
                    <p className="mb-1 text-xl font-bold text-[#afafaf]">
                        You scored{" "}
                        <span className="mx-1 text-3xl font-black text-[#ff9600]">{score}</span>{" "}
                        points.
                    </p>
                    <p className="mb-6 text-sm font-bold text-[#afafaf]">+{score * 10} XP earned</p>

                    <Button
                        variant="primary"
                        color="orange"
                        onClick={() => {
                            addXP(score * 10);
                            router.push(`/flashcard/${id}`);
                        }}
                        className="mb-8 w-full py-5 text-xl"
                    >
                        Collect {score * 10} XP
                    </Button>

                    <Leaderboard
                        gameMode={GAME_MODE}
                        currentUserId={user?.uid}
                        accentColor="#ff9600"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <header className="flex items-center justify-between p-4">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    icon={X}
                    className="px-3 py-2"
                />
                <div
                    className={`flex items-center gap-2 text-2xl font-black ${timeLeft <= 5 ? "animate-pulse text-[#ea2b2b]" : "text-[#ff9600]"}`}
                >
                    <Clock size={24} strokeWidth={3} />
                    <span>00:{timeLeft.toString().padStart(2, "0")}</span>
                </div>
                <div className="w-12 text-right text-2xl font-black text-[#afafaf]">{score}</div>
            </header>
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center p-6">
                <div
                    className={`mb-12 w-full text-center ${status === "wrong" ? "animate-shake" : ""}`}
                >
                    {currentCard.furigana && (
                        <p className="mb-2 text-xl font-bold tracking-widest text-[#afafaf]">
                            {currentCard.furigana}
                        </p>
                    )}
                    <h1 className="text-[6rem] leading-none font-medium text-[#3c3c3c] drop-shadow-sm">
                        {currentCard.kanji}
                    </h1>
                </div>
                <div className="grid w-full gap-4">
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
                            else state = "bg-white border-gray-200 text-gray-300 opacity-50";
                        }
                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                disabled={status !== "idle"}
                                className={`min-h-[80px] rounded-2xl border-2 border-b-4 py-4 text-xl font-black shadow-sm transition-all duration-150 select-none ${state}`}
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
