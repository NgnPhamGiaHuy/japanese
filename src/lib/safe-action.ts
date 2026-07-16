import "server-only";

import { createSafeActionClient } from "next-safe-action";

import { adminAuth } from "./firebase-admin";

import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * @file Server Action safety layer — centralizes ID-token
 * verification so individual actions stop hand-rolling
 * `adminAuth.verifyIdToken` + an ad-hoc `{ok,error}` return.
 *
 * Two families of actions exist in this repo, with different auth entry
 * points, so there are two clients:
 *   - `actionClient` + `verifyIdToken` (this file): the CLIENT supplies its
 *     own Firebase ID token as the action's first bind arg —
 *     `action(idToken, input)` — used by notification emission and activity
 *     logging, called directly (not via the `useAction` hook) from client
 *     services. Each action attaches its own inline `.useValidated()` step
 *     calling `verifyIdToken`, rather than sharing one pre-built middleware —
 *     next-safe-action forbids calling `.inputSchema()` after
 *     `.useValidated()`, and every action has its own input schema:
 *       actionClient.bindArgsSchemas([z.string()]).inputSchema(mySchema)
 *         .useValidated(async ({ next, bindArgsParsedInputs }) =>
 *           next({ ctx: await verifyIdToken(bindArgsParsedInputs[0]) }))
 *         .action(...)
 *   - `adminActionClient` (features/admin/services/admin.service.ts):
 *     identity comes from the `auth-token` session cookie, plus a per-action
 *     required permission declared via `.metadata()`.
 */

export const actionClient = createSafeActionClient({
    handleServerError(e) {
        return e instanceof Error ? e.message : "An unexpected error occurred";
    },
});

/** Verifies a raw Firebase ID token, returning the middleware ctx shape every idToken-bind-arg action attaches via `.useValidated()`. */
export async function verifyIdToken(
    idToken: string,
): Promise<{ uid: string; decoded: DecodedIdToken }> {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid, decoded };
}

/**
 * Adapts a next-safe-action result to this repo's existing
 * `{ok:true,data}|{ok:false,error}` shape, so callers written against the
 * pre-migration `ActionResult<T>` contract are unaffected.
 */
export function toActionResult<T>(result: {
    data?: T;
    serverError?: string;
    validationErrors?: unknown;
}): { ok: true; data: T } | { ok: false; error: string } {
    if (result.serverError !== undefined) return { ok: false, error: result.serverError };
    if (result.validationErrors !== undefined) return { ok: false, error: "Invalid input" };
    return { ok: true, data: result.data as T };
}
