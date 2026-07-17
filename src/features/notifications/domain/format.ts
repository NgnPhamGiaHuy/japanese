/**
 * @file domain/format.ts
 * Pure display helpers for the inbox UI: live relative timestamps and
 * collapsed-notification (avatar-stack) presentation. No React, no Firebase —
 * unit-testable.
 */
import type { AppNotification, NotificationActor, NotificationGroup } from "../types";

/**
 * Relative timestamp, computed against an injected `now` so it can tick live
 * (see shared/hooks useNow) and be tested deterministically. Preserves the
 * inbox's existing "just now / Xm / Xh / Xd / MMM d" format.
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

/** Alias, kept for this module's existing call sites — canonical shape lives in ../types (E11-T6). */
export type DisplayActor = NotificationActor;

/** Up to `max` actors to show as avatars in a collapsed notification. */
export function visibleActors(actors: DisplayActor[] | undefined, max = 3): DisplayActor[] {
    return (actors ?? []).slice(0, max);
}

/**
 * How many additional actors/events a collapsed doc represents beyond the shown
 * avatars — drives the "+N" overflow chip. Uses `count` (total events) when
 * present, else the actor list length.
 */
export function overflowCount(
    count: number | undefined,
    actors: DisplayActor[] | undefined,
    max = 3,
): number {
    const total = count ?? actors?.length ?? 0;
    const shown = Math.min(actors?.length ?? 0, max);
    return Math.max(0, total - shown);
}

/** True when a notification represents more than one collapsed event. */
export function isCollapsed(count: number | undefined): boolean {
    return (count ?? 1) > 1;
}

/**
 * One row of a virtualized, time-grouped notification list: each
 * group's sticky-label header and its notification rows are flattened into a
 * single sequence so `@tanstack/react-virtual` can window across group
 * boundaries — group size varies with how far a user has paginated, so
 * windowing per-group (rather than the flat sequence) wouldn't bound the DOM
 * count for a single large group.
 */
export type FlatNotificationItem =
    | { kind: "header"; key: string; label: NotificationGroup["label"] }
    | {
          kind: "row";
          key: string;
          notification: AppNotification;
          isFirstInGroup: boolean;
          isLastInGroup: boolean;
      };

export function flattenNotificationGroups(groups: NotificationGroup[]): FlatNotificationItem[] {
    const flat: FlatNotificationItem[] = [];
    for (const group of groups) {
        flat.push({ kind: "header", key: `header:${group.label}`, label: group.label });
        group.items.forEach((notification, i) => {
            flat.push({
                kind: "row",
                key: notification.id,
                notification,
                isFirstInGroup: i === 0,
                isLastInGroup: i === group.items.length - 1,
            });
        });
    }
    return flat;
}
