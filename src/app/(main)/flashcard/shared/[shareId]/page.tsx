"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { CopyPlus, Loader2 } from "lucide-react";

import { useLessons } from "@/features/flashcard/hooks";
import { getSharedLesson } from "@/features/flashcard/services";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store";

import type { FlashCard, Lesson } from "@/features/flashcard/types/flashcard.types";

export default function SharedLessonPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();
    const { saveFullLesson } = useLessons();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getSharedLesson(shareId)
            .then((res) => {
                if (res) {
                    setLesson(res.lesson);
                    setCards(res.cards);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [shareId]);

    const handleSaveToMyDecks = async () => {
        if (!user || !lesson) return;
        setSaving(true);
        try {
            // Strip out IDs and SRS logic to give the user a clean slate
            const cleanLesson: Lesson = {
                ...lesson,
                id: "",
                userId: user.uid,
                shareId: undefined,
                isPublic: false,
                createdAt: Date.now(),
            };
            const cleanCards: FlashCard[] = cards.map((c) => ({
                ...c,
                id: `c_${crypto.randomUUID()}`,
                lessonId: "",
                easeFactor: 2.5,
                interval: 0,
                repetitions: 0,
                nextReviewAt: 0,
            }));

            await saveFullLesson(cleanLesson, cleanCards, true);
            alert("Deck successfully copied to your collection!");
            router.push("/flashcard");
        } catch (err) {
            console.error("Failed to copy deck", err);
            alert("Failed to copy deck. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="p-6 pt-24 text-center font-bold text-[#afafaf]">
                <h1 className="mb-4 text-2xl font-black text-[#3c3c3c]">Deck Not Found</h1>
                <p className="mb-8">This deck may be private or the link is invalid.</p>
                <Button onClick={() => router.push("/flashcard")} variant="secondary">
                    Go Back Home
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-8 p-6 pb-24">
            <header className="rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-xl bg-[#e5f5ff] px-3 py-1 text-xs font-black tracking-widest text-[#1cb0f6] uppercase">
                        Shared Deck
                    </span>
                    <span className="font-bold text-[#afafaf]">{cards.length} Cards</span>
                </div>
                <h1 className="text-3xl font-black text-[#3c3c3c]">{lesson.title}</h1>
                {lesson.description && (
                    <p className="mt-2 text-lg font-bold text-[#afafaf]">{lesson.description}</p>
                )}
                {lesson.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {lesson.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-lg bg-[#faeaff] px-2 py-1 text-[10px] font-black tracking-wider text-[#ce82ff] uppercase"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            <div className="flex gap-4">
                {user && (
                    <Button
                        variant="primary"
                        color="blue"
                        icon={CopyPlus}
                        onClick={handleSaveToMyDecks}
                        disabled={saving}
                        className="flex-1 py-4 text-lg"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : "Save to My Decks"}
                    </Button>
                )}
            </div>

            <div>
                <h2 className="mb-4 text-xl font-black text-[#3c3c3c]">Card Preview</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {cards.map((card, idx) => (
                        <div
                            key={card.id || idx}
                            className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm"
                        >
                            <div className="mb-2 text-2xl font-medium text-[#3c3c3c]">
                                {card.kanji}
                            </div>
                            {card.furigana && (
                                <div className="text-sm font-bold text-[#afafaf]">
                                    {card.furigana}
                                </div>
                            )}
                            <div className="mt-2 text-lg font-black text-[#1cb0f6]">
                                {card.meaning}
                            </div>
                            {card.imageUrl && (
                                <div className="mt-4 h-24 overflow-hidden rounded-xl bg-gray-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={card.imageUrl}
                                        alt="Card preview"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
