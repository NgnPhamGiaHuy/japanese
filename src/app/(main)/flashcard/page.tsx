"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit2, Gamepad2, Play, Plus, RefreshCw, Trash2, Zap } from "lucide-react";

import { LessonBuilder } from "@/features/flashcard/components";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { CARD_BASE, SPACING } from "@/shared/constants";

import type { Lesson } from "@/features/flashcard/types/flashcard.types";

export default function FlashcardIndexPage() {
    const { lessons, loading, error, createLesson, updateLesson, deleteLesson } = useLessons();

    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [showBuilder, setShowBuilder] = useState(false);

    const closeBuilder = () => {
        setShowBuilder(false);
        setEditingLesson(null);
    };

    if (showBuilder || editingLesson) {
        return (
            <LessonBuilder
                editingLesson={editingLesson}
                onSave={async (l) => {
                    if (editingLesson) {
                        await updateLesson(l);
                    } else {
                        await createLesson(l);
                    }
                    closeBuilder();
                }}
                onDelete={async (id) => {
                    await deleteLesson(id);
                    closeBuilder();
                }}
                onClose={closeBuilder}
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
                {/* ── Error state ── */}
                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-2xl border-2 border-[#ea2b2b]/30 bg-[#ffdfe0] px-5 py-4">
                        <p className="text-sm font-bold text-[#ea2b2b]">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="ml-4 flex items-center gap-1 text-xs font-black text-[#ea2b2b] hover:underline"
                        >
                            <RefreshCw size={14} strokeWidth={3} /> Retry
                        </button>
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="animate-pulse rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white p-6 shadow-sm"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex-1 space-y-2 pr-4">
                                        <div className="h-5 w-48 rounded-lg bg-gray-200" />
                                        <div className="h-3 w-64 rounded-lg bg-gray-100" />
                                        <div className="flex gap-2 pt-1">
                                            <div className="h-5 w-12 rounded-lg bg-gray-100" />
                                            <div className="h-5 w-16 rounded-lg bg-gray-100" />
                                        </div>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                                    <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                                    <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                                    <div className="h-10 w-10 rounded-xl bg-gray-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && lessons.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm">
                            <Play size={48} strokeWidth={3} />
                        </div>
                        <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">No decks yet</h2>
                        <p className="mb-8 font-bold text-[#afafaf]">
                            Create your first vocabulary deck to get started!
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
                )}

                {/* ── Lesson list ── */}
                {!loading && !error && lessons.length > 0 && (
                    <div className="space-y-4">
                        {lessons.map((lesson) => (
                            <DeckCard
                                key={lesson.id}
                                lesson={lesson}
                                onEdit={() => setEditingLesson(lesson)}
                                onDelete={async () => {
                                    if (confirm("Delete this deck?")) await deleteLesson(lesson.id);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DeckCard({
    lesson,
    onEdit,
    onDelete,
}: {
    lesson: Lesson;
    onEdit: () => void;
    onDelete: () => void;
}) {
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
                    {lesson.tags.length > 0 && (
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
                    )}
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
                    onClick={onEdit}
                    className="rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#e5f5ff] hover:text-[#1cb0f6]"
                    title="Edit deck"
                >
                    <Edit2 size={20} strokeWidth={2.5} />
                </button>
                <button
                    onClick={onDelete}
                    className="rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#ffdfe0] hover:text-[#ea2b2b]"
                    title="Delete deck"
                >
                    <Trash2 size={20} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
