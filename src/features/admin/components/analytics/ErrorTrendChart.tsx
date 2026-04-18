"use client";

import { format } from "date-fns";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface ErrorTrendChartProps {
    data: { date: string; errors: number }[];
}

/**
 * System Error Trends Line Chart.
 *
 * @remarks Utilizes a 'stepAfter' line type to emphasize discrete spikes in system errors,
 * making it easier to identify specific regression periods.
 */
const ErrorTrendChart = ({ data }: ErrorTrendChartProps) => {
    return (
        <>
            <h3 className="mb-6 text-sm font-black tracking-[0.2em] text-gray-400 uppercase">
                System Error Trends
            </h3>
            <div className="h-[280px] w-full">
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
                        <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
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
                        />
                        <Line
                            type="stepAfter"
                            dataKey="errors"
                            stroke="#ea2b2b"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#ea2b2b", strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#ea2b2b" }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default ErrorTrendChart;
