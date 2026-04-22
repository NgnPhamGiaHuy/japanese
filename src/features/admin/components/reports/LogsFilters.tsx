/**
 * Log Filtering Interface.
 *
 * @remarks
 * Multi-dimensional filter panel: full-text search, severity level,
 * log type, user identity, and date range. Shows an active-filter count badge.
 *
 * @example
 * <LogsFilters filters={filters} onChange={setFilters} />
 */
"use client";

import {
    Activity,
    AlertTriangle,
    Bug,
    FileJson,
    Info,
    Lock,
    Shield,
    Terminal,
    User,
    Zap,
} from "lucide-react";

import { Card, Select } from "@/shared/components/ui";
import { AdminDateRangeFilter, AdminSearchInput } from "../shared";
import { LOG_LEVEL_OPTIONS, LOG_TYPE_OPTIONS } from "../../utils/filters";

import type { SelectOption } from "@/shared/components/ui";
import type { AdminLogFilters, LogLevel, LogType } from "../../types";

interface LogsFiltersProps {
    /** The current active filter set. */
    filters: AdminLogFilters;
    /** Triggered when any filter value changes. */
    onChange: (next: AdminLogFilters) => void;
    /** Total number of currently active filters. */
    activeFilterCount?: number;
}

const ALL = "__all__" as const;

const LogsFilters = ({ filters, onChange, activeFilterCount = 0 }: LogsFiltersProps) => {
    const levelOptions: SelectOption<LogLevel | typeof ALL>[] = [
        { value: ALL, label: "All Levels", icon: Info },
        ...LOG_LEVEL_OPTIONS.map((l) => ({
            value: l,
            label: l.charAt(0).toUpperCase() + l.slice(1),
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
        { value: ALL, label: "All Types", icon: Terminal },
        ...LOG_TYPE_OPTIONS.map((t) => ({
            value: t,
            label: t
                .split("_")
                .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                .join(" "),
            icon:
                t === "AUTH"
                    ? Lock
                    : t === "ADMIN_ACTION"
                      ? Shield
                      : t === "USER_ACTION"
                        ? Zap
                        : t === "SYSTEM"
                          ? Activity
                          : FileJson,
        })),
    ];

    return (
        <Card className="flex flex-col gap-4 p-4 hover:border-gray-200 sm:gap-5 sm:p-6">
            {/* Row 1: search */}
            <AdminSearchInput
                value={filters.search ?? ""}
                onChange={(v) => onChange({ ...filters, search: v || undefined })}
                placeholder="Search action, user, email, metadata…"
            />

            {/* Row 2: selects — full width on mobile, inline on sm+ */}
            <div className="xs:grid-cols-2 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                <Select
                    value={filters.level ?? ALL}
                    options={levelOptions}
                    onChange={(v) =>
                        onChange({ ...filters, level: v === ALL ? undefined : (v as LogLevel) })
                    }
                    className="w-full sm:w-auto sm:min-w-[150px]"
                />
                <Select
                    value={filters.type ?? ALL}
                    options={typeOptions}
                    onChange={(v) =>
                        onChange({ ...filters, type: v === ALL ? undefined : (v as LogType) })
                    }
                    className="w-full sm:w-auto sm:min-w-[150px]"
                />
            </div>

            {/* Row 3: user filter */}
            <div className="relative">
                <User
                    size={14}
                    className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#afafaf]"
                    aria-hidden
                />
                <input
                    type="text"
                    value={filters.userId ?? ""}
                    onChange={(e) => onChange({ ...filters, userId: e.target.value || undefined })}
                    placeholder="Filter by user ID, name, or email…"
                    className="h-10 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 pr-4 pl-9 text-sm font-bold text-[#3c3c3c] transition-colors outline-none placeholder:font-normal placeholder:text-[#afafaf] focus:border-[#1cb0f6] focus:bg-white sm:h-11"
                />
            </div>

            {/* Row 4: date range */}
            <AdminDateRangeFilter
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartChange={(v) => onChange({ ...filters, startDate: v })}
                onEndChange={(v) => onChange({ ...filters, endDate: v })}
                onReset={() => onChange({})}
                hasActiveFilters={activeFilterCount > 0}
            />
        </Card>
    );
};

export default LogsFilters;
