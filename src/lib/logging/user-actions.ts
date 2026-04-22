"use server";

import { adminAuth } from "@/lib/firebase-admin";
import { systemLogInputSchema } from "./schema";
import { persistSystemLog } from "./server";

import type { SystemLogInput } from "./public";

type UserActionInput = Omit<SystemLogInput, "source" | "userId"> & {
    userId?: string | null;
};

/**
 * Server Action: log a user-facing activity event.
 *
 * The idToken is verified server-side so the userId is always authoritative.
 * Errors are swallowed — logging must never block the primary user action.
 */
export async function logUserActionServer(idToken: string, input: UserActionInput): Promise<void> {
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        // Reject attempts to log on behalf of another user
        if (input.userId && input.userId !== decoded.uid) return;

        const parsed = systemLogInputSchema.parse({
            ...input,
            userId: decoded.uid,
            source: "client",
        });
        await persistSystemLog(parsed);
    } catch {
        // Intentionally swallowed — logging is non-blocking
    }
}
