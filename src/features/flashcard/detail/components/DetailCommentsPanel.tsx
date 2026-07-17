/**
 * DetailCommentsPanel — Right panel with comment system
 *
 * @remarks
 * Sticky panel with independent scrolling.
 * Integrates existing CommentPanel component with contextual empty states.
 */

"use client";

import { useTranslations } from "next-intl";

import { CommentPanel } from "@/features/flashcard/components";
import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";

import type { DetailCommentsPanelProps } from "../types";

const DetailCommentsPanel = ({
    ctx,
    selectedCardId,
    currentUserId,
    currentUserName,
    currentUserEmail,
}: DetailCommentsPanelProps) => {
    const t = useTranslations("FlashcardDetail");
    const { lesson, ownerId, lessonId, role, isOwner } = ctx;
    const themeHex = lesson.themeColor || DEFAULT_DECK_THEME_COLOR;
    const canComment = role === "owner" || role === "editor" || role === "commenter";

    if (!canComment) return null;

    if (!currentUserId) {
        return (
            <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-6rem)]">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-text mb-2 text-lg font-black">{t("comments")}</h3>
                    <p className="text-muted text-sm font-bold">{t("signInToComment")}</p>
                </div>
            </aside>
        );
    }

    if (!selectedCardId) {
        return (
            <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-6rem)]">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-text mb-2 text-lg font-black">{t("comments")}</h3>
                    <p className="text-muted text-sm font-bold">{t("selectCardForComments")}</p>
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
