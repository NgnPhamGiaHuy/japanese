import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { SYSTEM_LOGS_COLLECTION } from "./public";
import { systemLogInputSchema } from "./schema";

import type { SystemLogInput, SystemLogRecord } from "./public";

const MAX_METADATA_CHARS = 12_000;

function sanitizeMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!meta || typeof meta !== "object") return {};
    try {
        const json = JSON.stringify(meta);
        if (json.length > MAX_METADATA_CHARS) {
            return { _truncated: true, preview: json.slice(0, MAX_METADATA_CHARS) };
        }
        return JSON.parse(json) as Record<string, unknown>;
    } catch {
        return { _sanitizeError: true };
    }
}

/**
 * Persists a canonical system log (Admin SDK — bypasses client security rules).
 */
export async function persistSystemLog(raw: SystemLogInput): Promise<string> {
    const parsed = systemLogInputSchema.parse({
        ...raw,
        metadata: raw.metadata,
    });
    const ref = parsed.id
        ? adminDb.collection(SYSTEM_LOGS_COLLECTION).doc(parsed.id)
        : adminDb.collection(SYSTEM_LOGS_COLLECTION).doc();
    const ts = parsed.timestamp ?? Date.now();
    const payload: SystemLogRecord = {
        id: ref.id,
        timestamp: ts,
        userId: parsed.userId ?? null,
        action: parsed.action,
        entityType: parsed.entityType,
        entityId: parsed.entityId ?? null,
        metadata: sanitizeMetadata(parsed.metadata),
        level: parsed.level,
        source: parsed.source,
    };
    await ref.set(payload);
    return ref.id;
}
