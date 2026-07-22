/**
 * @file logMeta
 * Single source of truth for log-level and log-type presentation — badge
 * variant, chart hex color, and the summary-header chip
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
 *
 * `border` was added (E17-T3) to extend this coverage to LogsFilters.tsx and
 * LogRow.tsx, the two files that missed the original E11-T6 consolidation —
 * LogRow's warn case previously hardcoded `border-l-amber-400`, which visibly
 * drifted from every other warn-level color here (`#ff9600`/`survival`).
 *
 * Raw-hex adjudication (T-111a, UR-3): `ADMIN_ACTION`/`USER_ACTION`/`CONTENT`'s
 * `text` fields (`#7c3aed`, `#b86800`, `#3d8f00`) and both `ERROR`-family
 * `bg` hover states (`#ffc8c9`) are deliberately darker/higher-contrast
 * variants of their row's own token (`both`/`survival`/`hiragana`/
 * `danger-bg`) — chosen for legible small-badge text and a visible hover
 * step on top of an already-light 10%-opacity tint, not the token's own
 * value left un-extracted. None is an exact match for any token in `globals.css`
 * (verified), so converging them onto `text-both`/`text-survival`/
 * `text-hiragana` would be a silent nearest-match substitution that visibly
 * lightens the text — the `#ffc800` phantom-token history is exactly the
 * failure mode this note exists to avoid repeating. Kept as literal hex,
 * intentionally, alongside the already-carved-out `chartColor` field.
 */
import type { BadgeVariant } from "@/shared/components/ui";
import type { LogLevel, LogType } from "../types";

export interface LogLevelMeta {
    variant: BadgeVariant;
    chartColor: string;
    text: string;
    bg: string;
    dot: string;
    border: string;
}

export const LOG_LEVEL_META: Record<LogLevel, LogLevelMeta> = {
    info: {
        variant: "info",
        chartColor: "#1cb0f6",
        text: "text-katakana",
        bg: "bg-katakana/10 hover:bg-katakana/20",
        dot: "bg-katakana",
        border: "border-l-katakana",
    },
    warn: {
        variant: "warning",
        chartColor: "#ff9600",
        text: "text-orange-500",
        bg: "bg-orange-50 hover:bg-orange-100",
        dot: "bg-orange-400",
        border: "border-l-survival",
    },
    error: {
        variant: "danger",
        chartColor: "#ea2b2b",
        text: "text-danger",
        bg: "bg-danger-bg hover:bg-[#ffc8c9]",
        dot: "bg-danger",
        border: "border-l-danger",
    },
    security: {
        variant: "primary",
        chartColor: "#ce82ff",
        text: "text-both",
        bg: "bg-both/10 hover:bg-both/20",
        dot: "bg-both",
        border: "border-l-both",
    },
};

export interface LogTypeMeta {
    variant: BadgeVariant;
    chartColor: string;
    bg: string;
    text: string;
    activeBg: string;
}

export const LOG_TYPE_META: Record<LogType, LogTypeMeta> = {
    AUTH: {
        variant: "info",
        chartColor: "#1cb0f6",
        bg: "bg-katakana/10 hover:bg-katakana/20",
        text: "text-katakana",
        activeBg: "bg-katakana text-white",
    },
    ADMIN_ACTION: {
        variant: "primary",
        chartColor: "#ce82ff",
        bg: "bg-both/10 hover:bg-both/20",
        text: "text-[#7c3aed]",
        activeBg: "bg-both text-white",
    },
    USER_ACTION: {
        variant: "warning",
        chartColor: "#ff9600",
        bg: "bg-survival/10 hover:bg-survival/20",
        text: "text-[#b86800]",
        activeBg: "bg-survival text-white",
    },
    CONTENT: {
        variant: "success",
        chartColor: "#58cc02",
        bg: "bg-hiragana/10 hover:bg-hiragana/20",
        text: "text-[#3d8f00]",
        activeBg: "bg-hiragana text-white",
    },
    SYSTEM: {
        variant: "default",
        chartColor: "#afafaf",
        bg: "bg-gray-100 hover:bg-gray-200",
        text: "text-gray-600",
        activeBg: "bg-gray-600 text-white",
    },
    ERROR: {
        variant: "danger",
        chartColor: "#ea2b2b",
        bg: "bg-danger-bg hover:bg-[#ffc8c9]",
        text: "text-danger-strong",
        activeBg: "bg-danger text-white",
    },
};
