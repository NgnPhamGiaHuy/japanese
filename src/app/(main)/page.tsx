"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BookOpen, CheckCircle2, Clock, Flame, Plus, Sparkles, Trophy } from "lucide-react";

import ShareModal from "@/features/flashcard/components/ShareModal";
import DeckCard from "@/features/flashcard/dashboard/components/DeckCard";
import { useDashboardModals } from "@/features/flashcard/dashboard/hooks";
import { matchGameMode } from "@/features/flashcard/games/match/config";
import { speedGameMode } from "@/features/flashcard/games/speed/config";
import { useDeckProgressStatus, useLessons } from "@/features/flashcard/hooks";
import { recommendedAction } from "@/features/flashcard/utils/learningEngine";
import { subscribeGameStats } from "@/features/game/services";
import { HIRAGANA_DATA, KATAKANA_DATA } from "@/features/kana/data";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/lib/app-store";
import { ActionCard, Button, ConfirmModal, EmptyState, StatCard } from "@/shared/components/ui";
import { SECTION_HEADING, SPACING } from "@/shared/constants";

import type { GameStatEntry } from "@/features/game/services";

const TOTAL_KANA_CHARS = HIRAGANA_DATA.length + KATAKANA_DATA.length;

/** Visual + copy config for the "Continue Studying" tile per recommended action. */
const CONTINUE_TILE_CONFIG = {
    continue: {
        icon: Clock,
        bg: "bg-katakana",
        border: "border-katakana-strong",
        text: "text-katakana",
        label: "Reviews Due",
        cta: "Review Now",
    },
    learn: {
        icon: Sparkles,
        bg: "bg-hiragana",
        border: "border-hiragana-strong",
        text: "text-hiragana",
        label: "New Cards Ready",
        cta: "Start Learning",
    },
    idle: {
        icon: CheckCircle2,
        bg: "bg-hiragana",
        border: "border-hiragana-strong",
        text: "text-hiragana",
        label: "All Caught Up",
        cta: "Keep Practicing",
    },
} as const;

