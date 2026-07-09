"use client";

import { Mail } from "lucide-react";

import { ROLE_CONFIG } from "@/features/flashcard/utils/rbac";
import { useAppStore } from "@/lib/app-store";
import { Button, Input, Select } from "@/shared/components/ui";

import type { DeckAccessRole } from "@/features/flashcard/types";
import type { SelectOption } from "@/shared/components/ui";
import type { Lesson } from "../types";

type Role = DeckAccessRole;

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

interface ShareCollaboratorsPanelProps {
    lesson: Lesson;
    roles: Record<string, Role>;
    saving: boolean;
    themeHex: string;
    inviteEmail: string;
    inviteRole: Role;
    inviteError: string | null;
    onInviteEmailChange: (value: string) => void;
    onInviteRoleChange: (role: Role) => void;
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
    inviteEmail,
    inviteRole,
    inviteError,
    onInviteEmailChange,
    onInviteRoleChange,
    onInvite,
    onRevokeInvite,
    onUpdateUserRole,
    onRemoveUser,
}: ShareCollaboratorsPanelProps) => {
    const { user } = useAppStore();

    return (
        <>
            {/* Invite Input */}
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <Input
                        type="email"
                        variant="default"
                        placeholder="Invite by email address"
                        value={inviteEmail}
                        onChange={(e) => onInviteEmailChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") onInvite();
                        }}
                        disabled={saving}
                        containerClassName="flex-1"
                    />
                    <Select
                        value={inviteRole}
                        options={sharingOptions}
                        onChange={onInviteRoleChange}
                        disabled={saving}
                        themeHex={themeHex}
                        align="right"
                    />
                    <Button
                        onClick={onInvite}
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
                <h3 className="text-text mb-3 text-xs font-black tracking-widest uppercase">
                    People with access
                </h3>
                <div className="flex flex-col gap-2">
                    {Object.entries(roles).map(([uid, r]) => {
                        const meta = lesson.collaboratorMeta?.[uid];
                        const isCurrentUser = uid === user?.uid;
                        const displayName = isCurrentUser
                            ? "You"
                            : meta?.displayName || meta?.email?.split("@")[0] || `User ${uid.substring(0, 6)}`;
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
                                            <div className="text-text font-black">{email}</div>
                                            <div className="text-xs font-bold text-amber-500">
                                                Invite pending · {invite.role}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => onRevokeInvite(email)}
                                        disabled={saving}
                                        className="!p-1 !text-xs !font-bold text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                    >
                                        Revoke
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
