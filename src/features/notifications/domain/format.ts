/**
 * @file domain/format.ts
 * Pure display helpers for the inbox UI: collapsed-notification
 * (avatar-stack) presentation and link resolution. No React, no Firebase —
 * unit-testable. Live relative timestamps live in shared/utils/relativeTime —
 * this feature just consumes them (see NotificationRow.tsx).
 */
import type { AppNotification, NotificationActor, NotificationGroup } from "../types";

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

/** Where clicking a notification (or accepting an invite) should navigate to. */
export function resolveNotificationLink(n: AppNotification): string {
    return n.data?.shareLink ?? n.link ?? "/flashcard";
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
