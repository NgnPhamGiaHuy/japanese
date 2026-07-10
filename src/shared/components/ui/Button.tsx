"use client";

import { motion } from "framer-motion";
import { Loader2, LucideIcon } from "lucide-react";

import { cn } from "@/shared/utils";

/** Supported Japanese alphabet modes for thematic styling. */
type AlphabetMode = "hiragana" | "katakana" | "both";

/** Predefined theme color names or custom hex strings. */
type ThemeColor =
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "red"
    | "gray"
    | "teal"
    | "pink"
    | (string & {});

/** Visual variants for different action hierarchies. */
type Variant = "primary" | "secondary" | "outline" | "ghost";

/** Button footprint: "md" for labeled buttons, "icon" for a square icon-only button, "icon-sm" for a denser icon-only button (compact table rows/nav bars). */
type Size = "md" | "icon" | "icon-sm";

const ALPHABET_MAP: Record<AlphabetMode, ThemeColor> = {
    hiragana: "green",
    katakana: "blue",
    both: "purple",
};

const THEMES: Record<string, { bg: string; border: string; hover: string; text: string }> = {
    blue: {
        bg: "bg-katakana",
        border: "border-katakana-strong",
        hover: "hover:bg-katakana-hover",
        text: "text-katakana",
    },
    green: {
        bg: "bg-hiragana",
        border: "border-hiragana-strong",
        hover: "hover:bg-hiragana-hover",
        text: "text-hiragana",
    },
    purple: {
        bg: "bg-both",
        border: "border-both-strong",
        hover: "hover:bg-both-strong",
        text: "text-both",
    },
    orange: {
        bg: "bg-survival",
        border: "border-survival-strong",
        hover: "hover:bg-survival-hover",
        text: "text-survival",
    },
    red: {
        bg: "bg-danger",
        border: "border-danger-strong",
        hover: "hover:bg-danger-hover",
        text: "text-danger",
    },
    gray: {
        bg: "bg-muted",
        border: "border-muted-strong",
        hover: "hover:bg-muted-hover",
        text: "text-muted",
    },
    teal: {
        bg: "bg-teal",
        border: "border-teal-strong",
        hover: "hover:bg-teal-hover",
        text: "text-teal",
    },
    pink: {
        bg: "bg-pink",
        border: "border-pink-strong",
        hover: "hover:bg-pink-hover",
        text: "text-pink",
    },
};

/** Attributes for rendering a Button component. */
interface ButtonProps {
    /** Button content or label. */
    children?: React.ReactNode;
    /** Triggered when the button is clicked. */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** Visual style variant. */
    variant?: Variant;
    /** Button footprint. Use "icon" for a square icon-only button instead of ad hoc padding overrides. */
    size?: Size;
    /** Theme color name or custom hex code. */
    color?: ThemeColor;
    /** Preset color based on Japanese alphabet mode. */
    alphabet?: AlphabetMode;
    /** Additional CSS classes for the button container. */
    className?: string;
    /** Optional icon to display before the label. */
    icon?: LucideIcon;
    /** Size of the icon in pixels. */
    iconSize?: number;
    /** Additional CSS classes for the icon element. */
    iconClassName?: string;
    /** Whether the button is non-interactive. */
    disabled?: boolean;
    /** Whether to show a loading spinner and disable interaction. */
    loading?: boolean;
    /** Whether the button is visually active (useful for toggles). */
    active?: boolean;
    /** HTML button type. */
    type?: "button" | "submit";
    /** Triggered on mouse enter. */
    onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** Triggered on mouse leave. */
    onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** Optional badge content to display after the label. */
    badge?: React.ReactNode;
    /** HTML id attribute. */
    id?: string;
    /** HTML title attribute for tooltips. */
    title?: string;
    /** Accessible name for icon-only buttons with no visible text label. */
    "aria-label"?: string;
    /** ARIA role override — use `"switch"` for on/off toggles rendered as buttons. */
    role?: React.AriaRole;
    /** On/off state for `role="switch"` toggles. */
    "aria-checked"?: boolean;
    /** Pressed state for toggle buttons that are not switches. */
    "aria-pressed"?: boolean;
    /** Inline CSS styles. */
    style?: React.CSSProperties;
}

