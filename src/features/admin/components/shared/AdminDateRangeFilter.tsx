"use client";

import { useTranslations } from "next-intl";

import { Filter, RotateCcw } from "lucide-react";

import DatePicker from "./DatePicker";

interface AdminDateRangeFilterProps {
    startDate?: string;
    endDate?: string;
    onStartChange: (val?: string) => void;
    onEndChange: (val?: string) => void;
    onReset: () => void;
    hasActiveFilters?: boolean;
}

/**
 * Standardized Date Range Filter for Admin module.
 *
 * @remarks Provides a pair of Date Pickers with a reset button and active status indicator.
 */
const AdminDateRangeFilter = ({
    startDate,
    endDate,
    onStartChange,
    onEndChange,
    onReset,
    hasActiveFilters = false,
}: AdminDateRangeFilterProps) => {
    const t = useTranslations("AdminCommon");
    return (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-50 pt-4 lg:flex-row">
            <div className="flex flex-wrap items-center gap-3">
                <DatePicker
                    label={t("from")}
                    placeholder={t("startDate")}
                    value={startDate}
                    onChange={onStartChange}
                />
                <DatePicker
                    label={t("to")}
                    placeholder={t("endDate")}
                    value={endDate}
                    onChange={onEndChange}
                />
            </div>

            <div className="flex items-center gap-4 pt-4 lg:pt-0">
                <button
                    type="button"
                    onClick={onReset}
                    className="text-muted hover:text-danger flex items-center gap-2 text-xs font-black tracking-widest uppercase transition-all"
                >
                    <RotateCcw size={12} />
                    {t("reset")}
                </button>
                <div className="h-6 w-px bg-gray-100" />
                <div className="flex items-center gap-2 px-2 text-xs font-black tracking-widest uppercase">
                    <div
                        className={`flex h-6 items-center gap-2 rounded-full px-3 transition-all ${
                            hasActiveFilters
                                ? "bg-katakana/10 text-katakana"
                                : "text-muted bg-gray-50"
                        }`}
                    >
                        <Filter size={10} className={hasActiveFilters ? "animate-pulse" : ""} />
                        <span>{t("activeFilters")}</span>
                        {hasActiveFilters && (
                            <div className="bg-katakana shadow-katakana/50 h-2 w-2 rounded-full shadow-sm" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDateRangeFilter;
