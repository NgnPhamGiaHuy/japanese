/**
 * @file shared/utils/cookie
 * The auth cookie's name — the one fact both the client and the server need
 * to agree on.
 *
 * @remarks
 * Pre-ADR-107, this file also read/wrote the cookie directly via
 * `document.cookie`, because the cookie held a JS-readable raw ID token. It
 * now holds an httpOnly, server-minted session cookie (`lib/auth-session.ts`)
 * — client JS cannot read or write it at all, by design. Setting, clearing,
 * and verifying it are exclusively server-side concerns now: see
 * `features/user/actions/session.actions.ts` (mint/revoke) and
 * `features/admin/services/admin.service.ts` (verify, for admin actions).
 * `proxy.ts`'s edge gate still reads this cookie's *presence* via
 * `request.cookies` — that works regardless of httpOnly, since the
 * restriction is on JavaScript's `document.cookie`, not on the server
 * reading the raw `Cookie` request header.
 */
export const COOKIE_NAME = "auth-token";
