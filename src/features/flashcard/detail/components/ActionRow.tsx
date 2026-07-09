"use client";

import { Button } from "@/shared/components/ui";

import type { LucideIcon } from "lucide-react";

interface ActionRowProps {
    icon: LucideIcon;
    /** Extra classes applied directly to the icon (e.g. `animate-spin` for a loading icon). */
    iconClassName?: string;
    /** Tailwind classes for the icon circle's background/text color. */
    iconWrapperClassName?: string;
    /** Inline style for the icon circle — used for theme-hex-derived colors. */
    iconWrapperStyle?: React.CSSProperties;
    title: React.ReactNode;
    subtitle: string;
    onClick?: () => void;
    disabled?: boolean;
}

/**
 * One row in DetailActionsPanel's action list — icon circle, title, subtitle.
 * Every action (Edit, Share, Copy Link, Duplicate, ...) renders this exact shape.
 */
const ActionRow = ({
    icon: Icon,
    iconClassName,
    iconWrapperClassName = "",
    iconWrapperStyle,
    title,
    subtitle,
    onClick,
    disabled,
}: ActionRowProps) => {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            disabled={disabled}
            className="!flex !w-full !items-center !justify-start !gap-4 !rounded-2xl border-2 border-transparent !bg-white !px-4 !py-4 shadow-sm transition-all hover:!border-gray-200 active:translate-y-0 disabled:opacity-50"
        >
            <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrapperClassName}`}
                style={iconWrapperStyle}
            >
                <Icon size={22} className={iconClassName} />
            </div>
            <div className="text-left">
                <div className="text-text text-lg font-black">{title}</div>
                <div className="text-muted text-sm font-bold">{subtitle}</div>
            </div>
        </Button>
    );
};

export default ActionRow;
