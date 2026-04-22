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

import type { LogLevel } from "../../types";

const LEVEL_CONFIG: Record<
    LogLevel,
    { variant: "default" | "primary" | "success" | "warning" | "danger" | "info"; label: string }
> = {
    info: { variant: "info", label: "Info" },
    warn: { variant: "warning", label: "Warn" },
    error: { variant: "danger", label: "Error" },
    security: { variant: "primary", label: "Security" },
};

const LogLevelBadge = ({ level }: { level: LogLevel | string }) => {
    const safe = LEVEL_CONFIG[level as LogLevel] ?? {
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
