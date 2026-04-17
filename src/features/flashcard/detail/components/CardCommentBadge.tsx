/**
 * CardCommentBadge — Per-card comment count badge
 *
 * @remarks
 * Fetches comment metadata independently to avoid re-rendering entire card list.
 * Shows total count and highlights unresolved comments.
 */

"use client";

import { MessageCircle } from "lucide-react";

import { useCommentCount } from "@/features/flashcard/core/hooks";

import type { CardCommentBadgeProps } from "../types";

const CardCommentBadge = ({ ownerId, lessonId, cardId }: CardCommentBadgeProps) => {
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
};

export default CardCommentBadge;
