"use client";

import { BarChart3, Calendar, Download } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import AnalyticsDetailModal from "./AnalyticsDetailModal";
import ContentDistributionChart from "./ContentDistributionChart";
import EngagementChart from "./EngagementChart";
import ErrorTrendChart from "./ErrorTrendChart";
import RetentionChart from "./RetentionChart";
import GrowthChart from "../dashboard/GrowthChart";
import RoleChart from "../dashboard/RoleChart";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPageLayout } from "../shared";
import { useAnalytics, useAnalyticsDrilldown } from "../../hooks";

/**
 * Admin Analytics Dashboard Page.
 *
 * @remarks Orchestrates multiple visualization charts by consuming computed analytics data
 * from the useAnalytics hook. Handles loading and error states for the entire view.
 */
const AdminAnalyticsPageContent = () => {
    const { data, isLoading, error, refetch } = useAnalytics();
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
                <LoadingSpinner fullScreen={false} label="Loading deep insights..." />
            </AdminPageLayout>
        );
    if (error || !data) {
        return (
            <AdminPageLayout>
                <AdminErrorState
                    message={error?.message ?? "Analytics failed to load"}
                    onRetry={() => refetch()}
                />
            </AdminPageLayout>
        );
    }

    const drilldownTitle = selection ? `Drilling down: ${selection.label}` : "";
    const drilldownDesc = selection
        ? `Viewing detailed records associated with ${selection.value}. Records are live from Firebase.`
        : "";

    const isGlobalEmpty =
        data.growth.length === 0 &&
        data.engagement.length === 0 &&
        data.retention.length === 0 &&
        data.errorTrends.length === 0;

    if (isGlobalEmpty) {
        return (
            <AdminPageLayout>
                <AdminPageHeader
                    title="Advanced Analytics"
                    description="Cohort behavior and system performance insights."
                    icon={BarChart3}
                />
                <AdminEmptyState
                    title="No analytics data"
                    description="System metrics are computed daily. Data will appear here once the first batch is processed."
                    icon={BarChart3}
                />
            </AdminPageLayout>
        );
    }

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="Advanced Analytics"
                description="Long-term trends, cohort behavior, and system performance insights."
                icon={BarChart3}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" className="gap-2 !px-4 !py-2 text-sm">
                            <Calendar size={14} />
                            Last 30 Days
                        </Button>
                        <Button variant="primary" className="gap-2 !px-4 !py-2 text-sm">
                            <Download size={14} />
                            Export CSV
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <GrowthChart
                    data={data.growth}
                    onClick={(date) => openDrilldown("user_growth", "Registration Growth", date)}
                />
                <RoleChart
                    data={data.roles}
                    onClick={(role) => openDrilldown("role", "Administrative Distribution", role)}
                />
                <EngagementChart
                    data={data.engagement}
                    onClick={(feat) => openDrilldown("feature", "Feature Engagement", feat)}
                />
                <ContentDistributionChart
                    data={data.content}
                    onClick={(cat) => openDrilldown("content", "Content Breakdown", cat)}
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

            <div className="mt-8 rounded-3xl border-2 border-dashed border-gray-200 p-8 text-center">
                <p className="text-xs font-bold tracking-widest text-[#afafaf] uppercase">
                    Analytics data is pre-computed daily at 00:00 UTC. Next refresh in ~8 hours.
                </p>
            </div>
        </AdminPageLayout>
    );
};

export default AdminAnalyticsPageContent;
