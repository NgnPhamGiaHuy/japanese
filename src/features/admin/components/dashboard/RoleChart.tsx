"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#ce82ff", "#1cb0f6", "#58cc02", "#ffc800", "#ff4b4b"];

interface RoleChartProps {
    data: { name: string; value: number }[];
}

/**
 * Access Role Distribution Pie Chart.
 *
 * @remarks Displays the proportion of users assigned to different administrative
 * and standard roles using a donut-style radial chart.
 */
const RoleChart = ({ data }: RoleChartProps) => {
    return (
        <div className="flex flex-col items-center">
            <h3 className="mb-6 w-full text-center text-sm font-black tracking-[0.2em] text-gray-400 uppercase">
                Access Roles
            </h3>
            <div className="relative h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={12}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: "24px",
                                border: "none",
                                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                                padding: "12px 16px",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="mt-2 flex flex-wrap justify-center gap-4">
                    {data.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-[10px] font-black tracking-tighter text-[#3c3c3c] uppercase">
                                {item.name}: {item.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleChart;
