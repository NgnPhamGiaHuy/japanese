"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, ChevronDown, Copy, Globe2, Lock, ShieldAlert, X } from "lucide-react";

import { buildShareId } from "@/features/flashcard/services";
import { Button, CustomSelect } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { SelectOption } from "@/shared/components/ui";
import type { Lesson } from "../types";

export type Role = "owner" | "editor" | "commenter" | "viewer";

const sharingOptions: SelectOption<Role>[] = [
    { value: "viewer", label: "Viewer" },
    { value: "commenter", label: "Commenter" },
    { value: "editor", label: "Editor" },
];

interface ShareModalProps {
    lesson: Lesson;
    onShareLink: (allowLinkAccess: boolean, publicRole: Lesson["publicRole"]) => Promise<void>;
    onUpdateRoles: (newRoles: Record<string, Role>, newCollaborators: string[]) => Promise<void>;
    onClose: () => void;
}

const ShareModal = ({ lesson, onShareLink, onUpdateRoles, onClose }: ShareModalProps) => {
    const { user } = useAppStore();

    // ── Role derivation ──────────────────────────────────────────────────
    let currentRole = user ? lesson.roles?.[user.uid] : null;
    if (!currentRole && (lesson.allowLinkAccess || lesson.isPublic)) {
        currentRole = lesson.publicRole || "viewer";
    }

    const isOwner = currentRole === "owner" || (user && lesson.userId === user.uid);
    // If not owner, but editor, they can maybe add others? Usually only owner can change roles, but prompt says:
    // If OWNER: can change roles, can remove users
    // If EDITOR: can edit content, cannot change roles
    const canManageRoles = isOwner;

    // Derive share link deterministically
    const shareLink = useMemo(() => {
        if (typeof window === "undefined" || !lesson.userId) return "";
        const id = buildShareId(lesson.userId, lesson.id);
        return `${window.location.origin}/flashcard/shared/${id}`;
    }, [lesson.userId, lesson.id]);

    // ── Local edit state ──────────────────────────────────────────────────
    const [allowLinkAccess, setAllowLinkAccess] = useState<boolean>(
        !!lesson.allowLinkAccess || !!lesson.isPublic,
    );
    const [publicRole, setPublicRole] = useState<Lesson["publicRole"]>(
        lesson.publicRole ?? "viewer",
    );

    const [roles, setRoles] = useState<Record<string, Role>>(lesson.roles || {});
    const [inviteId, setInviteId] = useState("");
    const [inviteRole, setInviteRole] = useState<Role>("viewer");

    // Sync when the lesson prop changes (real-time update)
    useEffect(() => {
        setAllowLinkAccess(!!lesson.allowLinkAccess || !!lesson.isPublic);
        setPublicRole(lesson.publicRole ?? "viewer");
        setRoles(lesson.roles || {});
    }, [lesson]);

    // ── UI state ──────────────────────────────────────────────────────
    const [openPrivacyMenu, setOpenPrivacyMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const themeHex = lesson.themeColor || "#1cb0f6";
    const themeColorStr = hexToThemeColor(themeHex);

    const handleCopy = async () => {
        if (!shareLink) return;
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveLinkAccess = async (access: boolean) => {
        setAllowLinkAccess(access);
        setSaving(true);
        try {
            await onShareLink(access, publicRole);
        } catch (err) {
            console.error("[ShareModal] handleSaveLinkAccess failed:", err);
            setAllowLinkAccess(!access);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePublicRole = async (role: Lesson["publicRole"]) => {
        setPublicRole(role);
        setSaving(true);
        try {
            await onShareLink(allowLinkAccess, role);
        } catch (err) {
            console.error("[ShareModal] handleSavePublicRole failed:", err);
        } finally {
            setSaving(false);
        }
    };

    // ── Role Management ───────────────────────────────────────────────

    const commitRolesUpdate = async (newRoles: Record<string, Role>) => {
        setRoles(newRoles);
        const newCollaborators = Object.keys(newRoles);
        setSaving(true);
        try {
            await onUpdateRoles(newRoles, newCollaborators);
        } catch (err) {
            console.error("[ShareModal] commitRolesUpdate failed:", err);
            setRoles(lesson.roles || {});
        } finally {
            setSaving(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteId.trim()) return;
        const targetId = inviteId.trim();
        if (roles[targetId] === "owner") return;

        const newRoles = { ...roles, [targetId]: inviteRole };
        await commitRolesUpdate(newRoles);
        setInviteId("");
    };

    const handleUpdateUserRole = async (targetId: string, newRole: Role) => {
        if (roles[targetId] === "owner" || targetId === user?.uid) return;
        const newRoles = { ...roles, [targetId]: newRole };
        await commitRolesUpdate(newRoles);
    };

    const handleRemoveUser = async (targetId: string) => {
        if (roles[targetId] === "owner" || targetId === user?.uid) return;
        const newRoles = { ...roles };
        delete newRoles[targetId];
        await commitRolesUpdate(newRoles);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
            <div className="my-auto flex w-full max-w-lg flex-col rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white shadow-xl">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b-2 border-gray-100 p-6">
                    <h2 className="text-2xl font-black text-[#3c3c3c]">Share Deck</h2>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        icon={X}
                        className="px-3"
                        disabled={saving}
                    />
                </div>

                <div className="overflow-visible p-6">
                    {/* ── Role specific views ──────────────────────────────────────── */}
                    {canManageRoles ? (
                        <>
                            {/* Invite Input */}
                            <div className="mb-6 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Add people and groups (User ID)"
                                        className="h-12 w-full rounded-xl border-2 border-gray-200 px-4 font-bold text-[#3c3c3c] transition-colors outline-none focus:border-[#1cb0f6]"
                                        value={inviteId}
                                        onChange={(e) => setInviteId(e.target.value)}
                                        disabled={saving}
                                    />
                                </div>
                                <CustomSelect
                                    value={inviteRole}
                                    options={sharingOptions}
                                    onChange={(r) => setInviteRole(r)}
                                    disabled={saving}
                                    themeHex={themeHex}
                                    align="right"
                                />
                                <Button
                                    onClick={handleInvite}
                                    disabled={!inviteId.trim() || saving}
                                    variant="primary"
                                    color="blue"
                                    className="h-12 px-6"
                                >
                                    Invite
                                </Button>
                            </div>

                            {/* Collaborators List */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-sm font-black tracking-wider text-[#3c3c3c] uppercase">
                                    People with access
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(roles).map(([uid, r]) => (
                                        <div
                                            key={uid}
                                            className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500">
                                                    {uid.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-[#3c3c3c]">
                                                        {uid === user?.uid
                                                            ? "You"
                                                            : `User: ${uid.substring(0, 8)}...`}
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-400">
                                                        {uid === user?.uid
                                                            ? user?.email || "Owner"
                                                            : uid}
                                                    </div>
                                                </div>
                                            </div>

                                            <CustomSelect
                                                value={r}
                                                options={sharingOptions}
                                                onChange={(newRole) =>
                                                    handleUpdateUserRole(uid, newRole)
                                                }
                                                onRemove={
                                                    r !== "owner" && uid !== user?.uid
                                                        ? () => handleRemoveUser(uid)
                                                        : undefined
                                                }
                                                removeLabel="Remove access"
                                                disabled={saving || r === "owner"}
                                                themeHex={themeHex}
                                                variant="compact"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <h3 className="mb-4 border-t-2 border-gray-100 pt-6 text-base font-black text-[#3c3c3c]">
                                General access
                            </h3>

                            <div className="mb-6 flex flex-col gap-4 rounded-2xl border-2 border-gray-100 p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                        {allowLinkAccess ? (
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
                                            {allowLinkAccess
                                                ? "Anyone with the link"
                                                : "Restricted"}
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
                                                            void handleSaveLinkAccess(false);
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
                                                        {!allowLinkAccess && (
                                                            <Check
                                                                style={{ color: themeHex }}
                                                                size={20}
                                                            />
                                                        )}
                                                    </button>
                                                    <button
                                                        className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50"
                                                        onClick={() => {
                                                            void handleSaveLinkAccess(true);
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
                                                        {allowLinkAccess && (
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
                                            {allowLinkAccess
                                                ? "Anyone on the internet with the link can view."
                                                : "Only added people can open with the link."}
                                        </p>
                                    </div>
                                </div>

                                {/* Role picker (only when public) */}
                                {allowLinkAccess && (
                                    <div className="relative ml-14 flex items-center justify-between border-t-2 border-gray-100 pt-3">
                                        <span className="text-sm font-bold text-gray-400">
                                            Role
                                        </span>
                                        <CustomSelect
                                            value={publicRole || "viewer"}
                                            options={sharingOptions}
                                            onChange={(r) => void handleSavePublicRole(r as any)}
                                            disabled={saving}
                                            themeHex={themeHex}
                                            align="right"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ── Rest of users view ─────────────────────────── */
                        <div className="mb-6 flex flex-col gap-4">
                            <div className="flex items-center gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 p-4">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                                    style={{ backgroundColor: `${themeHex}20` }}
                                >
                                    <ShieldAlert style={{ color: themeHex }} size={20} />
                                </div>
                                <div>
                                    <p className="font-black text-[#3c3c3c] capitalize">
                                        {currentRole || "Viewer"} Access
                                    </p>
                                    <p className="text-sm font-bold text-[#afafaf]">
                                        {currentRole === "editor"
                                            ? "You can edit this deck&apos;s content, but only the owner can modify sharing settings."
                                            : currentRole === "commenter"
                                              ? "You can comment on items in this deck."
                                              : "You can study this deck but cannot edit it."}
                                    </p>
                                </div>
                            </div>

                            {/* Collaborator overview for non-owners */}
                            <div className="rounded-2xl border-2 border-gray-100 p-4">
                                <h4 className="mb-2 text-xs font-black tracking-widest text-[#afafaf] uppercase">
                                    Collaborators
                                </h4>
                                <div className="flex -space-x-2">
                                    {Object.entries(roles)
                                        .slice(0, 5)
                                        .map(([uid, r]) => (
                                            <div
                                                key={uid}
                                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-bold text-gray-500"
                                                title={`${uid} - ${r}`}
                                            >
                                                {uid.slice(0, 2).toUpperCase()}
                                            </div>
                                        ))}
                                    {Object.keys(roles).length > 5 && (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-bold text-gray-500">
                                            +{Object.keys(roles).length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer actions */}
                    <div className="flex shrink-0 items-center justify-between pt-2">
                        <Button
                            variant="secondary"
                            color={copied ? "green" : "gray"}
                            icon={copied ? Check : Copy}
                            onClick={handleCopy}
                            className={`h-12 rounded-2xl border-2 px-6 text-sm font-bold transition-colors ${
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
                            onClick={onClose}
                            className="h-12 px-10 text-sm"
                            disabled={saving}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
