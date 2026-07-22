/**
 * Formats a date for admin table/card badges (e.g. "Jan 5, 2026" or, with
 * `includeYear: false`, "Jan 5"). Locale-aware — respects the viewer's
 * browser locale rather than hardcoding English month names.
 */
export function formatAdminDate(
    date: number | string | Date,
    { includeYear = true }: { includeYear?: boolean } = {},
): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(undefined, {
        ...(includeYear ? { year: "numeric" as const } : {}),
        month: "short",
        day: "numeric",
    });
}

/** Window after which a user is no longer considered "online" (5 minutes). */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Whether a `lastSeenAt` timestamp is recent enough to show a live/online
 * indicator.
 */
export function isOnline(lastSeenAt: string | null | undefined): boolean {
    const lastSeen = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;
    return Date.now() - lastSeen < ONLINE_WINDOW_MS;
}
