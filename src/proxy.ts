import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

const POSTHOG_INGEST_HOST = "us.i.posthog.com";
const POSTHOG_ASSETS_HOST = "us-assets.i.posthog.com";

/**
 * Route protection (Next.js 16 `proxy` convention; replaces deprecated `middleware`).
 * Reads the `auth-token` cookie (set by useFirebaseAuth via onIdTokenChanged).
 * - Unauthenticated request to a protected path → redirect to /login
 * - Authenticated request to /login → redirect to /
 * The cookie is NOT httpOnly so Firebase client SDK can refresh it seamlessly.
 *
 * Also reverse-proxies /ingest/* to PostHog so event capture is first-party
 * (same-origin, not ad-blocked) — see src/lib/posthog.ts (api_host: "/ingest").
 * Requests here only ever exist if the client SDK initialized, which is
 * itself prod-gated, so this path is inert everywhere except production.
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

    const token = request.cookies.get("auth-token")?.value;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!token && !isPublic) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (token && pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
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
