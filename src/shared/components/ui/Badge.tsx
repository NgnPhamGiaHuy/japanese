/**
 * Versatile badge component for status, tags, or counts.
 *
 * @remarks
 * Supports multiple variants, sizes, and optional icons or status dots.
 *
 * @example
 * <Badge variant="success" dot>Active</Badge>
 */
import { LucideIcon } from "lucide-react";

import type { ReactNode } from "react";

/** Visual theme variant — exported so callers building variant lookup tables
 *  (e.g. per-log-level/type color registries) can type against it instead
 *  of re-declaring this same union. */
export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

/** Attributes for rendering a Badge. */
interface BadgeProps {
    /** The content to be displayed within the badge. */
    children: ReactNode;
    /** Visual theme variant. */
    variant?: BadgeVariant;
    /** Predefined size constraint. */
    size?: "sm" | "md" | "lg";
    /** Additional CSS classes. */
    className?: string;
    /** Optional icon to display before children. */
    icon?: LucideIcon;
    /** Whether to display a status dot. */
    dot?: boolean;
}

const VARIANT_STYLES = {
    default: "bg-gray-100 text-gray-600",
    primary: "bg-both text-white",
    success: "bg-hiragana text-white",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-danger-bg text-danger",
    info: "bg-katakana/10 text-katakana",
};

const SIZE_STYLES = {
    sm: "h-4 min-w-4 px-1 text-xs",
    md: "h-5 min-w-5 px-1.5 text-xs",
    lg: "h-6 min-w-6 px-2 text-xs",
};

const Badge = ({
    children,
    variant = "default",
    size = "md",
    className = "",
    icon: Icon,
    dot,
}: BadgeProps) => {
    return (
        <span
            className={`inline-flex items-center justify-center gap-1 overflow-hidden rounded-full font-black ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
        >
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
            {Icon && <Icon size={size === "sm" ? 10 : size === "lg" ? 14 : 12} />}
            {children}
        </span>
    );
};

export default Badge;
