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

import { clsx } from "clsx";

import { Card } from "@/shared/components/ui";

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

const LEVEL_STYLES: Record<LogLevel, { text: string; bg: string; dot: string }> = {
    error: { text: "text-danger", bg: "bg-danger-bg hover:bg-[#ffc8c9]", dot: "bg-danger" },
    warn: { text: "text-orange-500", bg: "bg-orange-50 hover:bg-orange-100", dot: "bg-orange-400" },
    security: {
        text: "text-both",
        bg: "bg-both/10 hover:bg-both/20",
        dot: "bg-both",
    },
    info: {
        text: "text-katakana",
        bg: "bg-katakana/10 hover:bg-katakana/20",
        dot: "bg-katakana",
    },
};

const TYPE_STYLES: Record<LogType, { label: string; bg: string; text: string; activeBg: string }> =
    {
        AUTH: {
            label: "Auth",
            bg: "bg-katakana/10 hover:bg-katakana/20",
            text: "text-katakana",
            activeBg: "bg-katakana text-white",
        },
        ADMIN_ACTION: {
            label: "Admin",
            bg: "bg-both/10 hover:bg-both/20",
            text: "text-[#7c3aed]",
            activeBg: "bg-both text-white",
        },
        USER_ACTION: {
            label: "User",
            bg: "bg-survival/10 hover:bg-survival/20",
            text: "text-[#b86800]",
            activeBg: "bg-survival text-white",
        },
        CONTENT: {
            label: "Content",
            bg: "bg-hiragana/10 hover:bg-hiragana/20",
            text: "text-[#3d8f00]",
            activeBg: "bg-hiragana text-white",
        },
        SYSTEM: {
            label: "System",
            bg: "bg-gray-100 hover:bg-gray-200",
            text: "text-gray-600",
            activeBg: "bg-gray-600 text-white",
        },
        ERROR: {
            label: "Error",
            bg: "bg-danger-bg hover:bg-[#ffc8c9]",
            text: "text-danger-strong",
            activeBg: "bg-danger text-white",
        },
    };

const LogsSummaryHeader = ({
    totalLoaded,
    countsByLevel,
    countsByType,
    onTypeClick,
    onLevelClick,
    activeType,
    activeLevel,
}: LogsSummaryHeaderProps) => {
    const activeTypes = (Object.keys(countsByType) as LogType[]).filter((t) => countsByType[t] > 0);

    return (
        <Card className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
            {/* Total + level chips — wrap on mobile */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <div className="flex flex-col">
                    <span className="text-xs font-black tracking-widest text-muted uppercase">
                        This Page
                    </span>
                    <span className="text-xl font-black text-text sm:text-2xl">
                        {totalLoaded}
                        <span className="ml-1 text-xs font-bold text-muted">entries</span>
                    </span>
                </div>

                <div className="hidden h-8 w-px bg-gray-100 sm:block" />

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {LEVEL_ORDER.filter((l) => countsByLevel[l]).map((l) => {
                        const s = LEVEL_STYLES[l];
                        const isActive = activeLevel === l;
                        return (
                            <button
                                key={l}
                                onClick={() => onLevelClick?.(l)}
                                title={`Filter by ${l}`}
                                className={clsx(
                                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black tracking-wider uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-katakana focus-visible:ring-offset-1 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs",
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
                        {activeTypes.map((t) => {
                            const pct = (countsByType[t]! / totalLoaded) * 100;
                            const colors: Record<LogType, string> = {
                                AUTH: "#1cb0f6",
                                ADMIN_ACTION: "#ce82ff",
                                USER_ACTION: "#ff9600",
                                CONTENT: "#58cc02",
                                SYSTEM: "#afafaf",
                                ERROR: "#ea2b2b",
                            };
                            return (
                                <div
                                    key={t}
                                    title={`${t}: ${countsByType[t]}`}
                                    style={{ width: `${pct}%`, backgroundColor: colors[t] }}
                                    className="transition-all"
                                />
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {activeTypes.map((t) => {
                            const s = TYPE_STYLES[t] ?? {
                                label: t,
                                bg: "bg-gray-100 hover:bg-gray-200",
                                text: "text-gray-600",
                                activeBg: "bg-gray-600 text-white",
                            };
                            const isActive = activeType === t;
                            return (
                                <button
                                    key={t}
                                    onClick={() => onTypeClick?.(t)}
                                    title={`Filter by ${t}`}
                                    className={clsx(
                                        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black tracking-wider uppercase transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-katakana focus-visible:ring-offset-1 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs",
                                        isActive ? s.activeBg : `${s.bg} ${s.text}`,
                                        onTypeClick ? "cursor-pointer" : "cursor-default",
                                    )}
                                >
                                    {s.label}
                                    <span className="font-mono">{countsByType[t]}</span>
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
