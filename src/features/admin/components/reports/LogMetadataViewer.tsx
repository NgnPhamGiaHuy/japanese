"use client";

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
const LogMetadataViewer = ({ meta }: { meta: Record<string, unknown> }) => {
    const entries = Object.entries(meta).filter(([k]) => !INTERNAL_META_KEYS.has(k));
    if (entries.length === 0) return null;
    return (
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {entries.map(([k, v]) => (
                <div key={k} className="flex min-w-0 gap-1.5 rounded-lg bg-gray-100/80 px-2 py-1">
                    <span className="text-muted shrink-0 text-xs font-black tracking-wider uppercase">
                        {k}
                    </span>
                    <span className="text-text min-w-0 truncate font-mono text-xs">
                        {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default LogMetadataViewer;
