"use client";

import Link from "next/link";
import { useState } from "react";
import { Gamepad2, Play, Plus, Trash2, Zap } from "lucide-react";

import { LessonBuilder } from "@/features/flashcard/components";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { CARD_BASE, SPACING } from "@/shared/constants";

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
                        className="-mr-2 !p-2 shadow-none"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </Button>
                }
            />

            <div className={`${SPACING.pagePadding} mx-auto max-w-2xl pt-6`}>
                {lessons.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm">
                            <Play size={48} strokeWidth={3} />
                        </div>
                        <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">No decks yet</h2>
                        <p className="mb-8 font-bold text-[#afafaf]">
                            Create your first vocabulary deck!
                        </p>
                        <Button
                            variant="primary"
                            color="purple"
                            onClick={() => setShowBuilder(true)}
                            icon={Plus}
                            className="mx-auto px-8 py-5 text-xl"
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
                                    if (confirm("Delete this deck?")) deleteLesson(lesson.id);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DeckCard({ lesson, onDelete }: { lesson: Lesson; onDelete: () => void }) {
    return (
        <div
            className={`${CARD_BASE} transition-all hover:-translate-y-0.5 hover:shadow-md ${SPACING.cardPadding}`}
        >
            <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 pr-4">
                    <h3 className="text-xl font-black text-[#3c3c3c]">{lesson.title}</h3>
                    {lesson.description && (
                        <p className="mt-1 line-clamp-2 text-sm font-bold text-[#afafaf]">
                            {lesson.description}
                        </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                        {lesson.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-lg bg-[#faeaff] px-2 py-1 text-[10px] font-black tracking-wider text-[#ce82ff] uppercase"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-center">
                    <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faeaff]">
                        <span className="text-2xl font-black text-[#ce82ff]">
                            {lesson.cards.length}
                        </span>
                    </div>
                    <span className="text-[9px] font-black text-[#afafaf] uppercase">cards</span>
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
                    className="rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#ffdfe0] hover:text-[#ea2b2b]"
                >
                    <Trash2 size={20} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
