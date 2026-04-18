"use client";

import { useMemo, useState } from "react";

import { clsx } from "clsx";
import { FileText } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import LogsFilters from "./LogsFilters";
import LogsSummaryHeader from "./LogsSummaryHeader";
import LogsVirtualList from "./LogsVirtualList";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPageLayout } from "../shared";
import { useLogs } from "../../hooks";

import type { AdminLogFilters, LogLevel } from "../../types";

const LEVEL_ORDER: LogLevel[] = ["error", "warn", "security", "info"];

/**
 * Admin Reports & Audit Logs Page.
 *
 * @remarks Provides a high-performance virtualized stream of system activity.
 * Coordinates real-time filtering, pagination, and statistical summaries.
 * Delegates data transformation to useLogs hook to remain strictly UI-focused.
 */
const AdminReportsPageContent = () => {
    const [filters, setFilters] = useState<AdminLogFilters>({});
    const {
        logs,
        countsByLevel,
        countsByType,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        createManualLog,
    } = useLogs(filters);

    const isEmpty = useMemo(() => !isLoading && logs.length === 0, [isLoading, logs.length]);

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="Reports"
                description="System logs and audit trail — filter by level, type, date, or full-text search."
                icon={FileText}
                actions={<Button onClick={() => createManualLog()}>Emit Test Log</Button>}
            />
            <LogsFilters filters={filters} onChange={setFilters} />

            {!isLoading && !error && logs.length > 0 && (
                <div className="flex flex-col gap-4">
                    <LogsSummaryHeader
                        totalLoaded={logs.length}
                        countsByLevel={countsByLevel}
                        countsByType={countsByType}
                    />

                    <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-b-8 border-gray-100 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b-2 border-gray-50 bg-gray-50/30 px-6 py-4">
                            <h2 className="text-xs font-black tracking-widest text-[#3c3c3c] uppercase">
                                Audit Trail
                            </h2>
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-2 w-2 animate-pulse rounded-full bg-[#58cc02]"
                                    title="Real-time monitoring"
                                />
                                <span className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                    Live Stream
                                </span>
                            </div>
                        </div>

                        <LogsVirtualList logs={logs} />

                        {hasNextPage && (
                            <div className="border-t-2 border-gray-50 p-6">
                                <Button
                                    onClick={() => fetchNextPage()}
                                    loading={isFetchingNextPage}
                                    variant="primary"
                                    className="w-full !rounded-2xl !py-4 !text-base shadow-lg shadow-[#1cb0f6]/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    Load More Logs
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isLoading && <LoadingSpinner fullScreen={false} label="Loading logs..." />}
            {error && <AdminErrorState message={error.message} />}
            {isEmpty && (
                <AdminEmptyState
                    title="No logs found"
                    description="Try changing filters."
                    icon={FileText}
                />
            )}
        </AdminPageLayout>
    );
};

export default AdminReportsPageContent;
