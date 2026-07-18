"use server";

import { verifyIdToken } from "@/lib/safe-action";
import { systemLogInputSchema } from "./schema";
import { persistSystemLog } from "./server";

import type { SystemLogInput } from "./public";

export type PersistUserLogInput = Omit<SystemLogInput, "source" | "userId"> & {
    userId?: string | null;
};

interface PersistUserLogOptions {
    /** Enrich metadata with the token's userName/userEmail. */
    enrichFromToken?: boolean;
}

/**
 * Verifies idToken, rejects userId spoofing, and persists a client-attributed
 * system log. Shared core for `logUserActionServer` (void return, enriches
 * metadata, silently swallows failures) and `appendClientLogAction`
 * ({ok,error} return, no enrichment, surfaces the error) — the two
 * previously hand-rolled near-identical copies of this.
 */
export async function persistUserLog(
    idToken: string,
    input: PersistUserLogInput,
    options: PersistUserLogOptions = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const { uid, decoded } = await verifyIdToken(idToken);
        // Reject attempts to log on behalf of another user
        if (input.userId != null && input.userId !== "" && input.userId !== uid) {
            return { ok: false, error: "FORBIDDEN: userId mismatch" };
        }

        const metadata = options.enrichFromToken
            ? {
                  ...input.metadata,
                  userName: decoded.name || decoded.display_name || undefined,
                  userEmail: decoded.email || undefined,
              }
            : input.metadata;

        const parsed = systemLogInputSchema.parse({
            ...input,
            userId: uid,
            source: "client",
            metadata,
        });
        await persistSystemLog(parsed);
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Log append failed";
        return { ok: false, error: message };
    }
}

/**
 * Server Action: log a user-facing activity event.
 *
 * The idToken is verified server-side so the userId is always authoritative.
 * Errors are swallowed — logging must never block the primary user action.
 */
export async function logUserActionServer(
    idToken: string,
    input: PersistUserLogInput,
): Promise<void> {
    await persistUserLog(idToken, input, { enrichFromToken: true });
}
