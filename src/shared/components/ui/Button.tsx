"use client";

import { motion } from "framer-motion";

import type { LucideIcon } from "lucide-react";

type AlphabetMode = "hiragana" | "katakana" | "both";
type ThemeColor = "blue" | "green" | "purple" | "orange" | "red" | "gray" | "teal" | "pink";
type Variant = "primary" | "secondary" | "outline" | "ghost";

const ALPHABET_MAP: Record<AlphabetMode, ThemeColor> = {
    hiragana: "green",
    katakana: "blue",
    both: "purple",
};

const THEMES: Record<ThemeColor, { bg: string; border: string; hover: string; text: string }> = {
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

interface ButtonProps {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: Variant;
    color?: ThemeColor;
    alphabet?: AlphabetMode;
    className?: string;
    icon?: LucideIcon;
    disabled?: boolean;
    type?: "button" | "submit";
    id?: string;
}

const Button = ({
    children,
    onClick,
    variant = "primary",
    color = "blue",
    alphabet,
    className = "",
    icon: Icon,
    disabled,
    type = "button",
    id,
}: ButtonProps) => {
    const resolvedColor = alphabet ? ALPHABET_MAP[alphabet] : color;
    const t = THEMES[resolvedColor];

    const base =
        "flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 rounded-[1rem] md:rounded-2xl font-extrabold transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<Variant, string> = {
        primary: `${t.bg} text-white border-b-4 ${t.border} ${t.hover} hover:-translate-y-1 hover:shadow-lg active:border-b-0 active:translate-y-[4px]`,
        secondary: `bg-white ${t.text} border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 hover:shadow-md active:border-b-2 active:translate-y-[2px]`,
        outline: `bg-transparent text-gray-500 border-2 border-b-4 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-1 active:border-b-2 active:translate-y-[2px]`,
        ghost: `text-gray-500 hover:text-[#3c3c3c] hover:bg-gray-100 active:bg-gray-200 rounded-xl`,
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            id={id}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon size={20} strokeWidth={2.5} />}
            {children}
        </motion.button>
    );
};

export default Button;
