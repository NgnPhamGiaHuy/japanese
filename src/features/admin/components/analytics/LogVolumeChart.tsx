"use client";

import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AdminChartContainer } from "../shared";

import type { LogVolumePoint } from "../../types";

interface LogVolumeChartProps {
    data: LogVolumePoint[];
    onClick?: (type: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
    AUTH: "#1cb0f6",
    USER_ACTION: "#ff9600",
    ADMIN_ACTION: "#ce82ff",
    CONTENT: "#58cc02",
    SYSTEM: "#afafaf",
    ERROR: "#ea2b2b",
};

const TYPE_LABELS: Record<string, string> = {
    AUTH: "Auth",
    USER_ACTION: "User",
    ADMIN_ACTION: "Admin",
    CONTENT: "Content",
    SYSTEM: "System",
    ERROR: "Error",
};

const TOOLTIP_STYLE = {
    borderRadius: "24px",
    border: "none",
    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
    padding: "12px 16px",
};

/**
 * Log Volume Over Time — stacked bar chart.
 *
 * @remarks
 * Each bar represents one day, stacked by log type.
 * Uses a custom legend matching the RoleChart pattern.
 *
 * @example
 * <LogVolumeChart data={[{ date: '2024-01-01', AUTH: 10, SYSTEM: 5 }]} />
 */
const LogVolumeChart = ({ data, onClick }: LogVolumeChartProps) => {
    if (!data || data.length === 0) return null;

    const activeTypes = (Object.keys(TYPE_COLORS) as string[]).filter((t) =>
        data.some((d) => (d as any)[t] > 0),
    );

    return (
        <AdminChartContainer title="Log Volume Over Time" subtitle="Daily event count by type">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => {
                            try {
                                return format(new Date(v), "MMM d");
                            } catch {
                                return v;
                            }
                        }}
                        dy={8}
                        interval="preserveStartEnd"
                        tick={{ fontWeight: "bold", fill: "#afafaf" }}
                    />
                    <YAxis
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={28}
                        allowDecimals={false}
                        tick={{ fontWeight: "bold", fill: "#afafaf" }}
                    />
                    <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={{ fontWeight: 900, fontSize: 11, marginBottom: 6 }}
                        labelFormatter={(v) => {
                            try {
                                return format(new Date(v), "MMM d, yyyy");
                            } catch {
                                return v;
                            }
                        }}
                        formatter={(value: any, name: any) => [
                            value ?? 0,
                            TYPE_LABELS[String(name ?? "")] ?? String(name ?? ""),
                        ]}
                        cursor={{ fill: "#f8fafc" }}
                    />
                    {activeTypes.map((type, i) => (
                        <Bar
                            key={type}
                            dataKey={type}
                            stackId="logs"
                            fill={TYPE_COLORS[type]}
                            radius={i === activeTypes.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                            maxBarSize={36}
                            animationDuration={1400}
                            onClick={() => onClick?.(type)}
                            className={onClick ? "cursor-pointer" : undefined}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>

            {/* Custom legend — same pattern as RoleChart */}
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {activeTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => onClick?.(type)}
                        className={`flex items-center gap-1.5 ${onClick ? "cursor-pointer transition-opacity hover:opacity-70" : "cursor-default"}`}
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: TYPE_COLORS[type] }}
                        />
                        <span className="text-[10px] font-black tracking-tighter text-[#3c3c3c] uppercase">
                            {TYPE_LABELS[type]}
                        </span>
                    </button>
                ))}
            </div>
        </AdminChartContainer>
    );
};

export default LogVolumeChart;
