/**
 * @file ShareModal
 * Management interface for deck sharing and collaborative permissions.
 * Implements a "Google Docs" style access control model with email-based invites.
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, ChevronDown, Copy, Globe2, Lock, Mail, ShieldAlert, X } from "lucide-react";

import { buildShareId, inviteByEmail, revokeEmailInvite } from "@/features/flashcard/services";
import { Button, CustomSelect } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { SelectOption } from "@/shared/components/ui";
import type { Lesson } from "../types";

/**
 * Permission levels for deck collaboration.
 * - owner: Full control, can delete deck, can manage roles.
 * - editor: Can modify cards and meta, cannot manage roles or delete deck.
 * - commenter: Can read and add comments to cards.
 * - viewer: Read-only access to cards.
 */
export type Role = "owner" | "editor" | "commenter" | "viewer";

const sharingOptions: SelectOption<Role>[] = [
    { value: "viewer", label: "Viewer" },
    { value: "commenter", label: "Commenter" },
    { value: "editor", label: "Editor" },
];

interface ShareModalProps {
    /** The deck being shared */
    lesson: Lesson;
    /** Callback for toggling public link access and default public role */
    onShareLink: (allowLinkAccess: boolean, publicRole: Lesson["publicRole"]) => Promise<void>;
    /** Callback for specific user role management */
    onUpdateRoles: (newRoles: Record<string, Role>, newCollaborators: string[]) => Promise<void>;
    /** Close logic */
    onClose: () => void;
}

/**
 * ShareModal Component
 *
 * @remarks
 * Orchestrates:
 * 1. **Public Access**: Toggling "Anyone with the link" and assigning a default role.
 * 2. **Invite System**: Adding specific users by ID with explicit roles.
 * 3. **Role Management**: Updating or removing existing collaborator access.
 * 4. **Adaptive UI**: Rendered differently for owners (Manage) vs collaborators (View).
 *
 * @example
 * <ShareModal lesson={lesson} onShareLink={handleShare} onUpdateRoles={handleUpdate} />
 */
const ShareModal = ({ lesson, onShareLink, onUpdateRoles, onClose }: ShareModalProps) => {
    const { user } = useAppStore();

    // ── Role derivation (Logic Orchestration) ──────────────────────────────────
    /**
     * Finds the user's effective role.
     * Priority: Explicit Firestore Role > Public Role (if link access enabled) > Viewer.
     */
    let currentRole = user ? lesson.roles?.[user.uid] : null;
    if (!currentRole && (lesson.allowLinkAccess || lesson.isPublic)) {
        currentRole = lesson.publicRole || "viewer";
    }

    const isOwner = currentRole === "owner" || (user && lesson.userId === user.uid);

    /** Permission guard: Only owners can invite or change roles of others */
    const canManageRoles = isOwner;

    /**
     * Deterministic Share Link
     * Generated from userId + lessonId via buildShareId utility.
     */
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
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<Role>("viewer");
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Sync when the lesson prop changes (for real-time consistency)
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

    /** Handles the "Anyone with link" toggle */
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

    /** Handles the default role for public visitors */
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

    /**
     * Orchestrator for persisting role changes.
     * Computes the new collaborators list (keys of roles object) and calls parent handler.
     */
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
        if (!inviteEmail.trim()) return;
        const email = inviteEmail.trim().toLowerCase();

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setInviteError("Please enter a valid email address.");
            return;
        }

        // Don't invite the owner
        if (email === user?.email?.toLowerCase()) {
            setInviteError("You can't invite yourself.");
            return;
        }

        setInviteError(null);
        setSaving(true);
        try {
            if (!lesson.userId) return;
            await inviteByEmail(
                lesson.userId,
                lesson.id,
                email,
                inviteRole as "viewer" | "commenter" | "editor",
                user?.displayName,
                lesson.title,
            );
            setInviteEmail("");
        } catch (err) {
            console.error("[ShareModal] handleInvite failed:", err);
            setInviteError("Failed to send invite. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeEmailInvite = async (email: string) => {
        if (!lesson.userId) return;
        setSaving(true);
        try {
            await revokeEmailInvite(lesson.userId, lesson.id, email);
        } catch (err) {
            console.error("[ShareModal] handleRevokeEmailInvite failed:", err);
        } finally {
            setSaving(false);
        }
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
                            <div className="mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="email"
                                            placeholder="Invite by email address"
                                            className="h-12 w-full rounded-xl border-2 border-gray-200 px-4 font-bold text-[#3c3c3c] transition-colors outline-none focus:border-[#1cb0f6]"
                                            value={inviteEmail}
                                            onChange={(e) => {
                                                setInviteEmail(e.target.value);
                                                setInviteError(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") void handleInvite();
                                            }}
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
                                        disabled={!inviteEmail.trim() || saving}
                                        variant="primary"
                                        color="blue"
                                        className="h-12 px-6"
                                    >
                                        Invite
                                    </Button>
                                </div>
                                {inviteError && (
                                    <p className="mt-1.5 text-xs font-bold text-red-500">{inviteError}</p>
                                )}
                            </div>

                            {/* Collaborators List */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-sm font-black tracking-wider text-[#3c3c3c] uppercase">
                                    People with access
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(roles).map(([uid, r]) => {
                                        const meta = lesson.collaboratorMeta?.[uid];
                                        const isCurrentUser = uid === user?.uid;
                                        const displayName = isCurrentUser
                                            ? "You"
                                            : meta?.displayName || meta?.email?.split("@")[0] || `User ${uid.substring(0, 6)}`;
                                        const displayEmail = isCurrentUser
                                            ? user?.email || ""
                                            : meta?.email || "";
                                        const initial = isCurrentUser
                                            ? (user?.displayName?.[0] ?? user?.email?.[0] ?? "Y").toUpperCase()
                                            : (meta?.displayName?.[0] ?? meta?.email?.[0] ?? uid[0]).toUpperCase();

                                        return (
                                        <div
                                            key={uid}
                                            className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500">
                                                    {initial}
                                                </div>
                                                <div>
                                                    <div className="font-black text-[#3c3c3c]">
                                                        {displayName}
                                                    </div>
                                                    {displayEmail && (
                                                        <div className="text-xs font-bold text-gray-400">
                                                            {displayEmail}
                                                        </div>
                                                    )}
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
                                        );
                                    })}
                                </div>

                                {/* Pending email invites */}
                                {lesson.invitedEmails && Object.keys(lesson.invitedEmails).length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="mb-2 text-xs font-black tracking-wider text-gray-400 uppercase">
                                            Pending invites
                                        </h4>
                                        <div className="flex flex-col gap-2">
                                            {Object.entries(lesson.invitedEmails).map(([email, invite]) => (
                                                <div
                                                    key={email}
                                                    className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-gray-50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                                            <Mail size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-[#3c3c3c]">{email}</div>
                                                            <div className="text-xs font-bold text-amber-500">
                                                                Invite pending · {invite.role}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => void handleRevokeEmailInvite(email)}
                                                        disabled={saving}
                                                        className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        Revoke
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                            ? "You can edit this deck's content, but only the owner can modify sharing settings."
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
