/**
 * DetailCommentsPanel — Right panel with comment system
 *
 * @remarks
 * Sticky panel with independent scrolling.
 * Integrates existing CommentPanel component with contextual empty states.
 */

"use client";

import { CommentPanel } from "@/features/flashcard/core/components";

import type { DetailCommentsPanelProps } from "../types";

const DetailCommentsPanel = ({
    ctx,
    selectedCardId,
    currentUserId,
    currentUserName,
    currentUserEmail,
}: DetailCommentsPanelProps) => {
    const { lesson, ownerId, lessonId, role, isOwner } = ctx;
    const themeHex = lesson.themeColor || "#1cb0f6";
    const canComment = role === "owner" || role === "editor" || role === "commenter";

    if (!canComment) return null;

    if (!currentUserId) {
        return (
            <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-6rem)]">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 text-lg font-black text-[#3c3c3c]">Comments</h3>
                    <p className="text-sm font-bold text-[#afafaf]">
                        Sign in to view and add comments.
                    </p>
                </div>
            </aside>
        );
    }

    if (!selectedCardId) {
        return (
            <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-6rem)]">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 text-lg font-black text-[#3c3c3c]">Comments</h3>
                    <p className="text-sm font-bold text-[#afafaf]">
                        Select a card to view its comments.
                    </p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-6rem)]">
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
        </aside>
    );
};

export default DetailCommentsPanel;
