"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Trophy, X } from "lucide-react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";

import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { Button } from "@/shared/components/ui";

interface MatchItem {
    id: string;
    text: string;
    matchId: string;
    type: "kanji" | "meaning";
}

export default function MatchModePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { lessons } = useLessons();
    const { addXP } = useUserProgress();
    const router = useRouter();

    const lesson = lessons.find((l) => l.id === id);

    const [items, setItems] = useState<MatchItem[]>([]);
    const [selected, setSelected] = useState<MatchItem[]>([]);
    const [matched, setMatched] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [errorIds, setErrorIds] = useState<string[]>([]);

    useEffect(() => {
        if (lesson?.cards) {
            const pool = [...lesson.cards]
                .sort(() => Math.random() - 0.5)
                .slice(0, 6);
            const gameItems: MatchItem[] = [];
            pool.forEach((c) => {
                gameItems.push({
                    id: `${c.id}-k`,
                    text: c.kanji,
                    matchId: c.id,
                    type: "kanji",
                });
                gameItems.push({
                    id: `${c.id}-m`,
                    text: c.meaning,
                    matchId: c.id,
                    type: "meaning",
                });
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setItems(gameItems.sort(() => Math.random() - 0.5));
        }
    }, [lesson]);

    const handleSelect = (item: MatchItem) => {
        if (matched.includes(item.id) || errorIds.length > 0) return;
        if (selected.length === 0) {
            setSelected([item]);
            return;
        }
        if (selected.length === 1) {
            const first = selected[0];
            if (first.id === item.id) {
                setSelected([]);
                return;
            }
            setSelected([first, item]);
            if (first.matchId === item.matchId && first.type !== item.type) {
                setTimeout(() => {
                    setMatched((p) => [...p, first.id, item.id]);
                    setSelected([]);
                    setScore((s) => s + 1);
                }, 300);
            } else {
                setErrorIds([first.id, item.id]);
                setTimeout(() => {
                    setSelected([]);
                    setErrorIds([]);
                }, 600);
            }
        }
    };

    if (!lesson) return notFound();
    if (items.length === 0) return null;
    const isComplete = matched.length === items.length && items.length > 0;

    if (isComplete) {
        const { innerWidth: width, innerHeight: height } =
            typeof window !== "undefined"
                ? window
                : { innerWidth: 500, innerHeight: 500 };
        return (
            <div className="fixed inset-0 bg-[#F7F7F8] z-50 flex flex-col items-center justify-center p-6 overflow-hidden">
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={300}
                    gravity={0.2}
                    colors={["#ce82ff", "#1cb0f6", "#58cc02", "#ff9600"]}
                />
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-24 h-24 bg-[#ce82ff] text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border-b-8 border-[#b65ce8]"
                >
                    <Trophy size={56} strokeWidth={3} />
                </motion.div>
                <h2 className="text-4xl font-black text-[#3c3c3c] mb-2">
                    Perfect Match!
                </h2>
                <Button
                    variant="primary"
                    color="purple"
                    onClick={() => {
                        addXP(score * 15);
                        router.push(`/flashcard/${id}`);
                    }}
                    className="mt-12 w-full max-w-xs text-xl py-5"
                >
                    Collect {score * 15} XP
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
                <h2 className="font-black text-2xl text-[#ce82ff] uppercase tracking-widest">
                    Match
                </h2>
                <div className="w-12" />
            </header>
            <div className="flex-1 p-4 md:p-6 w-full max-w-md mx-auto flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {items.map((item) => {
                        const isSelected = selected.some(
                            (s) => s.id === item.id
                        );
                        const isMatched = matched.includes(item.id);
                        const isError = errorIds.includes(item.id);
                        let btnClass =
                            "bg-white border-gray-200 text-[#3c3c3c] shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-2";
                        if (isMatched)
                            btnClass =
                                "bg-[#f2fbf0] border-[#58cc02] text-[#58cc02] opacity-50 scale-95 pointer-events-none translate-y-[2px] border-b-2";
                        else if (isError)
                            btnClass =
                                "bg-[#ffdfe0] border-[#ea2b2b] text-[#ea2b2b] animate-shake translate-y-[2px] border-b-2";
                        else if (isSelected)
                            btnClass =
                                "bg-[#e5f5ff] border-[#1cb0f6] text-[#1cb0f6] translate-y-[2px] border-b-2";
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                disabled={
                                    isMatched ||
                                    (selected.length === 2 && !isError)
                                }
                                className={`p-4 md:p-6 rounded-2xl border-2 border-b-4 text-xl md:text-2xl font-black transition-all duration-200 flex items-center justify-center min-h-[100px] select-none ${btnClass}`}
                            >
                                {item.text}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
