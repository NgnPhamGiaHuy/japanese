"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { AdminChartContainer } from "../shared";

const COLORS = ["#ce82ff", "#1cb0f6", "#58cc02", "#ffc800", "#ff4b4b"];

interface RoleChartProps {
    data: { name: string; value: number }[];
    onClick?: (role: string) => void;
}

/**
 * Access Role Distribution Pie Chart.
 *
 * @remarks Displays the proportion of users assigned to different administrative
 * and standard roles using a donut-style radial chart.
 */
const RoleChart = ({ data, onClick }: RoleChartProps) => {
    return (
        <AdminChartContainer title="Access Roles">
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
                        onClick={(data: any) => onClick?.(data.payload?.name ?? data.name ?? "")}
                        className="cursor-pointer"
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
                        <span className="text-text text-xs font-black tracking-tighter uppercase">
                            {item.name}: {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </AdminChartContainer>
    );
};

export default RoleChart;
