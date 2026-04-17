/**
 * @file FlashcardDetailPage
 * Detailed view of a personal flashcard deck.
 * Orchestrates access control, card preview, and deck management (Edit/Share).
 */

"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { ShareModal } from "@/features/flashcard/core/components";
import { useCards, useLessons } from "@/features/flashcard/core/hooks";
import { buildShareId } from "@/features/flashcard/core/services";
import { FlashcardDetailLayout } from "@/features/flashcard/detail";
import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import { useAppStore } from "@/store";

import type { DeckContext } from "@/features/flashcard/detail";

/**
 * Deck Detail Page (Personal)
 *
 * @remarks
 * This page handles the entry point for deck owners.
 * It ensures the deck exists and the user has permission (ownership check).
 * It delegates the UI rendering to `FlashcardDetailLayout` with a "owner" role context.
 */
export default function FlashcardDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { showAlert } = useAlert();
    const router = useRouter();
    const { user } = useAppStore();
    const { lessons, loading: lessonsLoading, shareLesson, updateLessonRoles } = useLessons();
    const { cards, loading: cardsLoading, reorderCard } = useCards(id);

    const [sharingLesson, setSharingLesson] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    if (lessonsLoading || cardsLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    const lesson = lessons.find((l) => l.id === id);

    /** Error Boundary / Guard: Ensure deck exists and user is authenticated */
    if (!lesson || !user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-6 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border-b-8 border-gray-200 bg-white shadow-sm">
                    <span className="text-4xl">🔒</span>
                </div>
                <h1 className="mb-2 text-2xl font-black text-[#3c3c3c]">Deck Not Found</h1>
                <p className="mb-8 font-bold text-[#afafaf]">
                    This deck doesn&apos;t exist or you don&apos;t have access.
                </p>
                <Button onClick={() => router.push("/flashcard")} variant="secondary">
                    Go Back
                </Button>
            </div>
        );
    }

    /** Prepares the common context consumed by the layout for consistency with shared views */
    const ctx: DeckContext = {
        lesson,
        cards,
        ownerId: user.uid,
        lessonId: id,
        role: "owner",
        isOwner: true,
        basePath: `/flashcard/${id}`,
    };

    /**
     * Copies the share link to clipboard.
     * Always available — opens ShareModal first if sharing hasn't been enabled yet.
     */
    const handleCopyLink = async () => {
        const shareId = lesson.shareId || buildShareId(user.uid, id);
        await navigator.clipboard.writeText(
            `${window.location.origin}/flashcard/shared/${shareId}`,
        );
        setLinkCopied(true);
        showAlert("success", "Link copied to clipboard");
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <>
            <FlashcardDetailLayout
                ctx={ctx}
                currentUserId={user.uid}
                currentUserName={user.displayName}
                currentUserEmail={user.email}
                linkCopied={linkCopied}
                onCopyLink={handleCopyLink}
                onManageAccess={() => setSharingLesson(true)}
                onEdit={() => router.push(`/flashcard/${id}/edit`)}
                onReorderCard={reorderCard}
            />

            {sharingLesson && (
                <ShareModal
                    lesson={lesson}
                    onShareLink={async (allowLinkAccess, publicRole, isPublic) => {
                        await shareLesson(id, allowLinkAccess, publicRole, isPublic);
                    }}
                    onUpdateRoles={async (roles, collabs) => {
                        await updateLessonRoles(id, roles, collabs);
                    }}
                    onClose={() => setSharingLesson(false)}
                />
            )}
        </>
    );
}
