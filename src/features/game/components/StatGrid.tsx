/**
 * StatGrid — Reusable "colored value + uppercase label" stat tile grid
 *
 * @remarks
 * Three visual densities cover every current call site: `default` (game
 * results screens, 4-col grid), `compact` (StudyModeSelector's New/Due/
 * Learned row), and `large` (flashcard session-summary screens). Each
 * caller supplies its own container className since the three use
 * different layouts (fixed grid vs. flex row vs. full-width flex-1 pair).
 */

"use client";

export interface StatItem {
    value: string | number;
    label: string;
    color: string;
}

type StatGridVariant = "default" | "compact" | "large";

export interface StatGridProps {
    stats: StatItem[];
    variant?: StatGridVariant;
    /** Container className — defaults to the 4-col grid the "default" variant originally used. */
    className?: string;
}

const TILE_CLASSES: Record<StatGridVariant, string> = {
    default: "rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-3 text-center shadow-sm",
    compact: "rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-center shadow-sm",
    large: "flex-1 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-6 text-center shadow-sm",
};

const VALUE_CLASSES: Record<StatGridVariant, string> = {
    default: "text-2xl font-black",
    compact: "text-xl font-black",
    large: "text-5xl font-black",
};

const LABEL_CLASSES: Record<StatGridVariant, string> = {
    default: "text-muted mt-1 text-xs font-black tracking-widest uppercase",
    compact: "mt-1 text-xs font-black tracking-widest text-slate-400 uppercase",
    large: "text-muted mt-2 text-xs font-black tracking-widest uppercase",
};

export function StatGrid({ stats, variant = "default", className }: StatGridProps) {
    return (
        <div className={className ?? "grid w-full grid-cols-4 gap-3"}>
            {stats.map(({ value, label, color }) => (
                <div key={label} className={TILE_CLASSES[variant]}>
                    <div className={VALUE_CLASSES[variant]} style={{ color }}>
                        {value}
                    </div>
                    <div className={LABEL_CLASSES[variant]}>{label}</div>
                </div>
            ))}
        </div>
    );
}
