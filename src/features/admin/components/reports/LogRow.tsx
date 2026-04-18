"use client";

import { useMemo } from "react";

import { ChevronRight } from "lucide-react";

import LogLevelBadge from "./LogLevelBadge";
import LogTypeBadge from "./LogTypeBadge";
import { formatLogTimestamp, getMetadataPreview } from "../../utils/log.utils";

import type { AdminLog } from "../../types";

/**
 * Individual Log Entry Row Component.
 *
 * @remarks Renders a structured view of an audit log entry, including metadata,
 * user information, and event context. Uses color-coded levels for severity visibility.
 */
const LogRow = ({ log }: { log: AdminLog }) => {
    const { relative, absolute } = useMemo(
        () => formatLogTimestamp(log.timestamp),
        [log.timestamp],
    );
    const preview = useMemo(() => getMetadataPreview(log.metadata ?? {}), [log.metadata]);
    const level = log.level ?? "info";
    const type = log.type ?? "SYSTEM";

    const borderByLevel =
        level === "error"
            ? "border-l-[#ea2b2b]"
            : level === "warn"
              ? "border-l-amber-400"
              : level === "security"
                ? "border-l-[#ce82ff]"
                : "border-l-[#1cb0f6]";

    return (
        <article
            className={`group flex w-full gap-3 border-b border-gray-100 bg-white px-4 py-3 pl-3 transition-colors hover:bg-gray-50/80 ${borderByLevel} border-l-4`}
        >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <LogLevelBadge level={level} />
                    <LogTypeBadge type={type} />
                    {log.ip && (
                        <span className="text-[9px] font-black tracking-wider text-[#afafaf] uppercase">
                            IP {log.ip}
                        </span>
                    )}
                </div>

                <div>
                    <h3 className="text-sm leading-snug font-black text-[#3c3c3c]">
                        {log.action ?? "(no action)"}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-[#afafaf]">
                        <span className="text-[#3c3c3c]">{log.userName ?? "—"}</span>
                        {" · "}
                        {log.userEmail ?? "—"}
                        {" · "}
                        <span className="font-mono text-[10px] text-gray-400" title={log.userId}>
                            {log.userId && log.userId.length > 18
                                ? `${log.userId.slice(0, 10)}…`
                                : (log.userId ?? "—")}
                        </span>
                    </p>
                </div>

                {(Object.keys(log.metadata ?? {}).length > 0 || log.userAgent) && (
                    <details className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-[10px]">
                        <summary className="cursor-pointer font-black tracking-wider text-[#afafaf] uppercase">
                            Context & metadata
                            {preview ? (
                                <span className="ml-2 line-clamp-1 font-mono font-normal text-[#3c3c3c] normal-case">
                                    {preview}
                                </span>
                            ) : null}
                        </summary>
                        {log.userAgent && (
                            <p className="mt-2 font-mono text-[10px] break-all text-gray-500">
                                <span className="font-black text-[#afafaf]">UA </span>
                                {log.userAgent}
                            </p>
                        )}
                        {Object.keys(log.metadata ?? {}).length > 0 && (
                            <pre className="mt-2 max-h-40 overflow-auto font-mono text-[10px] break-all whitespace-pre-wrap text-[#3c3c3c]">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        )}
                    </details>
                )}
            </div>

            <div className="flex shrink-0 flex-col items-end justify-start gap-1 text-right">
                <time
                    className="text-[10px] font-black tracking-wider text-[#58cc02] uppercase"
                    title={absolute}
                >
                    {relative}
                </time>
                <span
                    className="max-w-[120px] text-[9px] font-bold text-[#afafaf]"
                    title={absolute}
                >
                    {absolute}
                </span>
                <ChevronRight
                    size={14}
                    className="mt-1 text-gray-200 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                />
            </div>
        </article>
    );
};

export default LogRow;
