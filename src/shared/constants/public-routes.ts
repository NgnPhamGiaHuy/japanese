/**
 * @file public-routes.ts
 * The single source of truth for "may an unauthenticated visitor reach this?".
 *
 * @remarks
 * This list previously existed twice — once in `proxy.ts` (edge redirect) and
 * once in `lib/providers.tsx` (the auth-ready splash gate) — and the two had
 * silently drifted apart: the AuthGate copy admitted only the shared-deck
 * landing page while its comment claimed to mirror the proxy. Two lists that
 * must agree, may be edited independently, and are never compared will diverge;
 * the only question is when someone notices.
 *
 * The two consumers do genuinely need different subsets, so the difference is
 * expressed as **named derivations from one list** rather than as two lists:
 *
 * - `isPublicAtEdge` — every public route. The edge decides redirect-vs-allow
 *   for *all* requests, including ones that never render React.
 * - `isPublicForRender` — the `page` subset only. The AuthGate decides
 *   splash-vs-render, and a sitemap or an OG image never reaches a React tree,
 *   so including them would be meaningless rather than merely harmless.
 *
 * Adding a public route means adding one entry here. Both consumers honor it.
 */

/**
 * Whether a public route renders through the React tree.
 *
 * - `page` — a real page render; the AuthGate has an opinion about it.
 * - `asset` — served without the React shell (crawler files, file-convention
 *   image routes). Only the edge ever sees these.
 */
type PublicRouteKind = "page" | "asset";

interface PublicRoute {
    /** Stable identifier, used in tests and in the ledger. */
    readonly id: string;
    readonly kind: PublicRouteKind;
    /** Why this route is reachable signed-out — the part a future reader needs. */
    readonly why: string;
    /** Matched by path prefix, mirroring the original `startsWith` semantics. */
    readonly prefix?: string;
    /** Matched by pattern, for routes under a dynamic segment. */
    readonly pattern?: RegExp;
}

/**
 * Every route reachable without a session, locale prefix already stripped.
 *
 * The shared-deck landing page and its OG image are separate entries even
 * though the proxy previously matched both with a single optional-suffix
 * regex: they differ in `kind`, and that distinction is exactly what lets the
 * AuthGate take the page and ignore the image. Their union is unchanged.
 */
export const PUBLIC_ROUTES: readonly PublicRoute[] = [
    {
        id: "login",
        kind: "page",
        prefix: "/login",
        why: "The sign-in screen itself — the one page guaranteed to be viewed signed-out.",
    },
    {
        id: "sitemap",
        kind: "asset",
        prefix: "/sitemap.xml",
        why: "Crawler file with a single canonical URL; never locale-prefixed, never React-rendered.",
    },
    {
        id: "robots",
        kind: "asset",
        prefix: "/robots.txt",
        why: "Crawler file with a single canonical URL; never locale-prefixed, never React-rendered.",
    },
    {
        id: "shared-deck",
        kind: "page",
        pattern: /^\/flashcard\/shared\/[^/]+$/,
        why: "Public share-link landing page. Server-rendered for crawlers and link previews, so it must not sit behind a client-only splash. Only the exact landing page — its study/match/speed sub-routes need a signed-in user for progress tracking.",
    },
    {
        id: "shared-deck-og",
        kind: "asset",
        // Next.js serves file-convention image routes with a build-generated
        // hash suffix (e.g. opengraph-image-nnv7ce) that is not stable across
        // builds, hence the optional `-[a-z0-9]+` rather than a literal match.
        pattern: /^\/flashcard\/shared\/[^/]+\/opengraph-image(?:-[a-z0-9]+)?$/,
        why: "Social preview image for the share link. Fetched by crawlers that never carry a session cookie.",
    },
];

function matches(route: PublicRoute, path: string): boolean {
    if (route.prefix !== undefined && path.startsWith(route.prefix)) return true;
    return route.pattern?.test(path) ?? false;
}

/**
 * Edge derivation: may an unauthenticated request reach this path at all?
 *
 * Consumed by `proxy.ts`. Covers every entry — a crawler fetching the sitemap
 * or an OG image must not be redirected to /login.
 */
export function isPublicAtEdge(path: string): boolean {
    return PUBLIC_ROUTES.some((route) => matches(route, path));
}

/**
 * Render derivation: should this path render immediately rather than waiting
 * behind the auth-ready splash?
 *
 * Consumed by the AuthGate. Restricted to `page` entries: assets never reach
 * the React tree, so they cannot be splash-gated and need no opinion here.
 */
export function isPublicForRender(path: string): boolean {
    return PUBLIC_ROUTES.some((route) => route.kind === "page" && matches(route, path));
}
