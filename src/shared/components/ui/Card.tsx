"use client";

/**
 * Card — Reusable card container component
 *
 * @remarks
 * Base card component with consistent styling across the app.
 * Supports different variants and sizes.
 */
import type { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    variant?: "default" | "elevated" | "flat" | "dashboard";
    padding?: "none" | "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
}

const VARIANT_STYLES = {
    default: "rounded-3xl border-2 border-b-4 border-gray-200 bg-white shadow-sm transition-all",
    elevated: "rounded-3xl border-2 border-gray-200 bg-white shadow-md transition-all",
    flat: "rounded-3xl border-2 border-gray-200 bg-white transition-all",
    dashboard:
        "rounded-[2.5rem] bg-white shadow-sm transition-all hover:shadow-md border-2 border-gray-100/50",
};

const PADDING_STYLES = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

export function Card({
    children,
    variant = "default",
    padding = "md",
    className = "",
    onClick,
}: CardProps) {
    const Component = onClick ? "button" : "div";

    return (
        <Component
            onClick={onClick}
            className={`${VARIANT_STYLES[variant]} ${PADDING_STYLES[padding]} ${className}`}
        >
            {children}
        </Component>
    );
}
