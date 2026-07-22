"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { Mail } from "lucide-react";

import { ROLE_CONFIG } from "@/features/flashcard/utils/rbac";
import { useAppStore } from "@/lib/app-store";
import { Button, Input, Select } from "@/shared/components/ui";

import type { Control, UseFormRegister } from "react-hook-form";
import type { DeckAccessRole, ShareInvite } from "@/features/flashcard/types";
import type { SelectOption } from "@/shared/components/ui";
import type { Lesson } from "../../types";

type Role = DeckAccessRole;

/** Assignable collaborator roles, lowest → highest privilege. */
const SHARING_ROLES: readonly Role[] = ["viewer", "commenter", "editor"] as const;

interface ShareCollaboratorsPanelProps {
    lesson: Lesson;
    roles: Record<string, Role>;
    saving: boolean;
    themeHex: string;
    registerInvite: UseFormRegister<ShareInvite>;
    inviteControl: Control<ShareInvite>;
    inviteError: string | null;
    onInvite: () => void;
    onRevokeInvite: (email: string) => void;
    onUpdateUserRole: (targetId: string, newRole: Role) => void;
    onRemoveUser: (targetId: string) => void;
}

/** Invite input + "People with access" list + pending email invites section of ShareModal. */
const ShareCollaboratorsPanel = ({
    lesson,
    roles,
    saving,
    themeHex,
    registerInvite,
    inviteControl,
    inviteError,
    onInvite,
    onRevokeInvite,
    onUpdateUserRole,
    onRemoveUser,
}: ShareCollaboratorsPanelProps) => {
    const t = useTranslations("ShareModal");
    const tCommon = useTranslations("Common");
    const tDetail = useTranslations("FlashcardDetail");
    const { user } = useAppStore();

    const sharingOptions: SelectOption<Role>[] = SHARING_ROLES.map((role) => ({
        value: role,
        label: tDetail(`roleName.${role}`),
        icon: ROLE_CONFIG[role].icon,
        color: ROLE_CONFIG[role].color,
    }));

    return (
        <>
            {/* Invite Input */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <Input
                        type="email"
                        variant="default"
                        placeholder={t("inviteByEmail")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onInvite();
                        }}
                        disabled={saving}
                        containerClassName="flex-1"
                        aria-invalid={!!inviteError}
                        aria-describedby={inviteError ? "invite-email-error" : undefined}
                        {...registerInvite("email")}
                    />
                    <Controller
                        name="role"
                        control={inviteControl}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                options={sharingOptions}
                                onChange={field.onChange}
                                disabled={saving}
                                themeHex={themeHex}
                                align="right"
                            />
                        )}
                    />
                    <Button
                        onClick={onInvite}
                        disabled={saving}
                        variant="primary"
                        color="blue"
                        className="h-12 px-6"
                    >
                        {t("invite")}
                    </Button>
                </div>
                {inviteError && (
                    <p
                        id="invite-email-error"
                        role="alert"
                        className="mt-1.5 text-xs font-bold text-red-500"
                    >
                        {inviteError}
                    </p>
                )}
            </div>

            {/* Collaborators List */}
            <div className="mb-6">
                <h3 className="text-text mb-3 text-xs font-black tracking-widest uppercase">
                    {t("peopleWithAccess")}
                </h3>
                <div className="flex flex-col gap-2">
                    {Object.entries(roles).map(([uid, r]) => {
                        const meta = lesson.collaboratorMeta?.[uid];
                        const isCurrentUser = uid === user?.uid;
                        const displayName = isCurrentUser
                            ? tCommon("you")
                            : meta?.displayName ||
                              meta?.email?.split("@")[0] ||
                              `User ${uid.substring(0, 6)}`;
                        const displayEmail = isCurrentUser ? user?.email || "" : meta?.email || "";
                        const initial = isCurrentUser
                            ? (user?.displayName?.[0] ?? user?.email?.[0] ?? "Y").toUpperCase()
                            : (meta?.displayName?.[0] ?? meta?.email?.[0] ?? uid[0]).toUpperCase();

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
                                                backgroundColor: ROLE_CONFIG[r].color,
                                            }}
                                        >
                                            {(() => {
                                                const RoleIcon = ROLE_CONFIG[r].icon;
                                                return <RoleIcon size={8} />;
                                            })()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-text font-black">{displayName}</div>
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
                                    onChange={(newRole) => onUpdateUserRole(uid, newRole)}
                                    onRemove={
                                        r !== "owner" && uid !== user?.uid
                                            ? () => onRemoveUser(uid)
                                            : undefined
                                    }
                                    removeLabel={t("removeAccess")}
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
                            {t("pendingInvites")}
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
                                            <div className="text-text font-black">{email}</div>
                                            <div className="text-xs font-bold text-amber-500">
                                                {t("invitePending")} · {invite.role}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => onRevokeInvite(email)}
                                        disabled={saving}
                                        className="!p-1 !text-xs !font-bold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                    >
                                        {t("revoke")}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ShareCollaboratorsPanel;
