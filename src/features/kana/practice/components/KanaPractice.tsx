/**
 * KanaPractice — Main practice mode component
 *
 * @remarks
 * Root component for kana practice feature.
 * Orchestrates navigation, mode switching, and canvas display.
 */

"use client";

import { useKanaDataset } from "@/features/kana/hooks";
import { PracticeCanvasArea } from "./PracticeCanvasArea";
import { PracticeControls } from "./PracticeControls";
import { PracticeHeader } from "./PracticeHeader";
import { usePracticeNavigation } from "../hooks";

export function KanaPractice() {
    const { dataset, alphabet, themeColor } = useKanaDataset();

    const { char, isRandom, practiceMode, navigate, cycleMode, toggleRandom } =
        usePracticeNavigation(dataset, alphabet);

    if (!char) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F8]">
            <PracticeHeader
                mode={practiceMode}
                char={char}
                isRandom={isRandom}
                themeColor={themeColor}
                onModeChange={cycleMode}
                onRandomToggle={toggleRandom}
            />

            <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto px-4 py-4">
                <PracticeCanvasArea char={char} mode={practiceMode} themeColor={themeColor} />
                <PracticeControls
                    alphabet={alphabet}
                    onPrev={() => navigate(-1)}
                    onNext={() => navigate(1)}
                />
            </div>
        </div>
    );
}
