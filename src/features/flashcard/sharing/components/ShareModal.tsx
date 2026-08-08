"use client";

import { useTranslations } from "next-intl";

import { Dialog } from "@base-ui/react/dialog";
import { Check, Copy, ShieldAlert, X } from "lucide-react";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";
import { hexToThemeColor } from "@/features/flashcard/utils";
import { Button, DIALOG_BACKDROP_CLASSNAME } from "@/shared/components/ui";
import ShareCollaboratorsPanel from "./ShareCollaboratorsPanel";
import SharePrivacyPicker from "./SharePrivacyPicker";
import { useShareModal } from "../hooks/useShareModal";

import type { DeckAccessRole } from "@/features/flashcard/types";
import type { Lesson } from "../../types";

/**
 * Collaborative Access Controller (Share Modal)
 *
 * @remarks
 * Renders a "Google Docs" style permissions model. All role derivation,
 * privacy/role edit state, and persistence live in `useShareModal` — this
 * component is UI-only (CS-2, T-115a):
 * 1. Public Access: Three modes — Restricted, Link-only, Fully Public.
 * 2. Targeted Invites: Email-based invitations with explicit RBAC.
 * 3. Role Life-cycle: Updating and revoking existing collaborator access.
 *
 * @example
 * <ShareModal lesson={lesson} onShareLink={handleShare} onUpdateRoles={handleUpdate} onClose={close} />
 */

/** Access levels defining what actions a user can perform on a shared deck. */
export type Role = DeckAccessRole;

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
    onUpdateRoles: (newRoles: Record<string, Role>) => Promise<void>;
    /** Close logic */
    onClose: () => void;
}

const ShareModal = ({ lesson, onShareLink, onUpdateRoles, onClose }: ShareModalProps) => {
    const t = useTranslations("ShareModal");
    const tCommon = useTranslations("Common");
    const tDetail = useTranslations("FlashcardDetail");

    const {
        currentRole,
        canManageRoles,
        privacyMode,
        publicRole,
        roles,
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
    } = useShareModal({ lesson, onShareLink, onUpdateRoles });

    const themeHex = lesson.themeColor || DEFAULT_DECK_THEME_COLOR;
    const themeColorStr = hexToThemeColor(themeHex);

    return (
        <Dialog.Root
            open
            disablePointerDismissal
            onOpenChange={(open) => {
                // This component has no isOpen prop, it's only ever mounted while it
                // should be open (`open` above stays a constant `true`) — the parent
                // unmounts this component entirely to actually close it. The privacy
                // picker's own Menu.Root handles its Escape/outside-click independently
                // (nested Base UI popups don't bubble dismissal to their ancestors), so
                // this no longer needs to special-case it.
                if (!open) onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Backdrop className={DIALOG_BACKDROP_CLASSNAME} />
                <Dialog.Popup
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 outline-none"
                >
                    <div className="my-auto flex w-full max-w-lg flex-col rounded-4xl border-2 border-b-8 border-gray-200 bg-white shadow-xl">
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between border-b-2 border-gray-100 p-6">
                            <Dialog.Title className="text-text text-2xl font-black">
                                {tCommon("shareDeck")}
                            </Dialog.Title>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                icon={X}
                                disabled={saving}
                                aria-label={tCommon("close")}
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
                                        registerInvite={registerInvite}
                                        inviteControl={inviteControl}
                                        inviteError={inviteError}
                                        onInvite={() => void handleInvite()}
                                        onRevokeInvite={(email) =>
                                            void handleRevokeEmailInvite(email)
                                        }
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
                                        onChangePrivacyMode={(mode) =>
                                            void handleSavePrivacyMode(mode)
                                        }
                                        onChangePublicRole={(role) =>
                                            void handleSavePublicRole(role)
                                        }
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
                                                {tDetail(
                                                    `roleAccessTitle.${currentRole === "editor" || currentRole === "commenter" ? currentRole : "viewer"}`,
                                                )}
                                            </p>
                                            <p className="text-muted text-sm font-bold">
                                                {t(
                                                    `nonOwnerRoleAccessSubtitle.${currentRole === "editor" || currentRole === "commenter" ? currentRole : "viewer"}`,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Collaborator overview for non-owners */}
                                    <div className="rounded-2xl border-2 border-gray-100 p-4">
                                        <h4 className="text-muted mb-2 text-xs font-black tracking-widest uppercase">
                                            {t("collaborators")}
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
                                    onClick={() => void handleCopy()}
                                    className={`h-12 rounded-2xl border-2 px-6 text-sm font-bold transition-colors ${
                                        copied
                                            ? "text-hiragana border-hiragana/20 bg-hiragana/10"
                                            : "text-text border-gray-200 hover:bg-gray-50"
                                    }`}
                                    disabled={saving}
                                >
                                    {copied ? t("linkCopied") : t("copyLink")}
                                </Button>

                                <Button
                                    variant="primary"
                                    color={themeColorStr}
                                    onClick={onClose}
                                    className="h-12 px-10 text-sm"
                                    disabled={saving}
                                >
                                    {t("done")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ShareModal;
