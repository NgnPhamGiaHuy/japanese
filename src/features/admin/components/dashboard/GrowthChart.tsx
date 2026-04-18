"use client";

import { format } from "date-fns";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { AdminChartContainer } from "../shared";

interface GrowthChartProps {
    data: { date: string; newUsers: number; totalUsers: number }[];
    onClick?: (date: string) => void;
}

/**
 * User Acquisition Growth Line Chart.
 *
 * @remarks Utilizes a dual-axis approach to correlate daily 'New Users' spikes with
 * 'Total Users' accumulation over time.
 */
const GrowthChart = ({ data, onClick }: GrowthChartProps) => {
    return (
        <AdminChartContainer title="User Acquisition Growth">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => format(new Date(val), "MMM d")}
                        dy={10}
                    />
                    <YAxis
                        yAxisId="left"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                    />
                    <Tooltip
                        cursor={{ stroke: "#1cb0f6", strokeWidth: 2 }}
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
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line
                        yAxisId="right"
                        name="Total Users"
                        type="monotone"
                        dataKey="totalUsers"
                        stroke="#58cc02"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: "#58cc02" }}
                        animationDuration={1500}
                        onClick={(data: any) =>
                            onClick?.(data.activePayload?.[0]?.payload?.date ?? "")
                        }
                    />
                    <Line
                        yAxisId="left"
                        name="New Users"
                        type="monotone"
                        dataKey="newUsers"
                        stroke="#1cb0f6"
                        strokeWidth={5}
                        dot={false}
                        activeDot={{ r: 8, strokeWidth: 0, fill: "#1cb0f6" }}
                        animationDuration={2000}
                        onClick={(data: any) =>
                            onClick?.(data.activePayload?.[0]?.payload?.date ?? "")
                        }
                    />
                </LineChart>
            </ResponsiveContainer>
        </AdminChartContainer>
    );
};

export default GrowthChart;
