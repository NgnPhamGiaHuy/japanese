"use client";

import { useTranslations } from "next-intl";

import { Database, Search } from "lucide-react";

import { LoadingSpinner, Modal } from "@/shared/components/ui";
import { AdminErrorState, AdminStatCard } from "../shared";

interface AnalyticsDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    // Shape varies per drilldown type (user_growth/role/feature/content/log_*
    // each fetch differently-shaped Firestore records) — no sound static type here.
    data: unknown;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Detailed Analytics Data Drilldown Modal.
 *
 * @remarks Reuses shared Modal and Admin components to display table-based or
 * stat-based evidence for analytics data points.
 */
const AnalyticsDetailModal = ({
    isOpen,
    onClose,
    title,
    description,
    data,
    isLoading,
    error,
}: AnalyticsDetailModalProps) => {
    const t = useTranslations("AdminAnalytics");
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="4xl">
            <div className="space-y-6">
                <p className="text-muted text-sm font-bold">{description}</p>

                {isLoading ? (
                    <LoadingSpinner fullScreen={false} label={t("fetchingDetailedRecords")} />
                ) : error ? (
                    <AdminErrorState message={error.message} />
                ) : (
                    <div className="space-y-6">
                        {/* Summary for selected slice */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <AdminStatCard
                                label={t("totalRecordsFound")}
                                value={Array.isArray(data) ? data.length : 0}
                                icon={Database}
                            />
                            <AdminStatCard
                                label={t("analysisPhase")}
                                value={t("detailedDrilldown")}
                                icon={Search}
                            />
                        </div>

                        {/* Results Table */}
                        <div className="overflow-hidden rounded-3xl border-2 border-gray-100 bg-white">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-100 bg-gray-50/50">
                                    <tr>
                                        <th className="text-muted px-5 py-4 text-xs font-black tracking-widest uppercase">
                                            {t("subject")}
                                        </th>
                                        <th className="text-muted px-5 py-4 text-xs font-black tracking-widest uppercase">
                                            {t("activity")}
                                        </th>
                                        <th className="text-muted px-5 py-4 text-xs font-black tracking-widest uppercase">
                                            {t("occurred")}
                                        </th>
                                        <th className="text-muted px-5 py-4 text-right text-xs font-black tracking-widest uppercase">
                                            {t("insight")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Array.isArray(data) && data.length > 0 ? (
                                        data.map((item, idx: number) => {
                                            const displayDate = item.timestamp
                                                ? new Date(item.timestamp).toLocaleString([], {
                                                      month: "short",
                                                      day: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "—";

                                            const rowKey = item.id
                                                ? `${item.id}-${idx}`
                                                : `row-${idx}`;

                                            return (
                                                <tr
                                                    key={rowKey}
                                                    className="transition-all hover:bg-gray-50/80"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="text-text text-sm font-black">
                                                            {item.displayName ||
                                                                item.userName ||
                                                                t("system")}
                                                        </div>
                                                        <div className="text-muted max-w-[120px] truncate text-xs font-bold">
                                                            {item.email || item.uid || item.id}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-black text-gray-700">
                                                            {item.action ||
                                                                item.title ||
                                                                t("unknownAction")}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted px-5 py-4 text-xs font-bold">
                                                        {displayDate}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <span className="text-katakana text-xs font-black">
                                                            {item.metadata?.score !== undefined
                                                                ? t("scoreLabel", {
                                                                      score: item.metadata.score,
                                                                  })
                                                                : item.level
                                                                  ? item.level.toUpperCase()
                                                                  : t("detailsLabel")}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-muted px-5 py-12 text-center text-sm font-bold"
                                            >
                                                {t("noDetailedRecords")}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AnalyticsDetailModal;
