"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useState } from "react";

import { BarChart3, Calendar, Download } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import AnalyticsDetailModal from "./AnalyticsDetailModal";
import AnalyticsExportModal from "./AnalyticsExportModal";
import {
    AdminEmptyState,
    AdminErrorState,
    AdminPageHeader,
    AdminPageLayout,
    ChartSkeleton,
} from "../shared";
import { useAnalytics, useAnalyticsDrilldown } from "../../hooks";

// recharts (~141KB gz) is only needed on this route — dynamic-imported per
// chart (rather than a single combined import) so the bundler can still
// split/parallelize the fetch, keeping it out of the common bundle every
// other route pays for (E11-T2). ssr: false — recharts' ResponsiveContainer
// measures the DOM and renders nothing meaningful server-side anyway.
const GrowthChart = dynamic(() => import("../dashboard/GrowthChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const RoleChart = dynamic(() => import("../dashboard/RoleChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const EngagementChart = dynamic(() => import("./EngagementChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const ContentDistributionChart = dynamic(() => import("./ContentDistributionChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const RetentionChart = dynamic(() => import("./RetentionChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const ErrorTrendChart = dynamic(() => import("./ErrorTrendChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const LogVolumeChart = dynamic(() => import("./LogVolumeChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const LogLevelChart = dynamic(() => import("./LogLevelChart"), {
    ssr: false,
    loading: ChartSkeleton,
});
const TopActionsChart = dynamic(() => import("./TopActionsChart"), {
    ssr: false,
    loading: ChartSkeleton,
});

/**
 * Admin Analytics Dashboard Page.
 *
 * @remarks Orchestrates multiple visualization charts by consuming computed analytics data
 * from the useAnalytics hook. Handles loading and error states for the entire view.
 */
const AdminAnalyticsPageContent = () => {
    const t = useTranslations("AdminAnalytics");
    const { data, isLoading, error, refetch } = useAnalytics();
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const {
        selection,
        data: drilldownData,
        isLoading: isDrilldownLoading,
        error: drilldownError,
        openDrilldown,
        closeDrilldown,
    } = useAnalyticsDrilldown();

    if (isLoading)
        return (
            <AdminPageLayout>
                <LoadingSpinner fullScreen={false} label={t("loadingInsights")} />
            </AdminPageLayout>
        );
    if (error || !data) {
        return (
            <AdminPageLayout>
                <AdminErrorState
                    message={error?.message ?? t("analyticsFailedToLoad")}
                    onRetry={() => refetch()}
                />
            </AdminPageLayout>
        );
    }

    const drilldownTitle = selection ? t("drilldownTitle", { label: selection.label }) : "";
    const drilldownDesc = selection ? t("drilldownDescription", { value: selection.value }) : "";

    const isGlobalEmpty =
        data.growth.length === 0 &&
        data.engagement.length === 0 &&
        data.retention.length === 0 &&
        data.errorTrends.length === 0;

    if (isGlobalEmpty) {
        return (
            <AdminPageLayout>
                <AdminPageHeader
                    title={t("title")}
                    description={t("descriptionShort")}
                    icon={BarChart3}
                />
                <AdminEmptyState
                    title={t("noAnalyticsData")}
                    description={t("noAnalyticsDataDescription")}
                    icon={BarChart3}
                />
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title={t("title")}
                description={t("description")}
                icon={BarChart3}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            className="gap-2 !px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                        >
                            <Calendar size={14} />
                            {t("last30Days")}
                        </Button>
                        <Button
                            variant="primary"
                            className="gap-2 !px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                            onClick={() => setIsExportModalOpen(true)}
                        >
                            <Download size={14} />
                            {t("exportCsv")}
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <GrowthChart
                    data={data.growth}
                    onClick={(date) =>
                        openDrilldown("user_growth", t("registrationGrowthLabel"), date)
                    }
                />
                <RoleChart
                    data={data.roles}
                    onClick={(role) =>
                        openDrilldown("role", t("administrativeDistributionLabel"), role)
                    }
                />
                <EngagementChart
                    data={data.engagement}
                    onClick={(feat) => openDrilldown("feature", t("engagement"), feat)}
                />
                <ContentDistributionChart
                    data={data.content}
                    onClick={(cat) => openDrilldown("content", t("contentBreakdownLabel"), cat)}
                />
                <RetentionChart data={data.retention} />
                <ErrorTrendChart data={data.errorTrends} />
            </div>

            <AnalyticsDetailModal
                isOpen={!!selection}
                onClose={closeDrilldown}
                title={drilldownTitle}
                description={drilldownDesc}
                data={drilldownData}
                isLoading={isDrilldownLoading}
                error={drilldownError}
            />

            <AnalyticsExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />

            {/* ── Log-derived charts ── */}
            {(data.logVolume?.length > 0 ||
                data.logsByLevel?.length > 0 ||
                data.topActions?.length > 0) && (
                <>
                    <div className="flex items-center gap-3 pt-2">
                        <div className="h-px flex-1 bg-gray-100" />
                        <span className="text-muted text-xs font-black tracking-widest uppercase">
                            {t("systemLogInsights")}
                        </span>
                        <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                        <div className="lg:col-span-2">
                            <LogVolumeChart
                                data={data.logVolume ?? []}
                                onClick={(type) =>
                                    openDrilldown("log_type", t("logTypeDrilldown", { type }), type)
                                }
                            />
                        </div>
                        <LogLevelChart
                            data={data.logsByLevel ?? []}
                            onClick={(level) =>
                                openDrilldown("log_level", t("severityDrilldown", { level }), level)
                            }
                        />
                        <TopActionsChart
                            data={data.topActions ?? []}
                            onClick={(action) =>
                                openDrilldown(
                                    "log_action",
                                    t("actionDrilldown", { action }),
                                    action,
                                )
                            }
                        />
                    </div>
                </>
            )}
        </AdminPageLayout>
    );
};

export default AdminAnalyticsPageContent;
