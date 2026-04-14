/**
 * @file CommentThread
 * Container for a top-level comment and its flat list of replies.
 * Implements the "Google Docs style" 2-level nesting limit.
 */

"use client";

import { useState } from "react";

import { AlertTriangle } from "lucide-react";

import CommentItem from "./CommentItem";

import type { Comment } from "../types/flashcard.types";

export interface CommentThreadProps {
    /** The root comment object (contains an array of replies) */
    comment: Comment;
    /** Current logged-in user's ID for ownership checks */
    currentUserId: string;
    /** Resolved permission role (owner, editor, commenter, viewer) */
    currentUserRole: "viewer" | "commenter" | "editor" | "owner";
    /** Whether the user is the deck owner (bypasses some deletion restrictions) */
    isOwner: boolean;
    /** Deck-specific branding color */
    themeColor: string;
    /** Persistence handlers managed by the parent CommentPanel */
    onReply: (commentId: string, content: string) => Promise<void>;
    onResolve: (commentId: string) => Promise<void>;
    onEdit: (commentId: string, content: string) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
}

const CommentThread = ({
    comment,
    currentUserId,
    currentUserRole,
    isOwner,
    themeColor,
    onReply,
    onResolve,
    onEdit,
    onDelete,
}: CommentThreadProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const hasReplies = comment.replies.length > 0;

    const handleDelete = async () => {
        if (hasReplies) {
            setShowDeleteConfirm(true);
        } else {
            await onDelete(comment.id);
        }
    };

    return (
        <div
            className={`rounded-xl px-3 py-2.5 transition-colors ${
                comment.resolved ? "bg-gray-50 opacity-60" : "hover:bg-gray-50/60"
            }`}
        >
            {/* Root comment */}
            <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isOwner={isOwner}
                themeColor={themeColor}
                isReply={false}
                onReply={(content) => onReply(comment.id, content)}
                onResolve={() => onResolve(comment.id)}
                onEdit={(content) => onEdit(comment.id, content)}
                onDelete={handleDelete}
            />

            {/* Delete confirmation — inline, no modal */}
            {showDeleteConfirm && (
                <div className="mt-2 ml-9 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    <div className="flex-1">
                        <p className="mb-2 text-[12px] font-bold text-red-700">
                            Delete this comment and {comment.replies.length}{" "}
                            {comment.replies.length === 1 ? "reply" : "replies"}?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    setShowDeleteConfirm(false);
                                    await onDelete(comment.id);
                                }}
                                className="rounded-lg bg-red-500 px-3 py-1 text-[11px] font-black text-white hover:bg-red-600"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-black text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Replies — indented with connecting line */}
            {hasReplies && (
                <div className="mt-2 ml-9 space-y-2 border-l-2 border-gray-100 pl-3">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            isOwner={isOwner}
                            themeColor={themeColor}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentThread;
