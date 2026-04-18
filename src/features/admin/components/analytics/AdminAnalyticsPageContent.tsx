"use client";

import { BarChart3, Calendar, Download } from "lucide-react";

import { Button, Card, LoadingSpinner } from "@/shared/components/ui";
import EngagementChart from "./EngagementChart";
import ErrorTrendChart from "./ErrorTrendChart";
import RetentionChart from "./RetentionChart";
import GrowthChart from "../dashboard/GrowthChart";
import RoleChart from "../dashboard/RoleChart";
import { AdminErrorState, AdminPageHeader, AdminPageLayout } from "../shared";
import { useAnalytics } from "../../hooks";

/**
 * Admin Analytics Dashboard Page.
 *
 * @remarks Orchestrates multiple visualization charts by consuming computed analytics data
 * from the useAnalytics hook. Handles loading and error states for the entire view.
 */
const AdminAnalyticsPageContent = () => {
    const { data, isLoading, error, refetch } = useAnalytics();

    if (isLoading) return <LoadingSpinner fullScreen={false} label="Loading deep insights..." />;
    if (error || !data) {
        return (
            <AdminErrorState
                message={error?.message ?? "Analytics failed to load"}
                onRetry={() => refetch()}
            />
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
                <Card variant="dashboard" padding="lg" className="border-2 border-gray-100">
                    <GrowthChart data={data.growth} />
                </Card>

                <Card variant="dashboard" padding="lg" className="border-2 border-gray-100">
                    <RoleChart data={data.roles} />
                </Card>

                <Card variant="dashboard" padding="lg" className="border-2 border-gray-100">
                    <EngagementChart data={data.engagement} />
                </Card>

                <Card variant="dashboard" padding="lg" className="border-2 border-gray-100">
                    <RetentionChart data={data.retention} />
                </Card>

                <div className="lg:col-span-2">
                    <Card
                        variant="dashboard"
                        padding="lg"
                        className="border-2 border-gray-100 bg-red-50/10"
                    >
                        <ErrorTrendChart data={data.errorTrends} />
                    </Card>
                </div>
            </div>

            <div className="mt-8 rounded-3xl border-2 border-dashed border-gray-200 p-8 text-center">
                <p className="text-xs font-bold tracking-widest text-[#afafaf] uppercase">
                    Analytics data is pre-computed daily at 00:00 UTC. Next refresh in ~8 hours.
                </p>
            </div>
        </AdminPageLayout>
    );
};

export default AdminAnalyticsPageContent;
