import { useEffect, useState } from "react";

import { subscribeToComments } from "../services/comment.service";

import type { Comment } from "../types/flashcard.types";

interface CommentCountResult {
    totalComments: number;
    unresolvedCount: number;
}

/**
 * Subscribes to real-time comment updates and calculates reactive summaries.
 *
 * @remarks
 * Aggregation details:
 * - **Total**: Sum of all top-level comments plus their nested replies.
 * - **Unresolved**: Count of parent comments that haven't been marked as 'resolved'.
 *
 * @param ownerId - UID of the deck owner.
 * @param lessonId - ID of the deck file.
 * @param cardId - ID of the specific flashcard.
 * @returns Aggregated metrics for social badges and UI filters.
 */
export function useCommentCount(
    ownerId: string,
    lessonId: string,
    cardId: string,
): CommentCountResult {
    const [totalComments, setTotalComments] = useState(0);
    const [unresolvedCount, setUnresolvedCount] = useState(0);

    useEffect(() => {
        if (!ownerId || !lessonId || !cardId) return;

        const unsubscribe = subscribeToComments(
            ownerId,
            lessonId,
            cardId,
            (comments: Comment[]) => {
                const total = comments.reduce(
                    (sum, comment) => sum + 1 + (comment.replies?.length ?? 0),
                    0,
                );
                const unresolved = comments.filter((c) => !c.resolved).length;
                setTotalComments(total);
                setUnresolvedCount(unresolved);
            },
            (err) => {
                console.error("[useCommentCount] Subscription error:", err);
            },
        );

        return () => unsubscribe();
    }, [ownerId, lessonId, cardId]);

    return { totalComments, unresolvedCount };
}
