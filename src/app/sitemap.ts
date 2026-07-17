import { listPublicSharedLessonUrls } from "@/features/flashcard/services/shared-preview.service";

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Only the shared-deck landing page has any per-item public content today
 * (see robots.ts) — /login carries no indexable content and every other
 * route requires a signed-in user.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const publicDecks = await listPublicSharedLessonUrls();

    return publicDecks.map(({ shareId, lastModified }) => ({
        url: `${SITE_URL}/flashcard/shared/${shareId}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
    }));
}
