import "server-only";

import { createSafeActionClient } from "next-safe-action";
import { cookies } from "next/headers";

import { z } from "zod";

import { APP_ID } from "@/lib/app-id";
import { verifySessionCookie } from "@/lib/auth-session";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifiedActionClient } from "@/lib/safe-action";
import { COOKIE_NAME } from "@/shared/utils/cookie";
import { hasPermission, normalizeAdminRole } from "../utils/rbac";

import type { DecodedIdToken } from "firebase-admin/auth";
import type { AdminRole, CallerContext } from "../types";
import type { PermissionSet } from "../utils/rbac";

export { adminAuth, adminDb, APP_ID };

export type PermissionAction = keyof PermissionSet;

export function clampLimit(value: number, min = 1, max = 100): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(Math.floor(value), min), max);
}

async function getFirestoreRole(uid: string): Promise<AdminRole | null> {
    const snap = await adminDb.collection("admins").doc(uid).get();
    return normalizeAdminRole(snap.data()?.role);
}

/**
 * Resolves a verified token (from either a raw ID token or a session cookie —
 * both decode to the same claim shape) into a caller's admin role.
 */
async function resolveCallerContext(decoded: DecodedIdToken): Promise<CallerContext> {
    const claimRole =
        decoded.superadmin === true ? "superadmin" : decoded.admin === true ? "admin" : null;
    const firestoreRole = await getFirestoreRole(decoded.uid);
    const role = claimRole ?? firestoreRole;
    if (!role) throw new Error("FORBIDDEN: Admin access required");
    return { uid: decoded.uid, role };
}

/**
 * Verifies a raw Firebase ID token (the client SDK's own in-memory token,
 * passed explicitly) — used at app boot, before a session cookie necessarily
 * exists yet. See `fetchAdminRoleAction`'s docblock for why both this and the
 * cookie-based path below coexist.
 */
export async function getCallerContext(idToken: string): Promise<CallerContext> {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return resolveCallerContext(decoded);
}

export async function assertPermissionFromToken(
    idToken: string,
    action: PermissionAction,
): Promise<CallerContext> {
    const caller = await getCallerContext(idToken);
    if (!hasPermission(caller.role, action)) {
        throw new Error(`FORBIDDEN: You do not have permission to ${action}`);
    }
    return caller;
}

/**
 * Verifies the httpOnly session cookie (ADR-107) — real cryptographic
 * verification via `verifySessionCookie`, not the presence-only check the
 * edge gate does. This is the path every admin action other than
 * `fetchAdminRoleAction`'s explicit-token fallback goes through.
 */
export async function assertAdminAction(action: PermissionAction): Promise<CallerContext> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionCookie) throw new Error("UNAUTHORIZED: Session cookie missing");
    const decoded = await verifySessionCookie(sessionCookie);
    const caller = await resolveCallerContext(decoded);
    if (!hasPermission(caller.role, action)) {
        throw new Error(`FORBIDDEN: You do not have permission to ${action}`);
    }
    return caller;
}

/**
 * Pre-unification client. T-106b migrated its last caller
 * (features/admin/actions/admin.actions.ts) onto `verifiedAdminActionClient`
 * below; this has zero remaining callers and is kept only until T-106d
 * deletes it alongside `lib/safe-action.ts`'s equivalent `actionClient`.
 */
export const adminActionClient = createSafeActionClient({
    defineMetadataSchema: () =>
        z.object({
            permission: z.enum([
                "canViewDashboard",
                "canViewAnalytics",
                "canViewReports",
                "canManageUsers",
                "canDeleteUsers",
                "canPromoteUsers",
                "canManageContent",
                "canChangeSettings",
            ]),
        }),
    handleServerError(e) {
        return e instanceof Error ? e.message : "An unexpected error occurred";
    },
}).use(async ({ next, metadata }) => {
    const caller = await assertAdminAction(metadata.permission);
    return next({ ctx: caller });
});

/**
 * The unified admin surface (ADR-106, T-106a): extends the SHARED
 * `verifiedActionClient` base (`lib/safe-action.ts`) — imported here, not
 * re-implemented, since ADR-103 forbids the reverse (`lib/` importing this
 * feature) — with the same cookie-session identity + permission check as
 * the pre-unification client above.
 *
 * `verifiedActionClient`'s metadata schema is a generic `z.string().min(1)`,
 * fixed once at the shared client's creation — next-safe-action has no way
 * to narrow a metadata schema per-surface after the fact, which is the one
 * real trade-off of unifying on a single client: `.metadata({permission})`
 * call sites lose the exact `PermissionAction` enum's compile-time typo
 * protection. `assertAdminAction`'s runtime `hasPermission` check is the
 * backstop that already existed regardless of the zod schema, so this
 * narrows a DX nicety, not a security property — a mistyped permission
 * still fails closed (FORBIDDEN), just at runtime instead of compile time.
 */
export const verifiedAdminActionClient = verifiedActionClient.use(async ({ next, metadata }) => {
    const caller = await assertAdminAction(metadata.permission as PermissionAction);
    return next({ ctx: caller });
});
