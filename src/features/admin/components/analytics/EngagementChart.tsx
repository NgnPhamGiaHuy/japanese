"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { AdminChartContainer } from "../shared";

interface EngagementChartProps {
    data: { feature: string; count: number; percentage: number }[];
    onClick?: (feature: string) => void;
}

const COLORS = ["#1cb0f6", "#58cc02", "#ce82ff", "#ff9600", "#ff4b4b"];

/**
 * Feature Engagement Vertical Bar Chart.
 *
 * @remarks Visualizes relative usage of different platform features using a vertical layout
 * to accommodate long feature names while maintaining readability.
 */
const EngagementChart = ({ data, onClick }: EngagementChartProps) => {
    return (
        <AdminChartContainer title="Feature Engagement">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="8 8" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="feature"
                        type="category"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                        tick={{ fontWeight: "bold" }}
                    />
                    <Tooltip
                        cursor={{ fill: "#f8fafc", radius: 12, cursor: "pointer" }}
                        contentStyle={{
                            borderRadius: "24px",
                            border: "none",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                            padding: "12px 16px",
                        }}
                        labelStyle={{
                            fontWeight: "black",
                            fontSize: "12px",
                            marginBottom: "4px",
                        }}
                    />
                    <Bar
                        dataKey="count"
                        radius={[0, 12, 12, 0]}
                        barSize={32}
                        animationDuration={1500}
                        onClick={(data: any) =>
                            onClick?.(data.payload?.feature ?? data.feature ?? "")
                        }
                        className="cursor-pointer"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </AdminChartContainer>
    );
};

export default EngagementChart;
