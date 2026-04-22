"use client";

import LogRow from "./LogRow";

import type { AdminLog } from "../../types";

interface LogsVirtualListProps {
    logs: AdminLog[];
}

/**
 * Log list — renders the current page of rows with no scroll container.
 *
 * @remarks
 * Pagination is handled at the page level; this component just renders what it receives.
 * Optimized for display within a virtualized or paginated parent container.
 *
 * @example
 * <LogsVirtualList logs={adminLogs} />
 */
const LogsVirtualList = ({ logs }: LogsVirtualListProps) => {
    return (
        <div className="flex flex-col">
            {logs.map((log) => (
                <LogRow key={log.id} log={log} />
            ))}
        </div>
    );
};

export default LogsVirtualList;
