/**
 * Admin Reports & Audit Logs Page.
 *
 * @remarks
 * Provides a high-performance virtualized stream of system activity.
 * Coordinates cursor-based pagination, real-time filtering, and statistical summaries.
 * Summary chips are wired directly to the filter state for one-click drill-down.
 *
 * @example
 * <AdminReportsPageContent />
 */
"use client";

import { useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, FileText, RefreshCw } from "lucide-react";

import { Button, Card, LoadingSpinner } from "@/shared/components/ui";
import LogsFilters from "./LogsFilters";
import LogsSummaryHeader from "./LogsSummaryHeader";
import LogsVirtualList from "./LogsVirtualList";
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPageLayout } from "../shared";
import { useLogs } from "../../hooks";

import type { AdminLogFilters, LogLevel, LogType } from "../../types";

const AdminReportsPageContent = () => {
    const [filters, setFilters] = useState<AdminLogFilters>({});

    const {
        logs,
        countsByLevel,
        countsByType,
        isLoading,
        isRefreshing,
        error,
        currentPage,
        totalPages,
        goToNextPage,
        goToPreviousPage,
        hasNextPage,
        hasPreviousPage,
        refresh,
        createManualLog,
    } = useLogs(filters);

    const isEmpty = useMemo(() => !isLoading && logs.length === 0, [isLoading, logs.length]);

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // Summary chip handlers — toggle filter on/off
    const handleTypeClick = (type: LogType) => {
        setFilters((f) => ({ ...f, type: f.type === type ? undefined : type }));
    };
    const handleLevelClick = (level: LogLevel) => {
        setFilters((f) => ({ ...f, level: f.level === level ? undefined : level }));
    };

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="Reports"
                description="System logs and audit trail — filter by level, type, date, or full-text search."
                icon={FileText}
                isLive={true}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={refresh}
                            loading={isRefreshing}
                            icon={RefreshCw}
                            iconSize={16}
                            className="!rounded-xl !px-3 !py-2 sm:!px-3 sm:!py-2"
                            title="Refresh current page"
                        />
                        <Button
                            variant="secondary"
                            onClick={() => void createManualLog()}
                            className="!rounded-xl !px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                        >
                            Emit Test Log
                        </Button>
                    </div>
                }
            />

            <LogsFilters
                filters={filters}
                onChange={setFilters}
                activeFilterCount={activeFilterCount}
            />

            {!isLoading && !error && logs.length > 0 && (
                <div className="flex flex-col gap-4">
                    <LogsSummaryHeader
                        totalLoaded={logs.length}
                        countsByLevel={countsByLevel}
                        countsByType={countsByType}
                        onTypeClick={handleTypeClick}
                        onLevelClick={handleLevelClick}
                        activeType={filters.type}
                        activeLevel={filters.level}
                    />

                    <Card className="overflow-hidden border-b-8 p-0">
                        {/* Table header */}
                        <div className="flex items-center justify-between border-b-2 border-gray-50 bg-gray-50/40 px-6 py-3">
                            <h2 className="text-xs font-black tracking-widest text-[#3c3c3c] uppercase">
                                Audit Trail
                            </h2>
                            {isRefreshing && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black tracking-wider text-[#1cb0f6] uppercase">
                                    <RefreshCw size={10} className="animate-spin" />
                                    Refreshing…
                                </span>
                            )}
                        </div>

                        <LogsVirtualList logs={logs} />

                        {/* Pagination footer */}
                        <div className="flex flex-col gap-3 border-t-2 border-gray-50 bg-gray-50/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                    Page {currentPage + 1}
                                    {totalPages > 1 ? ` of ${totalPages}` : ""}
                                </span>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={() => setFilters({})}
                                        className="text-[10px] font-black tracking-wider text-[#ea2b2b] uppercase transition-opacity hover:opacity-70"
                                    >
                                        Clear {activeFilterCount} filter
                                        {activeFilterCount > 1 ? "s" : ""}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={goToPreviousPage}
                                    disabled={!hasPreviousPage}
                                    variant="secondary"
                                    icon={ChevronLeft}
                                    iconSize={16}
                                    className="!rounded-xl !p-2"
                                    title="Previous page"
                                />
                                <Button
                                    onClick={goToNextPage}
                                    disabled={!hasNextPage}
                                    variant="secondary"
                                    icon={ChevronRight}
                                    iconSize={16}
                                    className="!rounded-xl !p-2"
                                    title="Next page"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {isLoading && <LoadingSpinner fullScreen={false} label="Loading logs…" />}
            {error && <AdminErrorState message={error.message} />}
            {isEmpty && (
                <AdminEmptyState
                    title="No logs match your filters"
                    description="We couldn't find any audit logs for the selected criteria. Try adjusting your time range or log levels."
                    icon={FileText}
                    action={
                        activeFilterCount > 0 ? (
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
