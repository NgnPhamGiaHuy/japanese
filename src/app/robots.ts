import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Almost the entire app requires a signed-in user (proxy.ts redirects
 * everything but /login and the shared-deck landing page to /login), so a
 * crawler hitting any other path would only ever see a login redirect —
 * useless for SEO and liable to read as a redirect chain. Disallow
 * everything, then carve out the one genuinely public, crawlable surface.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: ["/flashcard/shared/"],
            disallow: ["/"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
