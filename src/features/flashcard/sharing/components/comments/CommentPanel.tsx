"use client";

import { useTranslations } from "next-intl";

import { MessageSquare, SlidersHorizontal } from "lucide-react";

import { COMMENT_MAX_LENGTH } from "@/features/flashcard/services/comment.schema";
import { Button, LoadingSpinner } from "@/shared/components/ui";
import { useNow } from "@/shared/hooks";
import CommentInput from "./CommentInput";
import CommentThread from "./CommentThread";
import { useCommentPanel } from "../../hooks";

/**
 * Flashcard Commenting Hub
 *
 * @remarks
 * Orchestrates real-time social interactions for specific cards. Manages:
 * 1. Firebase subscription lifecycle (Connect/Disconnect/Retry).
 * 2. Nested CRUD operations (Reply/Edit/Resolve).
 * 3. Intelligent scroll management for new message arrivals.
 *
 * @example
 * <CommentPanel lessonId="123" cardId="456" currentUserId="abc" ... />
 */

/** Configuration for the comment lifecycle and access control. */
export interface CommentPanelProps {
    /** Creator of the deck, used for security path derivation. */
    ownerId: string;
    /** Parent deck identifier. */
    lessonId: string;
    /** Specific card being discussed. */
    cardId: string;
    /** Identity of the active session user. */
    currentUserId: string;
    /** Display name used for new local-first comment rendering. */
    currentUserName?: string | null;
    /** Email for gravatar or internal lookup. */
    currentUserEmail?: string | null;
    /** Permission scope affecting UI visibility of Edit/Delete/Resolve. */
    currentUserRole: "viewer" | "commenter" | "editor" | "owner";
    /** True if the active user is the deck author, granting super-admin delete rights. */
    isOwner: boolean;
    /** Branding color used for theme-consistent icons and loading states. */
    themeColor: string;
}

const CommentPanel = ({
    ownerId,
    lessonId,
    cardId,
    currentUserId,
    currentUserName,
    currentUserEmail,
    currentUserRole,
    isOwner,
    themeColor,
}: CommentPanelProps) => {
    const t = useTranslations("FlashcardComments");
    const {
        comments,
        loading,
        showResolved,
        setShowResolved,
        listRef,
        sorted,
        resolvedCount,
        handleAdd,
        handleReply,
        handleResolve,
        handleEdit,
        handleDelete,
    } = useCommentPanel({
        ownerId,
        lessonId,
        cardId,
        currentUserId,
        currentUserName,
        currentUserEmail,
        isOwner,
    });
    const now = useNow();

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        /*
         * KEY LAYOUT FIX:
         * The panel is a flex column with a fixed height.
         * - Header: shrinks to content
         * - List:   flex-1 + overflow-y-auto → scrolls independently
         * - Input:  shrinks to content, always visible at bottom
         *
         * The parent <aside> in FlashcardDetailLayout must be
         * `sticky top-4 h-[calc(100vh-6rem)]` so this panel has a
         * real height to work against.
         */
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                    <MessageSquare size={15} style={{ color: themeColor }} />
                    <span className="text-text text-[13px] font-black">{t("comments")}</span>
                    {comments.length > 0 && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-px text-xs font-black text-gray-500">
                            {sorted.length}
                        </span>
                    )}
                </div>

                {resolvedCount > 0 && (
                    <Button
                        variant="ghost"
                        onClick={() => setShowResolved((v) => !v)}
                        className={`!flex !items-center !gap-1 !rounded-lg !px-2 !py-1 !text-xs !font-bold shadow-none transition-colors hover:shadow-none active:translate-y-0 ${
                            showResolved
                                ? "!bg-gray-100 !text-gray-700"
                                : "!text-gray-400 hover:!text-gray-600"
                        }`}
                        title={
                            showResolved
                                ? t("hideResolved")
                                : t("showResolvedCount", { count: resolvedCount })
                        }
                        icon={SlidersHorizontal}
                        iconSize={11}
                    >
                        {showResolved
                            ? t("hideResolved")
                            : t("resolvedCount", { count: resolvedCount })}
                    </Button>
                )}
            </div>

            {/* ── Scrollable comment list ─────────────────────────────────── */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-2">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <LoadingSpinner fullScreen={false} label={t("loading")} />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                        <MessageSquare size={28} className="text-gray-200" />
                        <p className="text-[13px] font-bold text-gray-400">
                            {showResolved ? t("noCommentsYet") : t("noOpenComments")}
                        </p>
                        <p className="text-xs text-gray-300">
                            {showResolved ? t("beFirstToDiscuss") : t("allThreadsResolved")}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sorted.map((comment) => (
                            <CommentThread
                                key={comment.id}
                                comment={comment}
                                now={now}
                                currentUserId={currentUserId}
                                currentUserRole={currentUserRole}
                                isOwner={isOwner}
                                themeColor={themeColor}
                                onReply={handleReply}
                                onResolve={handleResolve}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Sticky input ───────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-gray-100 bg-white px-3 py-3">
                <CommentInput
                    placeholder={t("addCommentPlaceholder")}
                    onSubmit={handleAdd}
                    themeColor={themeColor}
                    maxLength={COMMENT_MAX_LENGTH}
                />
            </div>
        </div>
    );
};

export default CommentPanel;
