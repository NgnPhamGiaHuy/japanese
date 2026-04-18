"use client";

import { isValidElement } from "react";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

import type { ReactElement } from "react";

interface StatCardProps {
    icon: LucideIcon | ReactElement;
    title: string;
    value: number | string;
    trend?: string;
    color?: string;
    loading?: boolean;
    index?: number;
}

const StatCard = ({
    icon,
    title,
    value,
    trend,
    color = "#1cb0f6",
    loading,
    index = 0,
}: StatCardProps) => {
    const renderedIcon = isValidElement(icon)
        ? icon
        : (() => {
              const Icon = icon as LucideIcon;
              return <Icon size={24} style={{ color }} />;
          })();
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#1cb0f6]/30 hover:shadow-lg hover:shadow-[#1cb0f6]/5"
        >
            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        {renderedIcon}
                    </div>
                    {trend && (
                        <span
                            className={`text-[10px] font-black tracking-widest uppercase ${
                                trend === "Live" ? "animate-pulse text-[#58cc02]" : "text-gray-400"
                            }`}
                        >
                            {trend}
                        </span>
                    )}
                </div>

                <div>
                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        {title}
                    </p>
                    <h2 className="mt-1 text-3xl font-black tracking-tighter text-[#3c3c3c]">
                        {loading ? "…" : value}
                    </h2>
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
