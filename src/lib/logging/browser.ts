"use client";

import { appendClientLogAction } from "./actions";

import type { SystemLogInput } from "./public";

type ClientLogPayload = Omit<SystemLogInput, "source" | "userId"> & { userId?: string | null };

/**
 * Non-blocking client audit log. Swallows errors so UI and core flows are never blocked.
 */
export function enqueueClientLog(getIdToken: () => Promise<string>, input: ClientLogPayload): void {
    void (async () => {
        try {
            const token = await getIdToken();
            await appendClientLogAction(token, input);
        } catch {
            /* intentionally ignored */
        }
    })();
}
