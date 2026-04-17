/**
 * Badge — Reusable badge component
 *
 * @remarks
 * Used for counts, status indicators, and labels across the app.
 */

import type { ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
    size?: "sm" | "md" | "lg";
    className?: string;
}

const VARIANT_STYLES = {
    default: "bg-gray-100 text-gray-600",
    primary: "bg-[#ce82ff] text-white",
    success: "bg-[#58cc02] text-white",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-[#ffdfe0] text-[#ea2b2b]",
    info: "bg-[#1cb0f6]/10 text-[#1cb0f6]",
};

const SIZE_STYLES = {
    sm: "h-4 min-w-4 px-1 text-[9px]",
    md: "h-5 min-w-5 px-1.5 text-[10px]",
    lg: "h-6 min-w-6 px-2 text-xs",
};

export function Badge({ children, variant = "default", size = "md", className = "" }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center justify-center rounded-full font-black ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
        >
            {children}
        </span>
    );
}
