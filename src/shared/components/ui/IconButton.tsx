"use client";

/**
 * IconButton — Circular icon button
 *
 * @remarks
 * Used for action buttons with icons only (no text).
 */
import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    variant?: "default" | "primary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    title?: string;
    disabled?: boolean;
}

const VARIANT_STYLES = {
    default: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    primary: "bg-[#1cb0f6] text-white hover:bg-[#149fdf]",
    danger: "bg-red-50 text-[#ea2b2b] hover:bg-red-100",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
};

const SIZE_STYLES = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
};

const ICON_SIZE = {
    sm: 16,
    md: 20,
    lg: 24,
};

export function IconButton({
    icon: Icon,
    onClick,
    variant = "default",
    size = "md",
    className = "",
    title,
    disabled = false,
}: IconButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex items-center justify-center rounded-full transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
        >
            <Icon size={ICON_SIZE[size]} />
        </button>
    );
}
