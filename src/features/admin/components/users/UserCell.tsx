"use client";

import { isOnline } from "@/shared/utils";
import UserIdentityAvatar from "./UserIdentityAvatar";

import type { AdminUser } from "../../types";

interface UserCellProps {
    user: AdminUser;
}

/**
 * User Identity Table Cell.
 *
 * @remarks Displays user avatar (or fallback initial) and basic profile info.
 * Includes a subtle hover transition for a premium feel.
 */
const UserCell = ({ user }: UserCellProps) => {
    const online = isOnline(user.lastSeenAt);

    return (
        <div className="flex items-center gap-4 pl-4 text-left">
            <UserIdentityAvatar
                photoURL={user.photoURL}
                displayName={user.displayName}
                email={user.email}
                isOnline={online}
                size={11}
            />
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-text truncate text-[15px] font-black">
                        {user.displayName || "Anonymous User"}
                    </p>
                    {online && (
                        <span className="bg-hiragana flex h-4 animate-pulse items-center rounded-full px-1.5 text-[8px] font-black tracking-widest text-white uppercase shadow-sm shadow-[#58cc02]/20">
                            Live
                        </span>
                    )}
                </div>
                <p className="text-muted truncate text-xs leading-none font-bold">
                    {user.email ?? "No email linked"}
                </p>
            </div>
        </div>
    );
};

export default UserCell;
