/**
 * GameIntroScreen — Reusable game introduction/setup screen
 *
 * @remarks
 * Used for game mode intro screens with icon, title, description, best score, and start button.
 * Supports optional children for mode-specific content (difficulty selection, rules, etc).
 */

"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { LucideIcon } from "lucide-react";
import type { TierInfo } from "@/features/game/logic";

export interface GameIntroScreenProps {
    /** Game mode title */
    title: string;
    /** Game mode description */
    description: string;
    /** Icon component to display */
    icon: LucideIcon;
    /** Icon background color (e.g., "bg-[#ce82ff]") */
    iconBg: string;
    /** Icon border color (e.g., "#b65ce8") */
    iconBorder: string;
    /** Best score for this mode */
    bestScore: number;
    /** Tier information for best score */
    tierInfo: TierInfo;
    /** Start button text */
    startButtonText?: string;
    /** Start button color */
    startButtonColor?: "purple" | "orange" | "blue" | "green" | "red";
    /** Whether start button is disabled */
    startDisabled?: boolean;
    /** Whether start button is loading */
    loading?: boolean;
    /** Optional children for mode-specific content */
    children?: React.ReactNode;
    onBack: () => void;
    onStart: () => void | Promise<void>;
}

export function GameIntroScreen({
    title,
    description,
    icon: Icon,
    iconBg,
    iconBorder,
    bestScore,
    tierInfo,
    startButtonText = "Play",
    startButtonColor = "purple",
    startDisabled = false,
    children,
    loading = false,
    onBack,
    onStart,
}: GameIntroScreenProps) {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6">
            <Button
                variant="ghost"
                onClick={onBack}
                className="absolute top-4 left-4 p-2!"
                icon={X}
            />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`mb-6 flex h-20 w-20 -rotate-3 items-center justify-center rounded-[1.75rem] border-b-8 text-white shadow-sm ${iconBg}`}
                style={{ borderColor: iconBorder }}
            >
                <Icon size={44} strokeWidth={2.5} />
            </motion.div>

            <h1 className="mb-1 text-3xl font-black text-[#3c3c3c]">{title}</h1>
            <p className="mb-2 max-w-sm text-center text-sm font-bold text-[#afafaf]">
                {description}
            </p>

            {bestScore > 0 && (
                <div
                    className="mb-5 flex items-center gap-2 rounded-2xl border-2 px-4 py-2"
                    style={{ borderColor: tierInfo.border, backgroundColor: tierInfo.bg }}
                >
                    <span className="text-lg">{tierInfo.emoji}</span>
                    <span className="text-sm font-black" style={{ color: tierInfo.color }}>
                        {tierInfo.label}
                    </span>
                    <span className="text-sm font-bold text-[#afafaf]">·</span>
                    <span className="text-sm font-black text-[#3c3c3c]">Best: {bestScore}</span>
                </div>
            )}

            {children}

            <Button
                variant="primary"
                color={startButtonColor}
                onClick={() => void onStart()}
                disabled={startDisabled}
                loading={loading}
                className="w-full max-w-sm py-5 text-xl"
            >
                {startButtonText}
            </Button>
        </div>
    );
}
