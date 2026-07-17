"use client";

import { useTranslations } from "next-intl";

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
import { CHART_PALETTE, CHART_TOOLTIP_STYLE } from "../../domain/chartTheme";

import type { TopActionPoint } from "../../types";

interface TopActionsChartProps {
    data: TopActionPoint[];
    onClick?: (action: string) => void;
}

/** Indices into CHART_PALETTE: 0 blue, 1 green, 2 purple, 3 orange. */
function colorForAction(action: string): string {
    if (action.startsWith("user.login") || action.startsWith("user.logout"))
        return CHART_PALETTE[0];
    if (action.startsWith("admin.")) return CHART_PALETTE[2];
    if (action.startsWith("deck.") || action.startsWith("card.") || action.startsWith("study."))
        return CHART_PALETTE[3];
    if (action.startsWith("share.")) return CHART_PALETTE[1];
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
    const t = useTranslations("AdminAnalytics");
    if (!data || data.length === 0) return null;

    return (
        <AdminChartContainer
            title={t("topActions")}
            subtitle={t("mostFrequentEvents")}
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
                        contentStyle={CHART_TOOLTIP_STYLE}
                        labelStyle={{ fontWeight: 900, fontSize: 12, marginBottom: 4 }}
                        // recharts' Tooltip formatter args aren't meaningfully typed upstream.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any) => [v, t("occurrences")]}
                    />
                    <Bar
                        dataKey="count"
                        radius={[16, 16, 16, 16]}
                        barSize={32}
                        animationDuration={1500}
                        // recharts' Bar onClick payload isn't meaningfully typed upstream.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
