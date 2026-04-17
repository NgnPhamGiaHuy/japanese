/**
 * ModeSelectionCard — Reusable mode selection button
 *
 * @remarks
 * Used for game/quiz mode selection screens.
 * Displays icon, title, description, and optional best score.
 */

"use client";

import Button from "./Button";

import type { LucideIcon } from "lucide-react";

export interface ModeSelectionCardProps {
    id?: string;
    icon: LucideIcon;
    iconBgColor: string;
    iconColor: string;
    title: string;
    description: string;
    bestScore?: number | string;
    onClick: () => void;
}

export function ModeSelectionCard({
    id,
    icon: Icon,
    iconBgColor,
    iconColor,
    title,
    description,
    bestScore,
    onClick,
}: ModeSelectionCardProps) {
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
}
