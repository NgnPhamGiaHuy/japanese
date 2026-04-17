"use client";

import { motion } from "framer-motion";

export type MatchCardSurface = "default" | "selected" | "matched" | "error";

interface MatchCardProps {
    label: string;
    surface: MatchCardSurface;
    disabled: boolean;
    onPress: () => void;
    /** Keyboard navigation support for stimulus tiles (Requirement 7.4) */
    tabIndex?: number;
}

const surfaceRing: Record<MatchCardSurface, string> = {
    default: "border-gray-200 text-[#3c3c3c] bg-white",
    selected: "border-[#ce82ff] text-[#ce82ff] bg-[#f8f0ff] shadow-md",
    matched: "border-[#58cc02] text-[#58cc02] bg-[#f2fbf0]",
    error: "border-[#ea2b2b] text-[#ea2b2b] bg-[#ffdfe0]",
};

const MatchCard = ({ label, surface, disabled, onPress, tabIndex }: MatchCardProps) => {
    return (
        <motion.button
            type="button"
            layout
            disabled={disabled}
            onClick={onPress}
            tabIndex={tabIndex}
            className={[
                "flex min-h-[76px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-b-4 p-2 text-center font-black transition-all duration-150 select-none",
                surfaceRing[surface],
                surface === "error" ? "animate-shake" : "",
                disabled ? "pointer-events-none opacity-40" : "",
            ].join(" ")}
            whileTap={disabled ? undefined : { scale: 0.97 }}
        >
            <span className="line-clamp-4 text-sm leading-snug wrap-break-word sm:text-base">
                {label}
            </span>
        </motion.button>
    );
};

export default MatchCard;
