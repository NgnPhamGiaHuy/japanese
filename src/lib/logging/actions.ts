"use server";

import { persistUserLog } from "./user-actions";

import type { PersistUserLogInput } from "./user-actions";

/**
 * Authenticated users may append client-side audit rows; `userId` is always the token subject.
 */
export async function appendClientLogAction(
    idToken: string,
    input: PersistUserLogInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
    return persistUserLog(idToken, input);
}
