/**
 * @file FlashcardDetailLayout
 * Reusable layout for deck detail views (Personal & Shared).
 * Implement a three-zone interface: Actions (Left), Preview (Center), Comments (Right).
 */

"use client";

import Link from "next/link";
import { useState } from "react";

import {
    BookOpen,
    Copy,
    CopyPlus,
    Edit2,
    Gamepad2,
    Info,
    Loader2,
    Lock,
    MessageCircle,
    Zap,
} from "lucide-react";

import { CommentPanel } from "@/features/flashcard/components";
import { useCommentCount } from "@/features/flashcard/hooks";
import { resolveDisplay } from "@/features/flashcard/utils/displayEngine";
import { Button } from "@/shared/components/ui";

import type { FlashCard, Lesson } from "@/features/flashcard/types";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Roles determining capabilities within a collaborative deck */
export type DeckRole = "owner" | "editor" | "commenter" | "viewer";

/**
 * Scoped data object passed to the layout to handle logic
 * variations between personal and shared decks.
 */
export interface DeckContext {
    lesson: Lesson;
    cards: FlashCard[];
    /** Firestore owner UID — used for comment paths */
    ownerId: string;
    /** Firestore lesson ID — used for comment paths */
    lessonId: string;
    /** Resolved role for the current user */
    role: DeckRole;
    /** Whether the user is the functional owner of the deck */
    isOwner: boolean;
    /** Base path for study/match/speed links, e.g. "/flashcard/shared/abc" or "/flashcard/abc" */
    basePath: string;
}

interface FlashcardDetailLayoutProps {
    ctx: DeckContext;
    currentUserId?: string;
    currentUserName?: string | null;
    currentUserEmail?: string | null;
    /** Called when user wants to duplicate the deck */
    onDuplicate?: () => Promise<void>;
    /** Called when user wants to copy the share link */
    onCopyLink?: () => Promise<void>;
    linkCopied?: boolean;
    /** Navigate to the edit page (owner/editor only) */
    onEdit?: () => void;
    /** Called when owner wants to open share management modal */
    onManageAccess?: () => void;
    /** Visual loading state for duplication */
    saving?: boolean;
}

// ─── Comment badge (per-card, needs own component to avoid hook-in-loop) ─────

/**
 * Metadata badge showing the number of comments on a specific card.
 * Fetches data independently to avoid re-rendering the entire card list.
 */
