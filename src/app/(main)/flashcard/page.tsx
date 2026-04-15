/**
 * @file FlashcardIndexPage
 * Flashcard dashboard with three sections:
 * 1. Your Decks — owned by the current user
 * 2. Shared With Me — decks others have explicitly invited the user to
 * 3. Discover — globally public decks ordered by popularity
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
    BookOpen,
    Copy,
    Edit2,
    Gamepad2,
    Plus,
    RefreshCw,
    Share2,
    Trash2,
    Zap,
} from "lucide-react";

import {
    Lesson,
    OwnerBadge,
    ShareModal,
    useLessons,
    usePublicLessons,
    useSharedWithMe,
} from "@/features/flashcard";
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
        deleteLesson,
        updateLessonRoles,
        updateVisibility,
        saveFullLesson,
    } = useLessons();
    const {
        lessons: sharedLessons,
        loading: sharedLoading,
        error: sharedError,
    } = useSharedWithMe();
    const {
        lessons: publicLessons,
        loading: publicLoading,
        error: publicError,
    } = usePublicLessons(20);
    const { user } = useAppStore();
    const router = useRouter();

    const [gameStats, setGameStats] = useState<Record<string, GameStatEntry>>({});
    const [sharingLesson, setSharingLesson] = useState<Lesson | null>(null);
    const [cloningId, setCloningId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        return subscribeGameStats(user.uid, setGameStats);
    }, [user]);

    const handleClone = async (lesson: Lesson) => {
        if (!user) return;
        setCloningId(lesson.id);
        try {
            const { getSharedLesson, buildShareId, incrementCloneCount } =
                await import("@/features/flashcard");
            const shareId = buildShareId(lesson.userId!, lesson.id);
            const result = await getSharedLesson(shareId, user.uid, user);
            if (!result) return;
            await saveFullLesson(
                {
                    ...result.lesson,
                    id: "",
                    userId: user.uid,
                    sourceLessonId: lesson.id,
                    sourceUserId: lesson.userId,
                    roles: { [user.uid]: "owner" },
                    collaborators: [user.uid],
                    visibility: "private",
                    isIndexed: false,
                    cloneCount: 0,
                },
                result.cards,
                true,
            );
            await incrementCloneCount(lesson.userId!, lesson.id);
        } finally {
            setCloningId(null);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="My Decks"
                backHref="/"
                right={
                    <Button
                        variant="primary"
                        color="purple"
                        onClick={() => router.push("/flashcard/create")}
                        className="-mr-2 !p-2 shadow-none"
                    >
                        <Plus size={20} strokeWidth={3} />
                    </Button>
                }
            />

            <div className={`${SPACING.pagePadding} mx-auto max-w-2xl space-y-10 pt-6`}>
                {/* ── Your Decks ── */}
                <DeckSection
                    title="Your Decks"
                    loading={loading}
                    error={error}
                    empty={!loading && !error && lessons.length === 0}
                    emptyMessage="Create your first vocabulary deck to get started!"
                    emptyAction={
                        <Button
                            variant="primary"
                            color="purple"
                            onClick={() => router.push("/flashcard/create")}
                            icon={Plus}
                            className="mx-auto px-8 py-5 text-xl"
                        >
                            Create Deck
                        </Button>
                    }
                >
                    {lessons.map((lesson) => (
                        <DeckCard
                            key={lesson.id}
                            lesson={lesson}
                            matchStats={gameStats[matchGameMode(lesson.id)]}
                            speedStats={gameStats[speedGameMode(lesson.id)]}
                            onDelete={async () => {
                                if (confirm("Delete this deck?")) await deleteLesson(lesson.id);
                            }}
                            onShare={() => setSharingLesson(lesson)}
                            badge={
                                lesson.visibility === "public"
                                    ? { label: "Public", color: "#58cc02" }
                                    : lesson.visibility === "unlisted"
                                      ? { label: "Unlisted", color: "#ff9600" }
                                      : undefined
                            }
                        />
                    ))}
                </DeckSection>

                {/* ── Shared With Me ── */}
                <DeckSection
                    title="Shared With Me"
                    loading={sharedLoading}
                    error={sharedError}
                    empty={!sharedLoading && !sharedError && sharedLessons.length === 0}
                    emptyMessage="No one has shared a deck with you yet."
                >
                    {sharedLessons.map((lesson) => {
                        const role =
                            lesson.roles?.[user?.uid ?? ""] ?? lesson.publicRole ?? "viewer";
                        const shareHref = `/flashcard/shared/${buildShareIdClient(lesson)}`;
                        return (
                            <DeckCard
                                key={`${lesson.userId}-${lesson.id}`}
                                lesson={lesson}
                                viewHref={shareHref}
                                showOwner
                                badge={{
                                    label: role.charAt(0).toUpperCase() + role.slice(1),
                                    color: "#1cb0f6",
                                }}
                                onClone={
                                    cloningId === lesson.id ? undefined : () => handleClone(lesson)
                                }
                                cloningId={cloningId}
                            />
                        );
                    })}
                </DeckSection>

                {/* ── Discover ── */}
                <DeckSection
                    title="Discover Decks"
                    loading={publicLoading}
                    error={publicError}
                    empty={!publicLoading && !publicError && publicLessons.length === 0}
                    emptyMessage="No public decks available yet."
                >
                    {publicLessons.map((lesson) => (
                        <DeckCard
                            key={`public-${lesson.userId}-${lesson.id}`}
                            lesson={lesson}
                            viewHref={`/flashcard/shared/${buildShareIdClient(lesson)}`}
                            showOwner
                            badge={{ label: "Public", color: "#58cc02" }}
                            onClone={
                                cloningId === lesson.id ? undefined : () => handleClone(lesson)
                            }
                            cloningId={cloningId}
                            readOnly
                        />
                    ))}
                </DeckSection>
            </div>

            {sharingLesson &&
                (() => {
                    const liveLesson =
                        lessons.find((l) => l.id === sharingLesson.id) ?? sharingLesson;
                    return (
                        <ShareModal
                            lesson={liveLesson}
                            onShareLink={async (visibility, publicRole) => {
                                await updateVisibility(liveLesson.id, visibility, publicRole);
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

// ─── DeckSection ──────────────────────────────────────────────────────────────

function DeckSection({
    title,
    loading,
    error,
    empty,
    emptyMessage,
    emptyAction,
    children,
}: {
    title: string;
    loading: boolean;
    error: string | null;
    empty: boolean;
    emptyMessage: string;
    emptyAction?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="mb-4 text-lg font-black text-[#3c3c3c]">{title}</h2>

            {error && (
                <div className="mb-4 flex items-center justify-between rounded-2xl border-2 border-[#ea2b2b]/30 bg-[#ffdfe0] px-5 py-4">
                    <p className="text-sm font-bold text-[#ea2b2b]">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="ml-4 flex items-center gap-1 text-xs font-black text-[#ea2b2b] hover:underline"
                    >
                        <RefreshCw size={14} strokeWidth={3} /> Retry
                    </button>
                </div>
            )}

            {loading && (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="animate-pulse rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="flex-1 space-y-2 pr-4">
                                    <div className="h-5 w-48 rounded-lg bg-gray-200" />
                                    <div className="h-3 w-64 rounded-lg bg-gray-100" />
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                                <div className="h-10 flex-1 rounded-xl bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {empty && !loading && (
                <div className="py-10 text-center">
                    <p className="mb-4 font-bold text-[#afafaf]">{emptyMessage}</p>
                    {emptyAction}
                </div>
            )}

            {!loading && !error && !empty && <div className="space-y-4">{children}</div>}
        </section>
    );
}

// ─── TierBadge ────────────────────────────────────────────────────────────────

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

// ─── DeckCard ─────────────────────────────────────────────────────────────────

function DeckCard({
    lesson,
    matchStats,
    speedStats,
    onDelete,
    onShare,
    onClone,
    cloningId,
    badge,
    readOnly = false,
    viewHref,
    showOwner = false,
}: {
    lesson: Lesson;
    matchStats?: GameStatEntry;
    speedStats?: GameStatEntry;
    onDelete?: () => void;
    onShare?: () => void;
    onClone?: () => void;
    cloningId?: string | null;
    badge?: { label: string; color: string };
    readOnly?: boolean;
    viewHref?: string;
    showOwner?: boolean;
}) {
    const themeColor = lesson.themeColor || "#1cb0f6";
    const isCloning = cloningId === lesson.id;

    return (
        <div
            className={`${CARD_BASE} transition-all hover:-translate-y-0.5 hover:shadow-md ${SPACING.cardPadding}`}
        >
            <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-[#3c3c3c]">{lesson.title}</h3>
                        {badge && (
                            <span
                                className="rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wider uppercase"
                                style={{ color: badge.color, backgroundColor: `${badge.color}20` }}
                            >
                                {badge.label}
                            </span>
                        )}
                    </div>
                    {lesson.description && (
                        <p className="mt-1 line-clamp-2 text-sm font-bold text-[#afafaf]">
                            {lesson.description}
                        </p>
                    )}
                    {lesson.tags?.length > 0 && (
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
                    {showOwner && (
                        <div className="mt-2">
                            <OwnerBadge
                                displayName={lesson.owner?.displayName}
                                photoURL={lesson.owner?.photoURL}
                            />
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
                    <Link href={viewHref ?? `/flashcard/${lesson.id}`} className="flex-1">
                        <Button
                            variant="primary"
                            color={hexToThemeColor(themeColor)}
                            icon={BookOpen}
                            className="w-full flex-col gap-1 px-1 py-2 text-[10px] md:flex-row md:gap-2 md:px-2 md:py-3 md:text-sm"
                        >
                            <span className="truncate">View</span>
                        </Button>
                    </Link>

                    {!readOnly && (
                        <>
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
                        </>
                    )}
                </div>

                <div className="flex justify-around gap-2 border-t-2 border-gray-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                    {onClone && (
                        <button
                            onClick={onClone}
                            disabled={isCloning}
                            className="flex flex-1 items-center justify-center rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#ebf8e6] hover:text-[#58cc02] disabled:opacity-50 sm:flex-none"
                            title="Duplicate deck"
                        >
                            <Copy size={20} strokeWidth={2.5} />
                        </button>
                    )}
                    {onShare && (
                        <button
                            onClick={onShare}
                            className="flex flex-1 items-center justify-center rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#ebf8e6] hover:text-[#58cc02] sm:flex-none"
                            title="Share deck"
                        >
                            <Share2 size={20} strokeWidth={2.5} />
                        </button>
                    )}
                    {!readOnly && onDelete && (
                        <>
                            <Link
                                href={`/flashcard/${lesson.id}/edit`}
                                className="flex flex-1 items-center justify-center rounded-xl p-3 text-gray-300 transition-colors sm:flex-none"
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
                            >
                                <Edit2 size={20} strokeWidth={2.5} />
                            </Link>
                            <button
                                onClick={onDelete}
                                className="flex flex-1 items-center justify-center rounded-xl p-3 text-gray-300 transition-colors hover:bg-[#ffdfe0] hover:text-[#ea2b2b] sm:flex-none"
                                title="Delete deck"
                            >
                                <Trash2 size={20} strokeWidth={2.5} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Client-side shareId builder (mirrors buildShareId from service) */
function buildShareIdClient(lesson: Lesson): string {
    if (!lesson.userId) return lesson.id;
    const raw = btoa(`${lesson.userId}:${lesson.id}`);
    return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
