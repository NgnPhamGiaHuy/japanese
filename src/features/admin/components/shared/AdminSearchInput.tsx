"use client";

import { Search } from "lucide-react";

interface AdminSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Standardized Search Input for Admin Dashboard.
 *
 * @remarks Implements the consistent platform search aesthetic with
 * rounded-2xl borders and high-contrast typography.
 */
const AdminSearchInput = ({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
}: AdminSearchInputProps) => {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-[#afafaf]" size={18} />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 w-full rounded-2xl border-2 border-gray-100 bg-white pr-4 pl-11 text-sm font-black text-[#3c3c3c] transition-all outline-none placeholder:font-bold placeholder:text-[#afafaf] focus:border-[#1cb0f6] focus:ring-4 focus:ring-[#1cb0f6]/5"
            />
        </div>
    );
};

export default AdminSearchInput;