function CardCommentBadge({
    ownerId,
    lessonId,
    cardId,
}: {
    ownerId: string;
    lessonId: string;
    cardId: string;
}) {
    const { totalComments, unresolvedCount } = useCommentCount(ownerId, lessonId, cardId);
    if (totalComments === 0) return null;
    return (
        <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
                unresolvedCount > 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"
            }`}
        >
            <MessageCircle size={11} />
            {totalComments}
        </span>
    );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

/**
 * Flashcard Detail Layout
 *
 * @remarks
 * Orchestrates:
 * 1. **Permission Logic**: Calculates `canEdit`, `canComment` based on `ctx.role`.
 * 2. **Navigation**: Links to Study/Game modes using the `basePath` abstraction.
 * 3. **Contextual UI**: Shows management actions for Owners, and "Duplicate" for shared users.
 * 4. **Selective Scrolling**: Independent scroll zones for card list and comment panel.
 */
export default function FlashcardDetailLayout({
    ctx,
    currentUserId,
    currentUserName,
    currentUserEmail,
    onDuplicate,
    onCopyLink,
    linkCopied = false,
    onEdit,
    onManageAccess,
    saving = false,
}: FlashcardDetailLayoutProps) {
    const { lesson, cards, ownerId, lessonId, role, isOwner, basePath } = ctx;
    const themeHex = lesson.themeColor || "#1cb0f6";
    const canPlay = cards.length >= 4;
    const canEdit = role === "owner" || role === "editor";
    const canComment = role === "owner" || role === "editor" || role === "commenter";

    /** Active card for the comment panel display */
    const [selectedCardId, setSelectedCardId] = useState<string | null>(
        cards.length > 0 ? cards[0].id : null,
    );

    return (
        <div className="min-h-screen bg-[#F7F7F8]">
            {/* ── HERO HEADER ─────────────────────────────────────────────── */}
            <header className="relative overflow-hidden border-b-2 border-gray-200 bg-white shadow-sm">
                <div
                    className="pointer-events-none absolute inset-0 opacity-10"
                    style={{ backgroundColor: themeHex }}
                />
                <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 pt-8 pb-6 md:flex-row md:items-end">
                    <div>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {!isOwner && (
                                <span
                                    className="flex items-center justify-center rounded-xl border-2 px-3 py-1 text-xs font-black tracking-widest uppercase"
                                    style={{
                                        backgroundColor: `${themeHex}10`,
                                        color: themeHex,
                                        borderColor: `${themeHex}40`,
                                    }}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </span>
                            )}
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

                    {/* Action buttons */}
                    <div className="flex shrink-0 flex-col gap-3">
                        <Link href={`${basePath}/study`} className="w-full">
                            <Button
                                variant="primary"
                                color="blue"
                                className="flex w-full items-center justify-center gap-2 border-b-8 px-8 py-4 text-lg shadow-sm"
                                style={
                                    {
                                        backgroundColor: themeHex,
                                        borderColor: `${themeHex}BB`,
                                    } as React.CSSProperties
                                }
                            >
                                <BookOpen size={24} />
                                Start Study
                            </Button>
                        </Link>

                        <div className="flex gap-3">
                            <Link
                                href={`${basePath}/match`}
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
                                href={`${basePath}/speed`}
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

            {/* ── THREE-PANEL BODY ─────────────────────────────────────────── */}
            <div className="mx-auto mt-4 max-w-7xl px-6 pb-24">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[25%_45%_30%] lg:items-start">
                    {/* LEFT PANEL */}
                    <aside className="flex flex-col gap-4">
                        {isOwner ? (
                            /* ── OWNER: management actions only, no redundant role info ── */
                            <>
                                {onEdit && (
                                    <ActionButton
                                        icon={<Edit2 size={18} />}
                                        iconBg={`${themeHex}15`}
                                        iconColor={themeHex}
                                        label="Edit Deck"
                                        sub="Add, remove, or update cards"
                                        onClick={onEdit}
                                    />
                                )}
                                {onCopyLink && (
                                    <ActionButton
                                        icon={<Copy size={18} />}
                                        iconBg="bg-gray-100"
                                        iconColor="text-gray-600"
                                        label={linkCopied ? "Link Copied!" : "Copy Share Link"}
                                        sub="Share this deck with others"
                                        onClick={onCopyLink}
                                    />
                                )}
                                {onManageAccess && (
                                    <ActionButton
                                        icon={<Lock size={18} />}
                                        iconBg="bg-blue-50"
                                        iconColor="text-blue-500"
                                        label="Manage Access"
                                        sub="Control who can view or comment"
                                        onClick={onManageAccess}
                                    />
                                )}
                            </>
                        ) : (
                            /* ── SHARED USER: role badge + access info + actions ── */
                            <>
                                {/* Role badge */}
                                <div
                                    className="flex items-center gap-3 rounded-2xl border-2 p-4 shadow-sm"
                                    style={{
                                        backgroundColor: `${themeHex}10`,
                                        borderColor: `${themeHex}40`,
                                    }}
                                >
                                    <div
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                                        style={{ backgroundColor: themeHex }}
                                    >
                                        {role[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p
                                            className="text-[11px] font-black tracking-widest uppercase"
                                            style={{ color: themeHex }}
                                        >
                                            Your Role
                                        </p>
                                        <p className="font-black text-[#3c3c3c] capitalize">
                                            {role}
                                        </p>
                                    </div>
                                </div>

                                {/* Access info card */}
                                <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                                    <div className="flex items-center gap-4 border-b-2 border-gray-100 p-4">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                            style={{ backgroundColor: `${themeHex}15` }}
                                        >
                                            {canEdit ? (
                                                <Edit2 size={18} style={{ color: themeHex }} />
                                            ) : (
                                                <BookOpen size={18} style={{ color: themeHex }} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#3c3c3c]">
                                                {role === "editor"
                                                    ? "Editor Access"
                                                    : role === "commenter"
                                                      ? "Commenter Access"
                                                      : "Viewer Access"}
                                            </p>
                                            <p className="mt-0.5 text-xs font-bold text-[#afafaf]">
                                                {canEdit
                                                    ? "You have edit rights to this deck."
                                                    : role === "commenter"
                                                      ? "You can comment but not edit cards."
                                                      : "View only — no editing or commenting."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-gray-50 p-4">
                                        <Info
                                            size={16}
                                            className="mt-0.5 shrink-0 text-[#ff9600]"
                                        />
                                        <p className="text-xs font-bold text-gray-500">
                                            Your game progress and learning data is strictly
                                            separate from the owner&apos;s original metrics.
                                        </p>
                                    </div>
                                </div>

                                {/* Shared user actions */}
                                <div className="flex flex-col gap-3">
                                    {canEdit && onEdit && (
                                        <ActionButton
                                            icon={<Edit2 size={18} />}
                                            iconBg={`${themeHex}15`}
                                            iconColor={themeHex}
                                            label="Edit Deck Content"
                                            sub="Modify for all users"
                                            onClick={onEdit}
                                        />
                                    )}
                                    {onDuplicate ? (
                                        <ActionButton
                                            icon={
                                                saving ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <CopyPlus size={18} />
                                                )
                                            }
                                            iconBg="bg-gray-100"
                                            iconColor="text-gray-600"
                                            label={saving ? "Duplicating..." : "Duplicate Deck"}
                                            sub="Save a copy to your collection"
                                            onClick={onDuplicate}
                                            disabled={saving}
                                        />
                                    ) : !currentUserId ? (
                                        <Link
                                            href="/login"
                                            className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:shadow-sm"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
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
                                    ) : null}
                                    {onCopyLink && (
                                        <ActionButton
                                            icon={<Copy size={18} />}
                                            iconBg="bg-gray-100"
                                            iconColor="text-gray-600"
                                            label={linkCopied ? "Link Copied!" : "Copy Share Link"}
                                            sub="Share this deck with others"
                                            onClick={onCopyLink}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </aside>

                    {/* CENTER PANEL — scrolls with page */}
                    <main className="flex flex-col">
                        <h2 className="mb-4 border-b-2 border-gray-200 pb-2 text-xl font-black text-[#3c3c3c]">
                            Preview ({cards.length} Cards)
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {cards.map((card, idx) => (
                                <div
                                    key={card.id || idx}
                                    onClick={() => setSelectedCardId(card.id)}
                                    className={`group flex cursor-pointer flex-col rounded-2xl border-2 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                                        selectedCardId === card.id
                                            ? "border-[var(--theme)]"
                                            : "border-gray-200"
                                    }`}
                                    style={
                                        selectedCardId === card.id
                                            ? ({
                                                  "--theme": themeHex,
                                                  borderColor: themeHex,
                                              } as React.CSSProperties)
                                            : undefined
                                    }
                                >
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-start justify-between gap-2">
                                            {/* Concept-first display text */}
                                            <span className="text-3xl font-medium text-[#3c3c3c]">
                                                {
                                                    resolveDisplay(card, {
                                                        mode: "learn",
                                                        difficulty: 1,
                                                    }).question
                                                }
                                            </span>
                                            <CardCommentBadge
                                                ownerId={ownerId}
                                                lessonId={lessonId}
                                                cardId={card.id}
                                            />
                                        </div>
                                        {card.alternatives.length > 0 && (
                                            <div className="text-sm font-bold text-gray-400">
                                                {card.alternatives[0]}
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
                                        <div className="mt-4 h-32 overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-50">
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
                    </main>

                    {/* RIGHT PANEL — sticky, fixed height, independent scroll */}
                    <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-6rem)]">
                        {canComment && currentUserId ? (
                            selectedCardId ? (
                                <CommentPanel
                                    ownerId={ownerId}
                                    lessonId={lessonId}
                                    cardId={selectedCardId}
                                    currentUserId={currentUserId}
                                    currentUserName={currentUserName}
                                    currentUserEmail={currentUserEmail}
                                    currentUserRole={role}
                                    isOwner={isOwner}
                                    themeColor={themeHex}
                                />
                            ) : (
                                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                                    <h3 className="mb-2 text-lg font-black text-[#3c3c3c]">
                                        Comments
                                    </h3>
                                    <p className="text-sm font-bold text-[#afafaf]">
                                        Select a card to view its comments.
                                    </p>
                                </div>
                            )
                        ) : canComment && !currentUserId ? (
                            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-2 text-lg font-black text-[#3c3c3c]">Comments</h3>
                                <p className="text-sm font-bold text-[#afafaf]">
                                    Sign in to view and add comments.
                                </p>
                            </div>
                        ) : null}
                    </aside>
                </div>
            </div>
        </div>
    );
}

// ─── Small reusable action button ─────────────────────────────────────────────

/**
 * Shared button component for the side menu.
 * Displays an icon with a background and multi-line label/subtext.
 */
function ActionButton({
    icon,
    iconBg,
    iconColor,
    label,
    sub,
    onClick,
    disabled,
}: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    sub: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="group flex w-full items-center gap-3 rounded-xl border-2 border-transparent bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:shadow-sm disabled:opacity-50"
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${iconBg} ${iconColor}`}
            >
                {icon}
            </div>
            <div>
                <div className="font-black text-[#3c3c3c]">{label}</div>
                <div className="text-[11px] font-bold text-[#afafaf]">{sub}</div>
            </div>
        </button>
    );
}
