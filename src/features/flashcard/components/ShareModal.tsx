"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { Check, Copy, ShieldAlert, X } from "lucide-react";

import { buildShareId } from "@/features/flashcard/services";
import { sanitizePublicRole } from "@/features/flashcard/utils/rbac";
import { emitNotification } from "@/features/notifications/services";
import { useAppStore } from "@/lib/app-store";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { Button } from "@/shared/components/ui";
import { useCopyToClipboard, useDialogA11y } from "@/shared/hooks";
import { useAlert } from "@/shared/providers";
import { hexToThemeColor } from "@/shared/utils";
import ShareCollaboratorsPanel from "./ShareCollaboratorsPanel";
import SharePrivacyPicker from "./SharePrivacyPicker";
import { useShareInvites } from "../hooks";

import type { DeckAccessRole } from "@/features/flashcard/types";
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
export type PrivacyMode = "restricted" | "link" | "public";

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
    const { copied, copy: copyLink } = useCopyToClipboard();
    const [saving, setSaving] = useState(false);

    const {
        inviteEmail,
        setInviteEmail,
        inviteRole,
        setInviteRole,
        inviteError,
        setInviteError,
        handleInvite,
        handleRevokeEmailInvite,
    } = useShareInvites({ lesson, setSaving });

    const titleId = useId();
    // Escape closes the privacy dropdown first if it's open, otherwise the whole modal —
    // this component has no isOpen prop, it's only ever mounted while it should be open.
    const dialogRef = useDialogA11y<HTMLDivElement>(true, () => {
        if (openPrivacyMenu) setOpenPrivacyMenu(false);
        else onClose();
    });

    const themeHex = lesson.themeColor || "#1cb0f6";
    const themeColorStr = hexToThemeColor(themeHex);

    const handleCopy = async () => {
        if (!shareLink) return;
        await copyLink(shareLink);
        showAlert("success", "Link copied to clipboard");
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
    const commitRolesUpdate = async (newRoles: Record<string, Role>): Promise<boolean> => {
        setRoles(newRoles);
        const newCollaborators = Object.keys(newRoles);
        setSaving(true);
        try {
            await onUpdateRoles(newRoles, newCollaborators);
            auditClient(ActivityAction.SHARE_ROLES_UPDATED, {
                collaboratorCount: newCollaborators.length,
            });
            showAlert("success", "Collaborator permissions updated");
            return true;
        } catch (err) {
            console.error("[ShareModal] commitRolesUpdate failed:", err);
            setRoles(lesson.roles || {});
            showAlert("error", "Failed to update permissions");
            return false;
        } finally {
            setSaving(false);
        }
    };

    // The owner manages sharing on their own deck, so lesson.ownerId (or the
    // current user) is the authoritative owner the server writer expects.
    const deckOwnerId = lesson.ownerId ?? lesson.userId ?? user?.uid;

    const handleUpdateUserRole = async (targetId: string, newRole: Role) => {
        if (roles[targetId] === "owner" || targetId === user?.uid) return;
        const newRoles = { ...roles, [targetId]: newRole };
        const okUpdate = await commitRolesUpdate(newRoles);
        // Notify the affected collaborator (server verifies owner + target).
        if (okUpdate && deckOwnerId) {
            void emitNotification({
                kind: "role_change",
                ownerId: deckOwnerId,
                lessonId: lesson.id,
                targetUserId: targetId,
                newRole,
            });
        }
    };

    const handleRemoveUser = async (targetId: string) => {
        if (roles[targetId] === "owner" || targetId === user?.uid) return;
        const newRoles = { ...roles };
        delete newRoles[targetId];
        const okRemove = await commitRolesUpdate(newRoles);
        if (okRemove && deckOwnerId) {
            void emitNotification({
                kind: "access_revoked",
                ownerId: deckOwnerId,
                lessonId: lesson.id,
                targetUserId: targetId,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="my-auto flex w-full max-w-lg flex-col rounded-4xl border-2 border-b-8 border-gray-200 bg-white shadow-xl"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b-2 border-gray-100 p-6">
                    <h2 id={titleId} className="text-text text-2xl font-black">
                        Share Deck
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        icon={X}
                        disabled={saving}
                        aria-label="Close"
                    />
                </div>

                <div className="overflow-visible p-6">
                    {/* ── Role specific views ──────────────────────────────────────── */}
                    {canManageRoles ? (
                        <>
                            <ShareCollaboratorsPanel
                                lesson={lesson}
                                roles={roles}
                                saving={saving}
                                themeHex={themeHex}
                                inviteEmail={inviteEmail}
                                inviteRole={inviteRole}
                                inviteError={inviteError}
                                onInviteEmailChange={(value) => {
                                    setInviteEmail(value);
                                    setInviteError(null);
                                }}
                                onInviteRoleChange={setInviteRole}
                                onInvite={() => void handleInvite()}
                                onRevokeInvite={(email) => void handleRevokeEmailInvite(email)}
                                onUpdateUserRole={(targetId, newRole) =>
                                    void handleUpdateUserRole(targetId, newRole)
                                }
                                onRemoveUser={(targetId) => void handleRemoveUser(targetId)}
                            />

                            <SharePrivacyPicker
                                privacyMode={privacyMode}
                                publicRole={publicRole}
                                saving={saving}
                                themeHex={themeHex}
                                openPrivacyMenu={openPrivacyMenu}
                                onTogglePrivacyMenu={() => setOpenPrivacyMenu((v) => !v)}
                                onClosePrivacyMenu={() => setOpenPrivacyMenu(false)}
                                onChangePrivacyMode={(mode) => void handleSavePrivacyMode(mode)}
                                onChangePublicRole={(role) => void handleSavePublicRole(role)}
                            />
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
                                    <p className="text-text font-black capitalize">
                                        {currentRole || "Viewer"} Access
                                    </p>
                                    <p className="text-muted text-sm font-bold">
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
                                <h4 className="text-muted mb-2 text-xs font-black tracking-widest uppercase">
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
                                    ? "text-hiragana border-[#58cc02] bg-[#f2fbf0]"
                                    : "text-text border-gray-200 hover:bg-gray-50"
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
