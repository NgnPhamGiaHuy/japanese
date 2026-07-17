/**
 * @file logMeta
 * Single source of truth for log-level and log-type presentation — badge
 * variant, display label, chart hex color, and the summary-header chip
 * classes — collapsing what were 7 independently-declared, partially
 * duplicated maps across LogLevelChart.tsx, LogVolumeChart.tsx,
 * LogLevelBadge.tsx, LogTypeBadge.tsx, and LogsSummaryHeader.tsx (E11-T6).
 *
 * Every value here is carried over unchanged from whichever file previously
 * declared it (verified per-field, not just "looks similar") — this is a
 * relocation, not a redesign, so no chip/badge/chart changes color.
 *
 * chartColor stays a literal hex rather than a CSS variable reference:
 * recharts renders these into raw SVG `fill`/inline-style attributes, which
 * don't resolve Tailwind's arbitrary-value classes the way JSX className
 * does.
 */
import type { BadgeVariant } from "@/shared/components/ui";
import type { LogLevel, LogType } from "../types";

export interface LogLevelMeta {
    label: string;
    variant: BadgeVariant;
    chartColor: string;
    text: string;
    bg: string;
    dot: string;
}

export const LOG_LEVEL_META: Record<LogLevel, LogLevelMeta> = {
    info: {
        label: "Info",
        variant: "info",
        chartColor: "#1cb0f6",
        text: "text-katakana",
        bg: "bg-katakana/10 hover:bg-katakana/20",
        dot: "bg-katakana",
    },
    warn: {
        label: "Warn",
        variant: "warning",
        chartColor: "#ff9600",
        text: "text-orange-500",
        bg: "bg-orange-50 hover:bg-orange-100",
        dot: "bg-orange-400",
    },
    error: {
        label: "Error",
        variant: "danger",
        chartColor: "#ea2b2b",
        text: "text-danger",
        bg: "bg-danger-bg hover:bg-[#ffc8c9]",
        dot: "bg-danger",
    },
    security: {
        label: "Security",
        variant: "primary",
        chartColor: "#ce82ff",
        text: "text-both",
        bg: "bg-both/10 hover:bg-both/20",
        dot: "bg-both",
    },
};

export interface LogTypeMeta {
    label: string;
    variant: BadgeVariant;
    chartColor: string;
    bg: string;
    text: string;
    activeBg: string;
}

export const LOG_TYPE_META: Record<LogType, LogTypeMeta> = {
    AUTH: {
        label: "Auth",
        variant: "info",
        chartColor: "#1cb0f6",
        bg: "bg-katakana/10 hover:bg-katakana/20",
        text: "text-katakana",
        activeBg: "bg-katakana text-white",
    },
    ADMIN_ACTION: {
        label: "Admin",
        variant: "primary",
        chartColor: "#ce82ff",
        bg: "bg-both/10 hover:bg-both/20",
        text: "text-[#7c3aed]",
        activeBg: "bg-both text-white",
    },
    USER_ACTION: {
        label: "User",
        variant: "warning",
        chartColor: "#ff9600",
        bg: "bg-survival/10 hover:bg-survival/20",
        text: "text-[#b86800]",
        activeBg: "bg-survival text-white",
    },
    CONTENT: {
        label: "Content",
        variant: "success",
        chartColor: "#58cc02",
        bg: "bg-hiragana/10 hover:bg-hiragana/20",
        text: "text-[#3d8f00]",
        activeBg: "bg-hiragana text-white",
    },
    SYSTEM: {
        label: "System",
        variant: "default",
        chartColor: "#afafaf",
        bg: "bg-gray-100 hover:bg-gray-200",
        text: "text-gray-600",
        activeBg: "bg-gray-600 text-white",
    },
    ERROR: {
        label: "Error",
        variant: "danger",
        chartColor: "#ea2b2b",
        bg: "bg-danger-bg hover:bg-[#ffc8c9]",
        text: "text-danger-strong",
        activeBg: "bg-danger text-white",
    },
};
