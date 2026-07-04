/**
 * Reusable empty state component for displaying missing content.
 *
 * @remarks
 * Used to display empty states with icon, title, description, and optional action button.
 *
 * @example
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="Try adjusting your search filters."
 *   action={<Button>Clear Filters</Button>}
 * />
 */
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Attributes for rendering an EmptyState component. */
interface EmptyStateProps {
    /** The icon to display as the main visual element. */
    icon: LucideIcon;
    /** Primary heading text. */
    title: string;
    /** Secondary descriptive text explaining the empty state. */
    description: string;
    /** Optional action element (e.g., a Button). */
    action?: ReactNode;
    /** Tailwind background color class for the icon container. */
    iconBg?: string;
    /** Tailwind border color class for the icon container. */
    iconBorder?: string;
}

const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    iconBg = "bg-both",
    iconBorder = "border-both-strong",
}: EmptyStateProps) => {
    return (
        <div className="py-20 text-center">
            <div
                className={`mx-auto mb-6 flex h-24 w-24 -rotate-6 items-center justify-center rounded-4xl border-b-8 ${iconBg} ${iconBorder} text-white shadow-sm`}
            >
                <Icon size={48} strokeWidth={3} />
            </div>
            <h2 className="text-text mb-2 text-2xl font-black">{title}</h2>
            <p className="text-muted mb-8 font-bold">{description}</p>
            <div className="flex justify-center">{action}</div>
        </div>
    );
};

export default EmptyState;
