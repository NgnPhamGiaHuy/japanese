"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BookOpen, Edit2, Gamepad2, Plus, RefreshCw, Share2, Trash2, Zap } from "lucide-react";

import { Lesson, LessonBuilder, ShareModal, useLessons } from "@/features/flashcard";
import {
    GameStatEntry,
    matchGameMode,
    scoreToTier,
    speedGameMode,
    subscribeGameStats,
    TIER_INFO,
} from "@/features/game";
import { ScreenHeader } from "@/shared/components/layout";
import { Button } from "@/shared/components/ui";
import { CARD_BASE, SPACING } from "@/shared/constants";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";

export default function FlashcardIndexPage() {
    const {
        lessons,
        loading,
        error,
        saveFullLesson,
        deleteLesson,
        shareLesson,
        updateLessonRoles,
    } = useLessons();
    const { user } = useAppStore();

    // Real-time game stats for all modes (used to show tier badges on deck cards)
    const [gameStats, setGameStats] = useState<Record<string, GameStatEntry>>({});
    useEffect(() => {
        if (!user) return;
        return subscribeGameStats(user.uid, setGameStats);
    }, [user]);

    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [sharingLesson, setSharingLesson] = useState<Lesson | null>(null);
    const [showBuilder, setShowBuilder] = useState(false);

    const closeBuilder = () => {
        setShowBuilder(false);
        setEditingLesson(null);
    };

    if (showBuilder || editingLesson) {
        return (
            <LessonBuilder
                editingLesson={editingLesson}
                onSave={async (lesson, cards, isNew) => {
                    await saveFullLesson(lesson, cards, isNew);
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
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                                    <div className="flex flex-1 gap-2">
                                        <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                                        <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                                        <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                                    </div>
                                    <div className="flex justify-around gap-2 border-t-2 border-gray-50 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                                        <div className="h-10 w-10 flex-1 rounded-xl bg-gray-100 sm:flex-none" />
                                        <div className="h-10 w-10 flex-1 rounded-xl bg-gray-100 sm:flex-none" />
                                        <div className="h-10 w-10 flex-1 rounded-xl bg-gray-100 sm:flex-none" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && lessons.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm">
                            <BookOpen size={48} strokeWidth={3} />
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
                                matchStats={gameStats[matchGameMode(lesson.id)]}
                                speedStats={gameStats[speedGameMode(lesson.id)]}
                                onEdit={() => setEditingLesson(lesson)}
                                onDelete={async () => {
                                    if (confirm("Delete this deck?")) await deleteLesson(lesson.id);
                                }}
                                onShare={() => setSharingLesson(lesson)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {sharingLesson &&
                (() => {
                    const liveLesson =
                        lessons.find((l) => l.id === sharingLesson.id) ?? sharingLesson;
                    return (
                        <ShareModal
                            lesson={liveLesson}
                            onShareLink={async (allowLinkAccess, publicRole) => {
                                await shareLesson(liveLesson.id, allowLinkAccess, publicRole);
                            }}
                            onUpdateRoles={async (roles, collabs) => {
                                await updateLessonRoles(liveLesson.id, roles, collabs);
                            }}
                            onClose={() => setSharingLesson(null)}
                        />
                    );
                })()}
        </div>
    );
}

function TierBadge({ score, className = "" }: { score: number; className?: string }) {
    const tier = scoreToTier(score);
    const info = TIER_INFO[tier];
    return (
        <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black shadow-sm ${className}`}
            style={{
                backgroundColor: info.bg,
                color: info.color,
                border: `1px solid ${info.border}`,
            }}
        >
            {info.emoji}
        </span>
    );
}

function DeckCard({
    lesson,
    matchStats,
    speedStats,
    onEdit,
    onDelete,
    onShare,
}: {
    lesson: Lesson;
    matchStats?: GameStatEntry;
    speedStats?: GameStatEntry;
    onEdit: () => void;
    onDelete: () => void;
    onShare: () => void;
}) {
    const themeColor = lesson.themeColor || "#1cb0f6";

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
                                    style={{
                                        color: themeColor,
                                        backgroundColor: `${themeColor}20`,
                                    }}
                                    className="rounded-lg px-2 py-1 text-[10px] font-black tracking-wider uppercase"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 flex-col items-center">
                    <div
                        className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${themeColor}20` }}
                    >
                        <span className="text-2xl font-black" style={{ color: themeColor }}>
                            {lesson.cardCount}
                        </span>
                    </div>
                    <span className="text-[9px] font-black text-[#afafaf] uppercase">cards</span>
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-3 sm:mt-0 sm:flex-row sm:gap-2">
                <div className="flex flex-1 gap-2">
                    <Link href={`/flashcard/${lesson.id}`} className="flex-1">
                        <Button
                            variant="primary"
                            color={hexToThemeColor(themeColor)}
                            icon={BookOpen}
                            className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                        >
                            <span className="truncate">Study</span>
                        </Button>
                    </Link>

                    {/* Speed button with tier badge */}
                    <div className="relative flex-1">
                        {speedStats && (
                            <TierBadge
                                score={speedStats.bestScore}
                                className="absolute -top-2 left-1/2 z-10 -translate-x-1/2"
                            />
                        )}
                        <Link href={`/flashcard/${lesson.id}/speed`} className="block">
                            <Button
                                variant="secondary"
                                color="orange"
                                icon={Zap}
                                className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                            >
                                <span className="truncate">Speed</span>
                            </Button>
                        </Link>
                    </div>

                    {/* Match button with tier badge */}
                    <div className="relative flex-1">
                        {matchStats && (
                            <TierBadge
                                score={matchStats.bestScore}
                                className="absolute -top-2 left-1/2 z-10 -translate-x-1/2"
                            />
                        )}
                        <Link href={`/flashcard/${lesson.id}/match`} className="block">
                            <Button
                                variant="secondary"
                                color="purple"
                                icon={Gamepad2}
                                className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                            >
                                <span className="truncate">Match</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex justify-around gap-2 border-t-2 border-gray-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                    <button
                        onClick={onShare}
                        className="flex flex-1 items-center justify-center rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#ebf8e6] hover:text-[#58cc02] sm:flex-none"
                        title="Share deck"
                    >
                        <Share2 size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex flex-1 items-center justify-center rounded-xl p-3 text-gray-300 transition-colors sm:flex-none"
                        style={{
                            backgroundColor: "transparent",
                            color: undefined,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${themeColor}20`;
                            e.currentTarget.style.color = themeColor;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "";
                        }}
                        title="Edit deck"
                    >
                        <Edit2 size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex flex-1 items-center justify-center rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#ffdfe0] hover:text-[#ea2b2b] sm:flex-none"
                        title="Delete deck"
                    >
                        <Trash2 size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}
