/**
 * StatGrid — Reusable 4-column statistics grid
 *
 * @remarks
 * Displays game statistics in a responsive grid layout.
 * Used in game results screens.
 */

"use client";

export interface StatItem {
    value: string | number;
    label: string;
    color: string;
}

export interface StatGridProps {
    stats: StatItem[];
}

export function StatGrid({ stats }: StatGridProps) {
    return (
        <div className="grid w-full grid-cols-4 gap-3">
            {stats.map(({ value, label, color }) => (
                <div
                    key={label}
                    className="rounded-2xl border-2 border-b-4 border-gray-200 bg-white p-3 text-center shadow-sm"
                >
                    <div className="text-2xl font-black" style={{ color }}>
                        {value}
                    </div>
                    <div className="mt-1 text-[9px] font-black tracking-widest text-[#afafaf] uppercase">
                        {label}
                    </div>
                </div>
            ))}
        </div>
    );
}
