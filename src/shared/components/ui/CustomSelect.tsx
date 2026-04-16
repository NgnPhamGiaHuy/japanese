"use client";

import { useState } from "react";

import { Check, ChevronDown } from "lucide-react";

import Button from "./Button";

export interface SelectOption<T> {
    value: T;
    label: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface CustomSelectProps<T> {
    value: T;
    options: SelectOption<T>[];
    onChange: (value: T) => void;
    onRemove?: () => void;
    removeLabel?: string;
    disabled?: boolean;
    themeHex?: string;
    align?: "left" | "right";
    variant?: "full" | "compact";
    className?: string;
}

const CustomSelect = <T extends string | number>({
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
                    <selectedOption.icon size={isCompact ? 14 : 16} className="shrink-0" />
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
                                    {opt.icon && <opt.icon size={isCompact ? 14 : 16} />}
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

export default CustomSelect;
