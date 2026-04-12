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

const NavItem = ({ icon, active, onClick, color = "blue" }: NavItemProps) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center rounded-xl p-2 transition-all duration-200 ${
                active
                    ? `${COLOR_MAP[color]} scale-105 border-2 border-transparent`
                    : "border-2 border-transparent text-[#afafaf] hover:border-gray-100 hover:bg-gray-50"
            }`}
        >
            {React.cloneElement(icon, {
                size: 28,
                strokeWidth: active ? 3 : 2.5,
            } as React.SVGProps<SVGSVGElement>)}
        </button>
    );
};

export default NavItem;
