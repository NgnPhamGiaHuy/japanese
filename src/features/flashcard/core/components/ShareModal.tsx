"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, ChevronDown, Copy, Mail, ShieldAlert, X } from "lucide-react";

import { buildShareId, inviteByEmail, revokeEmailInvite } from "@/features/flashcard/core/services";
import { ROLE_CONFIG, sanitizePublicRole } from "@/features/flashcard/core/utils/rbac";
import {
    resolveVisibilityColor,
    VISIBILITY_MAPPINGS,
    VisibilityLevel,
} from "@/features/flashcard/core/utils/visibility";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { Button, Select } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";

import type { DeckAccessRole } from "@/features/flashcard/core/types";
import type { SelectOption } from "@/shared/components/ui";
import type { Lesson } from "../types";

/**
 * Collaborative Access Controller (Share Modal)
 *
 * @remarks
 * Orchestrates a "Google Docs" style permissions model. Manages:
 * 1. Public Access: Three modes — Restricted, Link-only, Fully Public.
 * 2. Targeted Invites: Email-based invitations with explicit RBAC.
 * 3. Role Life-cycle: Updating and revoking existing collaborator access.
 *
 * @example
 * <ShareModal lesson={lesson} onShareLink={handleShare} onUpdateRoles={handleUpdate} onClose={close} />
 */

/** Access levels defining what actions a user can perform on a shared deck. */
export type Role = DeckAccessRole;

/**
 * Three-tier privacy model:
 * - restricted: only explicitly invited users
 * - link: anyone with the share link (not discoverable)
 * - public: fully public, discoverable without a link
 */
type PrivacyMode = "restricted" | "link" | "public";

const sharingOptions: SelectOption<Role>[] = [
    {
        value: "viewer",
        label: ROLE_CONFIG.viewer.label,
        icon: ROLE_CONFIG.viewer.icon,
        color: ROLE_CONFIG.viewer.color,
    },
    {
        value: "commenter",
        label: ROLE_CONFIG.commenter.label,
        icon: ROLE_CONFIG.commenter.icon,
        color: ROLE_CONFIG.commenter.color,
    },
    {
        value: "editor",
        label: ROLE_CONFIG.editor.label,
        icon: ROLE_CONFIG.editor.icon,
        color: ROLE_CONFIG.editor.color,
    },
];

/**
 * Options for the public/link "Default role" picker.
 * Editor is intentionally excluded — public access is capped at commenter.
 */
const publicRoleOptions: SelectOption<"viewer" | "commenter">[] = [
    {
        value: "viewer",
        label: ROLE_CONFIG.viewer.label,
        icon: ROLE_CONFIG.viewer.icon,
        color: ROLE_CONFIG.viewer.color,
    },
    {
        value: "commenter",
        label: ROLE_CONFIG.commenter.label,
        icon: ROLE_CONFIG.commenter.icon,
        color: ROLE_CONFIG.commenter.color,
    },
];

