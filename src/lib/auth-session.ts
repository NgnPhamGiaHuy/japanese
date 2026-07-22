/**
 * @file lib/auth-session
 * Server-minted, httpOnly session-cookie lifecycle (ADR-107, T-107a).
 *
 * @remarks
 * Replaces the previous design, where the client wrote its raw Firebase ID
 * token directly into a JS-readable `document.cookie` (any XSS anywhere
 * exfiltrated a live bearer token). The cookie now holds an opaque Firebase
 * session-cookie value — httpOnly, minted and verified only here via the
 * Admin SDK. `verifySessionCookie` is what makes server-side verification
 * real: a forged or expired value is rejected by cryptographic verification,
 * not by mere presence (which is all the edge gate in proxy.ts ever checks).
 */
import "server-only";

import { adminAuth } from "./firebase-admin";

import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * 5 days — a deliberate choice, not the previous 7-day cookie carried over.
 * Firebase session cookies cap at 14 days; unlike the old design, this
 * expiry is enforced by the same system (`verifySessionCookie`) that
 * validates the cookie, so there is no "cookie outlives token" gap (W-15).
 */
export const SESSION_COOKIE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Exchanges a freshly-obtained Firebase ID token for an opaque session-cookie
 * value. Must be called immediately after the client SDK issues the ID token
 * (sign-in, or a token refresh) — `createSessionCookie` requires a token
 * younger than 5 minutes.
 */
export async function mintSessionCookie(idToken: string): Promise<string> {
    return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_COOKIE_MAX_AGE_MS });
}

/**
 * Verifies a session-cookie value against Firebase's servers, rejecting a
 * forged, expired, or (via `checkRevoked: true`) explicitly revoked session —
 * this is the real verification ADR-107 requires, distinct from the edge
 * gate's presence-only check.
 */
export async function verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken> {
    return adminAuth.verifySessionCookie(sessionCookie, true);
}

/**
 * Revokes every refresh token for `uid`, so a `verifySessionCookie` call made
 * with `checkRevoked: true` — every call this module makes — starts rejecting
 * that user's existing session cookies immediately. Without this, clearing
 * the cookie client-side would leave a copied/stolen cookie value valid until
 * its natural expiry.
 */
export async function revokeSession(uid: string): Promise<void> {
    await adminAuth.revokeRefreshTokens(uid);
}