/**
 * Premium interactive button component.
 *
 * @remarks
 * Implements a premium Duolingo-style 3D button with spring animations
 * and glassmorphism support. Supports multiple themes, variants, and loading states.
 *
 * @example
 * <Button variant="primary" color="green" onClick={() => startLesson()}>
 *   Start Lesson
 * </Button>
 */
const Button = ({
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    variant = "primary",
    size = "md",
    color = "blue",
    alphabet,
    className = "",
    icon: Icon,
    iconSize = 20,
    iconClassName = "",
    disabled,
    loading,
    active,
    type = "button",
    id,
    title,
    "aria-label": ariaLabel,
    role,
    "aria-checked": ariaChecked,
    "aria-pressed": ariaPressed,
    style,
    badge,
}: ButtonProps) => {
    const resolvedColor = alphabet ? ALPHABET_MAP[alphabet] : color;
    const isStandardTheme = typeof resolvedColor === "string" && THEMES[resolvedColor as string];
    const t = isStandardTheme ? THEMES[resolvedColor as string] : THEMES.blue;

    const base =
        "flex items-center justify-center gap-2 rounded-2xl font-extrabold transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-katakana focus-visible:ring-offset-2";

    const sizes: Record<Size, string> = {
        md: "px-4 py-3 md:px-6 md:py-4",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-9 w-9 p-0",
    };

    const variants: Record<Variant, string> = {
        primary: `${isStandardTheme ? t.bg : ""} text-white border-b-4 ${isStandardTheme ? t.border : ""} ${isStandardTheme ? t.hover : ""} hover:-translate-y-1 hover:shadow-lg active:border-b-0 active:translate-y-[4px]`,
        secondary: `bg-white ${isStandardTheme ? t.text : ""} border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 hover:shadow-md active:border-b-2 active:translate-y-[2px]`,
        outline: `bg-transparent text-gray-500 border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 active:border-b-2 active:translate-y-[2px]`,
        ghost: `text-gray-500 hover:text-text hover:bg-gray-100 active:bg-gray-200 rounded-xl`,
    };

    // Forced active state for toggle buttons or tabs
    const activeClass = active ? "ring-2 ring-offset-2 ring-[var(--theme-color)]" : "";

    // If it's a custom hex color and primary/secondary variant, handle via style
    const customStyle: React.CSSProperties = { ...style };
    if (!isStandardTheme && typeof resolvedColor === "string") {
        if (variant === "primary") {
            customStyle.backgroundColor = resolvedColor;
            customStyle.borderBottomColor = `${resolvedColor}CC`; // 80% opacity for border
        } else if (variant === "secondary" || variant === "ghost") {
            customStyle.color = resolvedColor;
        }
    }

    return (
        <motion.button
            whileHover={disabled || loading ? {} : { scale: variant === "ghost" ? 1.05 : 1.02 }}
            whileTap={disabled || loading ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            id={id}
            title={title}
            aria-label={ariaLabel}
            role={role}
            aria-checked={ariaChecked}
            aria-pressed={ariaPressed}
            type={type}
            onClick={(e: any) => !loading && onClick?.(e)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            disabled={disabled || loading}
            className={cn(base, sizes[size], variants[variant], activeClass, className)}
            style={customStyle}
        >
            {loading ? (
                <Loader2 size={iconSize} className="animate-spin" />
            ) : Icon ? (
                <Icon size={iconSize} strokeWidth={2.5} className={iconClassName} />
            ) : null}
            {children}
            {badge && <div className="ml-2">{badge}</div>}
        </motion.button>
    );
};

export default Button;
