"use client";

import { cn } from "@/shared/utils";

import type { TextareaHTMLAttributes } from "react";

/** Visual treatment: "default" is a bordered box matching Input's default variant, "underline" is a borderless, muted inline field. */
type TextareaVariant = "default" | "underline";

/** Attributes for rendering a Textarea component. */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Visual treatment. */
    variant?: TextareaVariant;
}

/**
 * Shared multi-line text field, styled to match Input's variants.
 *
 * @example
 * <Textarea placeholder="Description" value={value} onChange={...} rows={4} />
 */
const Textarea = ({ variant = "default", className = "", ...props }: TextareaProps) => {
    if (variant === "underline") {
        return (
            <textarea
                {...props}
                className={cn(
                    "w-full resize-none border-b-2 border-transparent bg-transparent font-bold text-muted transition-colors outline-none placeholder:text-gray-300",
                    "focus:border-[var(--theme-color,var(--color-katakana))]",
                    className,
                )}
            />
        );
    }

    return (
        <textarea
            {...props}
            className={cn(
                "placeholder:text-muted w-full rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 text-sm font-black text-text transition-all outline-none placeholder:font-bold",
                "focus:ring-katakana/5 focus:border-[var(--theme-color,var(--color-katakana))] focus:ring-4",
                className,
            )}
        />
    );
};

export default Textarea;
