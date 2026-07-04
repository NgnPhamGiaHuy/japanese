"use client";

/**
 * Reusable card container component.
 *
 * @remarks
 * Base card component with consistent styling across the app.
 * Supports different variants and sizes.
 *
 * @example
 * <Card variant="elevated" padding="lg">
 *   <h3>Card Content</h3>
 * </Card>
 */
import { cn } from "@/shared/utils";

import type { ReactNode } from "react";

/** Attributes for rendering a Card component. */
interface CardProps {
    /** The content to be displayed inside the card. */
    children: ReactNode;
    /** Visual theme variant determining borders and shadows. */
    variant?: "default" | "elevated" | "flat" | "dashboard";
    /** Predefined padding size for the card interior. "compact" matches the app's other interactive cards (ActionCard, ModeSelectionCard, Alert). */
    padding?: "none" | "sm" | "compact" | "md" | "lg";
    /** Applies the standard hover-lift/press treatment for clickable cards. */
    interactive?: boolean;
    /** Additional CSS classes. */
    className?: string;
    /** Optional click handler. If provided, the card renders as a button. */
    onClick?: () => void;
}

const VARIANT_STYLES = {
    default: "rounded-3xl border-2 border-b-4 border-gray-200 bg-white shadow-sm transition-all",
    elevated: "rounded-3xl border-2 border-gray-200 bg-white shadow-md transition-all",
    flat: "rounded-3xl border-2 border-gray-200 bg-white transition-all",
    dashboard:
        "rounded-5xl bg-white shadow-sm transition-all hover:shadow-md border-2 border-gray-100/50",
};

const PADDING_STYLES = {
    none: "",
    sm: "p-4",
    compact: "p-5",
    md: "p-6",
    lg: "p-8",
};

const INTERACTIVE_STYLES =
    "duration-200 hover:-translate-y-1 hover:shadow-md active:translate-y-[2px] active:border-b-2";

const Card = ({
    children,
    variant = "default",
    padding = "md",
    interactive = false,
    className = "",
    onClick,
}: CardProps) => {
    const Component = onClick ? "button" : "div";

    return (
        <Component
            onClick={onClick}
            className={cn(
                VARIANT_STYLES[variant],
                interactive && INTERACTIVE_STYLES,
                PADDING_STYLES[padding],
                className,
            )}
        >
            {children}
        </Component>
    );
};

export default Card;
