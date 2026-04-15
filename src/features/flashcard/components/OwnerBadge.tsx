"use client";

import Image from "next/image";

interface OwnerBadgeProps {
    displayName?: string | null;
    photoURL?: string | null;
}

/**
 * Derives initials from a display name.
 * Takes the first character of each word, max 2, uppercase.
 * Returns "?" when displayName is null/empty.
 */
export function deriveInitials(displayName?: string | null): string {
    if (!displayName?.trim()) return "?";
    return displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
}

/**
 * Displays a circular avatar (photo or initials fallback) alongside the owner's name.
 * Used on Shared With Me and Discover deck cards.
 */
export function OwnerBadge({ displayName, photoURL }: OwnerBadgeProps) {
    const name = displayName?.trim() || "Unknown";
    const initials = deriveInitials(displayName);

    return (
        <div className="flex items-center gap-1.5">
            {photoURL ? (
                <Image
                    src={photoURL}
                    alt={name}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                />
            ) : (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[8px] font-black text-gray-500">
                    {initials}
                </div>
            )}
            <span className="truncate text-[11px] font-bold text-[#afafaf]">{name}</span>
        </div>
    );
}
