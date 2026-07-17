/**
 * Log Distribution Summary Header.
 *
 * @remarks
 * Shows severity counts as clickable filter chips and a type breakdown
 * bar with labeled segments. Clicking any chip applies that filter instantly.
 *
 * @example
 * <LogsSummaryHeader
 *   totalLoaded={100}
 *   countsByLevel={{ error: 5, warn: 10 }}
 *   countsByType={{ AUTH: 50, SYSTEM: 50 }}
 * />
 */
"use client";

import { useTranslations } from "next-intl";

import { clsx } from "clsx";

import { Card } from "@/shared/components/ui";
import { LOG_LEVEL_META, LOG_TYPE_META } from "../../domain/logMeta";

import type { LogLevel, LogType } from "../../types";

interface LogsSummaryHeaderProps {
    /** Total number of log entries currently loaded in the view. */
    totalLoaded: number;
    /** Mapping of log severity levels to their occurrence counts. */
    countsByLevel: Record<string, number>;
    /** Mapping of log functional types to their occurrence counts. */
    countsByType: Record<string, number>;
    /** Triggered when a log type chip is clicked. */
    onTypeClick?: (type: LogType) => void;
    /** Triggered when a log level chip is clicked. */
    onLevelClick?: (level: LogLevel) => void;
    /** The currently active log type filter. */
    activeType?: LogType;
    /** The currently active log severity level filter. */
    activeLevel?: LogLevel;
}

const LEVEL_ORDER: LogLevel[] = ["error", "warn", "security", "info"];

const LogsSummaryHeader = ({
    totalLoaded,
    countsByLevel,
    countsByType,
    onTypeClick,
    onLevelClick,
    activeType,
    activeLevel,
}: LogsSummaryHeaderProps) => {
    const tr = useTranslations("AdminReports");
    const activeTypes = (Object.keys(countsByType) as LogType[]).filter(
        (type) => countsByType[type] > 0,
    );

    return (
        <Card className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
            {/* Total + level chips — wrap on mobile */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <div className="flex flex-col">
                    <span className="text-muted text-xs font-black tracking-widest uppercase">
                        {tr("thisPage")}
                    </span>
                    <span className="text-text text-xl font-black sm:text-2xl">
                        {totalLoaded}
                        <span className="text-muted ml-1 text-xs font-bold">{tr("entries")}</span>
                    </span>
                </div>

                <div className="hidden h-8 w-px bg-gray-100 sm:block" />

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {LEVEL_ORDER.filter((l) => countsByLevel[l]).map((l) => {
                        const s = LOG_LEVEL_META[l];
                        const isActive = activeLevel === l;
                        return (
                            <button
                                key={l}
                                onClick={() => onLevelClick?.(l)}
                                title={tr("filterByLevel", { level: l })}
                                className={clsx(
                                    "focus-visible:ring-katakana flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black tracking-wider uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs",
                                    isActive
                                        ? `${s.dot} text-white shadow-sm`
                                        : `${s.bg} ${s.text}`,
                                    onLevelClick ? "cursor-pointer" : "cursor-default",
                                )}
                            >
                                <span
                                    className={clsx(
                                        "h-1.5 w-1.5 rounded-full",
                                        isActive ? "bg-white/70" : s.dot,
                                    )}
                                />
                                {l}
                                <span className="font-mono">{countsByLevel[l]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Type breakdown */}
            {activeTypes.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        {activeTypes.map((type) => {
                            const pct = (countsByType[type]! / totalLoaded) * 100;
                            return (
                                <div
                                    key={type}
                                    title={`${type}: ${countsByType[type]}`}
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: LOG_TYPE_META[type].chartColor,
                                    }}
                                    className="transition-all"
                                />
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {activeTypes.map((type) => {
                            // countsByType comes from raw Firestore data, so it may
                            // carry a type we have no meta or translation for —
                            // fall back to the raw value, as before.
                            const known = LOG_TYPE_META[type];
                            const s = known ?? {
                                bg: "bg-gray-100 hover:bg-gray-200",
                                text: "text-gray-600",
                                activeBg: "bg-gray-600 text-white",
                            };
                            const isActive = activeType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => onTypeClick?.(type)}
                                    title={tr("filterByType", { type })}
                                    className={clsx(
                                        "focus-visible:ring-katakana flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black tracking-wider uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs",
                                        isActive ? s.activeBg : `${s.bg} ${s.text}`,
                                        onTypeClick ? "cursor-pointer" : "cursor-default",
                                    )}
                                >
                                    {known ? tr(`logType.${type}`) : type}
                                    <span className="font-mono">{countsByType[type]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default LogsSummaryHeader;
