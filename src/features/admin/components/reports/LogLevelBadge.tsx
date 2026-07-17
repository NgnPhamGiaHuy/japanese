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

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/components/ui";
import { LOG_LEVEL_META } from "../../domain/logMeta";

import type { LogLevel } from "../../types";

const LogLevelBadge = ({ level }: { level: LogLevel | string }) => {
    const t = useTranslations("AdminReports");
    // `level` is raw Firestore data, so it may be a value we have no meta or
    // translation for — fall back to showing it verbatim, as before.
    const known = LOG_LEVEL_META[level as LogLevel];
    return (
        <Badge
            variant={known?.variant ?? "default"}
            size="sm"
            className="tracking-tighter uppercase"
        >
            {known ? t(`logLevel.${level as LogLevel}`) : String(level)}
        </Badge>
    );
};

export default LogLevelBadge;
