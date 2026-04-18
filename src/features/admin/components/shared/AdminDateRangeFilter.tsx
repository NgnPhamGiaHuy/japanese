"use client";

import { Filter, RotateCcw } from "lucide-react";

import { CustomDatePicker } from "@/shared/components/ui";

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
    return (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-50 pt-4 lg:flex-row">
            <div className="flex flex-wrap items-center gap-3">
                <CustomDatePicker
                    label="From"
                    placeholder="Start date"
                    value={startDate}
                    onChange={onStartChange}
                />
                <CustomDatePicker
                    label="To"
                    placeholder="End date"
                    value={endDate}
                    onChange={onEndChange}
                />
            </div>

            <div className="flex items-center gap-4 pt-4 lg:pt-0">
                <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#afafaf] uppercase transition-all hover:text-[#ea2b2b]"
                >
                    <RotateCcw size={12} />
                    Reset
                </button>
                <div className="h-6 w-px bg-gray-100" />
                <div className="flex items-center gap-2 px-2 text-[10px] font-black tracking-widest uppercase">
                    <div
                        className={`flex h-6 items-center gap-2 rounded-full px-3 transition-all ${
                            hasActiveFilters
                                ? "bg-[#1cb0f6]/10 text-[#1cb0f6]"
                                : "bg-gray-50 text-[#afafaf]"
                        }`}
                    >
                        <Filter size={10} className={hasActiveFilters ? "animate-pulse" : ""} />
                        <span>Active Filters</span>
                        {hasActiveFilters && (
                            <div className="h-2 w-2 rounded-full bg-[#1cb0f6] shadow-sm shadow-[#1cb0f6]/50" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDateRangeFilter;
