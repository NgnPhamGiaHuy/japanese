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
    /** Tailwind text color class for the icon itself. */
    iconTextColor?: string;
    /** Whether the icon well is tilted -6deg (the default "playful" look). */
    rotateIcon?: boolean;
    /** Renders as a fixed full-viewport takeover instead of an inline py-20 section. */
    fullScreen?: boolean;
    /** Icon stroke width. */
    iconStrokeWidth?: number;
}

const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    iconBg = "bg-both",
    iconBorder = "border-both-strong",
    iconTextColor = "text-white",
    rotateIcon = true,
    fullScreen = false,
    iconStrokeWidth = 3,
}: EmptyStateProps) => {
    return (
        <div
            className={
                fullScreen
                    ? "bg-bg flex h-screen flex-col items-center justify-center p-6 text-center"
                    : "py-20 text-center"
            }
        >
            <div
                className={`mx-auto mb-6 flex h-24 w-24 ${rotateIcon ? "-rotate-6" : ""} items-center justify-center rounded-4xl border-b-8 ${iconBg} ${iconBorder} ${iconTextColor} shadow-sm`}
            >
                <Icon size={48} strokeWidth={iconStrokeWidth} />
            </div>
            <h2 className="text-text mb-2 text-2xl font-black">{title}</h2>
            <p className="text-muted mb-8 font-bold">{description}</p>
            <div className="flex justify-center">{action}</div>
        </div>
    );
};

export default EmptyState;
