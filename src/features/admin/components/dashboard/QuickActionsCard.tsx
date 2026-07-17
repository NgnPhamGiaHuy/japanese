"use client";

import { useTranslations } from "next-intl";

import { FileText, Settings, Shield } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { AdminCard } from "../shared";

/**
 * Administrative Quick Actions Card.
 *
 * @remarks Provides immediate access to frequent administrative tasks like
 * global settings, content audits, and security reviews.
 */
const QuickActionsCard = () => {
    const t = useTranslations("AdminDashboard");
    return (
        <AdminCard title={t("quickActions")}>
            <div className="grid grid-cols-1 gap-2">
                <Button
                    variant="ghost"
                    className="!text-text !justify-start gap-3 !px-3 !py-2 !text-xs"
                >
                    <Settings size={14} className="text-muted" />
                    {t("globalSettings")}
                </Button>
                <Button
                    variant="ghost"
                    className="!text-text !justify-start gap-3 !px-3 !py-2 !text-xs"
                >
                    <FileText size={14} className="text-muted" />
                    {t("contentAudit")}
                </Button>
                <Button
                    variant="ghost"
                    className="!text-text !justify-start gap-3 !px-3 !py-2 !text-xs"
                >
                    <Shield size={14} className="text-muted" />
                    {t("securityReview")}
                </Button>
            </div>
        </AdminCard>
    );
};

export default QuickActionsCard;
