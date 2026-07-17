"use client";

import { useTranslations } from "next-intl";

import { Activity, BookOpen, Database, Users, Zap } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button, LoadingSpinner } from "@/shared/components/ui";
import QuickActionsCard from "./QuickActionsCard";
import SystemHealthCard from "./SystemHealthCard";
import { LogRow } from "../reports";
import {
    AdminCard,
    AdminEmptyState,
    AdminErrorState,
    AdminPageHeader,
    AdminPageLayout,
    AdminStatCard,
} from "../shared";
import { useAdminDashboard } from "../../hooks";

/**
 * Admin Operational Dashboard Overview.
 *
 * @remarks The primary status page for administrators. Orchestrates high-level metrics,
 * recent operational activity feed, and system health monitoring.
 */
const AdminOverviewPage = () => {
    const t = useTranslations("AdminDashboard");
    const { data, isLoading, error, refetch } = useAdminDashboard();

    if (isLoading)
        return (
            <AdminPageLayout>
                <LoadingSpinner fullScreen={false} label={t("loadingOverview")} />
            </AdminPageLayout>
        );
    if (error || !data) {
        return (
            <AdminPageLayout>
                <AdminErrorState
                    message={error?.message ?? t("overviewFailedToLoad")}
                    onRetry={() => refetch()}
                />
            </AdminPageLayout>
        );
    }

    const { stats, recentActivity } = data;

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title={t("title")}
                description={t("description")}
                icon={Zap}
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/users">
                            <Button
                                variant="secondary"
                                className="!px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                            >
                                {t("manageUsers")}
                            </Button>
                        </Link>
                        <Link href="/admin/reports">
                            <Button
                                variant="primary"
                                className="!px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                            >
                                {t("viewLogs")}
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <AdminStatCard label={t("totalUsers")} value={stats.totalUsers} icon={Users} />
                <AdminStatCard
                    label={t("activeToday")}
                    value={stats.activeUsersToday}
                    icon={Activity}
                    color="text-hiragana"
                />
                <AdminStatCard
                    label={t("flashcards")}
                    value={stats.totalFlashcards}
                    icon={Database}
                />
                <AdminStatCard
                    label={t("totalSessions")}
                    value={stats.totalSessions}
                    icon={BookOpen}
                    color="text-both"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                <AdminCard
                    title={t("operationalFeed")}
                    padding="none"
                    className="lg:col-span-2"
                    actions={
                        <Link
                            href="/admin/reports"
                            className="text-katakana text-xs font-black tracking-widest uppercase hover:underline"
                        >
                            {t("fullAuditTrail")}
                        </Link>
                    }
                >
                    <div className="divide-y divide-gray-50">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((log) => <LogRow key={log.id} log={log} />)
                        ) : (
                            <AdminEmptyState
                                title={t("noRecentActivity")}
                                description={t("noRecentActivityDescription")}
                                icon={Activity}
                            />
                        )}
                    </div>
                </AdminCard>

                <div className="space-y-4 sm:space-y-6">
                    <SystemHealthCard
                        errorRate={stats.errorRate}
                        activeAdmins={stats.activeAdmins}
                        activeSuperAdmins={stats.activeSuperAdmins}
                    />
                    <QuickActionsCard />
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default AdminOverviewPage;
