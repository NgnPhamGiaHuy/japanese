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
    variant?: "default" | "elevated" | "flat";
    padding?: "none" | "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
}

const VARIANT_STYLES = {
    default: "rounded-3xl border-2 border-b-4 border-gray-200 bg-white shadow-sm",
    elevated: "rounded-3xl border-2 border-gray-200 bg-white shadow-md",
    flat: "rounded-3xl border-2 border-gray-200 bg-white",
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
