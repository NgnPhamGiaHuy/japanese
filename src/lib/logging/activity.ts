"use server";

import { logUserActionServer } from "./user-actions";

import type { ActivityAction } from "./actions.enum";
import type { CanonicalLogLevel } from "./public";

/**
 * Shared scaffolding for the per-feature activity-log Server Actions — each
 * one previously hand-wrote the same `{ action, entityType, entityId, level,
 * userId, metadata: { logType: "USER_ACTION", ...extra } }` shape.
 */
export async function logActivity(
    idToken: string,
    userId: string,
    action: (typeof ActivityAction)[keyof typeof ActivityAction],
    entityType: string,
    entityId: string,
    extraMetadata: Record<string, unknown> = {},
    level: CanonicalLogLevel = "info",
): Promise<void> {
    await logUserActionServer(idToken, {
        action,
        entityType,
        entityId,
        level,
        userId,
        metadata: { logType: "USER_ACTION", ...extraMetadata },
    });
}
