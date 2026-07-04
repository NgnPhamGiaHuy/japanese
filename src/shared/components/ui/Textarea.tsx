"use client";

import { cn } from "@/shared/utils";

import type { TextareaHTMLAttributes } from "react";

/** Attributes for rendering a Textarea component. */
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Shared multi-line text field, styled to match Input's default variant.
 *
 * @example
 * <Textarea placeholder="Description" value={value} onChange={...} rows={4} />
 */
const Textarea = ({ className = "", ...props }: TextareaProps) => {
    return (
        <textarea
            {...props}
            className={cn(
                "w-full rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 text-sm font-black text-[#3c3c3c] outline-none transition-all placeholder:font-bold placeholder:text-muted",
                "focus:border-[var(--theme-color,var(--color-katakana))] focus:ring-4 focus:ring-katakana/5",
                className,
            )}
        />
    );
};

export default Textarea;
