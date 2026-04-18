"use client";

import { clsx } from "clsx";

import type { LogType } from "../../types";

const TYPE_STYLES: Record<LogType, string> = {
    AUTH: "border-[#1cb0f6]/40 bg-[#1cb0f6]/10 text-[#1cb0f6]",
    ADMIN_ACTION: "border-[#ce82ff]/40 bg-[#ce82ff]/15 text-[#7c3aed]",
    SYSTEM: "border-gray-200 bg-gray-50 text-gray-600",
    ERROR: "border-[#ea2b2b]/40 bg-[#ffdfe0] text-[#b82222]",
    CONTENT: "border-[#58cc02]/40 bg-[#58cc02]/15 text-[#3d8f00]",
};

/**
 * Functional Log Type Badge.
 *
 * @remarks Categorizes logs by their functional domain (Auth, Content, System)
 * using distinct visual themes to help distinguish between different system events.
 */
const LogTypeBadge = ({ type }: { type: LogType | string }) => {
    const style =
        type in TYPE_STYLES
            ? TYPE_STYLES[type as LogType]
            : "border-gray-200 bg-gray-100 text-gray-600";
    return (
        <span
            className={clsx(
                "inline-flex max-w-[160px] truncate rounded-lg border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase",
                style,
            )}
            title={String(type)}
        >
            {String(type).replaceAll("_", " ")}
        </span>
    );
};

export default LogTypeBadge;
