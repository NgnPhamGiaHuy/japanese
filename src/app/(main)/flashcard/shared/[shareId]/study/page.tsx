"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { BookOpen } from "lucide-react";

import { getSharedLesson, saveSharedStudyProgress } from "@/features/flashcard/services";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store";

import type { SharedLessonResult } from "@/features/flashcard/services";
import type { FlashCard } from "@/features/flashcard/types";

export default function SharedStudyPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();

    const [result, setResult] = useState<SharedLessonResult | null>(null);
    const [status, setStatus] = useState<"loading" | "not_found" | "ready">("loading");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        getSharedLesson(shareId, user?.uid)
            .then((res) => {
                if (!res) setStatus("not_found");
                else {
                    setResult(res);
                    setStatus("ready");
                }
            })
            .catch(() => setStatus("not_found"));
    }, [shareId]);

    if (status === "loading") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    if (status !== "ready" || !result) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <h1 className="mb-4 text-2xl font-black text-[#3c3c3c]">Deck Not Found</h1>
                <Button onClick={() => router.back()} variant="secondary">
                    Go Back
                </Button>
            </div>
        );
    }

    const { lesson, cards, meta } = result;
    const themeHex = lesson.themeColor || "#1cb0f6";
    const card: FlashCard | undefined = cards[currentIndex];

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex((i) => i + 1);
            setRevealed(false);
        } else {
            // Save lightweight progress (no SRS data touched)
            if (user) {
                void saveSharedStudyProgress(
                    user.uid,
                    shareId,
                    meta.sourceUserId,
                    meta.sourceLessonId,
                    cards.length,
                );
            }
            setDone(true);
        }
    };

    if (done) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div
                    className="mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 text-white shadow-sm"
                    style={{ backgroundColor: themeHex, borderColor: `${themeHex}AA` }}
                >
                    <BookOpen size={48} strokeWidth={3} />
                </div>
                <h2 className="mb-2 text-3xl font-black text-[#3c3c3c]">Preview Complete!</h2>
                <p className="mb-8 font-bold text-[#afafaf]">
                    You browsed all {cards.length} cards.{" "}
                    {user
                        ? "Your view was saved to your account."
                        : "Log in to save your progress."}
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setCurrentIndex(0);
                            setRevealed(false);
                            setDone(false);
                        }}
                    >
                        Restart
                    </Button>
                    <Button
                        variant="primary"
                        color="blue"
                        onClick={() => router.push(`/flashcard/shared/${shareId}`)}
                    >
                        Back to Deck
                    </Button>
                </div>
            </div>
        );
    }

    if (!card) return null;

    const progress = ((currentIndex + 1) / cards.length) * 100;

    return (
        <div className="fixed inset-0 flex flex-col bg-[#F7F7F8]">
            {/* Header */}
            <header className="flex items-center justify-between p-4">
                <button
                    onClick={() => router.back()}
                    className="rounded-xl p-2 font-bold text-[#afafaf] hover:bg-gray-200"
                >
                    ✕
                </button>
                <div className="flex flex-col items-center">
                    <div className="text-xs font-black tracking-widest text-[#afafaf] uppercase">
                        Preview (Read-only)
                    </div>
                    <div className="text-sm font-black text-[#3c3c3c]">
                        {currentIndex + 1} / {cards.length}
                    </div>
                </div>
                <div className="w-8" />
            </header>

            {/* Progress bar */}
            <div className="mx-4 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: themeHex }}
                />
            </div>

            {/* Shared mode notice */}
            <div className="mx-4 mt-3 rounded-xl bg-[#fff8e8] px-4 py-2 text-center">
                <p className="text-xs font-bold text-[#ff9600]">
                    👁 Shared deck — study progress stays private to you
                </p>
            </div>

            {/* Card */}
            <div className="flex flex-1 flex-col items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Front face */}
                    <div
                        className="mb-6 rounded-[2rem] border-2 border-b-8 bg-white p-8 text-center shadow-sm"
                        style={{ borderColor: `${themeHex}60` }}
                    >
                        <div className="mb-1 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Japanese
                        </div>
                        <div className="text-5xl font-medium break-words text-[#3c3c3c]">
                            {card.kanji}
                        </div>
                        {card.furigana && (
                            <div className="mt-2 text-sm font-bold text-[#afafaf]">
                                {card.furigana}
                            </div>
                        )}
                    </div>

                    {/* Reveal / back face */}
                    {!revealed ? (
                        <button
                            onClick={() => setRevealed(true)}
                            className="w-full rounded-2xl border-2 border-b-4 py-4 text-center font-black text-white transition-all active:translate-y-[2px] active:border-b-2"
                            style={{ backgroundColor: themeHex, borderColor: `${themeHex}BB` }}
                        >
                            Reveal Meaning
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div
                                className="rounded-[2rem] border-2 border-b-4 bg-white p-6 text-center shadow-sm"
                                style={{ borderColor: `${themeHex}40` }}
                            >
                                <div className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                    Meaning
                                </div>
                                <div
                                    className="mt-2 text-2xl font-black"
                                    style={{ color: themeHex }}
                                >
                                    {card.meaning}
                                </div>
                                {card.example && (
                                    <p className="mt-3 text-sm font-bold text-[#afafaf]">
                                        {card.example}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleNext}
                                className="w-full rounded-2xl border-2 border-b-4 border-[#58a700] bg-[#58cc02] py-4 text-center font-black text-white transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-[2px] active:border-b-2"
                            >
                                {currentIndex < cards.length - 1 ? "Next →" : "Finish Preview"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
