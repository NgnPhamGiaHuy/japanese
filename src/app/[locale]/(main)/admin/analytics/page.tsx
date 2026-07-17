import { getTranslations } from "next-intl/server";

import { AdminAnalyticsPageContent } from "@/features/admin/components";

import type { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });
    return { title: t("adminAnalyticsTitle"), description: t("adminAnalyticsDescription") };
}

/**
 * Admin Analytics Page.
 *
 * @remarks Visualizes platform usage statistics, user engagement, and system performance.
 * @example
 * <AdminAnalyticsPage />
 */
export default function AdminAnalyticsPage() {
    return <AdminAnalyticsPageContent />;
}
