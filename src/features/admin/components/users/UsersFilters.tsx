"use client";

interface UsersFiltersProps {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Simplistic User Search Filter.
 *
 * @remarks Provides basic text-based filtering for the user management table.
 */
export default function UsersFilters({ value, onChange }: UsersFiltersProps) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Filter by name or email"
            className="h-10 w-full rounded-xl border-2 border-gray-100 bg-white px-4 text-sm font-bold text-[#3c3c3c] outline-none focus:border-[#1cb0f6]"
        />
    );
}
