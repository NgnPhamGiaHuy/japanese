"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { BookOpen, Copy, CopyPlus, Edit2, Gamepad2, Info, Loader2, Lock, Zap } from "lucide-react";

import { LessonBuilder, ShareModal } from "@/features/flashcard/components";
import { useLessons } from "@/features/flashcard/hooks";
import { getSharedLesson, SharedLessonResult } from "@/features/flashcard/services";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store";

import type { FlashCard } from "@/features/flashcard/types";

export default function SharedLessonPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();
    const { saveFullLesson, shareLesson, updateLessonRoles } = useLessons();

    const [result, setResult] = useState<SharedLessonResult | null>(null);
    const [status, setStatus] = useState<"loading" | "not_found" | "private" | "ready">("loading");
    const [saving, setSaving] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [sharingLesson, setSharingLesson] = useState(false);

    // Refresh function for after edits
    const loadSharedLesson = () => {
        getSharedLesson(shareId, user?.uid)
            .then((res) => {
                if (!res) {
                    setStatus("not_found");
                } else {
                    setResult(res);
                    setStatus("ready");
                }
            })
            .catch(() => setStatus("not_found"));
    };

    useEffect(() => {
        loadSharedLesson();
    }, [shareId, user?.uid]);

    // ── Save to my decks ────────────────────────────────────────────────────
    const handleSaveToMyDecks = async () => {
        if (!user || !result) return;
        setSaving(true);
        try {
            const { lesson, cards, meta } = result;

            const cleanLesson = {
                ...lesson,
                id: "",
                userId: user.uid,
                shareId: undefined,
                allowLinkAccess: false,
                isPublic: false,
                roles: { [user.uid]: "owner" as const },
                collaborators: [user.uid],
                createdAt: Date.now(),
                sourceLessonId: meta.sourceLessonId,
                sourceUserId: meta.sourceUserId,
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
            router.push("/flashcard");
        } catch (err) {
            console.error("[SharedLessonPage] Save failed:", err);
            alert("Failed to duplicate deck. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // ── Copy share link ─────────────────────────────────────────────────────
    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    // ── Loading ─────────────────────────────────────────────────────────────
    if (status === "loading") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    // ── Not found ───────────────────────────────────────────────────────────
    if (status !== "ready" || !result) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-4xl border-b-8 border-gray-200 bg-white shadow-sm">
                    <span className="text-4xl">🔒</span>
                </div>
                <h1 className="mb-2 text-2xl font-black text-[#3c3c3c]">Deck Not Found</h1>
                <p className="mb-8 font-bold text-[#afafaf]">
                    This deck may be restricted, deleted, or the link is invalid.
                </p>
                <Button onClick={() => router.push("/flashcard")} variant="secondary">
                    Go Back
                </Button>
            </div>
        );
    }

    const { lesson, cards, meta } = result;
    const themeHex = lesson.themeColor || "#1cb0f6";
    const canPlay = cards.length >= 4;

    // RBAC Resolution
    let currentRole = user ? lesson.roles?.[user.uid] : null;
    if (!currentRole && (lesson.allowLinkAccess || lesson.isPublic)) {
        currentRole = lesson.publicRole || "viewer";
    }

    const isOwner = currentRole === "owner" || (user && lesson.userId === user.uid);
    const canEdit = isOwner || currentRole === "editor";

    // View state mappings based on role
    const accessBadgeProps = {
        icon: canEdit ? (
            <Edit2 size={18} style={{ color: themeHex }} />
        ) : (
            <BookOpen size={18} style={{ color: themeHex }} />
        ),
        title: canEdit ? (isOwner ? "Owner Access" : "Editor Access") : "Viewer Access",
        text: canEdit
            ? "You have edit rights to this collaborative deck."
            : "Study this deck. Your progress is saved to your own account only.",
    };

    if (isEditing) {
        // Embed the LessonBuilder for collaborative editing
        return (
            <LessonBuilder
                editingLesson={{ ...lesson, userId: lesson.userId || meta.sourceUserId }}
                initialCards={cards}
                onSave={async (updatedLesson, updatedCards, isNew) => {
                    await saveFullLesson(updatedLesson, updatedCards, isNew);
                    setIsEditing(false);
                    loadSharedLesson();
                }}
                onDelete={async (id) => {
                    alert(
                        "Only the owner can delete the collaborative deck from the main dashboard.",
                    );
                }}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F7F8] pb-24">
            {/* ── 1. HERO HEADER (Top) ─────────────────────────────────────── */}
            <header className="relative overflow-hidden border-b-2 border-gray-200 bg-white shadow-sm">
                <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{ backgroundColor: themeHex }}
                />
                <div className="relative z-10 mx-auto flex max-w-5xl flex-col justify-between gap-6 px-6 pt-8 pb-6 md:flex-row md:items-end">
                    <div>
                        {/* Badges */}
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="flex items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100 px-3 py-1 text-xs font-black tracking-widest text-gray-500 uppercase">
                                🔗 Shared
                            </span>
                            <span
                                className="flex items-center justify-center rounded-xl border-2 px-3 py-1 text-xs font-black tracking-widest uppercase"
                                style={{
                                    backgroundColor: `${themeHex}10`,
                                    color: themeHex,
                                    borderColor: `${themeHex}40`,
                                }}
                            >
                                Role: {currentRole || "Viewer"}
                            </span>
                            <span className="flex items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100 px-3 py-1 text-xs font-black tracking-widest text-gray-400 uppercase">
                                {lesson.cardCount} Cards
                            </span>
                        </div>

                        <h1 className="text-3xl font-black text-[#3c3c3c] md:text-5xl">
                            {lesson.title}
                        </h1>

                        {lesson.description && (
                            <p className="mt-3 max-w-2xl text-base font-bold text-[#afafaf] md:text-lg">
                                {lesson.description}
                            </p>
                        )}

                        {lesson.tags?.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {lesson.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-lg px-2 py-1 text-[10px] font-black tracking-wider uppercase"
                                        style={{
                                            color: themeHex,
                                            backgroundColor: `${themeHex}20`,
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Primary actions positioned inline on desktop, stacked on mobile */}
                    <div className="flex shrink-0 flex-col gap-3">
                        <Link href={`/flashcard/shared/${shareId}/study`} className="w-full">
                            <Button
                                variant="primary"
                                color="blue"
                                className="flex w-full items-center justify-center gap-2 border-b-8 px-8 py-4 text-lg shadow-sm"
                                style={
                                    {
                                        backgroundColor: themeHex,
                                        borderColor: `${themeHex}BB`,
                                    } as any
                                }
                            >
                                <BookOpen size={24} />
                                Start Study
                            </Button>
                        </Link>

                        <div className="flex gap-3">
                            <Link
                                href={`/flashcard/shared/${shareId}/match`}
                                className={`flex-1 ${!canPlay && "pointer-events-none"}`}
                            >
                                <Button
                                    variant="secondary"
                                    color="purple"
                                    className="flex w-full items-center justify-center gap-2"
                                    disabled={!canPlay}
                                >
                                    <Gamepad2 size={18} />
                                    Match
                                </Button>
                            </Link>

                            <Link
                                href={`/flashcard/shared/${shareId}/speed`}
                                className={`flex-1 ${!canPlay && "pointer-events-none"}`}
                            >
                                <Button
                                    variant="secondary"
                                    color="orange"
                                    className="flex w-full items-center justify-center gap-2"
                                    disabled={!canPlay}
                                >
                                    <Zap size={18} />
                                    Speed
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto mt-4 flex max-w-5xl flex-col gap-8 p-6 lg:flex-row">
                {/* ── 2. LEFT SIDEBAR (Desktop) ───────────────────────────────── */}
                <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-1/3">
                    {/* Access Rules Group */}
                    <section>
                        <h3 className="mb-3 ml-2 text-xs font-black tracking-widest text-gray-400 uppercase">
                            Access
                        </h3>
                        <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-4 border-b-2 border-gray-100 p-4">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: `${themeHex}15` }}
                                >
                                    {accessBadgeProps.icon}
                                </div>
                                <div>
                                    <p className="font-black text-[#3c3c3c]">
                                        {accessBadgeProps.title}
                                    </p>
                                    <p className="mt-0.5 text-xs font-bold text-[#afafaf]">
                                        {accessBadgeProps.text}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-gray-50 p-4">
                                <Info size={16} className="mt-0.5 shrink-0 text-[#ff9600]" />
                                <p className="text-xs font-bold text-gray-500">
                                    {
                                        "Your game progress and learning data is strictly separate from the owner's original metrics."
                                    }
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Deck Actions Group */}
                    <section>
                        <h3 className="mb-3 ml-2 text-xs font-black tracking-widest text-gray-400 uppercase">
                            Manage
                        </h3>
                        <div className="flex flex-col gap-3">
                            {canEdit && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
                                >
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                                        style={{
                                            backgroundColor: `${themeHex}15`,
                                            color: themeHex,
                                        }}
                                    >
                                        <Edit2 size={18} />
                                    </div>
                                    <div>
                                        <div className="font-black text-[#3c3c3c]">
                                            Edit Deck Content
                                        </div>
                                        <div className="text-[11px] font-bold text-[#afafaf]">
                                            Modify for all users
                                        </div>
                                    </div>
                                </button>
                            )}

                            {user ? (
                                <button
                                    onClick={() => void handleSaveToMyDecks()}
                                    disabled={saving}
                                    className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:shadow-sm disabled:opacity-50"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-transform group-hover:scale-105">
                                        {saving ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <CopyPlus size={18} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-black text-[#3c3c3c]">
                                            {saving ? "Duplicating..." : "Duplicate Deck"}
                                        </div>
                                        <div className="text-[11px] font-bold text-[#afafaf]">
                                            Save to your collection
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-transform group-hover:scale-105">
                                        <CopyPlus size={18} />
                                    </div>
                                    <div>
                                        <div className="font-black text-[#3c3c3c]">
                                            Log in to Duplicate
                                        </div>
                                        <div className="text-[11px] font-bold text-[#afafaf]">
                                            Sign in to save this deck
                                        </div>
                                    </div>
                                </Link>
                            )}

                            <button
                                onClick={handleCopyLink}
                                className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-transform group-hover:scale-105">
                                    <Copy size={18} />
                                </div>
                                <div>
                                    <div className="font-black text-[#3c3c3c]">
                                        {linkCopied ? "Link Copied!" : "Copy Share Link"}
                                    </div>
                                    <div className="text-[11px] font-bold text-[#afafaf]">
                                        Share this deck with others
                                    </div>
                                </div>
                            </button>

                            {/* Optional: Owner can manage sharing options exactly here */}
                            {isOwner && (
                                <button
                                    onClick={() => setSharingLesson(true)}
                                    className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 transition-transform group-hover:scale-105">
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <div className="font-black text-[#3c3c3c]">
                                            Manage Access
                                        </div>
                                        <div className="text-[11px] font-bold text-[#afafaf]">
                                            Change roles or invites
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </section>
                </aside>

                {/* ── 3. RIGHT CONTENT (Card Preview) ────────────────────────── */}
                <main className="w-full lg:w-2/3">
                    <h2 className="mb-4 border-b-2 border-gray-200 pb-2 text-xl font-black text-[#3c3c3c]">
                        Preview ({cards.length} Cards)
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2">
                        {cards.map((card, idx) => (
                            <div
                                key={card.id || idx}
                                className="group flex flex-col rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="flex-1">
                                    <div className="mb-1 text-3xl font-medium text-[#3c3c3c]">
                                        {card.kanji}
                                    </div>
                                    {card.furigana && (
                                        <div className="text-sm font-bold text-gray-500">
                                            {card.furigana}
                                        </div>
                                    )}
                                    <div
                                        className="mt-3 text-lg font-black"
                                        style={{ color: themeHex }}
                                    >
                                        {card.meaning}
                                    </div>
                                </div>
                                {card.imageUrl && (
                                    <div className="mt-4 h-32 overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-50 transition-colors group-hover:border-gray-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={card.imageUrl}
                                            alt="Card preview image"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Share Permissions Management Modal integration */}
            {sharingLesson && isOwner && (
                <ShareModal
                    lesson={lesson}
                    onShareLink={async (isPub, pRole) => {
                        await shareLesson(lesson.id, isPub, pRole);
                        loadSharedLesson();
                    }}
                    onUpdateRoles={async (roles, collabs) => {
                        await updateLessonRoles(lesson.id, roles, collabs);
                        loadSharedLesson();
                    }}
                    onClose={() => setSharingLesson(false)}
                />
            )}
        </div>
    );
}
