import "server-only";

import { createSafeActionClient } from "next-safe-action";

import { z } from "zod";

import { adminAuth } from "./firebase-admin";

import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * @file Server Action safety layer (ADR-106 unification, T-106a/T-106c/T-106d).
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
 * T-106c migrated all 6 former `actionClient` (pre-unification) call sites
 * straight onto `userActionClient` — no per-action middleware needed, since
 * verification now lives once in `userActionClient`'s own `.use()` above.
 * Two of those call sites still call `verifyIdToken` a second time inside
 * the action body itself (notification emission needs the full `decoded`
 * claims — name/email — that `ctx.uid` alone doesn't carry; every
 * activity-log action delegates to `logActivity`, a shared helper whose
 * signature was intentionally left untouched). Both are disclosed, harmless
 * redundancy — identity is checked at least as strongly as before, never
 * more weakly.
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

/** Verifies a raw Firebase ID token into `{uid, decoded}` — called once by `userActionClient`'s own middleware, and again directly by the couple of migrated action bodies that need the full decoded claims beyond just `uid`. */
export async function verifyIdToken(
    idToken: string,
): Promise<{ uid: string; decoded: DecodedIdToken }> {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid, decoded };
}

/**
 * Adapts a next-safe-action result to this repo's existing
 * `{ok:true,data}|{ok:false,error}` shape. NOT a migration-era shim due to
 * retire on its own: `admin.actions.ts`'s 19 actions (fully on
 * `verifiedAdminActionClient`, the unified client) still call this to keep
 * their own external contract unchanged for the hooks/components that
 * consume them — that consumer need is orthogonal to which safe-action
 * client backs an action, so it outlives the client-unification migration
 * itself. Treat it as a permanent envelope adapter, not a shim awaiting
 * removal.
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
