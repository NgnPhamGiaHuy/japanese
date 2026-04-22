/**
 * Reusable action card with icon and content.
 *
 * @remarks
 * Used for navigation cards with primary/secondary variants.
 * Supports progress bars, badges, and custom styling.
 *
 * @example
 * <ActionCard
 *   href="/learn"
 *   icon={<LearnIcon />}
 *   title="Learn"
 *   progress={{ value: 50, label: "50% Complete" }}
 * />
 */
import Link from "next/link";

import type { ReactNode } from "react";

/** Attributes for rendering an ActionCard. */
interface ActionCardProps {
    /** Target navigation URL. */
    href: string;
    /** Whether to use the primary visual style. */
    primary?: boolean;
    /** Main icon element. */
    icon: ReactNode;
    /** Primary heading text. */
    title: string;
    /** Optional secondary descriptive text. */
    subtitle?: string;
    /** Optional badge element to overlay. */
    badge?: ReactNode;
    /** Progress bar configuration. */
    progress?: {
        value: number;
        label: string;
    };
    /** Override for primary background color. */
    primaryBg?: string;
    /** Override for primary bottom border color. */
    primaryBorderB?: string;
    /** Override for primary hover state background. */
    primaryHover?: string;
    /** Override for primary text color. */
    primaryText?: string;
    /** Override for primary light background variant. */
    primaryBgLight?: string;
    /** Additional CSS classes. */
    className?: string;
}

const ActionCard = ({
    href,
    primary = false,
    icon,
    title,
    subtitle,
    badge,
    progress,
    primaryBg = "bg-[#1cb0f6]",
    primaryBorderB = "border-[#1899d6]",
    primaryHover = "hover:bg-[#149fdf]",
    primaryText = "text-[#1cb0f6]",
    primaryBgLight = "bg-[#1cb0f6]/10",
    className = "",
}: ActionCardProps) => {
    const baseClasses =
        "group flex h-full w-full rounded-3xl p-5 font-extrabold shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:scale-[0.99] md:rounded-4xl md:p-6";

    const variantClasses = primary
        ? `${primaryBg} border-b-4 text-white ${primaryBorderB} ${primaryHover} active:border-b-0`
        : `bg-white ${primaryText} border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2`;

    const layoutClasses = progress
        ? "items-center"
        : "flex-col items-center justify-center text-center";

    return (
        <Link
            href={href}
            className={`${baseClasses} ${variantClasses} ${layoutClasses} ${className}`}
        >
            {badge}
            <div
                className={`${primary ? "bg-white/20" : primaryBgLight} ${progress ? "mr-4" : "mb-3 md:mb-4"} rounded-xl p-3 transition-transform group-hover:scale-110 md:rounded-2xl md:p-4`}
            >
                {icon}
            </div>
            <div
                className={`flex ${progress ? "flex-1" : ""} flex-col justify-center ${progress ? "text-left" : ""}`}
            >
                <div
                    className={`text-xl md:text-2xl ${primary ? "text-white" : "text-[#3c3c3c] group-hover:text-black"}`}
                    style={primary && !progress ? { color: "white" } : undefined}
                >
                    {title}
                </div>
                {progress && (
                    <>
                        <div className="my-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 md:my-3 md:h-2">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${primary ? "bg-white" : primaryBg}`}
                                style={{ width: `${progress.value}%` }}
                            />
                        </div>
                        <div
                            className={`text-[10px] font-bold md:text-xs ${primary ? "text-white/80" : "text-gray-500"}`}
                        >
                            {progress.label}
                        </div>
                    </>
                )}
                {subtitle && (
                    <div className="mt-1 text-[10px] font-bold text-white/80 md:mt-2 md:text-xs">
                        {subtitle}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default ActionCard;
