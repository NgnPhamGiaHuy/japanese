"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BookOpen, Edit2, Gamepad2, Plus, RefreshCw, Share2, Trash2, Zap } from "lucide-react";

import { buildShareId, Lesson, ShareModal, useLessons } from "@/features/flashcard";
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
import { useAlert } from "@/shared/providers";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";

/**
 * Flashcard Dashboard
 *
 * @remarks
 * Central hub for the user's personal and shared study materials. Orchestrates:
 * 1. Synchronized Deck Lifecycle: Fetching and managing personal vs. shared views.
 * 2. Gamification Sync: Real-time subscription to high-scores and tier badges.
 * 3. Collaboration Flow: Management of share-link generation and modal states.
 *
 * @example
 * <FlashcardIndexPage />
 */
export default function FlashcardIndexPage() {
    const { lessons, sharedLessons, loading, error, deleteLesson, shareLesson, updateLessonRoles } =
        useLessons();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab") as "personal" | "shared" | null;

    const activeTab = tabParam || "personal";

    const handleTabChange = (tab: "personal" | "shared") => {
        router.replace(`/flashcard?tab=${tab}`, { scroll: false });
    };

    /** Track high scores for each personal deck to display badges/tiers */
    const [gameStats, setGameStats] = useState<Record<string, GameStatEntry>>({});

    useEffect(() => {
        if (!user) return;
        return subscribeGameStats(user.uid, setGameStats);
    }, [user]);

    const [sharingLesson, setSharingLesson] = useState<Lesson | null>(null);

    const displayLessons = activeTab === "personal" ? lessons : sharedLessons;

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="Flashcards"
                backHref="/"
                right={
                    <Button
                        variant="primary"
                        color="purple"
                        onClick={() => router.push("/flashcard/create")}
                        className="-mr-2 !p-2 shadow-none"
                        icon={Plus}
                        iconSize={20}
                    />
                }
            />

            <div className={`${SPACING.pagePadding} mx-auto max-w-2xl pt-6`}>
                {/* ── Tab Switcher ── */}
                <div className="mb-6 flex gap-2 rounded-2xl bg-gray-100 p-1">
                    <Button
                        variant="ghost"
                        onClick={() => handleTabChange("personal")}
                        className={`!flex-1 !rounded-xl !py-2 !text-sm !font-black shadow-none !transition-all hover:shadow-none active:translate-y-0 ${
                            activeTab === "personal"
                                ? "!bg-white !text-[#3c3c3c] shadow-sm"
                                : "!text-[#afafaf] hover:!bg-transparent hover:!text-[#3c3c3c]"
                        }`}
                    >
                        My Decks
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => handleTabChange("shared")}
                        className={`!flex-1 !rounded-xl !py-2 !text-sm !font-black shadow-none !transition-all hover:shadow-none active:translate-y-0 ${
                            activeTab === "shared"
                                ? "!bg-white !text-[#3c3c3c] shadow-sm"
                                : "!text-[#afafaf] hover:!bg-transparent hover:!text-[#3c3c3c]"
                        }`}
                        badge={
                            sharedLessons.length > 0 && (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ce82ff] text-[10px] text-white">
                                    {sharedLessons.length}
                                </span>
                            )
                        }
                    >
                        Shared with me
                    </Button>
                </div>

                {/* ── Error state ── */}
                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-2xl border-2 border-[#ea2b2b]/30 bg-[#ffdfe0] px-5 py-4">
                        <p className="text-sm font-bold text-[#ea2b2b]">{error}</p>
                        <Button
                            variant="ghost"
                            onClick={() => window.location.reload()}
                            className="!ml-4 !flex !items-center !gap-1 !text-xs !font-black !text-[#ea2b2b] shadow-none hover:underline hover:shadow-none active:translate-y-0"
                            icon={RefreshCw}
                            iconSize={14}
                        >
                            Retry
                        </Button>
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
                {!loading && !error && displayLessons.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[2rem] border-b-8 border-[#b65ce8] bg-[#ce82ff] text-white shadow-sm">
                            <BookOpen size={48} strokeWidth={3} />
                        </div>
                        <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">
                            {activeTab === "personal" ? "No decks yet" : "No shared decks"}
                        </h2>
                        <p className="mb-8 font-bold text-[#afafaf]">
                            {activeTab === "personal"
                                ? "Create your first vocabulary deck to get started!"
                                : "Shared decks from other students will appear here."}
                        </p>
                        {activeTab === "personal" && (
                            <Button
                                variant="primary"
                                color="purple"
                                onClick={() => router.push("/flashcard/create")}
                                icon={Plus}
                                className="mx-auto px-8 py-5 text-xl"
                            >
                                Create Deck
                            </Button>
                        )}
                    </div>
                )}

                {/* ── Lesson list ── */}
                {!loading && !error && displayLessons.length > 0 && (
                    <div className="space-y-4">
                        {displayLessons.map((lesson) => (
                            <DeckCard
                                key={lesson.id}
                                lesson={lesson}
                                isShared={activeTab === "shared"}
                                matchStats={gameStats[matchGameMode(lesson.id)]}
                                speedStats={gameStats[speedGameMode(lesson.id)]}
                                onDelete={async () => {
                                    if (confirm("Delete this deck?")) {
                                        try {
                                            await deleteLesson(lesson.id);
                                            showAlert("success", "Deck deleted");
                                        } catch (err) {
                                            console.error("[FlashcardIndex] Delete failed:", err);
                                            showAlert("error", "Failed to delete deck");
                                        }
                                    }
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

/**
 * Small visual tier indicator based on score.
 * Shows emoji + specific theme colors (Gold, Platinum, etc).
 */
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

/**
 * Individual Deck Entry on Dashboard
 *
 * @remarks
 * Displays deck metadata (title, tags, count) and high score badges.
 * Provides entry points to Study, Speed Quiz, and Match game.
 */
function DeckCard({
    lesson,
    isShared,
    matchStats,
    speedStats,
    onDelete,
    onShare,
}: {
    lesson: Lesson;
    isShared?: boolean;
    matchStats?: GameStatEntry;
    speedStats?: GameStatEntry;
    onDelete: () => void;
    onShare: () => void;
}) {
    const { user } = useAppStore();
    const themeColor = lesson.themeColor || "#1cb0f6";

    // Determine permissions
    const role = user ? lesson.roles?.[user.uid] : "viewer";
    const canEdit = role === "owner" || role === "editor";
    const canShare = role === "owner";
    const canDelete = role === "owner";

    // Path resolution
    const resolvedShareId =
        lesson.shareId || (lesson.userId ? buildShareId(lesson.userId, lesson.id) : "");

    const viewPath = isShared ? `/flashcard/shared/${resolvedShareId}` : `/flashcard/${lesson.id}`;
    const speedPath = isShared
        ? `/flashcard/shared/${resolvedShareId}/speed`
        : `/flashcard/${lesson.id}/speed`;
    const matchPath = isShared
        ? `/flashcard/shared/${resolvedShareId}/match`
        : `/flashcard/${lesson.id}/match`;
    const editPath = isShared
        ? `/flashcard/${lesson.id}/edit?ownerId=${lesson.userId}`
        : `/flashcard/${lesson.id}/edit`;

    return (
        <div
            className={`${CARD_BASE} transition-all hover:-translate-y-0.5 hover:shadow-md ${SPACING.cardPadding}`}
        >
            <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-[#3c3c3c]">{lesson.title}</h3>
                        {isShared && (
                            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-[9px] font-black tracking-tight text-[#afafaf] uppercase">
                                Shared
                            </span>
                        )}
                    </div>
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
                    <Link href={viewPath} className="flex-1">
                        <Button
                            variant="primary"
                            color={hexToThemeColor(themeColor)}
                            icon={BookOpen}
                            className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                        >
                            <span className="truncate">View</span>
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
                        <Link href={speedPath} className="block">
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
                        <Link href={matchPath} className="block">
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

                <div className="flex items-center justify-around gap-2 border-t-2 border-gray-50 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                    {canShare && (
                        <Button
                            variant="ghost"
                            onClick={onShare}
                            className="!flex !h-11 !w-11 !items-center !justify-center !rounded-xl !p-0 !text-gray-300 shadow-none transition-colors hover:!bg-[#ebf8e6] hover:!text-[#58cc02] hover:shadow-none active:translate-y-0"
                            title="Share deck"
                            icon={Share2}
                            iconSize={20}
                        />
                    )}
                    {canEdit && (
                        <Link href={editPath}>
                            <Button
                                variant="ghost"
                                className="!flex !h-11 !w-11 !items-center !justify-center !rounded-xl !p-0 !text-gray-300 shadow-none transition-all hover:shadow-none active:translate-y-0"
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor =
                                        `${themeColor}20`;
                                    (e.currentTarget as HTMLElement).style.color = themeColor;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor =
                                        "transparent";
                                    (e.currentTarget as HTMLElement).style.color = "";
                                }}
                                title="Edit deck"
                                icon={Edit2}
                                iconSize={20}
                            />
                        </Link>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            onClick={onDelete}
                            className="!flex !h-11 !w-11 !items-center !justify-center !rounded-xl !p-0 !text-gray-300 shadow-none transition-colors hover:!bg-[#ffdfe0] hover:!text-[#ea2b2b] hover:shadow-none active:translate-y-0"
                            title="Delete deck"
                            icon={Trash2}
                            iconSize={20}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
