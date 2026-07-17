import { getTranslations } from "next-intl/server";

import { AdminContentPageContent } from "@/features/admin/components/content";

import type { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });
    return { title: t("adminContentTitle"), description: t("adminContentDescription") };
}

/**
 * Admin Content Management Page.
 *
 * @remarks Orchestrates the global flashcard and lesson moderation tools.
 * @example
 * <AdminContentPage />
 */
export default function AdminContentPage() {
    return <AdminContentPageContent />;
}
