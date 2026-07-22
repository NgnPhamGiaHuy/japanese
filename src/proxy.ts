import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { isPublicAtEdge } from "@/shared/constants/public-routes";
import { COOKIE_NAME } from "@/shared/utils/cookie";
import { routing } from "./i18n/routing";

import type { NextRequest } from "next/server";

const POSTHOG_INGEST_HOST = "us.i.posthog.com";
const POSTHOG_ASSETS_HOST = "us-assets.i.posthog.com";

const handleI18nRouting = createMiddleware(routing);

/**
 * Splits a pathname into its locale prefix and the underlying app path, so
 * auth-gating can match paths independent of locale. Under "as-needed", the
 * default locale (en) has no prefix — visiting it explicitly (/en/kana) is
 * still recognized here so it resolves the same as bare /kana, but its
 * canonical (redirect-target) prefix is "" rather than "/en".
 */
function splitLocale(pathname: string): { path: string; canonicalPrefix: string } {
    for (const locale of routing.locales) {
        const canonicalPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
        if (pathname === `/${locale}`) return { path: "/", canonicalPrefix };
        if (pathname.startsWith(`/${locale}/`)) {
            return { path: pathname.slice(locale.length + 1), canonicalPrefix };
        }
    }
    return { path: pathname, canonicalPrefix: "" };
}

/**
 * Route protection (Next.js 16 `proxy` convention; replaces deprecated `middleware`).
 * Reads the `auth-token` cookie (an httpOnly, server-minted session cookie —
 * see lib/auth-session.ts and features/user/actions/session.actions.ts).
 * - Unauthenticated request to a protected path → redirect to /login
 * - Authenticated request to /login → redirect to /
 *
 * ADR-107: this check is presence-only, by design — it is routing UX, never
 * a security boundary. Real verification (`verifySessionCookie`) happens
 * server-side in admin actions; every other server action re-verifies
 * identity from the client SDK's own in-memory ID token independently of
 * this cookie. A future server-rendered protected page must call
 * `verifySessionCookie` itself rather than inferring anything from having
 * reached this point.
 *
 * Also reverse-proxies /ingest/* to PostHog so event capture is first-party
 * (same-origin, not ad-blocked) — see src/lib/posthog.ts (api_host: "/ingest").
 * Requests here only ever exist if the client SDK initialized, which is
 * itself prod-gated, so this path is inert everywhere except production.
 *
 * next-intl's locale routing (E12-T1) runs first so `[locale]` always
 * resolves to a real locale by the time the App Router sees the request;
 * /sitemap.xml and /robots.txt bypass it entirely since those are
 * single-canonical-URL crawler files, never locale-prefixed.
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/ingest/")) {
        const url = request.nextUrl.clone();
        url.protocol = "https";
        url.hostname = pathname.startsWith("/ingest/static/")
            ? POSTHOG_ASSETS_HOST
            : POSTHOG_INGEST_HOST;
        url.port = "";
        url.pathname = pathname.replace(/^\/ingest/, "");
        return NextResponse.rewrite(url);
    }

    if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
        return NextResponse.next();
    }

    const intlResponse = handleI18nRouting(request);

    const { path, canonicalPrefix } = splitLocale(pathname);
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token && !isPublicAtEdge(path)) {
        const url = request.nextUrl.clone();
        url.pathname = `${canonicalPrefix}/login`;
        return NextResponse.redirect(url);
    }

    if (token && path === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = canonicalPrefix || "/";
        return NextResponse.redirect(url);
    }

    return intlResponse;
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static  (Next.js build assets)
         * - _next/image   (image optimisation)
         * - favicon.ico
         * - *.svg / *.png / *.jpg / *.ico (static public files)
         */
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)).*)",
    ],
};
