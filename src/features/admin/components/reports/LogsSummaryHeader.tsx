"use client";

import { clsx } from "clsx";

import type { LogLevel } from "../../types";

interface LogsSummaryHeaderProps {
    totalLoaded: number;
    countsByLevel: Record<string, number>;
    countsByType: Record<string, number>;
}

const LEVEL_ORDER: LogLevel[] = ["error", "warn", "security", "info"];

/**
 * Log Distribution Summary Header.
 *
 * @remarks Provides a high-level statistical overview of the currently loaded logs,
 * categorizing them by severity level and functional type.
 */
const LogsSummaryHeader = ({
    totalLoaded,
    countsByLevel,
    countsByType,
}: LogsSummaryHeaderProps) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-gray-100 bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                        Total Loaded
                    </span>
                    <span className="text-xl font-black text-[#3c3c3c]">
                        {totalLoaded}{" "}
                        <span className="text-xs font-bold text-[#afafaf]">entries</span>
                    </span>
                </div>
                <div className="h-10 w-px bg-gray-100" />
                <div className="flex items-center gap-3">
                    {LEVEL_ORDER.filter((l) => countsByLevel[l]).map((l) => (
                        <div key={l} className="flex flex-col">
                            <span className="text-[9px] font-black tracking-widest text-[#afafaf] uppercase">
                                {l}
                            </span>
                            <span
                                className={clsx(
                                    "text-sm font-black",
                                    l === "error"
                                        ? "text-[#ea2b2b]"
                                        : l === "warn"
                                          ? "text-orange-500"
                                          : l === "security"
                                            ? "text-[#ce82ff]"
                                            : "text-[#1cb0f6]",
                                )}
                            >
                                {countsByLevel[l]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hidden items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2 sm:flex">
                <span className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    Distribution:
                </span>
                <div className="flex gap-1">
                    {Object.entries(countsByType).map(([k, v]) => (
                        <span
                            key={k}
                            title={`${k}: ${v}`}
                            className="h-1.5 w-4 rounded-full bg-gray-200"
                            style={{ opacity: Math.max(0.2, v / totalLoaded) }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LogsSummaryHeader;
