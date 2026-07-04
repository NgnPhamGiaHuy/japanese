"use client";

import { cn } from "@/shared/utils";

import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes } from "react";

/** Visual treatment: "default" is a bordered field for forms/search/filters, "underline" is a borderless, larger inline title-style field. */
type InputVariant = "default" | "underline";

/** Attributes for rendering an Input component. */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    /** Visual treatment. */
    variant?: InputVariant;
    /** Optional leading icon (default variant only). */
    icon?: LucideIcon;
    /** Size of the icon in pixels. */
    iconSize?: number;
    /** Classes for the wrapper div (default variant only, e.g. to control width). */
    containerClassName?: string;
}

/**
 * Shared text input.
 *
 * @remarks
 * Reads an ambient `--theme-color` CSS variable for its focus border when one is set by
 * an ancestor (the same convention Button's `active` ring and deck-themed pages already
 * use), falling back to the katakana token otherwise.
 *
 * @example
 * <Input icon={Search} placeholder="Search..." value={value} onChange={...} />
 */
const Input = ({
    variant = "default",
    icon: Icon,
    iconSize = 18,
    className = "",
    containerClassName = "",
    ...props
}: InputProps) => {
    if (variant === "underline") {
        return (
            <input
                {...props}
                className={cn(
                    "text-text w-full border-b-2 border-transparent bg-transparent pb-2 font-black transition-colors outline-none placeholder:text-gray-300",
                    "focus:border-[var(--theme-color,var(--color-katakana))]",
                    className,
                )}
            />
        );
    }

    return (
        <div className={cn("relative", containerClassName)}>
            {Icon && (
                <Icon
                    className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
                    size={iconSize}
                />
            )}
            <input
                {...props}
                className={cn(
                    "placeholder:text-muted text-text h-12 w-full rounded-2xl border-2 border-gray-100 bg-white text-sm font-black transition-all outline-none placeholder:font-bold",
                    "focus:ring-katakana/5 focus:border-[var(--theme-color,var(--color-katakana))] focus:ring-4",
                    Icon ? "pr-4 pl-11" : "px-4",
                    className,
                )}
            />
        </div>
    );
};

export default Input;
