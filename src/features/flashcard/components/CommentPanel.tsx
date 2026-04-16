"use client";

import { useEffect, useRef, useState } from "react";

import { MessageSquare, SlidersHorizontal } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import CommentInput from "./CommentInput";
import CommentThread from "./CommentThread";
import {
    addComment,
    CommentError,
    CommentErrorCode,
    deleteComment,
    replyToComment,
    resolveComment,
    subscribeToComments,
    updateComment,
} from "../services/comment.service";

import type { Comment } from "../types";

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

/** Error lookup table used for normalizing Firestore/Logic errors into user-friendly strings. */
function mapError(err: unknown, fallback: string): string {
    if (err instanceof CommentError) {
        switch (err.code) {
            case CommentErrorCode.PERMISSION_DENIED:
                return "You don't have permission to do that.";
            case CommentErrorCode.INVALID_CONTENT:
                return err.message;
            case CommentErrorCode.COMMENT_NOT_FOUND:
                return "Comment not found — it may have been deleted.";
            case CommentErrorCode.NETWORK_ERROR:
                return "Network error. Please check your connection.";
            default:
                return err.message || fallback;
        }
    }
    return fallback;
}

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
    const { showAlert } = useAlert();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [showResolved, setShowResolved] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(0);

    // Reset loading state whenever the subscription target changes
    useEffect(() => {
        setLoading(true);
        setComments([]);
    }, [ownerId, lessonId, cardId, retryKey]);

    /**
     * Real-time Synchronization
     * Establishes a Firestore listener. Automatically cleans up on unmount or
     * when the target card/lesson changes.
     */
    useEffect(() => {
        let active = true;
        const unsub = subscribeToComments(
            ownerId,
            lessonId,
            cardId,
            (updated) => {
                if (!active) return;
                setComments(updated);
                setLoading(false);
                setIsNetworkError(false);
            },
            (err) => {
                if (!active) return;
                console.error("[CommentPanel]", err);
                setIsNetworkError(true);
                showAlert("error", "Lost connection to comments. Trying to reconnect...");
            },
        );
        return () => {
            active = false;
            unsub();
        };
    }, [ownerId, lessonId, cardId, retryKey]);

    /**
     * Scroll Management
     * Automatically scrolls to the bottom when a NEW comment is added to the thread.
     * Prevents jumping by comparing the previous count.
     */
    useEffect(() => {
        if (!loading && comments.length > prevCountRef.current) {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        }
        prevCountRef.current = comments.length;
    }, [comments.length, loading]);

    // ── Derived list ──────────────────────────────────────────────────────────
    const sorted = [...comments]
        .filter((c) => showResolved || !c.resolved)
        .sort((a, b) => a.createdAt - b.createdAt);

    const resolvedCount = comments.filter((c) => c.resolved).length;

    // ── Handlers ──────────────────────────────────────────────────────────────
    /**
     * Async Action Wrapper
     * Uniformly handles error catching, network status tracking, and UI error state reporting.
     */
    const wrap = async (fn: () => Promise<void>, fallback: string, successMsg?: string) => {
        try {
            setIsNetworkError(false);
            await fn();
            if (successMsg) {
                showAlert("success", successMsg);
            }
        } catch (err) {
            const msg = mapError(err, fallback);
            setIsNetworkError(
                err instanceof CommentError && err.code === CommentErrorCode.NETWORK_ERROR,
            );
            showAlert("error", msg);
            throw err;
        }
    };

    const handleAdd = (content: string) =>
        wrap(
            () =>
                addComment(
                    ownerId,
                    lessonId,
                    cardId,
                    content,
                    currentUserId,
                    currentUserName,
                    currentUserEmail,
                ).then(() => {}),
            "Failed to add comment.",
        );

    const handleReply = (commentId: string, content: string) =>
        wrap(
            () =>
                replyToComment(
                    ownerId,
                    lessonId,
                    cardId,
                    commentId,
                    content,
                    currentUserId,
                    currentUserName,
                    currentUserEmail,
                ),
            "Failed to add reply.",
        );

    const handleResolve = (commentId: string) =>
        wrap(
            () => resolveComment(ownerId, lessonId, cardId, commentId, currentUserId),
            "Failed to resolve comment.",
            "Comment resolved",
        );

    const handleEdit = (commentId: string, content: string) =>
        wrap(
            () => updateComment(ownerId, lessonId, cardId, commentId, content, currentUserId),
            "Failed to edit comment.",
        );

    const handleDelete = (commentId: string) =>
        wrap(
            () => deleteComment(ownerId, lessonId, cardId, commentId, currentUserId, isOwner),
            "Failed to delete comment.",
            "Comment deleted",
        );

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
                    <span className="text-[13px] font-black text-[#3c3c3c]">Comments</span>
                    {comments.length > 0 && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-px text-[11px] font-black text-gray-500">
                            {sorted.length}
                        </span>
                    )}
                </div>

                {resolvedCount > 0 && (
                    <Button
                        variant="ghost"
                        onClick={() => setShowResolved((v) => !v)}
                        className={`!flex !items-center !gap-1 !rounded-lg !px-2 !py-1 !text-[11px] !font-bold shadow-none transition-colors hover:shadow-none active:translate-y-0 ${
                            showResolved
                                ? "!bg-gray-100 !text-gray-700"
                                : "!text-gray-400 hover:!text-gray-600"
                        }`}
                        title={showResolved ? "Hide resolved" : `Show ${resolvedCount} resolved`}
                        icon={SlidersHorizontal}
                        iconSize={11}
                    >
                        {showResolved ? "Hide resolved" : `${resolvedCount} resolved`}
                    </Button>
                )}
            </div>

            {/* ── Scrollable comment list ─────────────────────────────────── */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-2">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                                style={{ borderColor: themeColor, borderTopColor: "transparent" }}
                            />
                            <p className="text-[12px] font-bold text-gray-400">Loading…</p>
                        </div>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                        <MessageSquare size={28} className="text-gray-200" />
                        <p className="text-[13px] font-bold text-gray-400">
                            {showResolved ? "No comments yet" : "No open comments"}
                        </p>
                        <p className="text-[11px] text-gray-300">
                            {showResolved
                                ? "Be the first to start a discussion"
                                : "All threads are resolved"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sorted.map((comment) => (
                            <CommentThread
                                key={comment.id}
                                comment={comment}
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
                    placeholder="Add a comment… (⌘↵ to send)"
                    onSubmit={handleAdd}
                    themeColor={themeColor}
                    maxLength={2000}
                />
            </div>
        </div>
    );
};

export default CommentPanel;
