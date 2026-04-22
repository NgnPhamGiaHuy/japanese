/**
 * @file SharedLessonPage
 * Public landing page for shared flashcard decks.
 * Handles role-based access for non-owners (Viewer, Commenter, Editor).
 */

"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { RefreshCw } from "lucide-react";

import { ShareModal } from "@/features/flashcard/core/components";
import { useLessons, useSharedLesson } from "@/features/flashcard/core/hooks";
import { FlashcardDetailLayout } from "@/features/flashcard/detail";
import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import { useAppStore } from "@/store";

import type { FlashCard } from "@/features/flashcard/core/types";
import type { DeckContext } from "@/features/flashcard/detail";

/**
 * Shared Deck View
 *
 * @remarks
 * Orchestrates:
 * 1. Data Fetching: Resolves a shareId token via useSharedLesson (auth-aware, error-classified).
 * 2. Role Resolution: Google Docs-style permissions model.
 * 3. Duplication: Allows viewers to save a personal copy with fresh SRS state.
 */
export default function SharedLessonPage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = use(params);
    const router = useRouter();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const { saveFullLesson, shareLesson, updateLessonRoles } = useLessons();

    const { result, status, error } = useSharedLesson(shareId);

    const [saving, setSaving] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [sharingLesson, setSharingLesson] = useState(false);

    if (status === "loading") {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    // Network / quota error — show retry UI instead of a false 404.
    if (status === "error") {
        const isQuota = error?.code === "quota-exceeded";
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-b-8 border-gray-200 bg-white shadow-sm">
                    <span className="text-4xl">{isQuota ? "⏳" : "📡"}</span>
                </div>
                <h1 className="mb-2 text-2xl font-black text-[#3c3c3c]">
                    {isQuota ? "Service Busy" : "Connection Error"}
                </h1>
                <p className="mb-8 font-bold text-[#afafaf]">
                    {isQuota
                        ? "Too many requests right now. Please try again in a moment."
                        : "Couldn't load this deck. Check your connection and try again."}
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={() => window.location.reload()}
                        variant="primary"
                        color="blue"
                        icon={RefreshCw}
                    >
                        Try Again
                    </Button>
                    <Button onClick={() => router.back()} variant="secondary">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (status !== "ready" || !result) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-b-8 border-gray-200 bg-white shadow-sm">
                    <span className="text-4xl">🔒</span>
                </div>
                <h1 className="mb-2 text-2xl font-black text-[#3c3c3c]">Deck Not Found</h1>
                <p className="mb-8 font-bold text-[#afafaf]">
                    This deck may be restricted, deleted, or the link is invalid.
                </p>
                <Button onClick={() => router.back()} variant="secondary">
                    Go Back
                </Button>
            </div>
        );
    }

    const { lesson, cards, meta } = result;

    const isOwner = meta.viewerRole === "owner";
    const role = (
        meta.viewerRole === "none" ? "viewer" : meta.viewerRole
    ) as import("@/features/flashcard/detail").DeckRole;

    const ctx: DeckContext = {
        lesson: lesson as unknown as import("@/features/flashcard/core/types").Lesson,
        cards: cards as import("@/features/flashcard/core/types").FlashCard[],
        ownerId: meta.sourceUserId,
        lessonId: meta.sourceLessonId,
        role,
        isOwner,
        basePath: `/flashcard/shared/${shareId}`,
    };

    const handleDuplicate = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const cleanLesson = {
                ...lesson,
                id: "",
                userId: user.uid,
                ownerId: user.uid,
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
            await saveFullLesson(
                cleanLesson as unknown as import("@/features/flashcard/core/types").Lesson,
                cleanCards,
                true,
            );
            router.back();
        } catch (err) {
            console.error("[SharedLessonPage] Duplicate failed:", err);
            showAlert("error", "Failed to duplicate deck. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        showAlert("success", "Link copied to clipboard");
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <>
            <FlashcardDetailLayout
                ctx={ctx}
                currentUserId={user?.uid}
                currentUserName={user?.displayName}
                currentUserEmail={user?.email}
                saving={saving}
                linkCopied={linkCopied}
                onDuplicate={user ? handleDuplicate : undefined}
                onCopyLink={handleCopyLink}
                onManageAccess={isOwner ? () => setSharingLesson(true) : undefined}
                onEdit={
                    role === "owner" || role === "editor"
                        ? () =>
                              router.push(
                                  isOwner
                                      ? `/flashcard/${meta.sourceLessonId}/edit`
                                      : `/flashcard/${meta.sourceLessonId}/edit?ownerId=${meta.sourceUserId}&returnTo=/flashcard/shared/${shareId}`,
                              )
                        : undefined
                }
            />

            {sharingLesson && isOwner && (
                <ShareModal
                    lesson={ctx.lesson}
                    onShareLink={async (isPub, pRole, isPublic) => {
                        await shareLesson(meta.sourceLessonId, isPub, pRole, isPublic);
                    }}
                    onUpdateRoles={async (roles, collabs) => {
                        await updateLessonRoles(meta.sourceLessonId, roles, collabs);
                    }}
                    onClose={() => setSharingLesson(false)}
                />
            )}
        </>
    );
}
