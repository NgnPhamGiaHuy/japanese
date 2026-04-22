"use client";

import { motion } from "framer-motion";
import { Loader2, LucideIcon } from "lucide-react";

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

const ALPHABET_MAP: Record<AlphabetMode, ThemeColor> = {
    hiragana: "green",
    katakana: "blue",
    both: "purple",
};

const THEMES: Record<string, { bg: string; border: string; hover: string; text: string }> = {
    blue: {
        bg: "bg-[#1cb0f6]",
        border: "border-[#1899d6]",
        hover: "hover:bg-[#149fdf]",
        text: "text-[#1cb0f6]",
    },
    green: {
        bg: "bg-[#58cc02]",
        border: "border-[#58a700]",
        hover: "hover:bg-[#46a302]",
        text: "text-[#58cc02]",
    },
    purple: {
        bg: "bg-[#ce82ff]",
        border: "border-[#b65ce8]",
        hover: "hover:bg-[#b65ce8]",
        text: "text-[#ce82ff]",
    },
    orange: {
        bg: "bg-[#ff9600]",
        border: "border-[#cc7800]",
        hover: "hover:bg-[#e68700]",
        text: "text-[#ff9600]",
    },
    red: {
        bg: "bg-[#ea2b2b]",
        border: "border-[#b82222]",
        hover: "hover:bg-[#d92626]",
        text: "text-[#ea2b2b]",
    },
    gray: {
        bg: "bg-[#afafaf]",
        border: "border-[#8f8f8f]",
        hover: "hover:bg-[#9f9f9f]",
        text: "text-[#afafaf]",
    },
    teal: {
        bg: "bg-[#00d1e0]",
        border: "border-[#00a8b5]",
        hover: "hover:bg-[#00b8ca]",
        text: "text-[#00d1e0]",
    },
    pink: {
        bg: "bg-[#ff66bb]",
        border: "border-[#e056a4]",
        hover: "hover:bg-[#ff88cc]",
        text: "text-[#ff66bb]",
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
    style,
    badge,
}: ButtonProps) => {
    const resolvedColor = alphabet ? ALPHABET_MAP[alphabet] : color;
    const isStandardTheme = typeof resolvedColor === "string" && THEMES[resolvedColor as string];
    const t = isStandardTheme ? THEMES[resolvedColor as string] : THEMES.blue;

    const base =
        "flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-[1rem] md:rounded-2xl font-extrabold transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<Variant, string> = {
        primary: `${isStandardTheme ? t.bg : ""} text-white border-b-4 ${isStandardTheme ? t.border : ""} ${isStandardTheme ? t.hover : ""} hover:-translate-y-1 hover:shadow-lg active:border-b-0 active:translate-y-[4px]`,
        secondary: `bg-white ${isStandardTheme ? t.text : ""} border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 hover:shadow-md active:border-b-2 active:translate-y-[2px]`,
        outline: `bg-transparent text-gray-500 border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 active:border-b-2 active:translate-y-[2px]`,
        ghost: `text-gray-500 hover:text-[#3c3c3c] hover:bg-gray-100 active:bg-gray-200 rounded-xl`,
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
            type={type}
            onClick={(e: any) => !loading && onClick?.(e)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            disabled={disabled || loading}
            className={`${base} ${variants[variant]} ${activeClass} ${className}`}
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
