"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";

import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import Button from "./Button";

import "react-day-picker/style.css";

/** Attributes for rendering a DatePicker component. */
interface CustomDatePickerProps {
    /** The currently selected ISO date string (YYYY-MM-DD). */
    value?: string;
    /** Triggered when a new date is selected or cleared. */
    onChange: (value?: string) => void;
    /** Text to display when no date is selected. */
    placeholder?: string;
    /** Optional field label displayed above the input. */
    label?: string;
    /** Additional CSS classes for the container. */
    className?: string;
    /** Whether the input is non-interactive. */
    disabled?: boolean;
}

/**
 * Premium date selection component.
 *
 * @remarks
 * Features a custom calendar dropdown with smooth animations.
 * Handles timezone-safe ISO date strings and provides clear visual feedback.
 *
 * @example
 * <DatePicker
 *   label="Birth Date"
 *   value={birthDate}
 *   onChange={setBirthDate}
 * />
 */
const DatePicker = ({
    value,
    onChange,
    placeholder = "MM/DD/YYYY",
    label,
    className = "",
    disabled = false,
}: CustomDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // parseISO (unlike `new Date("YYYY-MM-DD")`) parses the date part as
    // local midnight, not UTC — avoids the classic off-by-one-day bug when
    // the local timezone is behind UTC.
    const selectedDate = useMemo(() => (value ? parseISO(value) : undefined), [value]);

    const handleDateSelect = (date: Date | undefined) => {
        onChange(date ? format(date, "yyyy-MM-dd") : undefined);
        setIsOpen(false);
    };

    const displayValue = useMemo(() => {
        if (!selectedDate) return placeholder;
        return selectedDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    }, [selectedDate, placeholder]);

    return (
        <div className={`relative flex flex-col gap-1.5 ${className}`}>
            {label && (
                <span className="text-muted pl-1 text-xs font-black tracking-widest uppercase">
                    {label}
                </span>
            )}
            <div className="group relative">
                <Button
                    variant="ghost"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="!text-text !flex !h-12 !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-gray-100 bg-gray-50/50 !px-4 !text-sm !font-black shadow-none transition-all hover:border-gray-200 hover:bg-white"
                >
                    <CalendarIcon
                        className={clsx(
                            "text-gray-400 transition-colors",
                            isOpen ? "text-katakana" : "group-hover:text-katakana",
                        )}
                        size={16}
                    />
                    <span className={clsx(!value && "text-muted font-bold")}>{displayValue}</span>
                </Button>

                {value && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(undefined);
                        }}
                        className="hover:text-danger focus-visible:ring-katakana absolute top-1/2 right-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        title="Clear date"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <m.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-4xl border-2 border-gray-100 bg-white p-4 shadow-2xl"
                        >
                            <DayPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                defaultMonth={selectedDate ?? new Date()}
                                showOutsideDays
                                components={{
                                    Chevron: ({ orientation }) =>
                                        orientation === "left" ? (
                                            <ChevronLeft size={18} />
                                        ) : (
                                            <ChevronRight size={18} />
                                        ),
                                }}
                                classNames={{
                                    root: "text-text",
                                    month_caption:
                                        "flex items-center justify-center pb-4 text-sm font-black",
                                    nav: "flex items-center justify-between absolute inset-x-0 top-0 px-1",
                                    button_previous:
                                        "hover:text-katakana focus-visible:ring-katakana flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                    button_next:
                                        "hover:text-katakana focus-visible:ring-katakana flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                    weekdays: "flex",
                                    weekday:
                                        "text-muted flex-1 text-center text-xs font-black tracking-widest uppercase",
                                    week: "mt-1 flex w-full",
                                    day: "flex-1 p-0.5",
                                    day_button:
                                        "focus-visible:ring-katakana flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-text hover:text-katakana hover:bg-gray-50",
                                    today: "[&>button]:text-katakana [&>button]:bg-gray-100",
                                    selected:
                                        "[&>button]:bg-katakana [&>button]:text-white [&>button]:shadow-lg [&>button]:shadow-[#1cb0f6]/20 [&>button]:hover:text-white",
                                    outside: "[&>button]:text-gray-300",
                                    disabled:
                                        "[&>button]:opacity-30 [&>button]:pointer-events-none",
                                }}
                            />
                        </m.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DatePicker;
