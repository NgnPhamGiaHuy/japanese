"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { buildShareId } from "@/features/flashcard/services";
import { resolveRole, sanitizePublicRole } from "@/features/flashcard/utils/rbac";
import { emitNotification } from "@/features/notifications";
import { useAppStore } from "@/lib/app-store";
import { ActivityAction } from "@/lib/logging/actions.enum";
import { enqueueClientLog } from "@/lib/logging/browser";
import { useCopyToClipboard } from "@/shared/hooks";
import { useAlert } from "@/shared/providers";
import { useShareInvites } from "./useShareInvites";

import type { DeckAccessRole, Lesson } from "../../types";

type Role = DeckAccessRole;

export type PrivacyMode = "restricted" | "link" | "public";

interface UseShareModalParams {
    lesson: Lesson;
    onShareLink: (
        allowLinkAccess: boolean,
        publicRole: Lesson["publicRole"],
        isPublic?: boolean,
    ) => Promise<void>;
    onUpdateRoles: (newRoles: Record<string, Role>, newCollaborators: string[]) => Promise<void>;
}

/**
 * Owns ShareModal's role derivation, privacy/role edit state, and every
 * Firestore-persisting handler (privacy mode, public role, role
 * grant/revoke) — so the component stays UI-only (CS-2, T-115a). Composes
 * useShareInvites internally rather than leaving the component to
 * coordinate two hooks' saving state by hand.
 */
export function useShareModal({ lesson, onShareLink, onUpdateRoles }: UseShareModalParams) {
    const t = useTranslations("ShareModal");
    const tDetail = useTranslations("FlashcardDetail");
    const tCommon = useTranslations("Common");
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

    // Resolved via the canonical engine (ADR-115) — see rbac.ts's own
    // "never inline role logic" contract.
    const currentRole = resolveRole({ lesson, userId: user?.uid, userEmail: user?.email });
    const isOwner = currentRole === "owner";

    /** Permission guard: Only owners can invite or change roles of others */
    const canManageRoles = isOwner;

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
    const [roles, setRoles] = useState<Record<string, Role>>(lesson.roles || {});

    // Sync when the lesson prop changes (for real-time consistency) — adjusted
    // directly during render (React's documented pattern for "reset state
    // when a prop changes") rather than in an effect, since a following
    // effect would flash the previous lesson's values for one extra render.
    const [syncedLesson, setSyncedLesson] = useState(lesson);
    if (syncedLesson !== lesson) {
        setSyncedLesson(lesson);
        setPrivacyMode(derivePrivacyMode());
        setPublicRole(sanitizePublicRole(lesson.publicRole));
        setRoles(lesson.roles || {});
    }

    // Derived booleans from privacyMode for service calls.
    const allowLinkAccess = privacyMode !== "restricted";
    const isPublicMode = privacyMode === "public";

    // ── UI state ──────────────────────────────────────────────────────
    const [openPrivacyMenu, setOpenPrivacyMenu] = useState(false);
    const { copied, copy: copyLink } = useCopyToClipboard();
    const [saving, setSaving] = useState(false);

    const {
        register: registerInvite,
        control: inviteControl,
        inviteError,
        handleInvite,
        handleRevokeEmailInvite,
    } = useShareInvites({ lesson, setSaving });

    const handleCopy = async () => {
        if (!shareLink) return;
        await copyLink(shareLink);
        showAlert("success", tCommon("linkCopiedToClipboard"));
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
                restricted: t("accessRestricted"),
                link: t("linkSharingEnabled"),
                public: t("deckIsPublic"),
            };
            showAlert("success", labels[mode]);
        } catch (err) {
            console.error("[useShareModal] handleSavePrivacyMode failed:", err);
            setPrivacyMode(prev);
            showAlert("error", t("privacyUpdateFailed"));
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
            showAlert("success", t("defaultRoleSet", { role: tDetail(`roleName.${role}`) }));
        } catch (err) {
            console.error("[useShareModal] handleSavePublicRole failed:", err);
            showAlert("error", t("publicRoleFailed"));
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
            showAlert("success", t("permissionsUpdated"));
            return true;
        } catch (err) {
            console.error("[useShareModal] commitRolesUpdate failed:", err);
            setRoles(lesson.roles || {});
            showAlert("error", t("permissionsFailed"));
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

    return {
        currentRole,
        isOwner,
        canManageRoles,
        shareLink,
        privacyMode,
        publicRole,
        roles,
        openPrivacyMenu,
        setOpenPrivacyMenu,
        copied,
        saving,
        registerInvite,
        inviteControl,
        inviteError,
        handleInvite,
        handleRevokeEmailInvite,
        handleCopy,
        handleSavePrivacyMode,
        handleSavePublicRole,
        handleUpdateUserRole,
        handleRemoveUser,
    };
}
