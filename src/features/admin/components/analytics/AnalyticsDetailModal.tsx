"use client";

import { Database, Search } from "lucide-react";

import { LoadingSpinner, Modal } from "@/shared/components/ui";
import { AdminErrorState, AdminStatCard } from "../shared";

interface AnalyticsDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    data: any;
    isLoading: boolean;
    error: any;
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
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="4xl">
            <div className="space-y-6">
                <p className="text-sm font-bold text-[#afafaf]">{description}</p>

                {isLoading ? (
                    <LoadingSpinner fullScreen={false} label="Fetching detailed records..." />
                ) : error ? (
                    <AdminErrorState message={error.message} />
                ) : (
                    <div className="space-y-6">
                        {/* Summary for selected slice */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <AdminStatCard
                                label="Total Records Found"
                                value={Array.isArray(data) ? data.length : 0}
                                icon={Database}
                            />
                            <AdminStatCard
                                label="Analysis Phase"
                                value="Detailed Drilldown"
                                icon={Search}
                            />
                        </div>

                        {/* Results Table */}
                        <div className="overflow-hidden rounded-3xl border-2 border-gray-100 bg-white">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-100 bg-gray-50/50">
                                    <tr>
                                        <th className="px-5 py-4 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                            Subject
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                            Activity
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                            Occurred
                                        </th>
                                        <th className="px-5 py-4 text-right text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                            Insight
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Array.isArray(data) && data.length > 0 ? (
                                        data.map((item: any, idx: number) => {
                                            const displayDate = item.timestamp
                                                ? new Date(item.timestamp).toLocaleString([], {
                                                      month: "short",
                                                      day: "numeric",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "—";

                                            const rowKey = item.id ? `${item.id}` : `row-${idx}`;

                                            return (
                                                <tr
                                                    key={rowKey}
                                                    className="transition-all hover:bg-gray-50/80"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="text-sm font-black text-[#3c3c3c]">
                                                            {item.displayName ||
                                                                item.userName ||
                                                                "System"}
                                                        </div>
                                                        <div className="max-w-[120px] truncate text-[10px] font-bold text-[#afafaf]">
                                                            {item.email || item.uid || item.id}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-black text-gray-700">
                                                            {item.action ||
                                                                item.title ||
                                                                "Unknown Action"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs font-bold text-[#afafaf]">
                                                        {displayDate}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <span className="text-xs font-black text-[#1cb0f6]">
                                                            {item.metadata?.score !== undefined
                                                                ? `Score: ${item.metadata.score}`
                                                                : item.level
                                                                  ? item.level.toUpperCase()
                                                                  : "Details"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-5 py-12 text-center text-sm font-bold text-[#afafaf]"
                                            >
                                                No detailed records found for this selection.
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
