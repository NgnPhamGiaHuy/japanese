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

import { useMemo, useState } from "react";

import { Check, ChevronDown, Copy, Hash, Server, Smartphone } from "lucide-react";

import { Badge, Button } from "@/shared/components/ui";
import LogLevelBadge from "./LogLevelBadge";
import LogTypeBadge from "./LogTypeBadge";
import { formatLogTimestamp } from "../../utils/log.utils";

import type { AdminLog } from "../../types";

// ─── Metadata viewer ──────────────────────────────────────────────────────────

const INTERNAL_META_KEYS = new Set([
    "logType",
    "userName",
    "userEmail",
    "entityType",
    "entityId",
    "source",
]);

/**
 * Structured metadata viewer for log entries.
 *
 * @remarks
 * Filters out internal tracking keys and displays remaining metadata in a responsive grid.
 * Handles objects by stringifying them and provides a high-contrast mono font style.
 */
const MetadataViewer = ({ meta }: { meta: Record<string, unknown> }) => {
    const entries = Object.entries(meta).filter(([k]) => !INTERNAL_META_KEYS.has(k));
    if (entries.length === 0) return null;
    return (
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {entries.map(([k, v]) => (
                <div key={k} className="flex min-w-0 gap-1.5 rounded-lg bg-gray-100/80 px-2 py-1">
                    <span className="shrink-0 text-[9px] font-black tracking-wider text-[#afafaf] uppercase">
                        {k}
                    </span>
                    <span className="min-w-0 truncate font-mono text-[10px] text-[#3c3c3c]">
                        {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Copy button ──────────────────────────────────────────────────────────────

/**
 * Utility button for copying text to the clipboard.
 *
 * @remarks
 * Uses a minimal ghost variant to avoid visual clutter. Provides temporary
 * visual feedback via a checkmark icon after successful copying.
 */
const CopyButton = ({ text, title }: { text: string; title?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <Button
            variant="ghost"
            color="gray"
            onClick={handleCopy}
            title={title ?? "Copy"}
            icon={copied ? Check : Copy}
            iconSize={12}
            iconClassName={copied ? "text-[#58cc02]" : "text-[#afafaf]"}
            className="h-6 w-6 !p-0 transition-colors hover:!bg-transparent hover:text-[#3c3c3c]"
        />
    );
};

// ─── Source badge ─────────────────────────────────────────────────────────────

/**
 * Displays the architectural source of the log event.
 */
const SourceBadge = ({ source }: { source?: string }) => {
    if (!source) return null;
    const isClient = source === "client";
    return (
        <Badge
            variant="default"
            size="sm"
            icon={isClient ? Smartphone : Server}
            className="border-gray-100 bg-gray-50 tracking-wider text-[#afafaf] uppercase"
        >
            {source.replace("_", " ")}
        </Badge>
    );
};

// ─── Main row ─────────────────────────────────────────────────────────────────

interface LogRowProps {
    /** The raw log entry data to display. */
    log: AdminLog;
}

const LogRow = ({ log }: LogRowProps) => {
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
            className={`border-b border-l-4 border-gray-100 ${borderByLevel} bg-white transition-colors hover:bg-gray-50/60`}
        >
            {/* ── Main row ── */}
            <div
                className="flex w-full cursor-pointer flex-col gap-3 px-4 py-3 sm:flex-row sm:gap-3"
                onClick={() => hasDetail && setExpanded((v) => !v)}
                role={hasDetail ? "button" : undefined}
                aria-expanded={hasDetail ? expanded : undefined}
            >
                {/* Left: badges + action + user */}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <LogLevelBadge level={level} />
                        <LogTypeBadge type={type} />
                        <SourceBadge source={log.source} />
                        {log.ip && (
                            <span className="text-[9px] font-black tracking-wider text-[#afafaf] uppercase">
                                IP {log.ip}
                            </span>
                        )}
                    </div>

                    <h3 className="text-sm leading-snug font-black text-[#3c3c3c] sm:text-sm">
                        {log.action ?? "(no action)"}
                    </h3>

                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold text-[#afafaf] sm:text-[11px]">
                        <span className="text-[#3c3c3c]">{log.userName || "—"}</span>
                        <span>·</span>
                        <span>{log.userEmail || "—"}</span>
                        {log.userId && (
                            <>
                                <span>·</span>
                                <span
                                    className="flex items-center gap-1 font-mono text-[9px] text-gray-400 sm:text-[10px]"
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
                            className="block text-[10px] font-black tracking-wider text-[#58cc02] uppercase"
                            title={absolute}
                        >
                            {relative}
                        </time>
                        <span className="block text-[9px] font-bold text-[#afafaf]">
                            {absolute}
                        </span>
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
                            <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="font-black tracking-wider text-[#afafaf] uppercase">
                                    Entity
                                </span>
                                <Badge
                                    variant="default"
                                    size="sm"
                                    className="border-gray-200 bg-white font-mono text-[#3c3c3c]"
                                >
                                    {log.entityType}
                                    {log.entityId ? ` · ${log.entityId.slice(0, 12)}…` : ""}
                                </Badge>
                                {log.entityId && (
                                    <CopyButton text={log.entityId} title="Copy entity ID" />
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="font-black tracking-wider text-[#afafaf] uppercase">
                                Log ID
                            </span>
                            <Badge
                                variant="default"
                                size="sm"
                                className="border-gray-200 bg-white font-mono text-[#3c3c3c]"
                            >
                                {log.id.slice(0, 12)}…
                            </Badge>
                            <CopyButton text={log.id} title="Copy log ID" />
                        </div>
                    </div>

                    {/* User agent */}
                    {log.userAgent && (
                        <div className="mb-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <span className="mb-1 block text-[9px] font-black tracking-wider text-[#afafaf] uppercase">
                                User Agent
                            </span>
                            <p className="font-mono text-[10px] break-all text-gray-500">
                                {log.userAgent}
                            </p>
                        </div>
                    )}

                    {/* Metadata key-value grid */}
                    {log.metadata && <MetadataViewer meta={log.metadata} />}
                </div>
            )}
        </article>
    );
};

export default LogRow;
