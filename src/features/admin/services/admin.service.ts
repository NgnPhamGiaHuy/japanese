import "server-only";

import { createSafeActionClient } from "next-safe-action";
import { cookies } from "next/headers";

import { z } from "zod";

import { APP_ID } from "@/lib/app-id";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COOKIE_NAME } from "@/shared/utils/cookie";
import { hasPermission, normalizeAdminRole } from "../utils/rbac";

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

export async function getCallerContext(idToken: string): Promise<CallerContext> {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const claimRole =
        decoded.superadmin === true ? "superadmin" : decoded.admin === true ? "admin" : null;
    const firestoreRole = await getFirestoreRole(decoded.uid);
    const role = claimRole ?? firestoreRole;
    if (!role) throw new Error("FORBIDDEN: Admin access required");
    return { uid: decoded.uid, role };
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

export async function assertAdminAction(action: PermissionAction): Promise<CallerContext> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) throw new Error("UNAUTHORIZED: Session token missing");
    return assertPermissionFromToken(token, action);
}

/**
 * Admin-scoped safe-action client: each action declares its
 * required permission via `.metadata({permission})`; this middleware runs
 * the existing `assertAdminAction` once and exposes the resolved
 * `{uid, role}` as `ctx`. Folds the cookie-session + role/permission check
 * that every admin action previously hand-rolled into one place.
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
