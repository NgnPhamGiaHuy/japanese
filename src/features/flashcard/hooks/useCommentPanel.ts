"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useAlert } from "@/shared/providers";
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
 * Normalizes Firestore/logic errors into user-facing strings. `t` is passed in
 * rather than read via useTranslations() — this is a plain module function, not
 * a hook, so it can't call one itself.
 */
const mapError = (err: unknown, fallback: string, t: (key: string) => string): string => {
    if (err instanceof CommentError) {
        switch (err.code) {
            case CommentErrorCode.PERMISSION_DENIED:
                return t("permissionDenied");
            case CommentErrorCode.INVALID_CONTENT:
                return err.message;
            case CommentErrorCode.COMMENT_NOT_FOUND:
                return t("commentNotFound");
            case CommentErrorCode.NETWORK_ERROR:
                return t("networkError");
            default:
                return err.message || fallback;
        }
    }
    return fallback;
};

interface UseCommentPanelParams {
    ownerId: string;
    lessonId: string;
    cardId: string;
    currentUserId: string;
    currentUserName?: string | null;
    currentUserEmail?: string | null;
    isOwner: boolean;
}

/**
 * Owns CommentPanel's real-time subscription lifecycle, scroll-to-latest behavior,
 * and CRUD handlers (add/reply/resolve/edit/delete), so the component stays UI-only.
 */
export function useCommentPanel({
    ownerId,
    lessonId,
    cardId,
    currentUserId,
    currentUserName,
    currentUserEmail,
    isOwner,
}: UseCommentPanelParams) {
    const t = useTranslations("FlashcardComments");
    const { showAlert } = useAlert();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [retryKey] = useState(0);
    const [showResolved, setShowResolved] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(0);

    // Reset back to loading whenever the subscription target changes. Adjusted
    // during render rather than in an effect (React's documented pattern for
    // derived-from-props state) so the stale card's comments never paint for a
    // frame before the effect below re-subscribes.
    const target = `${ownerId}/${lessonId}/${cardId}/${retryKey}`;
    const [prevTarget, setPrevTarget] = useState(target);
    if (prevTarget !== target) {
        setPrevTarget(target);
        setLoading(true);
        setComments([]);
    }

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
                showAlert("error", t("connectionLost"));
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
            const msg = mapError(err, fallback, t);
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
            t("addCommentFailed"),
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
            t("addReplyFailed"),
        );

    const handleResolve = (commentId: string) =>
        wrap(
            () => resolveComment(ownerId, lessonId, cardId, commentId, currentUserId),
            t("resolveCommentFailed"),
            t("commentResolved"),
        );

    const handleEdit = (commentId: string, content: string) =>
        wrap(
            () => updateComment(ownerId, lessonId, cardId, commentId, content, currentUserId),
            t("editCommentFailed"),
        );

    const handleDelete = (commentId: string) =>
        wrap(
            () => deleteComment(ownerId, lessonId, cardId, commentId, currentUserId, isOwner),
            t("deleteCommentFailed"),
            t("commentDeleted"),
        );

    return {
        comments,
        loading,
        isNetworkError,
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
    };
}
