/**
 * Individual Log Entry Row.
 *
 * @remarks
 * Expandable row with structured metadata viewer, copy utilities,
 * and source/entity context. Color-coded left border by severity level.
 *
 * @example
 * <LogRow log={adminLog} />
 */
"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ChevronDown, Hash } from "lucide-react";

import { Badge } from "@/shared/components/ui";
import LogCopyButton from "./LogCopyButton";
import LogLevelBadge from "./LogLevelBadge";
import LogMetadataViewer from "./LogMetadataViewer";
import LogSourceBadge from "./LogSourceBadge";
import LogTypeBadge from "./LogTypeBadge";
import { LOG_LEVEL_META } from "../../domain/logMeta";
import { formatLogTimestamp } from "../../utils/log.utils";

import type { AdminLog } from "../../types";

// ─── Main row ─────────────────────────────────────────────────────────────────

interface LogRowProps {
    /** The raw log entry data to display. */
    log: AdminLog;
}

const LogRow = ({ log }: LogRowProps) => {
    const t = useTranslations("AdminReports");
    const [expanded, setExpanded] = useState(false);

    const { relative, absolute } = useMemo(
        () => formatLogTimestamp(log.timestamp),
        [log.timestamp],
    );

    const level = log.level ?? "info";
    const type = log.type ?? "SYSTEM";

    const hasDetail =
        (log.metadata && Object.keys(log.metadata).length > 0) ||
        !!log.userAgent ||
        !!log.entityId ||
        !!log.entityType;

    const borderByLevel = LOG_LEVEL_META[level].border;

    return (
        <article
            className={`border-b border-l-4 border-gray-100 ${borderByLevel} bg-white transition-colors hover:bg-gray-50/60`}
        >
            {/* ── Main row ── */}
            <div
                className="focus-visible:ring-katakana flex w-full cursor-pointer flex-col gap-3 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset sm:flex-row sm:gap-3"
                onClick={() => hasDetail && setExpanded((v) => !v)}
                onKeyDown={(e) => {
                    if (!hasDetail) return;
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpanded((v) => !v);
                    }
                }}
                role={hasDetail ? "button" : undefined}
                tabIndex={hasDetail ? 0 : undefined}
                aria-expanded={hasDetail ? expanded : undefined}
            >
                {/* Left: badges + action + user */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <LogLevelBadge level={level} />
                        <LogTypeBadge type={type} />
                        <LogSourceBadge source={log.source} />
                        {log.ip && (
                            <span className="text-muted text-xs font-black tracking-wider uppercase">
                                {t("ip", { address: log.ip })}
                            </span>
                        )}
                    </div>

                    <h3 className="text-text text-sm leading-snug font-bold">
                        {log.action ?? t("noAction")}
                    </h3>

                    <p className="text-muted flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-bold sm:text-xs">
                        <span className="text-text">{log.userName || "—"}</span>
                        <span>·</span>
                        <span>{log.userEmail || "—"}</span>
                        {log.userId && (
                            <>
                                <span>·</span>
                                <span
                                    className="flex items-center gap-1 font-mono text-xs text-gray-400 sm:text-xs"
                                    title={log.userId}
                                >
                                    <Hash size={8} className="sm:size-2.5" />
                                    {log.userId.length > 14
                                        ? `${log.userId.slice(0, 10)}…`
                                        : log.userId}
                                </span>
                            </>
                        )}
                    </p>
                </div>

                {/* Right: time + expand chevron */}
                <div className="flex shrink-0 flex-col items-end justify-between gap-1 text-right sm:flex-col">
                    <div>
                        <time
                            className="text-hiragana block text-xs font-black tracking-wider uppercase"
                            title={absolute}
                        >
                            {relative}
                        </time>
                        <span className="text-muted block text-xs font-bold">{absolute}</span>
                    </div>
                    {hasDetail && (
                        <ChevronDown
                            size={14}
                            className={`text-gray-300 transition-transform ${expanded ? "rotate-180" : ""}`}
                            aria-hidden
                        />
                    )}
                </div>
            </div>

            {/* ── Expanded detail panel ── */}
            {expanded && hasDetail && (
                <div className="border-t border-dashed border-gray-100 bg-gray-50/60 px-4 pt-3 pb-4">
                    {/* Entity + Log ID row */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                        {log.entityType && (
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-muted font-black tracking-wider uppercase">
                                    {t("entity")}
                                </span>
                                <Badge
                                    variant="default"
                                    size="sm"
                                    className="text-text border-gray-200 bg-white font-mono"
                                >
                                    {log.entityType}
                                    {log.entityId ? ` · ${log.entityId.slice(0, 12)}…` : ""}
                                </Badge>
                                {log.entityId && (
                                    <LogCopyButton text={log.entityId} title={t("copyEntityId")} />
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-muted font-black tracking-wider uppercase">
                                {t("logId")}
                            </span>
                            <Badge
                                variant="default"
                                size="sm"
                                className="text-text border-gray-200 bg-white font-mono"
                            >
                                {log.id.slice(0, 12)}…
                            </Badge>
                            <LogCopyButton text={log.id} title={t("copyLogId")} />
                        </div>
                    </div>

                    {/* User agent */}
                    {log.userAgent && (
                        <div className="mb-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <span className="text-muted mb-1 block text-xs font-black tracking-wider uppercase">
                                {t("userAgent")}
                            </span>
                            <p className="font-mono text-xs break-all text-gray-500">
                                {log.userAgent}
                            </p>
                        </div>
                    )}

                    {/* Metadata key-value grid */}
                    {log.metadata && <LogMetadataViewer meta={log.metadata} />}
                </div>
            )}
        </article>
    );
};

export default LogRow;
