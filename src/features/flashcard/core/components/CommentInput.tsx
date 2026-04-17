/**
 * @file CommentInput
 * Reusable text entry component for comments and replies.
 * Supports auto-expanding textareas and keyboard shortcuts.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { CornerDownLeft, X } from "lucide-react";

import { Button } from "@/shared/components/ui";

export interface CommentInputProps {
    /** Prompt text when empty */
    placeholder: string;
    /** Resolved value when submitted */
    onSubmit: (content: string) => Promise<void>;
    /** Optional cancel handler for inline editors (e.g. Esc key) */
    onCancel?: () => void;
    /** Initial value for editing scenarios */
    initialValue?: string;
    /** Deck-specific branding color */
    themeColor: string;
    /** Hard limit for length enforcement */
    maxLength?: number;
    /** Compact mode for inline reply/edit — smaller textarea */
    compact?: boolean;
}

const CommentInput = ({
    placeholder,
    onSubmit,
    onCancel,
    initialValue = "",
    themeColor,
    maxLength = 2000,
    compact = false,
}: CommentInputProps) => {
    const [content, setContent] = useState(initialValue);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [content]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void handleSubmit();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel?.();
        }
    };

    const handleSubmit = async () => {
        const trimmed = content.trim();
        if (!trimmed || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(trimmed);
            setContent("");
        } catch {
            // error handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const remaining = maxLength - content.length;
    const isOver = remaining < 0;
    const isWarn = remaining < 100 && !isOver;
    const isEmpty = !content.trim();

    return (
        <div className="flex flex-col gap-1.5">
            <div
                className="relative rounded-xl border-2 bg-white transition-colors"
                style={{ borderColor: isOver ? "#ff4b4b" : content ? themeColor : "#e5e7eb" }}
            >
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isSubmitting}
                    rows={compact ? 2 : 3}
                    className="w-full resize-none rounded-xl bg-transparent px-3 py-2.5 text-sm font-medium text-[#3c3c3c] outline-none placeholder:text-gray-400 disabled:opacity-50"
                    style={{ minHeight: compact ? 56 : 72, maxHeight: 160 }}
                />

                {/* Bottom bar inside textarea container */}
                <div className="flex items-center justify-between border-t border-gray-100 px-3 py-1.5">
                    <span
                        className={`text-[11px] font-bold tabular-nums ${
                            isOver ? "text-[#ff4b4b]" : isWarn ? "text-[#ffc800]" : "text-gray-300"
                        }`}
                    >
                        {remaining}
                    </span>

                    <div className="flex items-center gap-1">
                        {onCancel && (
                            <Button
                                variant="ghost"
                                onClick={onCancel}
                                disabled={isSubmitting}
                                className="!h-7 !w-7 opacity-40 hover:opacity-100"
                                icon={X}
                            />
                        )}
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isEmpty || isOver || isSubmitting}
                            className="!h-7 !px-2.5 !text-[11px] shadow-none hover:shadow-none active:translate-y-0"
                            style={{
                                backgroundColor: isEmpty || isOver ? "#d1d5db" : themeColor,
                                borderBottomColor: isEmpty || isOver ? "#9ca3af" : themeColor,
                                borderBottomWidth: 0,
                                transform: "none",
                            }}
                            icon={isSubmitting ? undefined : CornerDownLeft}
                        >
                            {isSubmitting ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : null}
                            {isSubmitting ? "Sending" : "Send"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentInput;
