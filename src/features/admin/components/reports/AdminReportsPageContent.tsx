"use client";

import { useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import LogsFilters from "./LogsFilters";
import LogsSummaryHeader from "./LogsSummaryHeader";
import LogsVirtualList from "./LogsVirtualList";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPageLayout } from "../shared";
import { useLogs } from "../../hooks";

import type { AdminLogFilters } from "../../types";

/**
 * Admin Reports & Audit Logs Page.
 *
 * @remarks Provides a high-performance virtualized stream of system activity.
 * Coordinates real-time filtering, pagination, and statistical summaries.
 */
const AdminReportsPageContent = () => {
    const [filters, setFilters] = useState<AdminLogFilters>({});
    const {
        logs,
        countsByLevel,
        countsByType,
        isLoading,
        error,
        currentPage,
        goToNextPage,
        goToPreviousPage,
        hasNextPage,
        hasPreviousPage,
        createManualLog,
    } = useLogs(filters);

    const isEmpty = useMemo(() => !isLoading && logs.length === 0, [isLoading, logs.length]);

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="Reports"
                description="System logs and audit trail — filter by level, type, date, or full-text search."
                icon={FileText}
                isLive={true}
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
                        </div>

                        <LogsVirtualList logs={logs} />

                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between border-t-2 border-gray-50 bg-gray-50/10 px-6 py-4">
                            <div className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Page {currentPage + 1}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => goToPreviousPage()}
                                    disabled={!hasPreviousPage}
                                    variant="secondary"
                                    className="!rounded-xl !p-2 transition-all active:scale-95"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() => goToNextPage()}
                                    disabled={!hasNextPage}
                                    variant="secondary"
                                    className="!rounded-xl !p-2 transition-all active:scale-95"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <LoadingSpinner fullScreen={false} label="Loading logs..." />}
            {error && <AdminErrorState message={error.message} />}
            {isEmpty && (
                <AdminEmptyState
                    title="No logs match your filters"
                    description="We couldn't find any audit logs for the selected criteria. Try adjusting your time range or log levels."
                    icon={FileText}
                    action={
                        Object.keys(filters).length > 0 ? (
                            <Button variant="secondary" onClick={() => setFilters({})}>
                                Clear Filters
                            </Button>
                        ) : undefined
                    }
                />
            )}
        </AdminPageLayout>
    );
};

export default AdminReportsPageContent;