export default function HomePage() {
    const { userData, loading: progressLoading } = useUserProgress();
    const { user } = useAppStore();
    const { lessons, loading: lessonsLoading } = useLessons();

    const recentLessons = [...lessons].sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
    const topLesson = recentLessons[0];

    const deckStatus = useDeckProgressStatus(topLesson?.id ?? "", topLesson?.cardCount ?? 0);
    const action = recommendedAction(deckStatus);
    const tile = CONTINUE_TILE_CONFIG[action];
    const primaryCount =
        action === "continue"
            ? deckStatus.dueCount
            : action === "learn"
              ? deckStatus.newCount
              : deckStatus.totalCount;

    // Live Speed/Match best-score + tier badges for the deck cards below.
    const [gameStats, setGameStats] = useState<Record<string, GameStatEntry>>({});
    useEffect(() => {
        if (!user) return;
        return subscribeGameStats(user.uid, setGameStats);
    }, [user]);

    const {
        sharingLesson,
        setSharingLesson,
        deletingLesson,
        setDeletingLesson,
        isDeleting,
        handleDelete,
        shareLesson,
        updateLessonRoles,
    } = useDashboardModals();

    const learnedCount = (userData.learnedChars || []).filter(
        (c) => HIRAGANA_DATA.some((d) => d.char === c) || KATAKANA_DATA.some((d) => d.char === c),
    ).length;
    const kanaPct = Math.min(Math.round((learnedCount / TOTAL_KANA_CHARS) * 100), 100);

    return (
        <div className="bg-bg min-h-dvh">
            <div
                className={`${SPACING.pagePadding} mx-auto max-w-2xl ${SPACING.sectionGap} pt-6 pb-28`}
            >
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-text text-3xl font-black tracking-tight">
                            Konnichiwa!
                        </h1>
                        <p className="text-muted mt-1 font-bold">Ready to learn Japanese today?</p>
                    </div>
                    <div className="border-survival-strong bg-survival flex h-16 w-16 rotate-3 transform items-center justify-center rounded-2xl border-b-4 text-2xl font-black text-white shadow-sm">
                        {progressLoading ? "…" : userData.streak}
                        <Flame size={24} className="ml-1" fill="currentColor" />
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon={<Trophy className="text-survival h-8 w-8" />}
                        title="Total XP"
                        value={userData.xp}
                        loading={progressLoading}
                        index={0}
                    />
                    <StatCard
                        icon={<BookOpen className="text-katakana h-8 w-8" />}
                        title="Lessons Done"
                        value={userData.lessonsCompleted}
                        loading={progressLoading}
                        index={1}
                    />
                </div>

                {/* Continue Studying — deck-scoped, real data, single correctly-routed CTA */}
                {topLesson && (
                    <div
                        className={`flex flex-col justify-between rounded-4xl border-2 border-b-8 p-6 text-white shadow-sm ${tile.bg} ${tile.border}`}
                    >
                        <div>
                            <tile.icon size={32} className="mb-2 opacity-80" />
                            <div className="text-4xl font-black">{primaryCount}</div>
                            <h3 className="text-xs font-black tracking-widest text-white/90 uppercase">
                                {tile.label}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-sm font-bold text-white/80">
                                {topLesson.title}
                            </p>
                            {deckStatus.mistakeCount > 0 && (
                                <p className="mt-1 text-xs font-bold text-white/70">
                                    {deckStatus.mistakeCount} card
                                    {deckStatus.mistakeCount === 1 ? "" : "s"} need extra practice
                                </p>
                            )}
                        </div>
                        <Link
                            href={`/flashcard/${topLesson.id}/study`}
                            className="focus-visible:ring-katakana mt-4 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        >
                            <Button
                                variant="ghost"
                                className={`w-full bg-white ${tile.text} hover:bg-gray-100`}
                            >
                                {tile.cta}
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Kana Section — data-driven, mirrors KanaHub's own hero-tile pattern */}
                <div>
                    <h2 className={`${SECTION_HEADING} mb-4`}>Kana Practice</h2>
                    <ActionCard
                        href="/kana"
                        primary
                        icon={<span className="text-2xl font-black text-white">あ→ア</span>}
                        title="Master Hiragana & Katakana"
                        subtitle="Learn · Quiz · Writing · Chart · Survival"
                        progress={{
                            value: kanaPct,
                            label: progressLoading
                                ? "Loading progress…"
                                : `${learnedCount}/${TOTAL_KANA_CHARS} characters mastered`,
                        }}
                        primaryBg="bg-gradient-to-br from-hiragana to-katakana"
                        primaryBorderB="border-hiragana-hover"
                        primaryHover=""
                    />
                </div>

                {/* Flashcard Section */}
                <div>
                    <div className="mb-4 flex items-end justify-between">
                        <h2 className={SECTION_HEADING}>Jump Back In</h2>
                        <Link
                            href="/flashcard"
                            className="text-katakana hover:text-katakana-hover focus-visible:ring-katakana rounded-md text-sm font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        >
                            See all →
                        </Link>
                    </div>

                    {!lessonsLoading && recentLessons.length === 0 ? (
                        <EmptyState
                            icon={Plus}
                            title="Create your first deck"
                            description="Add cards manually, paste a list, or let AI generate a deck for you."
                            action={
                                <Link href="/flashcard/create">
                                    <Button variant="primary" color="purple">
                                        Create a Deck
                                    </Button>
                                </Link>
                            }
                        />
                    ) : (
                        <div className={`flex flex-col ${SPACING.cardGap}`}>
                            {recentLessons.map((lesson) => (
                                <DeckCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    isShared={false}
                                    matchStats={gameStats[matchGameMode(lesson.id)]}
                                    speedStats={gameStats[speedGameMode(lesson.id)]}
                                    onDelete={() => setDeletingLesson(lesson)}
                                    onShare={() => setSharingLesson(lesson)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {sharingLesson &&
                (() => {
                    const liveLesson =
                        lessons.find((l) => l.id === sharingLesson.id) ?? sharingLesson;
                    return (
                        <ShareModal
                            lesson={liveLesson}
                            onShareLink={async (allowLinkAccess, publicRole, isPublic) => {
                                await shareLesson(
                                    liveLesson.id,
                                    allowLinkAccess,
                                    publicRole,
                                    isPublic,
                                );
                            }}
                            onUpdateRoles={async (roles, collabs) => {
                                await updateLessonRoles(liveLesson.id, roles, collabs);
                            }}
                            onClose={() => setSharingLesson(null)}
                        />
                    );
                })()}

            <ConfirmModal
                isOpen={!!deletingLesson}
                onClose={() => setDeletingLesson(null)}
                onConfirm={handleDelete}
                title="Delete Deck?"
                message={`Are you sure you want to permanently delete "${deletingLesson?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
