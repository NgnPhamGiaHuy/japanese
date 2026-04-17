/**
 * ModeButton — Study Mode Selection Button
 *
 * @remarks
 * Reusable button component for mode selection with Duolingo-style aesthetic.
 */

"use client";

import { Button } from "@/shared/components/ui";

interface ModeButtonProps {
    label: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    primary?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

const ModeButton = ({
    label,
    sub,
    icon,
    color,
    primary = false,
    disabled = false,
    onClick,
}: ModeButtonProps) => {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            disabled={disabled}
            className={`!flex !w-full !items-center !gap-4 !rounded-2xl !border-2 !border-b-4 !px-5 !py-4 !text-left shadow-none !transition-all hover:shadow-none active:translate-y-[2px] active:border-b-2 ${
                disabled
                    ? "!cursor-not-allowed !opacity-40"
                    : "hover:!-translate-y-0.5 hover:!shadow-md"
            } ${primary ? "!text-white shadow-sm" : "!bg-white !text-[#3c3c3c]"}`}
            style={
                primary
                    ? { backgroundColor: color, borderColor: `${color}BB` }
                    : { borderColor: "#e5e7eb" }
            }
        >
            <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={
                    primary
                        ? { backgroundColor: "rgba(255,255,255,0.2)" }
                        : { backgroundColor: `${color}18`, color }
                }
            >
                {icon}
            </div>
            <div className="flex flex-1 flex-col">
                <div
                    className={`text-base font-black ${primary ? "text-white" : "text-[#3c3c3c]"}`}
                >
                    {label}
                </div>
                <div
                    className={`text-xs font-bold ${primary ? "text-white/70" : "text-[#afafaf]"}`}
                >
                    {sub}
                </div>
            </div>
        </Button>
    );
};

export default ModeButton;
