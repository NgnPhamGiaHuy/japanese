import { defineRouting } from "next-intl/routing";

/**
 * "as-needed": the default locale (English) renders at bare paths (/, /kana)
 * with no prefix; other locales get one (/ja, /ja/kana). Chosen so existing
 * English URLs (bookmarks, the Wave 4 sitemap, shared-deck links) keep
 * resolving unchanged.
 */
export const routing = defineRouting({
    locales: ["en", "ja"],
    defaultLocale: "en",
    localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
