"use client";

import { EmptyState } from "@/shared/components/ui";

import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
}

/**
 * Admin Standard Empty State.
 *
 * @remarks Provides a consistent fallback UI when collections are empty,
 * reusing the core application's EmptyState design language.
 */
const AdminEmptyState = ({ title, description, icon }: AdminEmptyStateProps) => {
    return <EmptyState title={title} description={description} icon={icon} />;
};

export default AdminEmptyState;
