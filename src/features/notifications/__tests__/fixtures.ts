/**
 * @file __tests__/fixtures.ts
 * Pure notification fixtures. No Firebase imports — usable from both
 * the plain unit suite and the emulator suite.
 *
 * Deliberately produces all THREE legacy doc shapes that the migration must
 * tolerate (the `!=` field-existence trap hinges on these differences):
 *   - v2:        has `status`
 *   - legacy:    has `read` (boolean), no `status`
 *   - ancient:   has neither `status` nor `read` (isUnread() treats as read)
 */

import type { AppNotification } from "../types";

let seq = 0;
/** Deterministic id generator (no Date.now / Math.random — keeps tests stable). */
function nextId(prefix = "n"): string {
    seq += 1;
    return `${prefix}_${seq}`;
}

/** Resets the id counter — call in beforeEach for per-test determinism. */
export function resetFixtureSeq(): void {
    seq = 0;
}

type Overrides = Partial<AppNotification>;

/** A canonical v2 notification (has `status`). */
export function makeNotification(overrides: Overrides = {}): AppNotification {
    return {
        id: nextId(),
        userId: "user_recipient",
        type: "invite",
        title: "You've been invited",
        message: "Someone invited you to a deck",
        senderId: "user_sender",
        senderName: "Sender",
        status: "unread",
        isDeleted: false,
        createdAt: 1_700_000_000_000,
        data: { lessonId: "lesson_1", shareLink: "/flashcard/shared/abc" },
        ...overrides,
    };
}

/** Legacy shape: `read: boolean`, no `status`. */
export function makeLegacyReadNotification(
    read: boolean,
    overrides: Overrides = {},
): AppNotification {
    const n = makeNotification(overrides);
    // Strip status, use the legacy `read` field instead.
    const { status: _status, ...rest } = n;
    void _status;
    return { ...rest, read } as AppNotification;
}

/** Ancient shape: neither `status` nor `read`. isUnread() treats this as read. */
export function makeAncientNotification(overrides: Overrides = {}): AppNotification {
    const n = makeNotification(overrides);
    const { status: _status, read: _read, ...rest } = n;
    void _status;
    void _read;
    return rest as AppNotification;
}
