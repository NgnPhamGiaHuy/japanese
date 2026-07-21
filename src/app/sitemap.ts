import { listPublicSharedLessonUrls } from "@/features/flashcard/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

import type { MetadataRoute } from "next";

/** Locale-prefixed URL for a route, per routing's "as-needed" scheme (E12-T1) — the default locale (en) is unprefixed. */
function localizedUrl(path: string, locale: string): string {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return `${SITE_URL}${prefix}${path}`;
}

/**
 * Only the shared-deck landing page has any per-item public content today
 * (see robots.ts) — /login carries no indexable content and every other
 * route requires a signed-in user.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const publicDecks = await listPublicSharedLessonUrls();

    return publicDecks.map(({ shareId, lastModified }) => {
        const path = `/flashcard/shared/${shareId}`;
        return {
            url: localizedUrl(path, routing.defaultLocale),
            lastModified,
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
                languages: Object.fromEntries(
                    routing.locales.map((locale) => [locale, localizedUrl(path, locale)]),
                ),
            },
        };
    });
}
