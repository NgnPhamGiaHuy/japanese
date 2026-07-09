/**
 * KanaAudioButton — Circular "play audio" icon button
 *
 * @remarks
 * Shared by LearnCard, QuizPlaying, and PracticeCanvasArea, which previously
 * each hand-rolled their own copy of this same button.
 */
"use client";

import { Volume2 } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/utils";

interface KanaAudioButtonProps {
    char: string;
    onPlay: () => void;
    iconSize?: number;
    /** Tailwind text-color class applied to the icon (e.g. themeColor.text). */
    iconColorClassName?: string;
    /** Position/background/hover overrides — the three call sites differ here. */
    className?: string;
}

const BASE_CLASS =
    "rounded-full! border-2! border-gray-100! p-2! shadow-none transition-transform hover:shadow-none active:translate-y-0";

const KanaAudioButton = ({
    char,
    onPlay,
    iconSize = 18,
    iconColorClassName,
    className,
}: KanaAudioButtonProps) => {
    return (
        <Button
            variant="ghost"
            onClick={onPlay}
            title={`Play ${char}`}
            className={cn(BASE_CLASS, className)}
            icon={Volume2}
            iconSize={iconSize}
            iconClassName={iconColorClassName}
        />
    );
};

export default KanaAudioButton;
