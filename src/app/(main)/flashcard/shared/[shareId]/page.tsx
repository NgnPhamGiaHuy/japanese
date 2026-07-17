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

import { Suspense } from "react";

import { getPublicSharedLessonPreview } from "@/features/flashcard/services/shared-preview.service";
import SharedLessonPageClient from "./SharedLessonPageClient";

import type { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
    const { shareId } = await params;
    const preview = await getPublicSharedLessonPreview(shareId);

    if (!preview) {
        return { title: "Shared Deck | Kana & Nihongo Master" };
    }

    const title = `${preview.title} | Kana & Nihongo Master`;
    const description =
        preview.description ||
        `A shared Japanese flashcard deck with ${preview.cardCount} cards${preview.ownerName ? ` by ${preview.ownerName}` : ""}.`;

    return {
        title,
        description,
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
