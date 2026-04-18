/**
 * @file CommentItem
 * Primitive UI component for a single comment message.
 * Handles rendering, action buttons, and permission checks.
 */

"use client";

import { useState } from "react";

import { CheckCircle, Circle, Edit2, MessageSquare, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui";
import CommentInput from "./CommentInput";

import type { Comment, Reply } from "../types/flashcard.types";

export interface CommentItemProps {
    /** The comment/reply data object */
    comment: Comment | Reply;
    /** Current user's UID */
    currentUserId: string;
    /** Resolved permission role (owner, editor, commenter, viewer) */
    currentUserRole: "viewer" | "commenter" | "editor" | "owner";
    /** Global deck ownership flag (bypasses some deletion restrictions) */
    isOwner: boolean;
    /** Visual label for the author (e.g., 'owner', 'editor') */
    authorRole?: "owner" | "editor" | "commenter" | "viewer";
    /** Brand color for avatar */
    themeColor: string;
    /** Visual indentation flag */
    isReply?: boolean;
    /** Transition handlers managed by parent threads */
    onReply?: (content: string) => Promise<void>;
    onResolve?: () => Promise<void>;
    onEdit?: (content: string) => Promise<void>;
    onDelete?: () => Promise<void>;
}

// ─── Markdown renderer (pure function, no state) ──────────────────────────────
const renderMarkdown = (raw: string): string => {
    return raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        .replace(
            /`(.+?)`/g,
            "<code class='bg-gray-100 px-1 rounded text-[12px] font-mono'>$1</code>",
        )
        .replace(
            /(https?:\/\/[^\s<]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#1cb0f6] underline">$1</a>',
        )
        .replace(/\n/g, "<br>");
};

// ─── Relative time ────────────────────────────────────────────────────────────
const relativeTime = (ts: number): string => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ROLE_COLORS: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700",
    editor: "bg-blue-100 text-blue-700",
    commenter: "bg-green-100 text-green-700",
    viewer: "bg-gray-100 text-gray-600",
};

const CommentItem = ({
    comment,
    currentUserId,
    currentUserRole,
    isOwner,
    authorRole,
    themeColor,
    isReply = false,
    onReply,
    onResolve,
    onEdit,
    onDelete,
}: CommentItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);

    const isAuthor = comment.userId === currentUserId;
    const displayName = isAuthor ? "You" : comment.authorName || comment.authorEmail || "Unknown";
    const initial = isAuthor
        ? "Y"
        : (comment.authorName?.[0] ?? comment.authorEmail?.[0] ?? "?").toUpperCase();

    const isEdited = !!comment.updatedAt;
    const resolved = "resolved" in comment ? comment.resolved : false;

    const canEdit = isAuthor && !!onEdit;
    const canDelete = (isAuthor || isOwner) && !!onDelete;
    const canReply = !isReply && currentUserRole !== "viewer" && !!onReply;
    const canResolve =
        !isReply &&
        (currentUserRole === "editor" || currentUserRole === "owner" || isAuthor) &&
        !!onResolve;

    const handleEditSave = async (content: string) => {
        await onEdit!(content);
        setIsEditing(false);
    };

    const handleReplySave = async (content: string) => {
        await onReply!(content);
        setIsReplying(false);
    };

    return (
        <div className="group relative">
            <div className="flex gap-2.5">
                {/* Avatar */}
                <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                    style={{ backgroundColor: themeColor }}
                >
                    {initial}
                </div>

                {/* Body */}
                <div className="min-w-0 flex-1">
                    {/* Header row */}
                    <div className="mb-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="text-[13px] font-black text-[#3c3c3c]">{displayName}</span>
                        {authorRole && (
                            <span
                                className={`rounded-full px-1.5 py-px text-[10px] font-black capitalize ${ROLE_COLORS[authorRole] ?? ROLE_COLORS.viewer}`}
                            >
                                {authorRole}
                            </span>
                        )}
                        <span className="text-[11px] text-gray-400">
                            {relativeTime(comment.createdAt)}
                        </span>
                        {isEdited && (
                            <span className="text-[11px] text-gray-400 italic">(edited)</span>
                        )}
                        {resolved && (
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
                                <CheckCircle size={11} />
                                resolved
                            </span>
                        )}
                    </div>

                    {/* Content — inline replace with editor */}
                    {isEditing ? (
                        <div className="mb-1">
                            <CommentInput
                                placeholder="Edit your comment…"
                                onSubmit={handleEditSave}
                                onCancel={() => setIsEditing(false)}
                                initialValue={comment.content}
                                themeColor={themeColor}
                                compact
                            />
                        </div>
                    ) : (
                        <p
                            className="mb-1.5 text-[13px] leading-relaxed text-[#3c3c3c]"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
                        />
                    )}

                    {/* Actions — visible on hover, hidden when editing */}
                    {!isEditing && (
                        <div className="flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                            {canReply && !isReplying && (
                                <ActionBtn
                                    icon={<MessageSquare size={12} />}
                                    label="Reply"
                                    onClick={() => setIsReplying(true)}
                                />
                            )}
                            {canResolve && (
                                <ActionBtn
                                    icon={
                                        resolved ? <Circle size={12} /> : <CheckCircle size={12} />
                                    }
                                    label={resolved ? "Unresolve" : "Resolve"}
                                    onClick={onResolve!}
                                    color="text-emerald-600 hover:text-emerald-700"
                                />
                            )}
                            {canEdit && (
                                <ActionBtn
                                    icon={<Edit2 size={12} />}
                                    label="Edit"
                                    onClick={() => setIsEditing(true)}
                                    color="text-blue-500 hover:text-blue-700"
                                />
                            )}
                            {canDelete && (
                                <ActionBtn
                                    icon={<Trash2 size={12} />}
                                    label="Delete"
                                    onClick={onDelete!}
                                    color="text-red-400 hover:text-red-600"
                                />
                            )}
                        </div>
                    )}

                    {/* Inline reply input */}
                    {isReplying && (
                        <div className="mt-2">
                            <CommentInput
                                placeholder="Write a reply…"
                                onSubmit={handleReplySave}
                                onCancel={() => setIsReplying(false)}
                                themeColor={themeColor}
                                compact
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ActionBtn = ({
    icon: IconComp,
    label,
    onClick,
    color,
}: {
    icon: any;
    label: string;
    onClick: () => void;
    color?: string;
}) => {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={`!flex !h-auto !items-center !gap-1 !p-0 !text-[11px] !font-bold shadow-none transition-colors hover:shadow-none active:translate-y-0 ${color || "!text-gray-400 hover:!text-gray-600"}`}
        >
            {IconComp}
            {label}
        </Button>
    );
};

export default CommentItem;
