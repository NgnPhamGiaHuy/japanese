import "server-only";

import { adminAuth, adminDb, APP_ID, clampLimit } from "./admin.service";

import type { ListUsersResult, UserRecord } from "firebase-admin/auth";
import type { AdminStats, AdminUser, PaginatedUsers } from "../types";

async function isAdminInFirestore(uid: string): Promise<boolean> {
    const snap = await adminDb.collection("admins").doc(uid).get();
    return snap.exists && snap.data()?.role === "admin";
}

async function mapUserRecord(record: UserRecord): Promise<AdminUser> {
    const isAdmin = await isAdminInFirestore(record.uid);
    return {
        uid: record.uid,
        email: record.email || record.providerData?.[0]?.email || null,
        displayName: record.displayName || record.providerData?.[0]?.displayName || null,
        photoURL: record.photoURL || record.providerData?.[0]?.photoURL || null,
        disabled: record.disabled,
        isSuperAdmin: record.customClaims?.superadmin === true,
        isAdmin,
        lastSignInTime: record.metadata.lastSignInTime ?? null,
        lastSeenAt: null,
        creationTime: record.metadata.creationTime ?? null,
    };
}

export async function getUsersPaginated(
    pageToken?: string,
    pageSize = 25,
): Promise<PaginatedUsers> {
    const safeSize = clampLimit(pageSize, 1, 100);
    const result: ListUsersResult = await adminAuth.listUsers(safeSize, pageToken);
    const users = await Promise.all(result.users.map(mapUserRecord));

    const refs = users.map((u) =>
        adminDb.collection("artifacts").doc(APP_ID).collection("users").doc(u.uid),
    );
    if (refs.length > 0) {
        const snaps = await adminDb.getAll(...refs);
        users.forEach((u, i) => {
            u.lastSeenAt = snaps[i].exists ? (snaps[i].data()?.lastSeenAt ?? null) : null;
        });
    }

    const totalSnap = await adminDb
        .collection("artifacts")
        .doc(APP_ID)
        .collection("users")
        .count()
        .get();
    const totalCount = totalSnap.data().count;

    return {
        users,
        nextPageToken: result.pageToken ?? null,
        total: totalCount,
    };
}

export async function getAdminStats(): Promise<AdminStats> {
    // 1. Try to get cached counters from metadata/counters
    const metaRef = adminDb.collection("metadata").doc("counters");
    const metaSnap = await metaRef.get();
    const cached = metaSnap.exists ? (metaSnap.data() ?? {}) : null;

    // 2. Real-time count fallback — only when cache is absent (not when legitimately 0)
    let totalUsers: number;
    if (cached !== null && typeof cached.totalUsers === "number") {
        totalUsers = cached.totalUsers;
    } else {
        const countSnap = await adminDb
            .collection("artifacts")
            .doc(APP_ID)
            .collection("users")
            .count()
            .get();
        totalUsers = countSnap.data().count;
    }

    // totalFlashcards = total lesson decks (the primary content unit in this app)
    let totalFlashcards: number;
    if (cached !== null && typeof cached.totalFlashcards === "number") {
        totalFlashcards = cached.totalFlashcards;
    } else {
        const countSnap = await adminDb.collectionGroup("lessons").count().get();
        totalFlashcards = countSnap.data().count;
    }

    const adminSnap = await adminDb.collection("admins").get();
    const activeAdmins = adminSnap.docs.filter((d) => d.data().role === "admin").length;
    const activeSuperAdmins = adminSnap.docs.filter((d) => d.data().role === "superadmin").length;

    // Only use real values from cache — never fabricate activity metrics
    const activeUsersToday =
        cached !== null && typeof cached.activeUsersToday === "number"
            ? cached.activeUsersToday
            : 0;
    const totalSessions =
        cached !== null && typeof cached.totalSessions === "number" ? cached.totalSessions : 0;
    const errorRate =
        cached !== null && typeof cached.errorRate === "number" ? cached.errorRate : 0;

    return {
        totalUsers,
        activeUsersToday,
        totalFlashcards,
        totalSessions,
        errorRate,
        activeAdmins,
        activeSuperAdmins,
    };
}

export async function setAdminRole(
    targetUid: string,
    grant: boolean,
    callerUid: string,
): Promise<void> {
    if (!targetUid) throw new Error("BAD_REQUEST: targetUid is required");
    if (targetUid === callerUid && !grant) {
        throw new Error("FORBIDDEN: Cannot remove your own admin role");
    }

    const ref = adminDb.collection("admins").doc(targetUid);
    if (grant) {
        await ref.set({ role: "admin", grantedAt: new Date().toISOString(), grantedBy: callerUid });
        return;
    }
    await ref.delete();
}

export async function deleteUser(targetUid: string, callerUid: string): Promise<void> {
    if (!targetUid) throw new Error("BAD_REQUEST: targetUid is required");
    if (targetUid === callerUid) {
        throw new Error("FORBIDDEN: Cannot delete your own account");
    }

    const target = await adminAuth.getUser(targetUid);
    if (target.customClaims?.superadmin === true) {
        throw new Error("FORBIDDEN: Superadmin accounts can only be deleted via Firebase console");
    }

    await adminAuth.deleteUser(targetUid);
    await adminDb
        .collection("admins")
        .doc(targetUid)
        .delete()
        .catch(() => {});
}
