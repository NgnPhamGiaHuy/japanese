"use client";

import { useTranslations } from "next-intl";

import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AdminChartContainer } from "../shared";
import { LOG_TYPE_META } from "../../domain/logMeta";

import type { LogType, LogVolumePoint } from "../../types";

interface LogVolumeChartProps {
    data: LogVolumePoint[];
    onClick?: (type: string) => void;
}

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
    const t = useTranslations("AdminAnalytics");
    if (!data || data.length === 0) return null;

    const activeTypes = (Object.keys(LOG_TYPE_META) as string[]).filter((t) =>
        // LogVolumePoint's per-type fields are dynamic (one key per LogType,
        // spread onto the base {date} shape) — no sound static type here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.some((d) => (d as any)[t] > 0),
    );

    return (
        <AdminChartContainer title={t("logVolumeOverTime")} subtitle={t("dailyEventCount")}>
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
                        // recharts' Tooltip formatter args aren't meaningfully typed upstream.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: any) => [
                            value ?? 0,
                            LOG_TYPE_META[String(name ?? "") as LogType]?.label ??
                                String(name ?? ""),
                        ]}
                        cursor={{ fill: "#f8fafc" }}
                    />
                    {activeTypes.map((type, i) => (
                        <Bar
                            key={type}
                            dataKey={type}
                            stackId="logs"
                            fill={LOG_TYPE_META[type as LogType]?.chartColor}
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
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {activeTypes.map((type) => (
                    <button
                        key={type}
                        onClick={() => onClick?.(type)}
                        className={`focus-visible:ring-katakana flex items-center gap-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${onClick ? "cursor-pointer transition-opacity hover:opacity-70" : "cursor-default"}`}
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: LOG_TYPE_META[type as LogType]?.chartColor }}
                        />
                        <span className="text-text text-xs font-black tracking-tighter uppercase">
                            {LOG_TYPE_META[type as LogType]?.label}
                        </span>
                    </button>
                ))}
            </div>
        </AdminChartContainer>
    );
};

export default LogVolumeChart;
