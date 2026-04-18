import { LucideIcon } from "lucide-react";

import type { ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
    size?: "sm" | "md" | "lg";
    className?: string;
    icon?: LucideIcon;
    dot?: boolean;
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

export function Badge({
    children,
    variant = "default",
    size = "md",
    className = "",
    icon: Icon,
    dot,
}: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center justify-center gap-1 overflow-hidden rounded-full font-black ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
        >
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
            {Icon && <Icon size={size === "sm" ? 10 : size === "lg" ? 14 : 12} />}
            {children}
        </span>
    );
}
