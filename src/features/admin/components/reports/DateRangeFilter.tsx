"use client";

import { Filter, RotateCcw } from "lucide-react";

import { CustomDatePicker } from "@/shared/components/ui";

import type { AdminLogFilters } from "../../types";

interface DateRangeFilterProps {
    startDate?: string;
    endDate?: string;
    onChange: (next: AdminLogFilters) => void;
    filters: AdminLogFilters;
}

/**
 * Date Range Selection for Log Filtering.
 *
 * @remarks Encapsulates start/end date pickers and the reset functionality.
 */
const DateRangeFilter = ({ startDate, endDate, onChange, filters }: DateRangeFilterProps) => {
    return (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-50 pt-4 sm:flex-row">
            <div className="flex flex-wrap items-center gap-3">
                <CustomDatePicker
                    label="From"
                    placeholder="Start date"
                    value={startDate}
                    onChange={(v) => onChange({ ...filters, startDate: v })}
                />
                <CustomDatePicker
                    label="To"
                    placeholder="End date"
                    value={endDate}
                    onChange={(v) => onChange({ ...filters, endDate: v })}
                />
            </div>

            <div className="flex items-center gap-4 pt-4 sm:pt-0">
                <button
                    type="button"
                    onClick={() => onChange({})}
                    className="flex items-center gap-2 text-xs font-black tracking-widest text-[#afafaf] uppercase transition-all hover:text-[#ea2b2b]"
                >
                    <RotateCcw size={14} />
                    Reset
                </button>
                <div className="h-6 w-px bg-gray-100" />
                <div className="flex items-center gap-2 px-2 text-[10px] font-black tracking-tighter text-[#afafaf] uppercase">
                    <Filter size={12} className="text-[#1cb0f6]" />
                    Active View
                </div>
            </div>
        </div>
    );
};

export default DateRangeFilter;
