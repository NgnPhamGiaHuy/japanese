"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
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

/** Sentinel item value for the "remove" action, so it stays a real (keyboard-navigable,
 * typeahead-able) listbox item instead of a plain button mixed into the popup — while
 * staying invisible to the public onChange/onRemove contract. Module-level so it's a
 * stable reference across renders (item-selection equality is reference-based). */
const REMOVE_SENTINEL = Symbol("select-remove");

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
    const isCompact = variant === "compact";
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <BaseSelect.Root<T | typeof REMOVE_SENTINEL>
            value={value}
            onValueChange={(newValue) => {
                if (newValue === REMOVE_SENTINEL) {
                    onRemove?.();
                    return;
                }
                if (newValue !== null) onChange(newValue as T);
            }}
            disabled={disabled}
        >
            <BaseSelect.Trigger
                className={className}
                render={
                    <Button
                        variant="plain"
                        size="auto"
                        className={`group ${
                            isCompact
                                ? "flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-gray-500 shadow-none transition-colors hover:bg-gray-200 hover:shadow-none"
                                : "text-text flex h-12 items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-sm font-bold shadow-none transition-colors hover:bg-gray-100 hover:shadow-none"
                        }`}
                    />
                }
            >
                {selectedOption?.icon && (
                    <selectedOption.icon
                        size={isCompact ? 14 : 16}
                        className="shrink-0"
                        style={selectedOption.color ? { color: selectedOption.color } : undefined}
                    />
                )}
                <span className="capitalize">{selectedOption?.label || value}</span>
                <BaseSelect.Icon>
                    <ChevronDown
                        size={isCompact ? 14 : 16}
                        className="text-gray-400 transition-transform group-data-[popup-open]:rotate-180"
                    />
                </BaseSelect.Icon>
            </BaseSelect.Trigger>

            <BaseSelect.Portal>
                <BaseSelect.Positioner
                    side="bottom"
                    align={align === "right" ? "end" : "start"}
                    sideOffset={4}
                    className="z-50"
                >
                    <BaseSelect.Popup className="fade-in zoom-in-95 data-[ending-style]:fade-out data-[ending-style]:zoom-out-95 w-max min-w-[120px] overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-lg transition-[opacity,transform] duration-150 outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
                        {options.map((opt) => (
                            <BaseSelect.Item
                                key={opt.value}
                                value={opt.value}
                                className={`flex w-full cursor-pointer items-center justify-between gap-4 ${isCompact ? "p-3 text-sm" : "p-4"} text-text text-left font-bold capitalize outline-none select-none hover:bg-gray-50 data-[highlighted]:bg-gray-50`}
                            >
                                <div className="flex items-center gap-2">
                                    {opt.icon && (
                                        <opt.icon
                                            size={isCompact ? 14 : 16}
                                            style={opt.color ? { color: opt.color } : undefined}
                                        />
                                    )}
                                    <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
                                </div>
                                <BaseSelect.ItemIndicator>
                                    <Check style={{ color: themeHex }} size={isCompact ? 14 : 16} />
                                </BaseSelect.ItemIndicator>
                            </BaseSelect.Item>
                        ))}
                        {onRemove && (
                            <>
                                <BaseSelect.Separator className="my-1 h-0.5 w-full bg-gray-100" />
                                <BaseSelect.Item
                                    value={REMOVE_SENTINEL}
                                    className={`flex w-full cursor-pointer items-center justify-between ${isCompact ? "p-3 text-sm" : "p-4"} text-left font-bold text-red-500 outline-none select-none hover:bg-red-50 data-[highlighted]:bg-red-50`}
                                >
                                    <BaseSelect.ItemText>{removeLabel}</BaseSelect.ItemText>
                                </BaseSelect.Item>
                            </>
                        )}
                    </BaseSelect.Popup>
                </BaseSelect.Positioner>
            </BaseSelect.Portal>
        </BaseSelect.Root>
    );
};

export default Select;
