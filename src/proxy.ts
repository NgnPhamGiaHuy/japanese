import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { routing } from "./i18n/routing";

import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/sitemap.xml", "/robots.txt"];

// Public/social/crawler-facing surface under a dynamic segment — matched by
// pattern rather than prefix so only the exact landing page (or a same-segment
// SEO asset, e.g. opengraph-image) is public, never its study/match/speed
// sub-routes, which need a signed-in user for progress tracking. Next.js
// serves file-convention image routes with a build-generated hash suffix
// (e.g. opengraph-image-nnv7ce), hence the trailing (-[a-z0-9]+)? — the hash
// itself isn't stable across builds, so it can't be matched literally.
const PUBLIC_PATH_PATTERNS = [/^\/flashcard\/shared\/[^/]+(?:\/opengraph-image(?:-[a-z0-9]+)?)?$/];

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
 * Reads the `auth-token` cookie (set by useFirebaseAuth via onIdTokenChanged).
 * - Unauthenticated request to a protected path → redirect to /login
 * - Authenticated request to /login → redirect to /
 * The cookie is NOT httpOnly so Firebase client SDK can refresh it seamlessly.
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
    const token = request.cookies.get("auth-token")?.value;

    const isPublic =
        PUBLIC_PATHS.some((p) => path.startsWith(p)) ||
        PUBLIC_PATH_PATTERNS.some((re) => re.test(path));

    if (!token && !isPublic) {
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
