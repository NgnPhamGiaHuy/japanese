"use client";

import React from "react";

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
}

export default function StatCard({ icon, title, value }: StatCardProps) {
    return (
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border-2 border-b-4 border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="mb-3">{icon}</div>
            <p className="text-3xl font-black text-[#3c3c3c]">{value}</p>
            <p className="text-[10px] font-black text-[#afafaf] uppercase tracking-widest mt-1">
                {title}
            </p>
        </div>
    );
}
