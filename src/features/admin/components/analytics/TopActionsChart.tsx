"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { AdminChartContainer } from "../shared";

import type { TopActionPoint } from "../../types";

interface TopActionsChartProps {
    data: TopActionPoint[];
    onClick?: (action: string) => void;
}

function colorForAction(action: string): string {
    if (action.startsWith("user.login") || action.startsWith("user.logout")) return "#1cb0f6";
    if (action.startsWith("admin.")) return "#ce82ff";
    if (action.startsWith("deck.") || action.startsWith("card.") || action.startsWith("study."))
        return "#ff9600";
    if (action.startsWith("share.")) return "#58cc02";
    return "#afafaf";
}

/** Shorten action strings for the Y-axis label */
function shortLabel(action: string): string {
    // "deck.created" → "deck.created", "admin.role_granted" → "admin.role…"
    return action.length > 18 ? `${action.slice(0, 16)}…` : action;
}

/**
 * Top 10 Most Frequent Actions — horizontal bar chart.
 *
 * @remarks Matches EngagementChart's horizontal layout with radius=[0,12,12,0],
 * barSize=32, and colour-coded cells. Adds LabelList for count values on bars.
 */
const TopActionsChart = ({ data, onClick }: TopActionsChartProps) => {
    if (!data || data.length === 0) return null;

    return (
        <AdminChartContainer
            title="Top Actions"
            subtitle="Most frequent log events"
            chartHeight={360}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="8 8" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                        dataKey="action"
                        type="category"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={110}
                        tick={{ fontWeight: "bold", fill: "#afafaf" }}
                        tickFormatter={shortLabel}
                    />
                    <Tooltip
                        cursor={{ fill: "#f8fafc", radius: 12 }}
                        contentStyle={{
                            borderRadius: "24px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                            padding: "12px 16px",
                        }}
                        labelStyle={{ fontWeight: 900, fontSize: 12, marginBottom: 4 }}
                        formatter={(v: any) => [v, "occurrences"]}
                    />
                    <Bar
                        dataKey="count"
                        radius={[16, 16, 16, 16]}
                        barSize={32}
                        animationDuration={1500}
                        onClick={(d: any) => onClick?.(d.action ?? "")}
                        className={onClick ? "cursor-pointer" : undefined}
                    >
                        <LabelList
                            dataKey="count"
                            position="right"
                            style={{ fontSize: 10, fontWeight: 900, fill: "#afafaf" }}
                        />
                        {data.map((entry) => (
                            <Cell key={entry.action} fill={colorForAction(entry.action)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </AdminChartContainer>
    );
};

export default TopActionsChart;
