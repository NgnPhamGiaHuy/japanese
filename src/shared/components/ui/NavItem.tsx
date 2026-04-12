"use client";

import React from "react";

interface NavItemProps {
    icon: React.ReactElement;
    label: string;
    active: boolean;
    onClick: () => void;
    color?: "blue" | "green" | "purple" | "orange" | "gray";
}

const COLOR_MAP: Record<string, string> = {
    blue: "text-[#1cb0f6] bg-[#e5f5ff]",
    green: "text-[#58cc02] bg-[#e5f7d8]",
    purple: "text-[#ce82ff] bg-[#faeaff]",
    orange: "text-[#ff9600] bg-[#fff5e6]",
    gray: "text-[#3c3c3c] bg-gray-100",
};

export default function NavItem({
    icon,
    active,
    onClick,
    color = "blue",
}: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                active
                    ? `${COLOR_MAP[color]} scale-105 border-2 border-transparent`
                    : "text-[#afafaf] hover:bg-gray-50 border-2 border-transparent hover:border-gray-100"
            }`}
        >
            {React.cloneElement(icon, {
                size: 28,
                strokeWidth: active ? 3 : 2.5,
            } as React.SVGProps<SVGSVGElement>)}
        </button>
    );
}
