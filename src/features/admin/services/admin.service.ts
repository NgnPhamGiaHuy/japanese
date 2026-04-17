import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

import type { DecodedIdToken, ListUsersResult, UserRecord } from "firebase-admin/auth";
import type { AdminStats, AdminUser, PaginatedUsers } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Checks whether a UID holds the `admin` role in Firestore.
 * Does NOT check the superadmin custom claim — that is console-only.
 */
async function isAdminInFirestore(uid: string): Promise<boolean> {
    const snap = await adminDb.collection("admins").doc(uid).get();
    return snap.exists && snap.data()?.role === "admin";
}

async function mapUserRecord(record: UserRecord): Promise<AdminUser> {
    const isAdmin = await isAdminInFirestore(record.uid);
    return {
        uid: record.uid,
        email: record.email ?? null,
        displayName: record.displayName ?? null,
        photoURL: record.photoURL ?? null,
        disabled: record.disabled,
        isSuperAdmin: record.customClaims?.superadmin === true,
        isAdmin,
        lastSignInTime: record.metadata.lastSignInTime ?? null,
        creationTime: record.metadata.creationTime ?? null,
    };
}

/**
 * Verifies the caller's ID token and asserts the superadmin role via Firestore.
 * Superadmin is stored in the `admins` collection with role "superadmin".
 * This is set manually via the Firebase console — never via the dashboard.
 */
export async function assertSuperAdmin(idToken: string): Promise<DecodedIdToken> {
    let decoded: DecodedIdToken;
    try {
        decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
        throw new Error("UNAUTHORIZED: Invalid or expired token");
    }

    const adminRef = adminDb.collection("admins").doc(decoded.uid);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists || adminDoc.data()?.role !== "superadmin") {
        throw new Error("FORBIDDEN: Superadmin access required");
    }

    return decoded;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns a paginated list of Firebase Auth users with their admin roles resolved.
 */
export async function getUsersPaginated(
    pageToken?: string,
    pageSize = 25,
): Promise<PaginatedUsers> {
    const safeSize = Math.min(Math.max(pageSize, 1), 1000);
    const result: ListUsersResult = await adminAuth.listUsers(safeSize, pageToken);

    const users = await Promise.all(result.users.map(mapUserRecord));

    return {
        users,
        nextPageToken: result.pageToken ?? null,
        total: users.length,
    };
}

/**
 * Computes aggregate stats by walking all users and the admins collection.
 */
export async function getAdminStats(): Promise<AdminStats> {
    let totalUsers = 0;
    let activeUsers = 0;
    let superAdmins = 0;
    let disabledUsers = 0;
    let pageToken: string | undefined;

    do {
        const result: ListUsersResult = await adminAuth.listUsers(1000, pageToken);
        for (const user of result.users) {
            totalUsers++;
            if (!user.disabled) activeUsers++;
            if (user.disabled) disabledUsers++;
            if (user.customClaims?.superadmin === true) superAdmins++;
        }
        pageToken = result.pageToken;
    } while (pageToken);

    // Count Firestore admin docs with role "admin" (excludes superadmins).
    const adminSnap = await adminDb.collection("admins").where("role", "==", "admin").get();
    const admins = adminSnap.size;

    return { totalUsers, activeUsers, superAdmins, admins, disabledUsers };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Grants or revokes the `admin` role in Firestore.
 *
 * @remarks
 * - Only superadmins can call this (enforced by assertSuperAdmin in the action layer).
 * - Does NOT touch Firebase custom claims — superadmin is console-only.
 * - Prevents self-demotion.
 */
export async function setAdminRole(
    targetUid: string,
    grant: boolean,
    callerUid: string,
): Promise<void> {
    if (targetUid === callerUid && !grant) {
        throw new Error("FORBIDDEN: Cannot remove your own admin role");
    }

    const ref = adminDb.collection("admins").doc(targetUid);

    if (grant) {
        await ref.set({ role: "admin", grantedAt: new Date().toISOString(), grantedBy: callerUid });
    } else {
        await ref.delete();
    }
}

/**
 * Permanently deletes a Firebase Auth user.
 * Prevents self-deletion. Superadmins (custom claim) cannot be deleted via dashboard.
 */
export async function deleteUser(targetUid: string, callerUid: string): Promise<void> {
    if (targetUid === callerUid) {
        throw new Error("FORBIDDEN: Cannot delete your own account");
    }

    const target = await adminAuth.getUser(targetUid);
    if (target.customClaims?.superadmin === true) {
        throw new Error(
            "FORBIDDEN: Superadmin accounts can only be deleted via the Firebase console",
        );
    }

    await adminAuth.deleteUser(targetUid);
    // Clean up Firestore admin doc if present.
    await adminDb
        .collection("admins")
        .doc(targetUid)
        .delete()
        .catch(() => {});
}
