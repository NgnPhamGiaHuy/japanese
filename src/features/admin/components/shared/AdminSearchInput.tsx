"use client";

import { Search } from "lucide-react";

import { Input } from "@/shared/components/ui";

interface AdminSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Standardized Search Input for Admin Dashboard.
 *
 * @remarks Thin wrapper around the shared `Input` primitive for the
 * platform's standard search aesthetic.
 */
const AdminSearchInput = ({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
}: AdminSearchInputProps) => {
    return (
        <Input
            type="text"
            icon={Search}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            containerClassName={className}
        />
    );
};

export default AdminSearchInput;
