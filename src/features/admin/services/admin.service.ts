import "server-only";

import { cookies } from "next/headers";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { hasPermission, normalizeAdminRole } from "../utils/rbac";

import type { AdminRole, CallerContext } from "../types";

export { adminAuth, adminDb };

export const APP_ID = process.env.NEXT_PUBLIC_APP_ID ?? "kana-nihongo-master";

export type PermissionAction =
    | "canViewDashboard"
    | "canViewAnalytics"
    | "canViewReports"
    | "canManageUsers"
    | "canDeleteUsers"
    | "canPromoteUsers"
    | "canManageContent"
    | "canChangeSettings";

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
    const token = cookieStore.get("auth-token")?.value;
    if (!token) throw new Error("UNAUTHORIZED: Session token missing");
    return assertPermissionFromToken(token, action);
}
