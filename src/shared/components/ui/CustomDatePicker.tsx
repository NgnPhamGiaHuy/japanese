"use client";

import { useMemo, useState } from "react";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

import Button from "./Button";

interface CustomDatePickerProps {
    value?: string;
    onChange: (value?: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
}

const CustomDatePicker = ({
    value,
    onChange,
    placeholder = "MM/DD/YYYY",
    label,
    className = "",
    disabled = false,
}: CustomDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => (value ? new Date(value) : new Date()));

    const selectedDate = useMemo(() => (value ? new Date(value) : null), [value]);

    const daysInMonth = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();

        const arr = [];
        // Fill empty days for previous month
        for (let i = 0; i < firstDay; i++) arr.push(null);
        // Fill current month days
        for (let i = 1; i <= days; i++) arr.push(new Date(year, month, i));
        return arr;
    }, [viewDate]);

    const handleMonthChange = (offset: number) => {
        const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(next);
    };

    const handleDateSelect = (date: Date) => {
        // Offset for timezone to keep it as ISO string date part
        const iso = date.toISOString().split("T")[0];
        onChange(iso);
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
                <span className="pl-1 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    {label}
                </span>
            )}
            <div className="group relative">
                <Button
                    variant="ghost"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="!flex !h-12 !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-gray-100 bg-gray-50/50 !px-4 !text-sm !font-black !text-[#3c3c3c] shadow-none transition-all hover:border-gray-200 hover:bg-white"
                >
                    <CalendarIcon
                        className={clsx(
                            "text-gray-400 transition-colors",
                            isOpen ? "text-[#1cb0f6]" : "group-hover:text-[#1cb0f6]",
                        )}
                        size={16}
                    />
                    <span className={clsx(!value && "font-bold text-[#afafaf]")}>
                        {displayValue}
                    </span>
                </Button>

                {value && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(undefined);
                        }}
                        className="absolute top-1/2 right-3 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-red-50 hover:text-[#ea2b2b]"
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
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-[2rem] border-2 border-gray-100 bg-white p-4 shadow-2xl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-sm font-black text-[#3c3c3c]">
                                    {viewDate.toLocaleDateString(undefined, {
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleMonthChange(-1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#1cb0f6]"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleMonthChange(1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#1cb0f6]"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                    <span
                                        key={i}
                                        className="text-center text-[10px] font-black tracking-widest text-[#afafaf] uppercase"
                                    >
                                        {d}
                                    </span>
                                ))}
                                {daysInMonth.map((date, i) => {
                                    if (!date) return <div key={i} />;
                                    const isSelected =
                                        selectedDate?.toDateString() === date.toDateString();
                                    const isToday =
                                        new Date().toDateString() === date.toDateString();

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleDateSelect(date)}
                                            className={clsx(
                                                "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black transition-all",
                                                isSelected
                                                    ? "bg-[#1cb0f6] text-white shadow-lg shadow-[#1cb0f6]/20"
                                                    : isToday
                                                      ? "bg-gray-100 text-[#1cb0f6]"
                                                      : "text-[#3c3c3c] hover:bg-gray-50 hover:text-[#1cb0f6]",
                                            )}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomDatePicker;
