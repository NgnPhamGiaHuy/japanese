"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2, Gamepad2, Play, Zap } from "lucide-react";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { LessonBuilder } from "@/features/flashcard/components";
import { Button } from "@/shared/components/ui";
import { BottomNav, ScreenHeader } from "@/shared/components/layout";
import { SPACING, CARD_BASE } from "@/shared/constants";
import type { Lesson } from "@/features/flashcard/types/flashcard.types";

export default function FlashcardIndexPage() {
    const { lessons, createLesson, deleteLesson } = useLessons();
    const [showBuilder, setShowBuilder] = useState(false);

    if (showBuilder) {
        return (
            <LessonBuilder
                lessons={lessons}
                onSave={(l) => {
                    createLesson(l);
                    setShowBuilder(false);
                }}
                onClose={() => setShowBuilder(false)}
            />
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="My Decks"
                backHref="/"
                right={
                    <Button
                        variant="primary"
                        color="purple"
                        onClick={() => setShowBuilder(true)}
                        className="!p-2 -mr-2 shadow-none"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </Button>
                }
            />

            <div className={`${SPACING.pagePadding} max-w-2xl mx-auto pt-6`}>
                {lessons.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-[#ce82ff] text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border-b-8 border-[#b65ce8] mx-auto -rotate-6">
                            <Play size={48} strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-black text-[#3c3c3c] mb-2">
                            No decks yet
                        </h2>
                        <p className="text-[#afafaf] font-bold mb-8">
                            Create your first vocabulary deck!
                        </p>
                        <Button
                            variant="primary"
                            color="purple"
                            onClick={() => setShowBuilder(true)}
                            icon={Plus}
                            className="mx-auto text-xl py-5 px-8"
                        >
                            Create Deck
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {lessons.map((lesson) => (
                            <DeckCard
                                key={lesson.id}
                                lesson={lesson}
                                onDelete={() => {
                                    if (confirm("Delete this deck?"))
                                        deleteLesson(lesson.id);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
    );
}

function DeckCard({
    lesson,
    onDelete,
}: {
    lesson: Lesson;
    onDelete: () => void;
}) {
    return (
        <div
            className={`${CARD_BASE} hover:-translate-y-0.5 hover:shadow-md transition-all ${SPACING.cardPadding}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                    <h3 className="font-black text-xl text-[#3c3c3c]">
                        {lesson.title}
                    </h3>
                    {lesson.description && (
                        <p className="text-sm text-[#afafaf] font-bold mt-1 line-clamp-2">
                            {lesson.description}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {lesson.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] font-black text-[#ce82ff] bg-[#faeaff] px-2 py-1 rounded-lg uppercase tracking-wider"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-center shrink-0">
                    <div className="w-14 h-14 bg-[#faeaff] rounded-2xl flex items-center justify-center mb-1">
                        <span className="text-2xl font-black text-[#ce82ff]">
                            {lesson.cards.length}
                        </span>
                    </div>
                    <span className="text-[9px] font-black text-[#afafaf] uppercase">
                        cards
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                <Link href={`/flashcard/${lesson.id}`} className="flex-1">
                    <Button
                        variant="primary"
                        color="blue"
                        icon={Play}
                        className="w-full py-3 text-sm"
                    >
                        Study
                    </Button>
                </Link>
                <Link href={`/flashcard/${lesson.id}/speed`} className="flex-1">
                    <Button
                        variant="secondary"
                        color="orange"
                        icon={Zap}
                        className="w-full py-3 text-sm"
                    >
                        Speed
                    </Button>
                </Link>
                <Link href={`/flashcard/${lesson.id}/match`} className="flex-1">
                    <Button
                        variant="secondary"
                        color="purple"
                        icon={Gamepad2}
                        className="w-full py-3 text-sm"
                    >
                        Match
                    </Button>
                </Link>
                <button
                    onClick={onDelete}
                    className="p-3 text-gray-300 hover:text-[#ea2b2b] transition-colors rounded-xl hover:bg-[#ffdfe0]"
                >
                    <Trash2 size={20} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
