"use client";

import { useState } from "react";

import { Check, ChevronDown } from "lucide-react";

import Button from "./Button";

/** Attributes for a single option in the select menu. */
export interface SelectOption<T> {
    /** The raw value of the option. */
    value: T;
    /** The human-readable label to display. */
    label: string;
    /** Optional icon component to display next to the label. */
    icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    /** Optional theme color for the icon. */
    color?: string;
}

/** Attributes for rendering a Select component. */
interface CustomSelectProps<T> {
    /** The currently selected value. */
    value: T;
    /** Array of available options. */
    options: SelectOption<T>[];
    /** Triggered when a new option is selected. */
    onChange: (value: T) => void;
    /** Optional triggered when a "remove" or "clear" action is requested. */
    onRemove?: () => void;
    /** Label for the removal action (default: "Remove"). */
    removeLabel?: string;
    /** Whether the select is non-interactive. */
    disabled?: boolean;
    /** Visual theme hex code for active state indicators. */
    themeHex?: string;
    /** Menu alignment relative to the trigger. */
    align?: "left" | "right";
    /** Visual density of the select trigger. */
    variant?: "full" | "compact";
    /** Additional CSS classes for the container. */
    className?: string;
}

/**
 * Premium custom dropdown selection component.
 *
 * @remarks
 * Provides a highly customizable alternative to native select elements.
 * Supports icons, thematic coloring, and different density variants.
 *
 * @example
 * <Select
 *   value={theme}
 *   options={[{ value: 'dark', label: 'Dark Mode', icon: Moon }]}
 *   onChange={setTheme}
 * />
 */
const Select = <T extends string | number>({
    value,
    options,
    onChange,
    onRemove,
    removeLabel = "Remove",
    disabled,
    themeHex = "#1cb0f6",
    align = "right",
    variant = "full",
    className = "",
}: CustomSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const isCompact = variant === "compact";

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={`relative ${className}`}>
            <Button
                variant="ghost"
                className={
                    isCompact
                        ? "!flex !items-center !gap-1 !rounded-lg !px-2 !py-1 !text-sm !font-bold !text-gray-500 shadow-none transition-colors hover:bg-gray-200 hover:shadow-none"
                        : "!flex !h-12 !items-center !gap-2 !rounded-xl border-2 border-gray-200 bg-gray-50 !px-4 !text-sm !font-bold !text-[#3c3c3c] shadow-none transition-colors hover:bg-gray-100 hover:shadow-none"
                }
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
            >
                {selectedOption?.icon && (
                    <selectedOption.icon
                        size={isCompact ? 14 : 16}
                        className="shrink-0"
                        style={selectedOption.color ? { color: selectedOption.color } : undefined}
                    />
                )}
                <span className="capitalize">{selectedOption?.label || value}</span>
                <ChevronDown
                    size={isCompact ? 14 : 16}
                    className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div
                        className={`animate-in fade-in zoom-in-95 absolute top-full ${align === "right" ? "right-0" : "left-0"} z-50 mt-1 w-max min-w-[120px] overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg`}
                    >
                        {options.map((opt) => (
                            <Button
                                key={opt.value}
                                variant="ghost"
                                className={`!flex !w-full !items-center !justify-between !gap-4 ${isCompact ? "!p-3 !text-sm" : "!p-4"} !text-left !font-bold !text-[#3c3c3c] capitalize shadow-none hover:bg-gray-50 hover:shadow-none active:translate-y-0`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {opt.icon && (
                                        <opt.icon
                                            size={isCompact ? 14 : 16}
                                            style={opt.color ? { color: opt.color } : undefined}
                                        />
                                    )}
                                    {opt.label}
                                </div>
                                {value === opt.value && (
                                    <Check style={{ color: themeHex }} size={isCompact ? 14 : 16} />
                                )}
                            </Button>
                        ))}
                        {onRemove && (
                            <>
                                <div className="my-1 h-0.5 w-full bg-gray-100" />
                                <Button
                                    variant="ghost"
                                    className={`!flex !w-full !items-center !justify-between ${isCompact ? "!p-3 !text-sm" : "!p-4"} !text-left !font-bold !text-red-500 shadow-none hover:bg-red-50 hover:shadow-none active:translate-y-0`}
                                    onClick={() => {
                                        onRemove();
                                        setIsOpen(false);
                                    }}
                                >
                                    {removeLabel}
                                </Button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Select;
