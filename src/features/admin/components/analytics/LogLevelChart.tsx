"use client";

import { useTranslations } from "next-intl";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { AdminChartContainer } from "../shared";
import { LOG_LEVEL_META } from "../../domain/logMeta";

import type { LogLevel, LogLevelPoint } from "../../types";

interface LogLevelChartProps {
    data: LogLevelPoint[];
    onClick?: (level: string) => void;
}

/**
 * Log Level Distribution — donut chart.
 *
 * @remarks Matches RoleChart exactly: donut with cornerRadius, paddingAngle,
 * custom legend below, and click-to-drilldown on each slice and legend item.
 */
const LogLevelChart = ({ data, onClick }: LogLevelChartProps) => {
    const t = useTranslations("AdminAnalytics");
    const tReports = useTranslations("AdminReports");
    if (!data || data.length === 0) return null;

    const total = data.reduce((s, d) => s + d.count, 0);

    return (
        <AdminChartContainer
            title={t("eventsBySeverity")}
            subtitle={t("totalEntries", { count: total.toLocaleString() })}
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="level"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        cornerRadius={8}
                        stroke="none"
                        animationDuration={1500}
                        // recharts' Pie onClick payload isn't meaningfully typed upstream.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={(d: any) => onClick?.(d.level ?? d.name ?? "")}
                        className={onClick ? "cursor-pointer" : undefined}
                    >
                        {data.map((entry) => (
                            <Cell
                                key={entry.level}
                                fill={
                                    LOG_LEVEL_META[entry.level as LogLevel]?.chartColor ?? "#afafaf"
                                }
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: "24px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                            padding: "12px 16px",
                        }}
                        // recharts' Tooltip formatter args aren't meaningfully typed upstream.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: any) => [
                            `${value} (${Math.round(((Number(value) || 0) / total) * 100)}%)`,
                            LOG_LEVEL_META[String(name) as LogLevel]
                                ? tReports(`logLevel.${String(name)}`)
                                : String(name),
                        ]}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Custom legend — same pattern as RoleChart, clickable */}
            <div className="mt-2 flex flex-wrap justify-center gap-4">
                {data.map((item) => (
                    <button
                        key={item.level}
                        onClick={() => onClick?.(item.level)}
                        className={`focus-visible:ring-katakana flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${onClick ? "cursor-pointer transition-opacity hover:opacity-70" : "cursor-default"}`}
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{
                                backgroundColor:
                                    LOG_LEVEL_META[item.level as LogLevel]?.chartColor ?? "#afafaf",
                            }}
                        />
                        <span className="text-text text-xs font-black tracking-tighter uppercase">
                            {LOG_LEVEL_META[item.level as LogLevel]
                                ? tReports(`logLevel.${item.level}`)
                                : item.level}
                            : {item.count}
                        </span>
                    </button>
                ))}
            </div>
        </AdminChartContainer>
    );
};

export default LogLevelChart;
