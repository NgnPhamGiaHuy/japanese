"use client";

import { X } from "lucide-react";

import { Button } from "@/shared/components/ui";

interface StudyProgressHeaderProps {
    onClose: () => void;
    /** 1-based position of the current card. */
    current: number;
    total: number;
    /** 0-100. */
    progress: number;
    /** Progress-bar fill color — each study mode picks its own (theme color, or a fixed accent for Mistake Review). */
    color: string;
}

/**
 * Close button + progress bar + "current/total" counter shared by every
 * study-mode player (FlashcardPractice, FlashcardLearn, FlashcardMistakeReview).
 */
const StudyProgressHeader = ({
    onClose,
    current,
    total,
    progress,
    color,
}: StudyProgressHeaderProps) => (
    <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onClose} icon={X} aria-label="Close" />
        <div className="mx-4 flex-1">
            <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: color }}
                />
            </div>
        </div>
        <span className="text-muted w-12 text-right text-sm font-black">
            {current}/{total}
        </span>
    </header>
);

export default StudyProgressHeader;
