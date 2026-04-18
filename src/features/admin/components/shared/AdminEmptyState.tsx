"use client";

import { EmptyState } from "@/shared/components/ui";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminEmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    action?: ReactNode;
    iconBg?: string;
    iconBorder?: string;
}

/**
 * Admin Standard Empty State.
 *
 * @remarks Provides a consistent fallback UI when collections are empty,
 * reusing the core application's EmptyState design language.
 */
const AdminEmptyState = ({
    title,
    description,
    icon,
    action,
    iconBg,
    iconBorder,
}: AdminEmptyStateProps) => {
    return (
        <EmptyState
            title={title}
            description={description}
            icon={icon}
            action={action}
            iconBg={iconBg}
            iconBorder={iconBorder}
        />
    );
};

export default AdminEmptyState;
