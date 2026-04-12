import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Route-protection middleware.
 * Reads the `auth-token` cookie (set by useFirebaseAuth via onIdTokenChanged).
 * - Unauthenticated request to a protected path → redirect to /login
 * - Authenticated request to /login → redirect to /
 * The cookie is NOT httpOnly so Firebase client SDK can refresh it seamlessly.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
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
