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
    Shield,
    Terminal,
} from "lucide-react";

import { CustomSelect } from "@/shared/components/ui";
import { AdminDateRangeFilter, AdminSearchInput } from "../shared";
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
                <AdminSearchInput
                    value={filters.search ?? ""}
                    onChange={(v) => onChange({ ...filters, search: v || undefined })}
                    placeholder="Search action, user, email, metadata…"
                    className="flex-1"
                />

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

            <AdminDateRangeFilter
                startDate={filters.startDate}
                endDate={filters.endDate}
                onStartChange={(v) => onChange({ ...filters, startDate: v })}
                onEndChange={(v) => onChange({ ...filters, endDate: v })}
                onReset={() => onChange({})}
                hasActiveFilters={
                    !!filters.search ||
                    !!filters.level ||
                    !!filters.type ||
                    !!filters.startDate ||
                    !!filters.endDate
                }
            />
        </div>
    );
};

export default LogsFilters;
