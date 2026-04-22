"use client";

import Link from "next/link";

import { Activity, BookOpen, Database, Users, Zap } from "lucide-react";

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
    const { data, isLoading, error, refetch } = useAdminDashboard();

    if (isLoading)
        return (
            <AdminPageLayout>
                <LoadingSpinner fullScreen={false} label="Loading overview..." />
            </AdminPageLayout>
        );
    if (error || !data) {
        return (
            <AdminPageLayout>
                <AdminErrorState
                    message={error?.message ?? "Overview failed to load"}
                    onRetry={() => refetch()}
                />
            </AdminPageLayout>
        );
    }

    const { stats, recentActivity } = data;

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="System Overview"
                description="Real-time operational snapshot of the platform."
                icon={Zap}
                actions={
                    <div className="flex gap-2">
                        <Link href="/admin/users">
                            <Button
                                variant="secondary"
                                className="!px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                            >
                                Manage Users
                            </Button>
                        </Link>
                        <Link href="/admin/reports">
                            <Button
                                variant="primary"
                                className="!px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                            >
                                View Logs
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <AdminStatCard
                    label="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                />
                <AdminStatCard
                    label="Active Today"
                    value={stats.activeUsersToday}
                    icon={Activity}
                    color="text-[#58cc02]"
                />
                <AdminStatCard label="Flashcards" value={stats.totalFlashcards} icon={Database} />
                <AdminStatCard
                    label="Total Sessions"
                    value={stats.totalSessions}
                    icon={BookOpen}
                    color="text-[#ce82ff]"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                <AdminCard
                    title="Operational Feed"
                    padding="none"
                    className="lg:col-span-2"
                    actions={
                        <Link
                            href="/admin/reports"
                            className="text-[10px] font-black tracking-widest text-[#1cb0f6] uppercase hover:underline"
                        >
                            Full Audit Trail
                        </Link>
                    }
                >
                    <div className="divide-y divide-gray-50">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((log) => <LogRow key={log.id} log={log} />)
                        ) : (
                            <AdminEmptyState
                                title="No recent activity"
                                description="Operation logs will appear here as they happen."
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
