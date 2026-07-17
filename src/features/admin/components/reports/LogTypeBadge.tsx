/**
 * Functional Log Type Badge.
 *
 * @remarks
 * Categorizes logs by their functional domain (Auth, Content, System)
 * using distinct visual themes to help distinguish between different system events.
 *
 * @example
 * <LogTypeBadge type="AUTH" />
 */
"use client";

import { Badge } from "@/shared/components/ui";
import { LOG_TYPE_META } from "../../domain/logMeta";

import type { LogType } from "../../types";

const LogTypeBadge = ({ type }: { type: LogType | string }) => {
    const config = LOG_TYPE_META[type as LogType] ?? {
        variant: "default",
        label: String(type),
    };

    return (
        <Badge
            variant={config.variant}
            size="sm"
            className="max-w-[160px] truncate tracking-wider uppercase"
        >
            {config.label.replaceAll("_", " ")}
        </Badge>
    );
};

export default LogTypeBadge;
