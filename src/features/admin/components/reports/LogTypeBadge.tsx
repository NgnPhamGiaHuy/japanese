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

import type { LogType } from "../../types";

const TYPE_CONFIG: Record<
    LogType,
    { variant: "default" | "primary" | "success" | "warning" | "danger" | "info"; label: string }
> = {
    AUTH: { variant: "info", label: "Auth" },
    ADMIN_ACTION: { variant: "primary", label: "Admin" },
    USER_ACTION: { variant: "warning", label: "User" },
    SYSTEM: { variant: "default", label: "System" },
    ERROR: { variant: "danger", label: "Error" },
    CONTENT: { variant: "success", label: "Content" },
};

const LogTypeBadge = ({ type }: { type: LogType | string }) => {
    const config = TYPE_CONFIG[type as LogType] ?? {
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
