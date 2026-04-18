"use client";

import { format } from "date-fns";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface ActivityChartProps {
    data: { date: string; dau: number; wau: number }[];
}

/**
 * Platform Activity Bar Chart.
 *
 * @remarks Visualizes Daily Active Users (DAU) and Weekly Active Users (WAU) in parallel
 * to help administrators monitor short-term vs mid-term engagement trends.
 */
const ActivityChart = ({ data }: ActivityChartProps) => {
    return (
        <>
            <h3 className="mb-6 text-sm font-black tracking-[0.2em] text-gray-400 uppercase">
                Active Trends (DAU vs WAU)
            </h3>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => format(new Date(val), "MMM d")}
                            dy={10}
                        />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                        <Tooltip
                            cursor={{ fill: "#f7f7f8", radius: 12 }}
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
                        <Bar
                            name="Daily Active"
                            dataKey="dau"
                            fill="#58cc02"
                            radius={[6, 6, 6, 6]}
                            barSize={8}
                        />
                        <Bar
                            name="Weekly Active"
                            dataKey="wau"
                            fill="#1cb0f6"
                            radius={[6, 6, 6, 6]}
                            barSize={8}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default ActivityChart;
