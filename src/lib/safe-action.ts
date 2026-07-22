import "server-only";

import { createSafeActionClient } from "next-safe-action";

import { z } from "zod";

import { adminAuth } from "./firebase-admin";

import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * @file Server Action safety layer (ADR-106 unification, T-106a).
 *
 * @remarks
 * `verifiedActionClient` is the ONE verification/envelope mechanism every
 * server mutation in this app builds on — the family-choice criterion this
 * ADR calls for, replacing the old two-independent-clients docstring:
 *
 *   - **Privileged/cross-user writes ⇒ a safe-action client built on
 *     `verifiedActionClient`.** Every action declares `.metadata({permission})`
 *     before `.action()` compiles — `defineMetadataSchema` below makes that
 *     a structural (TypeScript) property, not a convention.
 *   - **Learner realtime surfaces ⇒ the client Firebase SDK under Firestore
 *     rules.** Not a server action at all — ADR-002's affirmed family (a),
 *     unrelated to this file.
 *
 * Configured thinly per surface, since identity arrives two different ways:
 *   - `userActionClient` (this file): the caller supplies its own Firebase ID
 *     token as the action's first bind arg — `action(idToken, input)` — for
 *     user-initiated privileged mutations (notification emission, activity
 *     logging). Fully generic (only `adminAuth.verifyIdToken`, no
 *     feature-specific permission model), so it lives here.
 *   - The admin-session surface (`features/admin/services/admin.service.ts`)
 *     extends the SAME `verifiedActionClient` base with cookie-session
 *     identity + the admin `PermissionSet` — kept in the admin feature
 *     because ADR-103 forbids `lib/` importing from `features/`, and that
 *     permission model belongs to the admin feature, not to generic
 *     infrastructure.
 *
 * `actionClient`/`verifyIdToken`'s old inline `.useValidated()` pattern
 * (see each call site) still applies per-action, since next-safe-action
 * forbids calling `.inputSchema()` after `.useValidated()` and every action
 * has its own input schema:
 *   userActionClient.bindArgsSchemas([z.string()]).inputSchema(mySchema)
 *     .useValidated(async ({ next, bindArgsParsedInputs }) =>
 *       next({ ctx: await verifyIdToken(bindArgsParsedInputs[0]) }))
 *     .action(...)
 */

/**
 * The shared base every server mutation's client extends: `.metadata()` is
 * structurally required before `.action()` type-checks (next-safe-action's
 * `HasMetadata` type parameter only flips to `true` once `defineMetadataSchema`
 * is set and `.metadata()` is called) — S-4's "an action cannot be defined
 * without declaring its required permission," generalized from admin-only to
 * every server mutation. `permission` is a free-form non-empty string here
 * (not a fixed enum) because the two surfaces have different permission
 * vocabularies — the admin surface narrows it to the real `PermissionSet`
 * enum via its own `.metadata()` calls' literal types; this base only
 * enforces that *something* was declared.
 */
export const verifiedActionClient = createSafeActionClient({
    defineMetadataSchema: () => z.object({ permission: z.string().min(1) }),
    handleServerError(e) {
        return e instanceof Error ? e.message : "An unexpected error occurred";
    },
});

/**
 * User-initiated surface: identity from an explicit idToken bind-arg (the
 * client SDK's own in-memory token), not a cookie. Authorization stays
 * per-action-body (e.g. notification.actions.ts's `authorizeAndResolve`) —
 * unlike the admin surface's flat role→permission matrix, these mutations
 * are inherently per-resource, so `metadata.permission` here is a
 * descriptive label for consistency/audit, not something this middleware
 * gates on.
 */
export const userActionClient = verifiedActionClient
    .bindArgsSchemas([z.string()])
    .use(async ({ next, bindArgsClientInputs }) => {
        const idToken = bindArgsClientInputs[0] as string;
        const { uid } = await verifyIdToken(idToken);
        return next({ ctx: { uid } });
    });

/** Verifies a raw Firebase ID token, returning the middleware ctx shape every idToken-bind-arg action attaches via `.useValidated()`. */
export async function verifyIdToken(
    idToken: string,
): Promise<{ uid: string; decoded: DecodedIdToken }> {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid, decoded };
}

/**
 * Pre-unification client, retained only for its 6 remaining callers
 * (T-106c migrates them onto `userActionClient`, after which this and its
 * `.useValidated()`-based inline verification are deleted — T-106d).
 */
export const actionClient = createSafeActionClient({
    handleServerError(e) {
        return e instanceof Error ? e.message : "An unexpected error occurred";
    },
});

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
