/**
 * PracticeControls — Navigation buttons
 *
 * @remarks
 * Provides Prev/Next buttons for navigating through characters.
 */

"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { PracticeControlsProps } from "../types";

export function PracticeControls({ alphabet, onPrev, onNext }: PracticeControlsProps) {
    return (
        <div className="mt-4 flex w-full max-w-sm shrink-0 justify-between gap-2 px-2 sm:px-0 md:mt-6 md:max-w-3xl md:gap-4">
            <Button
                variant="outline"
                onClick={onPrev}
                className="flex-1 py-2.5 text-sm md:py-4 md:text-lg"
            >
                Prev
            </Button>
            <Button
                alphabet={alphabet}
                onClick={onNext}
                className="flex-1 py-2.5 text-sm md:py-4 md:text-lg"
            >
                Next <ChevronRight size={20} strokeWidth={3} />
            </Button>
        </div>
    );
}
