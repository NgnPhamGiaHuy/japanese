"use client";

import { useState } from "react";

interface UserIdentityAvatarProps {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
    isOnline: boolean;
    /** Avatar diameter in Tailwind units, e.g. 11 → h-11 w-11. */
    size: 10 | 11;
}

// dot's glow shadow is size-11 (desktop) only — that matches each of
// UserCell/UserMobileRow's pre-consolidation markup exactly; not adding it
// to the mobile size is a preserved-as-is quirk, not a new inconsistency.
const SIZE_CLASSES: Record<10 | 11, { avatar: string; dot: string }> = {
    10: { avatar: "h-10 w-10", dot: "h-2.5 w-2.5" },
    11: { avatar: "h-11 w-11", dot: "h-3 w-3 shadow-[0_0_10px_#58cc02]" },
};

/**
 * Avatar circle (photo, or initial-letter fallback) plus an online-status
 * dot — the shared piece of UserCell.tsx (desktop) and UserMobileRow.tsx
 * (mobile), which had nearly identical copies (E11-T6). The onError
 * fallback (falls back to the initial when a remote photoURL is broken/
 * expired) previously only existed in UserCell — UserMobileRow gets it too
 * now via this shared component, rather than staying a silent broken-image
 * icon there.
 */
const UserIdentityAvatar = ({
    photoURL,
    displayName,
    email,
    isOnline,
    size,
}: UserIdentityAvatarProps) => {
    const [imgFailed, setImgFailed] = useState(false);
    const { avatar, dot } = SIZE_CLASSES[size];

    return (
        <div
            className={`relative flex ${avatar} shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 ring-2 ring-white transition-transform hover:scale-105`}
        >
            {photoURL && !imgFailed ? (
                <img
                    src={photoURL}
                    alt={displayName ?? "User Avatar"}
                    className="h-full w-full object-cover"
                    onError={() => setImgFailed(true)}
                />
            ) : (
                <span className="text-sm font-black text-gray-400">
                    {(displayName ?? email ?? "?")[0]?.toUpperCase()}
                </span>
            )}
            {isOnline && (
                <div
                    className={`bg-hiragana absolute right-0 bottom-0 ${dot} rounded-full border-2 border-white`}
                />
            )}
        </div>
    );
};

export default UserIdentityAvatar;
