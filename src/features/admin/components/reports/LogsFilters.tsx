"use client";

import {
    Activity,
    AlertTriangle,
    Bug,
    FileJson,
    Filter,
    Info,
    Lock,
    RotateCcw,
    Search,
    Shield,
    Terminal,
} from "lucide-react";

import { CustomDatePicker, CustomSelect } from "@/shared/components/ui";
import DateRangeFilter from "./DateRangeFilter";
import { LOG_LEVEL_OPTIONS, LOG_TYPE_OPTIONS } from "../../utils/filters";

import type { SelectOption } from "@/shared/components/ui";
import type { AdminLogFilters, LogLevel, LogType } from "../../types";

interface LogsFiltersProps {
    filters: AdminLogFilters;
    onChange: (next: AdminLogFilters) => void;
}

const ALL = "__all__" as const;

/**
 * Log Filtering Interface.
 *
 * @remarks Provides multi-dimensional filtering for the audit trail, including
 * full-text search, severity-level selection, and date range constraints.
 */
const LogsFilters = ({ filters, onChange }: LogsFiltersProps) => {
    const levelOptions: SelectOption<LogLevel | typeof ALL>[] = [
        { value: ALL, label: "Levels (All)", icon: Info },
        ...LOG_LEVEL_OPTIONS.map((l) => ({
            value: l,
            label: l.toUpperCase(),
            icon:
                l === "error"
                    ? Bug
                    : l === "warn"
                      ? AlertTriangle
                      : l === "security"
                        ? Shield
                        : Info,
            color:
                l === "error"
                    ? "#ea2b2b"
                    : l === "warn"
                      ? "#f59e0b"
                      : l === "security"
                        ? "#ce82ff"
                        : "#1cb0f6",
        })),
    ];

    const typeOptions: SelectOption<LogType | typeof ALL>[] = [
        { value: ALL, label: "Types (All)", icon: Terminal },
        ...LOG_TYPE_OPTIONS.map((t) => ({
            value: t,
            label: t.split("_").join(" "),
            icon:
                t === "AUTH"
                    ? Lock
                    : t === "ADMIN_ACTION"
                      ? Shield
                      : t === "SYSTEM"
                        ? Activity
                        : FileJson,
        })),
    ];

    return (
        <div className="flex flex-col gap-6 rounded-[2.5rem] border-2 border-b-8 border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-gray-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        value={filters.search ?? ""}
                        onChange={(e) =>
                            onChange({ ...filters, search: e.target.value || undefined })
                        }
                        placeholder="Search action, user, email, metadata…"
                        className="h-12 w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pr-4 pl-11 text-sm font-black text-[#3c3c3c] transition-all outline-none placeholder:font-bold placeholder:text-[#afafaf] focus:border-[#1cb0f6] focus:bg-white focus:ring-4 focus:ring-[#1cb0f6]/5"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <CustomSelect
                        value={filters.level ?? ALL}
                        options={levelOptions}
                        onChange={(v) =>
                            onChange({ ...filters, level: v === ALL ? undefined : (v as LogLevel) })
                        }
                        className="min-w-[160px]"
                    />
                    <CustomSelect
                        value={filters.type ?? ALL}
                        options={typeOptions}
                        onChange={(v) =>
                            onChange({ ...filters, type: v === ALL ? undefined : (v as LogType) })
                        }
                        className="min-w-[160px]"
                    />
                </div>
            </div>

            <DateRangeFilter
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={onChange}
                filters={filters}
            />
        </div>
    );
};

export default LogsFilters;
