/**
 * FlashcardAudioButton — Circular audio-replay button on a card face
 *
 * @remarks
 * Shared by FlashcardLearn, FlashcardPractice, and FlashcardMistakeReview,
 * which previously each hand-rolled their own copy of this same button.
 */
"use client";

import { Volume2 } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/utils";

interface FlashcardAudioButtonProps {
    onPlay: () => void;
    /** Practice/MistakeReview stop the click from also flipping the card. */
    stopPropagation?: boolean;
    className?: string;
    iconClassName?: string;
}

const BASE_CLASS =
    "absolute top-4 right-4 !rounded-full bg-gray-100 !p-2 shadow-none hover:shadow-none active:translate-y-0";

const FlashcardAudioButton = ({
    onPlay,
    stopPropagation = false,
    className,
    iconClassName,
}: FlashcardAudioButtonProps) => {
    return (
        <Button
            variant="ghost"
            onClick={(e) => {
                if (stopPropagation) e.stopPropagation();
                onPlay();
            }}
            className={cn(BASE_CLASS, className)}
            icon={Volume2}
            iconClassName={iconClassName}
        />
    );
};

export default FlashcardAudioButton;
