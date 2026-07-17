"use client";

import { useTranslations } from "next-intl";

import { Settings } from "lucide-react";

import { Card } from "@/shared/components/ui";
import { AdminPageHeader, AdminPageLayout } from "../shared";

/**
 * Admin System Settings Page.
 *
 * @remarks Global platform configuration is not yet wired to a backend.
 * This page renders an explicit "not available" state instead of a form that
 * appears to save but persists nothing.
 */
const AdminSettingsPageContent = () => {
    const t = useTranslations("AdminSettings");
    return (
        <AdminPageLayout>
            <AdminPageHeader title={t("title")} description={t("description")} icon={Settings} />
            <Card className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="text-muted flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    <Settings size={28} strokeWidth={2.5} />
                </div>
                <p className="text-text text-lg font-black">{t("notAvailableYet")}</p>
                <p className="text-muted max-w-sm text-sm font-bold">{t("notAvailableMessage")}</p>
            </Card>
        </AdminPageLayout>
    );
};

export default AdminSettingsPageContent;
