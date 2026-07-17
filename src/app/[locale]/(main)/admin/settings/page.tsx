import { getTranslations } from "next-intl/server";

import { AdminSettingsPageContent } from "@/features/admin/components";

import type { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });
    return { title: t("adminSettingsTitle"), description: t("adminSettingsDescription") };
}

/**
 * Admin Settings Page.
 *
 * @remarks Provides interface for managing global administrative configurations.
 * @example
 * <AdminSettingsPage />
 */
export default function AdminSettingsPage() {
    return <AdminSettingsPageContent />;
}
