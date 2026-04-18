"use client";

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
    const lastSeen = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
    const isOnline = Date.now() - lastSeen < 5 * 60 * 1000;

    return (
        <div className="flex items-center gap-4 pl-4 text-left">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 ring-2 ring-white transition-transform hover:scale-105">
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName ?? "User Avatar"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-sm font-black text-gray-400">
                        {(user.displayName ?? user.email ?? "?")[0]?.toUpperCase()}
                    </span>
                )}
                {isOnline && (
                    <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-[#58cc02] shadow-[0_0_10px_#58cc02]" />
                )}
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="truncate text-[15px] font-black text-[#3c3c3c]">
                        {user.displayName || "Anonymous User"}
                    </p>
                    {isOnline && (
                        <span className="flex h-4 animate-pulse items-center rounded-full bg-[#58cc02] px-1.5 text-[8px] font-black tracking-widest text-white uppercase shadow-sm shadow-[#58cc02]/20">
                            Live
                        </span>
                    )}
                </div>
                <p className="truncate text-xs leading-none font-bold text-[#afafaf]">
                    {user.email ?? "No email linked"}
                </p>
            </div>
        </div>
    );
};

export default UserCell;
