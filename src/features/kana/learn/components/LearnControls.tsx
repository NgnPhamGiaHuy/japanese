/**
 * LearnControls — Navigation buttons for learning mode
 *
 * @remarks
 * Provides Prev/Next buttons for navigating through kana characters.
 */

"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { LearnControlsProps } from "../types";

export function LearnControls({ alphabet, onPrev, onNext }: LearnControlsProps) {
    return (
        <div className="mt-2 flex justify-between gap-3">
            <Button
                variant="outline"
                onClick={onPrev}
                className="flex-1 py-3.5 text-base md:py-5 md:text-xl"
            >
                Prev
            </Button>
            <Button
                alphabet={alphabet}
                onClick={onNext}
                className="flex-1 py-3.5 text-base md:py-5 md:text-xl"
            >
                Next <ChevronRight size={24} strokeWidth={3} />
            </Button>
        </div>
    );
}
