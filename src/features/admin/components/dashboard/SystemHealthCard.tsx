"use client";

import { useTranslations } from "next-intl";

import { AdminCard } from "../shared";

interface SystemHealthCardProps {
    /** `null` renders a distinct "no data" state instead of a fabricated 0 (ADR-114). */
    errorRate: number | null;
    activeAdmins: number;
    activeSuperAdmins: number;
}

/**
 * System Health Monitoring Card.
 *
 * @remarks Displays real-time operational metrics like error rate and administrative presence.
 * Uses conditional styling to highlight high error rates.
 */
const SystemHealthCard = ({
    errorRate,
    activeAdmins,
    activeSuperAdmins,
}: SystemHealthCardProps) => {
    const t = useTranslations("AdminDashboard");
    const hasErrorRate = errorRate !== null;
    return (
        <AdminCard title={t("systemHealth")}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-bold">{t("errorRate")}</span>
                    <span
                        className={
                            !hasErrorRate
                                ? "text-muted font-bold italic"
                                : errorRate > 2
                                  ? "text-danger font-black"
                                  : "text-hiragana font-black"
                        }
                    >
                        {hasErrorRate ? `${errorRate}%` : t("noDataSource")}
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    {hasErrorRate && (
                        <div
                            className="bg-danger h-full transition-all"
                            style={{ width: `${Math.min(errorRate * 10, 100)}%` }}
                        />
                    )}
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-bold">{t("activeTeam")}</span>
                    <span className="text-text font-black">
                        {activeAdmins}A / {activeSuperAdmins}S
                    </span>
                </div>
            </div>
        </AdminCard>
    );
};

export default SystemHealthCard;
