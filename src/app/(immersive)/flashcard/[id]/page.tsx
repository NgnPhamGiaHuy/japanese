"use client";

import { notFound, useRouter } from "next/navigation";
import { use } from "react";

import { FlashcardPlayer } from "@/features/flashcard/components";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";

export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { lessons, loading, recordCardResult } = useLessons();
    const { addXP, completedLesson } = useUserProgress();
    const router = useRouter();

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return notFound();

    return (
        <FlashcardPlayer
            lesson={lesson}
            onClose={() => router.push("/flashcard")}
            onComplete={() => {
                addXP(50);
                completedLesson();
                router.push("/flashcard");
            }}
            onCardResult={recordCardResult}
        />
    );
}
