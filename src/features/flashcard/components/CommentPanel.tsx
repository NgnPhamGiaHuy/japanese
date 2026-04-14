/**
 * @file CommentPanel
 * The primary social interface for flashcard decks.
 * Orchestrates real-time Firebase subscriptions, CRUD operations, and threaded UI state.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { MessageSquare, RefreshCw, SlidersHorizontal } from "lucide-react";

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
 * Maps specialized CommentErrors to user-friendly UI strings.
 */
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

export interface CommentPanelProps {
    ownerId: string;
    lessonId: string;
    cardId: string;
    currentUserId: string;
    currentUserName?: string | null;
    currentUserEmail?: string | null;
    currentUserRole: "viewer" | "commenter" | "editor" | "owner";
    isOwner: boolean;
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
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                setError(null);
                setIsNetworkError(false);
            },
            (err) => {
                if (!active) return;
                console.error("[CommentPanel]", err);
                setError("Lost connection. Retrying…");
                setIsNetworkError(true);
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
    const wrap = async (fn: () => Promise<void>, fallback: string) => {
        try {
            setError(null);
            setIsNetworkError(false);
            await fn();
        } catch (err) {
            const msg = mapError(err, fallback);
            setIsNetworkError(
                err instanceof CommentError && err.code === CommentErrorCode.NETWORK_ERROR,
            );
            setError(msg);
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
                    <button
                        onClick={() => setShowResolved((v) => !v)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                            showResolved
                                ? "bg-gray-100 text-gray-700"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={showResolved ? "Hide resolved" : `Show ${resolvedCount} resolved`}
                    >
                        <SlidersHorizontal size={11} />
                        {showResolved ? "Hide resolved" : `${resolvedCount} resolved`}
                    </button>
                )}
            </div>

            {/* ── Error banner ───────────────────────────────────────────── */}
            {error && (
                <div className="mx-3 mt-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-red-600">{error}</p>
                        {isNetworkError && (
                            <button
                                onClick={() => {
                                    setError(null);
                                    setIsNetworkError(false);
                                    setRetryKey((k) => k + 1);
                                }}
                                className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700"
                            >
                                <RefreshCw size={11} />
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            )}

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
