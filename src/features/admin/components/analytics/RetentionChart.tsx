"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface RetentionChartProps {
    data: { day: number; rate: number }[];
}

/**
 * User Retention Rate Area Chart.
 *
 * @remarks Visualizes cohort retention over time using an Area chart to highlight the
 * volume of active users remaining after registration.
 */
const RetentionChart = ({ data }: RetentionChartProps) => {
    return (
        <>
            <h3 className="mb-6 text-sm font-black tracking-[0.2em] text-gray-400 uppercase">
                User Retention Rate (%)
            </h3>
            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#58cc02" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#58cc02" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="day"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `Day ${val}`}
                            dy={10}
                        />
                        <YAxis
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            width={30}
                            domain={[0, 100]}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
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
                            formatter={(value) => [`${Number(value ?? 0)}%`, "Retention"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="rate"
                            stroke="#58cc02"
                            fillOpacity={1}
                            fill="url(#colorRate)"
                            strokeWidth={4}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default RetentionChart;
