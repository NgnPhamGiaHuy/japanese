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

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/components/ui";
import { LOG_TYPE_META } from "../../domain/logMeta";

import type { LogType } from "../../types";

const LogTypeBadge = ({ type }: { type: LogType | string }) => {
    const t = useTranslations("AdminReports");
    // `type` is raw Firestore data, so it may be a value we have no meta or
    // translation for — fall back to showing it verbatim, as before.
    const known = LOG_TYPE_META[type as LogType];

    return (
        <Badge
            variant={known?.variant ?? "default"}
            size="sm"
            className="max-w-[160px] truncate tracking-wider uppercase"
        >
            {known ? t(`logType.${type as LogType}`) : String(type).replaceAll("_", " ")}
        </Badge>
    );
};

export default LogTypeBadge;
