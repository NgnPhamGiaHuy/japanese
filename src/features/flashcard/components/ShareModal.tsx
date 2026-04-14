"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, ChevronDown, Copy, Eye, Globe2, Lock, X } from "lucide-react";

import { buildShareId } from "@/features/flashcard/services";
import { Button } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { Lesson } from "../types";

interface ShareModalProps {
    lesson: Lesson;
    onShare: (isPublic: boolean, publicRole: Lesson["publicRole"]) => Promise<void>;
    onClose: () => void;
}

const ShareModal = ({ lesson, onShare, onClose }: ShareModalProps) => {
    const { user } = useAppStore();

    // ── Role derivation ──────────────────────────────────────────────────
    const isOwner = !!user && lesson.userId === user.uid;

    // Derive share link deterministically — no extra state needed
    const shareLink = useMemo(() => {
        if (typeof window === "undefined") return "";
        if (!user) return "";
        const id = buildShareId(user.uid, lesson.id);
        return `${window.location.origin}/flashcard/shared/${id}`;
    }, [user, lesson.id]);

    // ── Local edit state (only meaningful for owners) ─────────────────
    const [isPublic, setIsPublic] = useState<boolean>(!!lesson.isPublic);
    const [role, setRole] = useState<Lesson["publicRole"]>(lesson.publicRole ?? "viewer");

    // Sync when the lesson prop changes (real-time update or new lesson opened)
    useEffect(() => {
        setIsPublic(!!lesson.isPublic);
        setRole(lesson.publicRole ?? "viewer");
    }, [lesson.isPublic, lesson.publicRole]);

    // ── UI state ──────────────────────────────────────────────────────
    const [openPrivacyMenu, setOpenPrivacyMenu] = useState(false);
    const [openRoleMenu, setOpenRoleMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const themeHex = lesson.themeColor || "#1cb0f6";
    const themeColorStr = hexToThemeColor(themeHex);

    const handleCopy = async () => {
        if (!shareLink) return;
        if (isOwner) {
            // Persist settings first so the link works immediately
            setSaving(true);
            try {
                await onShare(isPublic, role);
                await navigator.clipboard.writeText(shareLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("[ShareModal] handleCopy failed:", err);
            } finally {
                setSaving(false);
            }
        } else {
            // Viewer just copies the current URL
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = async () => {
        if (!isOwner) {
            onClose();
            return;
        }
        setSaving(true);
        try {
            await onShare(isPublic, role);
            onClose();
        } catch (err) {
            console.error("[ShareModal] handleSave failed:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-gray-100 p-6">
                    <h2 className="text-2xl font-black text-[#3c3c3c]">Share Deck</h2>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        icon={X}
                        className="px-3"
                        disabled={saving}
                    />
                </div>

                <div className="p-6">
                    {/* ── Owner view ──────────────────────────────────────────────── */}
                    {isOwner ? (
                        <>
                            <h3 className="mb-4 text-base font-black text-[#3c3c3c]">
                                General access
                            </h3>

                            <div className="mb-6 flex flex-col gap-4 rounded-2xl border-2 border-gray-100 p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                        {isPublic ? (
                                            <Globe2 style={{ color: themeHex }} size={20} />
                                        ) : (
                                            <Lock className="text-gray-400" size={20} />
                                        )}
                                    </div>

                                    <div className="relative flex-1">
                                        {/* Privacy picker */}
                                        <button
                                            className="flex w-fit items-center gap-2 rounded-lg py-1 pr-2 text-lg font-black text-[#3c3c3c] transition-colors hover:bg-gray-100"
                                            onClick={() => setOpenPrivacyMenu((v) => !v)}
                                            disabled={saving}
                                        >
                                            {isPublic ? "Anyone with the link" : "Restricted"}
                                            <ChevronDown
                                                size={20}
                                                className={`text-gray-400 transition-transform ${openPrivacyMenu ? "rotate-180" : ""}`}
                                            />
                                        </button>

                                        {openPrivacyMenu && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setOpenPrivacyMenu(false)}
                                                />
                                                <div className="animate-in fade-in zoom-in-95 absolute top-10 left-0 z-50 w-64 overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg">
                                                    <button
                                                        className="flex w-full items-center gap-3 border-b-2 border-gray-50 p-4 text-left hover:bg-gray-50"
                                                        onClick={() => {
                                                            setIsPublic(false);
                                                            setOpenPrivacyMenu(false);
                                                        }}
                                                    >
                                                        <Lock className="text-gray-400" size={20} />
                                                        <div>
                                                            <div className="font-black text-[#3c3c3c]">
                                                                Restricted
                                                            </div>
                                                            <div className="text-xs font-bold text-gray-400">
                                                                Only people with access can open
                                                            </div>
                                                        </div>
                                                        {!isPublic && (
                                                            <Check
                                                                style={{ color: themeHex }}
                                                                size={20}
                                                            />
                                                        )}
                                                    </button>
                                                    <button
                                                        className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50"
                                                        onClick={() => {
                                                            setIsPublic(true);
                                                            setOpenPrivacyMenu(false);
                                                        }}
                                                    >
                                                        <Globe2
                                                            style={{ color: themeHex }}
                                                            size={20}
                                                        />
                                                        <div>
                                                            <div className="font-black text-[#3c3c3c]">
                                                                Anyone with the link
                                                            </div>
                                                            <div className="text-xs font-bold text-gray-400">
                                                                Anyone on the internet can view
                                                            </div>
                                                        </div>
                                                        {isPublic && (
                                                            <Check
                                                                style={{ color: themeHex }}
                                                                size={20}
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        <p className="mt-1 text-sm font-bold text-[#afafaf]">
                                            {isPublic
                                                ? "Anyone on the internet with the link can view."
                                                : "Only people with access can open with the link."}
                                        </p>
                                    </div>
                                </div>

                                {/* Role picker (only when public) */}
                                {isPublic && (
                                    <div className="relative ml-14 flex items-center justify-between border-t-2 border-gray-100 pt-3">
                                        <span className="text-sm font-bold text-gray-400">
                                            Role
                                        </span>
                                        <button
                                            className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-[#3c3c3c] transition-colors hover:bg-gray-100"
                                            onClick={() => setOpenRoleMenu((v) => !v)}
                                            disabled={saving}
                                        >
                                            <span className="capitalize">{role}</span>
                                            <ChevronDown
                                                size={16}
                                                className={`text-gray-400 transition-transform ${openRoleMenu ? "rotate-180" : ""}`}
                                            />
                                        </button>

                                        {openRoleMenu && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setOpenRoleMenu(false)}
                                                />
                                                <div className="animate-in fade-in zoom-in-95 absolute top-14 right-0 z-50 w-40 overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg">
                                                    {(
                                                        ["viewer", "commenter", "editor"] as const
                                                    ).map((r) => (
                                                        <button
                                                            key={r}
                                                            className="flex w-full items-center justify-between p-4 text-left font-bold text-[#3c3c3c] capitalize hover:bg-gray-50"
                                                            onClick={() => {
                                                                setRole(r);
                                                                setOpenRoleMenu(false);
                                                            }}
                                                        >
                                                            {r}
                                                            {role === r && (
                                                                <Check
                                                                    style={{ color: themeHex }}
                                                                    size={16}
                                                                />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ── Viewer / unauthenticated view ─────────────────────────── */
                        <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-gray-100 p-4">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${themeHex}20` }}
                            >
                                <Eye style={{ color: themeHex }} size={20} />
                            </div>
                            <div>
                                <p className="font-black text-[#3c3c3c]">View only</p>
                                <p className="text-sm font-bold text-[#afafaf]">
                                    You can study this deck but cannot edit it.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="flex items-center justify-between pt-2">
                        <Button
                            variant="secondary"
                            color={copied ? "green" : "gray"}
                            icon={copied ? Check : Copy}
                            onClick={handleCopy}
                            className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
                                copied
                                    ? "border-[#58cc02] bg-[#f2fbf0] text-[#58cc02]"
                                    : "border-gray-200 text-[#3c3c3c] hover:bg-gray-50"
                            }`}
                            disabled={saving}
                        >
                            {copied ? "Link copied" : "Copy link"}
                        </Button>

                        <Button
                            variant="primary"
                            color={themeColorStr}
                            onClick={handleSave}
                            className="px-8 py-3 text-sm"
                            disabled={saving}
                        >
                            {saving ? "Saving…" : isOwner ? "Done" : "Close"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
