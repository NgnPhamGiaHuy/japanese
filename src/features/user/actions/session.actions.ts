"use server";

/**
 * @file session.actions
 * Server Actions that own the httpOnly session cookie's Set-Cookie lifecycle
 * (ADR-107, T-107a). Called by the client immediately after every ID-token
 * mint (sign-in, token refresh) and on sign-out — see useFirebaseAuth.ts and
 * auth.service.ts.
 */
import { cookies } from "next/headers";

import {
    mintSessionCookie,
    revokeSession,
    SESSION_COOKIE_MAX_AGE_MS,
    verifySessionCookie,
} from "@/lib/auth-session";
import { COOKIE_NAME } from "@/shared/utils/cookie";

type ActionResult = { ok: true } | { ok: false; error: string };

function sessionCookieOptions(maxAgeSeconds: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: maxAgeSeconds,
        path: "/",
    };
}

/**
 * Exchanges a freshly-minted Firebase ID token for a session cookie and sets
 * it httpOnly — the token itself is never persisted anywhere the client can
 * read it back from.
 */
export async function createSessionAction(idToken: string): Promise<ActionResult> {
    try {
        const sessionCookie = await mintSessionCookie(idToken);
        const cookieStore = await cookies();
        cookieStore.set(
            COOKIE_NAME,
            sessionCookie,
            sessionCookieOptions(SESSION_COOKIE_MAX_AGE_MS / 1000),
        );
        return { ok: true };
    } catch (err) {
        console.error("[session.actions] createSessionAction failed:", err);
        return {
            ok: false,
            error: err instanceof Error ? err.message : "Failed to create session",
        };
    }
}

/**
 * Revokes the current session server-side (so a copied cookie value stops
 * verifying immediately, not merely on natural expiry) and clears the cookie.
 * Best-effort on the revoke half — an already-expired/invalid cookie has
 * nothing to revoke, but is still cleared.
 */
export async function revokeSessionAction(): Promise<ActionResult> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (sessionCookie) {
        try {
            const decoded = await verifySessionCookie(sessionCookie);
            await revokeSession(decoded.uid);
        } catch (err) {
            console.error("[session.actions] revokeSessionAction verify/revoke failed:", err);
        }
    }

    cookieStore.set(COOKIE_NAME, "", sessionCookieOptions(0));
    return { ok: true };
}
