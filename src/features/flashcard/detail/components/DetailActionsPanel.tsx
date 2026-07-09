/**
 * DetailActionsPanel — Left panel with owner/shared user actions
 *
 * @remarks
 * Displays contextual actions based on user role:
 * - Owner: Edit, Copy Link, Manage Access
 * - Shared User: Role badge, Access info, Edit (if editor), Duplicate, Copy Link
 */

"use client";

import Link from "next/link";

import { BookOpen, Copy, CopyPlus, Edit2, Globe2, Info, Loader2, Lock } from "lucide-react";

import ActionRow from "./ActionRow";

import type { DetailActionsPanelProps } from "../types";

const DetailActionsPanel = ({
    ctx,
    currentUserId,
    onDuplicate,
    onCopyLink,
    linkCopied = false,
    onEdit,
    onManageAccess,
    saving = false,
}: DetailActionsPanelProps) => {
    const { lesson, role, isOwner } = ctx;
    const themeHex = lesson.themeColor || "#1cb0f6";
    const canEdit = role === "owner" || role === "editor";
    const themedIconStyle = { backgroundColor: `${themeHex}15`, color: themeHex };

    if (isOwner) {
        const isShared = !!(lesson.shareId || lesson.allowLinkAccess || lesson.isPublic);

        return (
            <aside className="flex flex-col gap-4">
                {onEdit && (
                    <ActionRow
                        icon={Edit2}
                        iconWrapperStyle={themedIconStyle}
                        title="Edit Deck"
                        subtitle="Add, remove, or update cards"
                        onClick={onEdit}
                    />
                )}

                {/* Share / Manage Access — always visible for owners */}
                {onManageAccess && (
                    <ActionRow
                        icon={isShared ? Globe2 : Lock}
                        iconWrapperClassName={
                            isShared ? "text-hiragana bg-[#ebf8e6]" : "bg-blue-50 text-blue-500"
                        }
                        title={
                            <span className="flex items-center gap-2">
                                <span>{isShared ? "Manage Access" : "Share Deck"}</span>
                                {isShared && (
                                    <span className="text-hiragana rounded-lg bg-[#ebf8e6] px-2 py-0.5 text-xs font-black tracking-wider uppercase">
                                        Public
                                    </span>
                                )}
                            </span>
                        }
                        subtitle={
                            isShared
                                ? "Control who can view or comment"
                                : "Enable link sharing for this deck"
                        }
                        onClick={onManageAccess}
                    />
                )}

                {/* Copy link — only when sharing is active */}
                {isShared && onCopyLink && (
                    <ActionRow
                        icon={Copy}
                        iconWrapperClassName="bg-gray-100 text-gray-600"
                        title={linkCopied ? "Link Copied!" : "Copy Share Link"}
                        subtitle="Share this deck with others"
                        onClick={onCopyLink}
                    />
                )}
            </aside>
        );
    }

    return (
        <aside className="flex flex-col gap-4">
            {/* Role badge */}
            <div
                className="flex items-center gap-3 rounded-2xl border-2 p-4 shadow-sm"
                style={{
                    backgroundColor: `${themeHex}10`,
                    borderColor: `${themeHex}40`,
                }}
            >
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ backgroundColor: themeHex }}
                >
                    {role[0].toUpperCase()}
                </div>
                <div>
                    <p
                        className="text-xs font-black tracking-widest uppercase"
                        style={{ color: themeHex }}
                    >
                        Your Role
                    </p>
                    <p className="text-text font-black capitalize">{role}</p>
                </div>
            </div>

            {/* Access info card */}
            <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-4 border-b-2 border-gray-100 p-4">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${themeHex}15` }}
                    >
                        {canEdit ? (
                            <Edit2 size={18} style={{ color: themeHex }} />
                        ) : (
                            <BookOpen size={18} style={{ color: themeHex }} />
                        )}
                    </div>
                    <div>
                        <p className="text-text font-black">
                            {role === "editor"
                                ? "Editor Access"
                                : role === "commenter"
                                  ? "Commenter Access"
                                  : "Viewer Access"}
                        </p>
                        <p className="text-muted mt-0.5 text-xs font-bold">
                            {canEdit
                                ? "You have edit rights to this deck."
                                : role === "commenter"
                                  ? "You can comment but not edit cards."
                                  : "View only — no editing or commenting."}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 p-4">
                    <Info size={16} className="text-survival mt-0.5 shrink-0" />
                    <p className="text-xs font-bold text-gray-500">
                        Your game progress and learning data is strictly separate from the
                        owner&apos;s original metrics.
                    </p>
                </div>
            </div>

            {/* Shared user actions */}
            <div className="flex flex-col gap-3">
                {canEdit && onEdit && (
                    <ActionRow
                        icon={Edit2}
                        iconWrapperStyle={themedIconStyle}
                        title="Edit Deck Content"
                        subtitle="Modify for all users"
                        onClick={onEdit}
                    />
                )}
                {onDuplicate ? (
                    <ActionRow
                        icon={saving ? Loader2 : CopyPlus}
                        iconClassName={saving ? "animate-spin" : undefined}
                        iconWrapperClassName="bg-gray-100 text-gray-600"
                        title={saving ? "Duplicating..." : "Duplicate Deck"}
                        subtitle="Save a copy to your collection"
                        onClick={onDuplicate}
                        disabled={saving}
                    />
                ) : !currentUserId ? (
                    <Link href="/login" className="w-full">
                        <ActionRow
                            icon={CopyPlus}
                            iconWrapperClassName="bg-gray-100 text-gray-600"
                            title="Log in to Duplicate"
                            subtitle="Sign in to save this deck"
                        />
                    </Link>
                ) : null}
                {onCopyLink && (
                    <ActionRow
                        icon={Copy}
                        iconWrapperClassName="bg-gray-100 text-gray-600"
                        title={linkCopied ? "Link Copied!" : "Copy Share Link"}
                        subtitle="Share this deck with others"
                        onClick={onCopyLink}
                    />
                )}
            </div>
        </aside>
    );
};

export default DetailActionsPanel;
