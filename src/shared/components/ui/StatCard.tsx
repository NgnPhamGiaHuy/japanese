"use client";

import React from "react";

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
}

const StatCard = ({ icon, title, value }: StatCardProps) => {
    return (
        <div className="flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-b-4 border-gray-200 bg-white p-5 text-center shadow-sm">
            <div className="mb-3">{icon}</div>
            <p className="text-3xl font-black text-[#3c3c3c]">{value}</p>
            <p className="mt-1 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                {title}
            </p>
        </div>
    );
};

export default StatCard;

export const Test = () => {
    return <div>Test</div>;
};
