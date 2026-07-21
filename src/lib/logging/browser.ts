"use client";

import type { SystemLogInput } from "./public";

type ClientLogPayload = Omit<SystemLogInput, "source" | "userId"> & { userId?: string | null };

/**
 * Non-blocking client audit log. Swallows errors so UI and core flows are never blocked.
 *
 * @remarks
 * Imports the "use server" action lazily, at call time. Real callers only
 * ever invoke this from client code, where Next's build already stubs a "use
 * server" import into a thin RPC — but a static top-level import also runs
 * under plain Vitest (no such stubbing), pulling the real server
 * implementation (and its `server-only` guard) into ANY module that merely
 * imports `enqueueClientLog` transitively, whether or not it's ever called.
 * A dynamic import defers that until an actual call, which non-emulator unit
 * tests never make.
 */
export function enqueueClientLog(getIdToken: () => Promise<string>, input: ClientLogPayload): void {
    void (async () => {
        try {
            const { appendClientLogAction } = await import("./actions");
            const token = await getIdToken();
            await appendClientLogAction(token, input);
        } catch {
            /* intentionally ignored */
        }
    })();
}
