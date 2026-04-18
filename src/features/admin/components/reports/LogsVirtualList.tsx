"use client";

import { useRef } from "react";

import { useVirtualizer } from "@tanstack/react-virtual";

import LogRow from "./LogRow";

import type { AdminLog } from "../../types";

interface LogsVirtualListProps {
    logs: AdminLog[];
}

/**
 * Log Virtualization List.
 *
 * @remarks Efficiently renders large log datasets using windowing (@tanstack/react-virtual).
 * This ensures smooth scrolling even with thousands of operational entries.
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
