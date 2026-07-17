/**
 * @file SharedLessonPage
 * Server entry point for the public shared-deck route.
 *
 * @remarks
 * Starts a one-shot Admin SDK preview fetch on the server (never awaited
 * here) and hands the Promise down to the client component, which unwraps
 * it via `use()` — Next.js streams the resolved HTML inline as part of the
 * same response, so view-source shows real deck content for public/
 * link-accessible decks instead of an empty client shell. The full,
 * viewer-aware resolution (role, per-user progress, all interactivity)
 * still happens client-side exactly as before; no live subscription is ever
 * placed on the server.
 */

import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { getPublicSharedLessonPreview } from "@/features/flashcard/services/shared-preview.service";
import { routing } from "@/i18n/routing";
import SharedLessonPageClient from "./SharedLessonPageClient";

import type { Metadata } from "next";

/** Locale-prefixed path for this route, per routing's "as-needed" scheme (E12-T1) — the default locale (en) is unprefixed. */
function localizedPath(shareId: string, locale: string): string {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    return `${prefix}/flashcard/shared/${shareId}`;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ shareId: string; locale: string }>;
}): Promise<Metadata> {
    const { shareId, locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });
    const preview = await getPublicSharedLessonPreview(shareId);

    const alternates = {
        languages: Object.fromEntries(
            routing.locales.map((alternateLocale) => [
                alternateLocale,
                localizedPath(shareId, alternateLocale),
            ]),
        ),
    };

    if (!preview) {
        return { title: t("sharedDeckFallbackTitle"), alternates };
    }

    const title = t("sharedDeckTitle", { title: preview.title });
    // Two variants rather than an appended "by {owner}" clause — the owner
    // attribution sits at the front of the sentence in Japanese.
    const description =
        preview.description ||
        (preview.ownerName
            ? t("sharedDeckDescriptionByOwner", {
                  count: preview.cardCount,
                  owner: preview.ownerName,
              })
            : t("sharedDeckDescription", { count: preview.cardCount }));

    return {
        title,
        description,
        alternates,
        openGraph: {
            title: preview.title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: preview.title,
            description,
        },
    };
}

function LoadingShell() {
    return (
        <div className="bg-bg fixed inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
        </div>
    );
}

export default async function SharedLessonPage({
    params,
}: {
    params: Promise<{ shareId: string }>;
}) {
    const { shareId } = await params;
    const previewPromise = getPublicSharedLessonPreview(shareId);

    return (
        <Suspense fallback={<LoadingShell />}>
            <SharedLessonPageClient shareId={shareId} previewPromise={previewPromise} />
        </Suspense>
    );
}
