"use client";

import type { CSSProperties } from "react";

/** Attributes for rendering a UserMeta component. */
interface UserMetaProps {
    /** The full name of the user. */
    name: string;
    /** Optional URL for the user's avatar image. */
    avatar: string | null;
    /** Optional descriptive text to display above the name. */
    subtitle?: string;
    /** Additional CSS classes for the container. */
    className?: string;
}

/**
 * Resolves a two-character initials string from a given name.
 *
 * @remarks
 * Handles various separators (spaces, dashes, dots) to extract meaningful characters.
 * Defaults to "??" for empty strings.
 *
 * @param name - The full display name of the user.
 * @returns A 1-2 character uppercase string.
 */
const getInitials = (name: string): string => {
    const cleaned = name.trim();
    if (!cleaned) return "??";

    // Split on whitespace and common separators (e.g., "Tanaka-san", "Last, First")
    const parts = cleaned.split(/[\s\-_,.]+/g).filter(Boolean);
    const first = parts[0]?.[0] ?? cleaned[0];
    const second = parts.length > 1 ? parts[1]?.[0] : cleaned[1];
    return `${first}${second ?? ""}`.toUpperCase();
};

/**
 * Displays user identity with an avatar and secondary metadata.
 *
 * @remarks
 * Automatically generates fallback initials if an avatar URL is not provided.
 * Uses a stable, high-contrast style for fallback avatars to maintain UI consistency.
 *
 * @example
 * ```tsx
 * <UserMeta name="Tanaka" avatar={null} subtitle="Owner" />
 * ```
 */
const UserMeta = ({ name, avatar, subtitle, className }: UserMetaProps) => {
    const initials = getInitials(name);

    const avatarStyle: CSSProperties | undefined = avatar
        ? undefined
        : {
              // Keep a stable background even when no avatar is present
              backgroundColor: "rgba(0,0,0,0.04)",
              color: "rgba(0,0,0,0.55)",
          };

    return (
        <div className={`flex items-center gap-3 ${className ?? ""}`.trim()}>
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100"
                style={avatarStyle}
            >
                {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-xs font-black tracking-widest">{initials}</span>
                )}
            </div>

            <div className="min-w-0">
                {subtitle && (
                    <div className="truncate text-[11px] font-black tracking-widest text-gray-400 uppercase">
                        {subtitle}
                    </div>
                )}
                <div className="truncate text-sm font-black text-[#3c3c3c]">{name}</div>
            </div>
        </div>
    );
};

export default UserMeta;
