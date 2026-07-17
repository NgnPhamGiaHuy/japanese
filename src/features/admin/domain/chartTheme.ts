/**
 * @file chartTheme
 * Single source of truth for recharts tooltip styling and the categorical
 * color palette shared by the admin analytics/dashboard pie and bar charts —
 * collapsing what were 8 byte-for-byte-identical tooltip objects and 4
 * independently-drifted color arrays (C127, C128).
 *
 * Colors stay literal hex, mirroring logMeta.ts's own reasoning: recharts
 * renders these into raw SVG fill/inline-style attributes, which don't
 * resolve Tailwind's arbitrary-value classes the way JSX className does.
 * Every value is one of globals.css's actual design tokens — no new ad hoc
 * hex — fixing the drift where two files used "#ffc800" (not a real token)
 * instead of "#ff9600" (survival), and three used "#ff4b4b" (not a real
 * token) instead of "#ea2b2b" (danger).
 */

export const CHART_TOOLTIP_STYLE = {
    borderRadius: "24px",
    border: "none",
    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
    padding: "12px 16px",
};

/**
 * Categorical palette for charts with up to 5 series.
 * Order: katakana blue, hiragana green, both purple, survival orange, danger red.
 */
export const CHART_PALETTE = ["#1cb0f6", "#58cc02", "#ce82ff", "#ff9600", "#ea2b2b"];
