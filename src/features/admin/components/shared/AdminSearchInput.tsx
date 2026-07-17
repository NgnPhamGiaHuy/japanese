"use client";

import { useTranslations } from "next-intl";

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
    placeholder,
    className = "",
}: AdminSearchInputProps) => {
    const t = useTranslations("AdminCommon");
    return (
        <Input
            type="text"
            icon={Search}
            placeholder={placeholder ?? t("searchPlaceholder")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            containerClassName={className}
        />
    );
};

export default AdminSearchInput;
