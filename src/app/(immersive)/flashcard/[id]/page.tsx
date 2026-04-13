"use client";

import { notFound, useRouter, useSearchParams } from "next/navigation";
import { use, useState } from "react";

import { BookOpen, RefreshCw, Zap } from "lucide-react";

import { FlashcardPlayer } from "@/features/flashcard/components";
import { useCards } from "@/features/flashcard/hooks/useCards";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { Button } from "@/shared/components/ui";

import type { StudyMode } from "@/features/flashcard/types/flashcard.types";

export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { lessons, loading: lessonsLoading } = useLessons();
    const { cards, loading: cardsLoading } = useCards(id);
    const { addXP, completedLesson } = useUserProgress();
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialMode = searchParams.get("mode") as StudyMode | null;
    const [mode, setMode] = useState<StudyMode | null>(initialMode);

    if (lessonsLoading || cardsLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return notFound();

    if (!mode) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <h1 className="mb-2 text-3xl font-black text-[#3c3c3c]">{lesson.title}</h1>
                <p className="mb-10 text-sm font-bold text-[#afafaf]">{cards.length} cards total</p>

                <div className="flex w-full max-w-sm flex-col gap-4">
                    <Button
                        variant="primary"
                        color="blue"
                        onClick={() => setMode("learn")}
                        className="flex w-full items-center justify-center gap-2 py-4 text-xl"
                    >
                        <BookOpen size={24} /> Learn New
                    </Button>
                    <Button
                        variant="primary"
                        color="orange"
                        onClick={() => setMode("review")}
                        className="flex w-full items-center justify-center gap-2 py-4 text-xl"
                    >
                        <RefreshCw size={24} /> Review Due
                    </Button>
                    <Button
                        variant="secondary"
                        color="purple"
                        onClick={() => setMode("test")}
                        className="flex w-full items-center justify-center gap-2 py-4 text-xl"
                    >
                        <Zap size={24} /> Test Mode
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/flashcard")}
                        className="mt-4"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <FlashcardPlayer
            lesson={lesson}
            cards={cards}
            mode={mode}
            onClose={() => router.push("/flashcard")}
            onComplete={(stats) => {
                const xpEarned = mode === "test" ? stats.correct * 5 : stats.correct * 2;
                addXP(xpEarned);
                completedLesson();
                router.push("/flashcard");
            }}
        />
    );
}
