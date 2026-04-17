"use server";

import {
    assertSuperAdmin,
    deleteUser,
    getAdminStats,
    getUsersPaginated,
    setAdminRole,
} from "../services/admin.service";

import type { AdminStats, PaginatedUsers } from "../types"; // ─── Result wrapper ───────────────────────────────────────────────────────────

// ─── Result wrapper ───────────────────────────────────────────────────────────

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function ok<T>(data: T): ActionResult<T> {
    return { ok: true, data };
}

function fail(err: unknown): ActionResult<never> {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { ok: false, error: message };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function fetchUsersAction(
    idToken: string,
    pageToken?: string,
    pageSize = 25,
): Promise<ActionResult<PaginatedUsers>> {
    try {
        await assertSuperAdmin(idToken);
        return ok(await getUsersPaginated(pageToken, pageSize));
    } catch (err) {
        return fail(err);
    }
}

export async function fetchAdminStatsAction(idToken: string): Promise<ActionResult<AdminStats>> {
    try {
        await assertSuperAdmin(idToken);
        return ok(await getAdminStats());
    } catch (err) {
        return fail(err);
    }
}

/**
 * Grants or revokes the `admin` role (Firestore-backed).
 * Superadmin role is console-only and cannot be assigned here.
 */
export async function setAdminRoleAction(
    idToken: string,
    targetUid: string,
    grant: boolean,
): Promise<ActionResult<{ uid: string; isAdmin: boolean }>> {
    try {
        const decoded = await assertSuperAdmin(idToken);
        await setAdminRole(targetUid, grant, decoded.uid);
        return ok({ uid: targetUid, isAdmin: grant });
    } catch (err) {
        return fail(err);
    }
}

export async function deleteUserAction(
    idToken: string,
    targetUid: string,
): Promise<ActionResult<{ uid: string }>> {
    try {
        const decoded = await assertSuperAdmin(idToken);
        await deleteUser(targetUid, decoded.uid);
        return ok({ uid: targetUid });
    } catch (err) {
        return fail(err);
    }
}
