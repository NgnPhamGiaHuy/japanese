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

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, FileText, RefreshCw } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import LogsFilters from "./LogsFilters";
import LogsSummaryHeader from "./LogsSummaryHeader";
import LogsVirtualList from "./LogsVirtualList";
import {
    AdminEmptyState,
    AdminErrorState,
    AdminPageHeader,
    AdminPageLayout,
    AdminTableShell,
} from "../shared";
import { useLogs } from "../../hooks";

import type { AdminLogFilters, LogLevel, LogType } from "../../types";

const AdminReportsPageContent = () => {
    const t = useTranslations("AdminReports");
    const [filters, setFilters] = useState<AdminLogFilters>({});
    const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([undefined]);
    const [currentPage, setCurrentPage] = useState(0);

    // Reset pagination whenever filters change — adjusted during render (not
    // an Effect) so the reset lands in the same render as the filter change.
    const filtersKey = JSON.stringify(filters);
    const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
    if (filtersKey !== prevFiltersKey) {
        setPrevFiltersKey(filtersKey);
        setPageTokens([undefined]);
        setCurrentPage(0);
    }

    const {
        logs,
        nextPageToken,
        countsByLevel,
        countsByType,
        isLoading,
        isFetching,
        error,
        refetch,
        createTestLog,
        isCreatingTestLog,
    } = useLogs(filters, pageTokens[currentPage]);

    const isEmpty = useMemo(() => !isLoading && logs.length === 0, [isLoading, logs.length]);
    const isRefreshing = isFetching && !isLoading;

    const activeFilterCount = Object.values(filters).filter(Boolean).length;
    const totalPages = pageTokens.length;
    const hasNextPage = !!nextPageToken;
    const hasPreviousPage = currentPage > 0;

    // Summary chip handlers — toggle filter on/off
    const handleTypeClick = (type: LogType) => {
        setFilters((f) => ({ ...f, type: f.type === type ? undefined : type }));
    };
    const handleLevelClick = (level: LogLevel) => {
        setFilters((f) => ({ ...f, level: f.level === level ? undefined : level }));
    };

    const goToNextPage = () => {
        if (!nextPageToken) return;
        setPageTokens((prev) => (prev.includes(nextPageToken) ? prev : [...prev, nextPageToken]));
        setCurrentPage((p) => p + 1);
    };
    const goToPreviousPage = () => setCurrentPage((p) => Math.max(0, p - 1));

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title={t("title")}
                description={t("description")}
                icon={FileText}
                isLive={true}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => void refetch()}
                            loading={isRefreshing}
                            icon={RefreshCw}
                            iconSize={16}
                            className="!rounded-xl !px-3 !py-2 sm:!px-3 sm:!py-2"
                            title={t("refreshCurrentPage")}
                        />
                        <Button
                            variant="secondary"
                            onClick={() => void createTestLog()}
                            loading={isCreatingTestLog}
                            className="!rounded-xl !px-3 !py-2 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm"
                        >
                            {t("emitTestLog")}
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

                    <AdminTableShell
                        toolbar={
                            <div className="flex items-center justify-between bg-gray-50/40 px-6 py-3">
                                <h2 className="text-text text-xs font-black tracking-widest uppercase">
                                    {t("auditTrail")}
                                </h2>
                                {isRefreshing && (
                                    <span className="text-katakana flex items-center gap-1.5 text-xs font-black tracking-wider uppercase">
                                        <RefreshCw size={10} className="animate-spin" />
                                        {t("refreshing")}
                                    </span>
                                )}
                            </div>
                        }
                        pagination={
                            <div className="flex flex-col gap-3 border-t-2 border-gray-50 bg-gray-50/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-muted text-xs font-black tracking-widest uppercase">
                                        {totalPages > 1
                                            ? t("pageOfTotal", {
                                                  current: currentPage + 1,
                                                  total: totalPages,
                                              })
                                            : t("pageOf", { current: currentPage + 1 })}
                                    </span>
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={() => setFilters({})}
                                            className="text-danger focus-visible:ring-katakana rounded-md text-xs font-black tracking-wider uppercase transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                        >
                                            {t("clearFilter", { count: activeFilterCount })}
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
                                        title={t("previousPage")}
                                    />
                                    <Button
                                        onClick={goToNextPage}
                                        disabled={!hasNextPage}
                                        variant="secondary"
                                        icon={ChevronRight}
                                        iconSize={16}
                                        className="!rounded-xl !p-2"
                                        title={t("nextPage")}
                                    />
                                </div>
                            </div>
                        }
                    >
                        <LogsVirtualList logs={logs} />
                    </AdminTableShell>
                </div>
            )}

            {isLoading && <LoadingSpinner fullScreen={false} label={t("loadingLogs")} />}
            {error && <AdminErrorState message={error.message} onRetry={() => refetch()} />}
            {isEmpty && (
                <AdminEmptyState
                    title={t("noLogsMatch")}
                    description={t("noLogsMatchDescription")}
                    icon={FileText}
                    action={
                        activeFilterCount > 0 ? (
                            <Button variant="secondary" onClick={() => setFilters({})}>
                                {t("clearFilters")}
                            </Button>
                        ) : undefined
                    }
                />
            )}
        </AdminPageLayout>
    );
};

export default AdminReportsPageContent;
