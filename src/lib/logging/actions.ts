"use server";

import { adminAuth } from "@/lib/firebase-admin";
import { systemLogInputSchema } from "./schema";
import { persistSystemLog } from "./server";

import type { SystemLogInput } from "./public";

type AppendClientInput = Omit<SystemLogInput, "source" | "userId"> & { userId?: string | null };

/**
 * Authenticated users may append client-side audit rows; `userId` is always the token subject.
 */
export async function appendClientLogAction(
    idToken: string,
    input: AppendClientInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (input.userId != null && input.userId !== "" && input.userId !== decoded.uid) {
            return { ok: false, error: "FORBIDDEN: userId mismatch" };
        }
        const parsed = systemLogInputSchema.parse({
            ...input,
            userId: decoded.uid,
            source: "client",
        });
        await persistSystemLog(parsed);
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Log append failed";
        return { ok: false, error: message };
    }
}
