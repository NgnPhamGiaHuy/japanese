/** Formats a duration in seconds as `m:ss` */
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Window after which a user is no longer considered "online" (5 minutes). */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Whether a `lastSeenAt` timestamp is recent enough to show a live/online
 * indicator. Was duplicated inline in UserCell.tsx and UserMobileRow.tsx
 * (E11-T6) — single source now.
 */
export function isOnline(lastSeenAt: string | null | undefined): boolean {
    const lastSeen = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;
    return Date.now() - lastSeen < ONLINE_WINDOW_MS;
}
