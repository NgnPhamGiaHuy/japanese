/**
 * EmptyState — Reusable empty state component
 *
 * @remarks
 * Used to display empty states with icon, title, description, and optional action.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    iconColor?: string;
    iconBg?: string;
    iconBorder?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    iconColor = "#ce82ff",
    iconBg = "bg-[#ce82ff]",
    iconBorder = "border-[#b65ce8]",
}: EmptyStateProps) {
    return (
        <div className="py-20 text-center">
            <div
                className={`mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 ${iconBg} ${iconBorder} text-white shadow-sm`}
            >
                <Icon size={48} strokeWidth={3} />
            </div>
            <h2 className="mb-2 text-2xl font-black text-[#3c3c3c]">{title}</h2>
            <p className="mb-8 font-bold text-[#afafaf]">{description}</p>
            {action}
        </div>
    );
}
