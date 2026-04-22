/**
 * Interactive card for selecting study or game modes.
 *
 * @remarks
 * Used for game/quiz mode selection screens.
 * Displays icon, title, description, and optional best score metrics.
 *
 * @example
 * <ModeSelectionCard
 *   icon={Trophy}
 *   iconBgColor="bg-yellow-100"
 *   iconColor="text-yellow-600"
 *   title="Challenge Mode"
 *   description="Test your speed and accuracy"
 *   onClick={() => handleModeSelect('challenge')}
 * />
 */
"use client";

import Button from "./Button";

import type { LucideIcon } from "lucide-react";

/** Attributes for rendering a ModeSelectionCard. */
export interface ModeSelectionCardProps {
    /** Unique identifier for the card element. */
    id?: string;
    /** The icon to display on the left side. */
    icon: LucideIcon;
    /** Tailwind background color class for the icon container. */
    iconBgColor: string;
    /** Tailwind text color class for the icon. */
    iconColor: string;
    /** Primary mode title. */
    title: string;
    /** Secondary descriptive text. */
    description: string;
    /** Optional best performance metric to display. */
    bestScore?: number | string;
    /** Triggered when the card is clicked. */
    onClick: () => void;
}

const ModeSelectionCard = ({
    id,
    icon: Icon,
    iconBgColor,
    iconColor,
    title,
    description,
    bestScore,
    onClick,
}: ModeSelectionCardProps) => {
    return (
        <Button
            id={id}
            variant="ghost"
            onClick={onClick}
            className="flex! w-full! items-center! justify-start! rounded-2xl! border-2! border-b-4! border-gray-200! bg-white! p-5! text-left! shadow-none transition-all hover:-translate-y-1! hover:shadow-md hover:shadow-none active:translate-y-0"
        >
            <div className={`mr-4 rounded-xl p-3 ${iconBgColor}`}>
                <Icon size={24} className={iconColor} />
            </div>
            <div className="flex flex-1 flex-col">
                <div className="text-lg font-black text-[#3c3c3c]">{title}</div>
                <div className="text-sm font-bold text-[#afafaf]">{description}</div>
            </div>
            {bestScore !== undefined && (
                <span className="ml-2 text-xs font-black opacity-70">Best: {bestScore}</span>
            )}
        </Button>
    );
};

export default ModeSelectionCard;
