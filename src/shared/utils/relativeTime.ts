/**
 * Relative timestamp, computed against an injected `now` so it can tick live
 * (see shared/hooks useNow) and be tested deterministically. Format:
 * "just now / Xm ago / Xh ago / Xd ago / MMM d".
 */
export function formatRelativeTime(ts: number, now: number): string {
    const diff = now - ts;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
