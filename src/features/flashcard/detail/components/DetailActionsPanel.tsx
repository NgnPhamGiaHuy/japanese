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

import { BookOpen, Copy, CopyPlus, Edit2, Info, Loader2, Lock } from "lucide-react";

import { Button } from "@/shared/components/ui";

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

    if (isOwner) {
        return (
            <aside className="flex flex-col gap-4">
                {onEdit && (
                    <Button
                        variant="ghost"
                        onClick={onEdit}
                        className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0"
                    >
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                                backgroundColor: `${themeHex}15`,
                                color: themeHex,
                            }}
                        >
                            <Edit2 size={22} />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-[#3c3c3c]">Edit Deck</div>
                            <div className="text-sm font-bold text-[#afafaf]">
                                Add, remove, or update cards
                            </div>
                        </div>
                    </Button>
                )}
                {onCopyLink && (
                    <Button
                        variant="ghost"
                        onClick={onCopyLink}
                        className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
                            <Copy size={22} />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-[#3c3c3c]">
                                {linkCopied ? "Link Copied!" : "Copy Share Link"}
                            </div>
                            <div className="text-sm font-bold text-[#afafaf]">
                                Share this deck with others
                            </div>
                        </div>
                    </Button>
                )}
                {onManageAccess && (
                    <Button
                        variant="ghost"
                        onClick={onManageAccess}
                        className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                            <Lock size={22} />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-[#3c3c3c]">Manage Access</div>
                            <div className="text-sm font-bold text-[#afafaf]">
                                Control who can view or comment
                            </div>
                        </div>
                    </Button>
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
                        className="text-[11px] font-black tracking-widest uppercase"
                        style={{ color: themeHex }}
                    >
                        Your Role
                    </p>
                    <p className="font-black text-[#3c3c3c] capitalize">{role}</p>
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
                        <p className="font-black text-[#3c3c3c]">
                            {role === "editor"
                                ? "Editor Access"
                                : role === "commenter"
                                  ? "Commenter Access"
                                  : "Viewer Access"}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-[#afafaf]">
                            {canEdit
                                ? "You have edit rights to this deck."
                                : role === "commenter"
                                  ? "You can comment but not edit cards."
                                  : "View only — no editing or commenting."}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 p-4">
                    <Info size={16} className="mt-0.5 shrink-0 text-[#ff9600]" />
                    <p className="text-xs font-bold text-gray-500">
                        Your game progress and learning data is strictly separate from the
                        owner&apos;s original metrics.
                    </p>
                </div>
            </div>

            {/* Shared user actions */}
            <div className="flex flex-col gap-3">
                {canEdit && onEdit && (
                    <Button
                        variant="ghost"
                        onClick={onEdit}
                        className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0"
                    >
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                                backgroundColor: `${themeHex}15`,
                                color: themeHex,
                            }}
                        >
                            <Edit2 size={22} />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-[#3c3c3c]">
                                Edit Deck Content
                            </div>
                            <div className="text-sm font-bold text-[#afafaf]">
                                Modify for all users
                            </div>
                        </div>
                    </Button>
                )}
                {onDuplicate ? (
                    <Button
                        variant="ghost"
                        onClick={onDuplicate}
                        disabled={saving}
                        className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0 disabled:opacity-50"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
                            {saving ? (
                                <Loader2 size={22} className="animate-spin" />
                            ) : (
                                <CopyPlus size={22} />
                            )}
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-[#3c3c3c]">
                                {saving ? "Duplicating..." : "Duplicate Deck"}
                            </div>
                            <div className="text-sm font-bold text-[#afafaf]">
                                Save a copy to your collection
                            </div>
                        </div>
                    </Button>
                ) : !currentUserId ? (
                    <Link href="/login" className="w-full">
                        <Button
                            variant="ghost"
                            className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
                                <CopyPlus size={22} />
                            </div>
                            <div className="text-left">
                                <div className="text-lg font-black text-[#3c3c3c]">
                                    Log in to Duplicate
                                </div>
                                <div className="text-sm font-bold text-[#afafaf]">
                                    Sign in to save this deck
                                </div>
                            </div>
                        </Button>
                    </Link>
                ) : null}
                {onCopyLink && (
                    <Button
                        variant="ghost"
                        onClick={onCopyLink}
                        className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600">
                            <Copy size={22} />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-black text-[#3c3c3c]">
                                {linkCopied ? "Link Copied!" : "Copy Share Link"}
                            </div>
                            <div className="text-sm font-bold text-[#afafaf]">
                                Share this deck with others
                            </div>
                        </div>
                    </Button>
                )}
            </div>
        </aside>
    );
};

export default DetailActionsPanel;
