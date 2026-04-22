"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { AdminChartContainer } from "../shared";

import type { LogLevelPoint } from "../../types";

interface LogLevelChartProps {
    data: LogLevelPoint[];
    onClick?: (level: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
    info: "#1cb0f6",
    warn: "#ff9600",
    error: "#ea2b2b",
    security: "#ce82ff",
};

const LEVEL_LABELS: Record<string, string> = {
    info: "Info",
    warn: "Warn",
    error: "Error",
    security: "Security",
};

/**
 * Log Level Distribution — donut chart.
 *
 * @remarks Matches RoleChart exactly: donut with cornerRadius, paddingAngle,
 * custom legend below, and click-to-drilldown on each slice and legend item.
 */
const LogLevelChart = ({ data, onClick }: LogLevelChartProps) => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((s, d) => s + d.count, 0);

    return (
        <AdminChartContainer
            title="Events by Severity"
            subtitle={`${total.toLocaleString()} total entries`}
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
                        onClick={(d: any) => onClick?.(d.level ?? d.name ?? "")}
                        className={onClick ? "cursor-pointer" : undefined}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.level} fill={LEVEL_COLORS[entry.level] ?? "#afafaf"} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: "24px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                            padding: "12px 16px",
                        }}
                        formatter={(value: any, name: any) => [
                            `${value} (${Math.round(((Number(value) || 0) / total) * 100)}%)`,
                            LEVEL_LABELS[String(name)] ?? String(name),
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
                        className={`flex items-center gap-2 ${onClick ? "cursor-pointer transition-opacity hover:opacity-70" : "cursor-default"}`}
                    >
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: LEVEL_COLORS[item.level] ?? "#afafaf" }}
                        />
                        <span className="text-[10px] font-black tracking-tighter text-[#3c3c3c] uppercase">
                            {LEVEL_LABELS[item.level] ?? item.level}: {item.count}
                        </span>
                    </button>
                ))}
            </div>
        </AdminChartContainer>
    );
};

export default LogLevelChart;
