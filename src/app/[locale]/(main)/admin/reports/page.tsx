import { getTranslations } from "next-intl/server";

import { AdminReportsPageContent } from "@/features/admin/components";

import type { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });
    return { title: t("adminReportsTitle"), description: t("adminReportsDescription") };
}

/**
 * Admin Reports Page.
 *
 * @remarks Aggregates and displays system logs, user reports, and audit trails.
 * @example
 * <AdminReportsPage />
 */
export default function AdminReportsPage() {
    return <AdminReportsPageContent />;
}
