"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { FlashcardPlayer } from "@/features/flashcard/components";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { useRouter } from "next/navigation";

export default function FlashcardStudyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { lessons, recordCardResult } = useLessons();
    const { addXP, completedLesson } = useUserProgress();
    const router = useRouter();

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
