"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { LucideIcon } from "lucide-react";

export const SCREEN_HEADER_BAR_CLASS =
    "sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b-2 border-gray-200";

export const SCREEN_HEADER_BACK_BUTTON_CLASS =
    "flex items-center justify-center w-10 h-10 shrink-0 rounded-xl text-[#afafaf] hover:text-[#3c3c3c] hover:bg-gray-100 transition-colors";

export const ScreenHeaderBackLink = ({
    href,
    "aria-label": ariaLabel = "Go back",
}: {
    href: string;
    "aria-label"?: string;
}) => {
    return (
        <Link href={href} className={SCREEN_HEADER_BACK_BUTTON_CLASS} aria-label={ariaLabel}>
            <ArrowLeft size={22} strokeWidth={2.5} />
        </Link>
    );
};

export const ScreenHeaderBackButton = ({
    onClick,
    icon: Icon = ArrowLeft,
    "aria-label": ariaLabel = "Go back",
    className,
}: {
    onClick: () => void;
    icon?: LucideIcon;
    "aria-label"?: string;
    className?: string;
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${SCREEN_HEADER_BACK_BUTTON_CLASS} ${className ?? ""}`}
            aria-label={ariaLabel}
        >
            <Icon size={22} strokeWidth={2.5} />
        </button>
    );
};

export const ScreenHeaderRow = ({
    children,
    className,
    variant = "light",
}: {
    children: React.ReactNode;
    className?: string;
    variant?: "light" | "dark";
}) => {
    const bar =
        variant === "dark"
            ? "sticky top-0 z-20 border-b border-white/10 bg-[#0a0a1a]/90 backdrop-blur-md"
            : SCREEN_HEADER_BAR_CLASS;
    return (
        <header
            className={`${bar} flex items-center justify-between gap-2 px-4 py-3 ${className ?? ""}`}
        >
            {children}
        </header>
    );
};

interface ScreenHeaderProps {
    title: string;
    backHref?: string;
    onBack?: () => void;
    right?: React.ReactNode;
    /** Override default narrow right column (e.g. for toolbars). */
    rightWrapperClassName?: string;
}

const ScreenHeader = ({
    title,
    backHref,
    onBack,
    right,
    rightWrapperClassName = "w-10 flex items-center justify-end",
}: ScreenHeaderProps) => {
    const BackButton = backHref ? (
        <ScreenHeaderBackLink href={backHref} />
    ) : onBack ? (
        <ScreenHeaderBackButton onClick={onBack} />
    ) : (
        <div className="w-10 shrink-0" />
    );

    return (
        <header
            className={`${SCREEN_HEADER_BAR_CLASS} flex items-center justify-between gap-2 px-4 py-3`}
        >
            {BackButton}
            <h1 className="min-w-0 flex-1 truncate px-2 text-center text-lg font-black text-[#3c3c3c]">
                {title}
            </h1>
            <div className={rightWrapperClassName}>{right ?? null}</div>
        </header>
    );
};

export default ScreenHeader;
