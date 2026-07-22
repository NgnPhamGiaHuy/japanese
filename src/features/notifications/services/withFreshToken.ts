import { auth } from "@/lib/firebase";

/**
 * Fetches the current user's fresh ID token and passes it to `fn`; no-ops
 * (resolves undefined) if there's no signed-in user. Unifies the "get a
 * fresh token, then log/act" glue that used to be written two different ways
 * across NotificationRow/InviteActions' 4 call sites (a bare `.then()` chain
 * in three places, a manual `await` + `if` in the fourth).
 */
export async function withFreshToken<T>(
    fn: (token: string) => T | Promise<T>,
): Promise<T | undefined> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return undefined;
    return fn(token);
}
