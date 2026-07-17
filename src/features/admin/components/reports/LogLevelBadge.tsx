/**
 * Log Severity Level Badge.
 *
 * @remarks
 * Maps internal log levels to semantic UI variants (danger, warning, info)
 * to provide immediate visual feedback on event severity.
 *
 * @example
 * <LogLevelBadge level="error" />
 */
"use client";

import { Badge } from "@/shared/components/ui";
import { LOG_LEVEL_META } from "../../domain/logMeta";

import type { LogLevel } from "../../types";

const LogLevelBadge = ({ level }: { level: LogLevel | string }) => {
    const safe = LOG_LEVEL_META[level as LogLevel] ?? {
        variant: "default" as const,
        label: String(level),
    };
    return (
        <Badge variant={safe.variant} size="sm" className="tracking-tighter uppercase">
            {safe.label}
        </Badge>
    );
};

export default LogLevelBadge;