interface ShareModalProps {
    /** The deck being shared */
    lesson: Lesson;
    /**
     * Callback for toggling public link access and default public role.
     * isPublic=true means fully public (discoverable); allowLinkAccess=true with isPublic=false means link-only.
     */
    onShareLink: (
        allowLinkAccess: boolean,
        publicRole: Lesson["publicRole"],
        isPublic?: boolean,
    ) => Promise<void>;
    /** Callback for specific user role management */
    onUpdateRoles: (newRoles: Record<string, Role>, newCollaborators: string[]) => Promise<void>;
    /** Close logic */
    onClose: () => void;
}
const ShareModal = ({ lesson, onShareLink, onUpdateRoles, onClose }: ShareModalProps) => {
    const { user } = useAppStore();
    const { showAlert } = useAlert();

    const auditClient = (action: string, extra: Record<string, unknown>) => {
        if (!user) return;
        enqueueClientLog(() => user.getIdToken(), {
            action,
            entityType: "share",
            entityId: lesson.id,
            level: "info",
            metadata: {
                logType: "USER_ACTION",
                userName: user.displayName ?? undefined,
                userEmail: user.email ?? undefined,
                lessonTitle: lesson.title,
                ...extra,
            },
        });
    };

    // ── Role derivation (Logic Orchestration) ──────────────────────────────────
    /**
     * Finds the user's effective role.
     * Priority: Explicit Firestore Role > Public Role (if link access enabled) > Viewer.
     */
    let currentRole = user ? lesson.roles?.[user.uid] : null;
    if (!currentRole && (lesson.allowLinkAccess || lesson.isPublic)) {
        currentRole = lesson.publicRole || "viewer";
    }

    const isOwner = currentRole === "owner";

    /** Permission guard: Only owners can invite or change roles of others */
    const canManageRoles = isOwner;

    /**
     * Deterministic Share Link
     * Generated from userId + lessonId via buildShareId utility.
     */
    const shareLink = useMemo(() => {
        const ownerId = lesson.ownerId ?? lesson.userId;
        if (typeof window === "undefined" || !ownerId) return "";
        const id = buildShareId(ownerId, lesson.id);
        return `${window.location.origin}/flashcard/shared/${id}`;
    }, [lesson.ownerId, lesson.userId, lesson.id]);

    // ── Local edit state ──────────────────────────────────────────────────
    const derivePrivacyMode = (): PrivacyMode => {
        if (lesson.isPublic) return "public";
        if (lesson.allowLinkAccess) return "link";
        return "restricted";
    };

    const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(derivePrivacyMode);
    const [publicRole, setPublicRole] = useState<"viewer" | "commenter">(
        sanitizePublicRole(lesson.publicRole),
    );

    // Derived booleans from privacyMode for service calls.
    const allowLinkAccess = privacyMode !== "restricted";
    const isPublicMode = privacyMode === "public";

    const [roles, setRoles] = useState<Record<string, Role>>(lesson.roles || {});
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<Role>("viewer");
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Sync when the lesson prop changes (for real-time consistency)
    useEffect(() => {
        if (lesson.isPublic) setPrivacyMode("public");
        else if (lesson.allowLinkAccess) setPrivacyMode("link");
        else setPrivacyMode("restricted");
        setPublicRole(sanitizePublicRole(lesson.publicRole));
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
        showAlert("success", "Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    /** Handles privacy mode change — persists to Firestore immediately. */
    const handleSavePrivacyMode = async (mode: PrivacyMode) => {
        const prev = privacyMode;
        setPrivacyMode(mode);
        setSaving(true);
        try {
            const newAllowLink = mode !== "restricted";
            const newIsPublic = mode === "public";
            await onShareLink(newAllowLink, publicRole, newIsPublic);
            auditClient(ActivityAction.SHARE_PRIVACY_UPDATED, {
                mode,
                allowLinkAccess: newAllowLink,
                isPublic: newIsPublic,
            });
            const labels: Record<PrivacyMode, string> = {
                restricted: "Access restricted",
                link: "Link sharing enabled",
                public: "Deck is now public",
            };
            showAlert("success", labels[mode]);
        } catch (err) {
            console.error("[ShareModal] handleSavePrivacyMode failed:", err);
            setPrivacyMode(prev);
            showAlert("error", "Failed to update privacy settings");
        } finally {
            setSaving(false);
        }
    };

    /** Handles the default role for public/link visitors — capped at commenter. */
    const handleSavePublicRole = async (role: "viewer" | "commenter") => {
        setPublicRole(role);
        setSaving(true);
        try {
            await onShareLink(allowLinkAccess, role, isPublicMode);
            auditClient(ActivityAction.SHARE_PRIVACY_UPDATED, { publicRole: role });
            showAlert("success", `Default role set to ${role}`);
        } catch (err) {
            console.error("[ShareModal] handleSavePublicRole failed:", err);
            showAlert("error", "Failed to update public role");
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
            auditClient(ActivityAction.SHARE_ROLES_UPDATED, {
                collaboratorCount: newCollaborators.length,
            });
            showAlert("success", "Collaborator permissions updated");
        } catch (err) {
            console.error("[ShareModal] commitRolesUpdate failed:", err);
            setRoles(lesson.roles || {});
            showAlert("error", "Failed to update permissions");
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
            const ownerId = lesson.ownerId ?? lesson.userId;
            if (!ownerId) return;
            await inviteByEmail(
                ownerId,
                lesson.id,
                email,
                inviteRole as "viewer" | "commenter" | "editor",
                user?.displayName,
                user?.photoURL ?? null,
                lesson.title,
            );
            setInviteEmail("");
            showAlert("success", `Invitation sent to ${email}`);
        } catch (err) {
            console.error("[ShareModal] handleInvite failed:", err);
            setInviteError("Failed to send invite. Please try again.");
            showAlert("error", "Invitation failed");
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeEmailInvite = async (email: string) => {
        const ownerId = lesson.ownerId ?? lesson.userId;
        if (!ownerId) return;
        setSaving(true);
        try {
            await revokeEmailInvite(ownerId, lesson.id, email);
            showAlert("success", "Invitation revoked");
        } catch (err) {
            console.error("[ShareModal] handleRevokeEmailInvite failed:", err);
            showAlert("error", "Failed to revoke invitation");
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
                                    <Select
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
                                    <p className="mt-1.5 text-xs font-bold text-red-500">
                                        {inviteError}
                                    </p>
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
                                            : meta?.displayName ||
                                              meta?.email?.split("@")[0] ||
                                              `User ${uid.substring(0, 6)}`;
                                        const displayEmail = isCurrentUser
                                            ? user?.email || ""
                                            : meta?.email || "";
                                        const initial = isCurrentUser
                                            ? (
                                                  user?.displayName?.[0] ??
                                                  user?.email?.[0] ??
                                                  "Y"
                                              ).toUpperCase()
                                            : (
                                                  meta?.displayName?.[0] ??
                                                  meta?.email?.[0] ??
                                                  uid[0]
                                              ).toUpperCase();

                                        return (
                                            <div
                                                key={uid}
                                                className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500">
                                                            {initial}
                                                        </div>
                                                        <div
                                                            className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[8px] text-white"
                                                            style={{
                                                                backgroundColor:
                                                                    ROLE_CONFIG[r].color,
                                                            }}
                                                        >
                                                            {(() => {
                                                                const RoleIcon =
                                                                    ROLE_CONFIG[r].icon;
                                                                return <RoleIcon size={8} />;
                                                            })()}
                                                        </div>
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

                                                <Select
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
                                {lesson.invitedEmails &&
                                    Object.keys(lesson.invitedEmails).length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="mb-2 text-xs font-black tracking-wider text-gray-400 uppercase">
                                                Pending invites
                                            </h4>
                                            <div className="flex flex-col gap-2">
                                                {Object.entries(lesson.invitedEmails).map(
                                                    ([email, invite]) => (
                                                        <div
                                                            key={email}
                                                            className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                                                    <Mail size={18} />
                                                                </div>
                                                                <div>
                                                                    <div className="font-black text-[#3c3c3c]">
                                                                        {email}
                                                                    </div>
                                                                    <div className="text-xs font-bold text-amber-500">
                                                                        Invite pending ·{" "}
                                                                        {invite.role}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    void handleRevokeEmailInvite(
                                                                        email,
                                                                    )
                                                                }
                                                                disabled={saving}
                                                                className="!p-1 !text-xs !font-bold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                                            >
                                                                Revoke
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
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
                                        {(() => {
                                            const v =
                                                VISIBILITY_MAPPINGS[
                                                    privacyMode === "public"
                                                        ? VisibilityLevel.PUBLIC
                                                        : privacyMode === "link"
                                                          ? VisibilityLevel.SHARED
                                                          : VisibilityLevel.PRIVATE
                                                ];
                                            const Icon = v.icon;
                                            return (
                                                <Icon
                                                    style={{
                                                        color: resolveVisibilityColor(v, themeHex),
                                                    }}
                                                    size={20}
                                                />
                                            );
                                        })()}
                                    </div>

                                    <div className="relative flex-1">
                                        {/* Privacy picker */}
                                        <Button
                                            variant="ghost"
                                            className="flex w-fit items-center gap-2 !py-1 !pr-2 !text-lg !font-black text-[#3c3c3c] hover:bg-gray-100"
                                            onClick={() => setOpenPrivacyMenu((v) => !v)}
                                            disabled={saving}
                                        >
                                            {
                                                VISIBILITY_MAPPINGS[
                                                    privacyMode === "public"
                                                        ? VisibilityLevel.PUBLIC
                                                        : privacyMode === "link"
                                                          ? VisibilityLevel.SHARED
                                                          : VisibilityLevel.PRIVATE
                                                ].label
                                            }
                                            <ChevronDown
                                                size={20}
                                                className={`text-gray-400 transition-transform ${openPrivacyMenu ? "rotate-180" : ""}`}
                                            />
                                        </Button>

                                        {openPrivacyMenu && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setOpenPrivacyMenu(false)}
                                                />
                                                <div className="animate-in fade-in zoom-in-95 absolute top-10 left-0 z-50 w-72 overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg">
                                                    {(
                                                        ["restricted", "link", "public"] as const
                                                    ).map((mode) => {
                                                        const level =
                                                            mode === "public"
                                                                ? VisibilityLevel.PUBLIC
                                                                : mode === "link"
                                                                  ? VisibilityLevel.SHARED
                                                                  : VisibilityLevel.PRIVATE;
                                                        const v = VISIBILITY_MAPPINGS[level];
                                                        const Icon = v.icon;
                                                        const isSelected = privacyMode === mode;

                                                        return (
                                                            <Button
                                                                key={mode}
                                                                variant="ghost"
                                                                className="flex w-full items-center !justify-start gap-3 !rounded-none border-b-2 border-gray-50 !p-4 !text-left shadow-none hover:bg-gray-50 hover:shadow-none"
                                                                onClick={() => {
                                                                    void handleSavePrivacyMode(
                                                                        mode,
                                                                    );
                                                                    setOpenPrivacyMenu(false);
                                                                }}
                                                            >
                                                                <Icon
                                                                    className="shrink-0"
                                                                    style={{
                                                                        color: resolveVisibilityColor(
                                                                            v,
                                                                            themeHex,
                                                                        ),
                                                                    }}
                                                                    size={20}
                                                                />
                                                                <div className="flex-1 text-left">
                                                                    <div className="font-black text-[#3c3c3c]">
                                                                        {v.label}
                                                                    </div>
                                                                    <div className="text-xs font-bold text-gray-400">
                                                                        {v.description}
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <Check
                                                                        style={{
                                                                            color: resolveVisibilityColor(
                                                                                v,
                                                                                themeHex,
                                                                            ),
                                                                        }}
                                                                        size={20}
                                                                        className="shrink-0"
                                                                    />
                                                                )}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}

                                        <p className="mt-1 text-sm font-bold text-[#afafaf]">
                                            {
                                                VISIBILITY_MAPPINGS[
                                                    privacyMode === "public"
                                                        ? VisibilityLevel.PUBLIC
                                                        : privacyMode === "link"
                                                          ? VisibilityLevel.SHARED
                                                          : VisibilityLevel.PRIVATE
                                                ].description
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Role picker — shown for link and public modes, capped at commenter */}
                                {privacyMode !== "restricted" && (
                                    <div className="relative ml-14 flex items-center justify-between border-t-2 border-gray-100 pt-3">
                                        <span className="text-sm font-bold text-gray-400">
                                            Default role
                                        </span>
                                        <Select
                                            value={publicRole || "viewer"}
                                            options={publicRoleOptions}
                                            onChange={(r) =>
                                                void handleSavePublicRole(
                                                    r as "viewer" | "commenter",
                                                )
                                            }
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
