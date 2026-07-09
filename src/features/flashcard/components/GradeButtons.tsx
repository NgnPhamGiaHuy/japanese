/**
 * GradeButtons — Four-button SM-2 grade UI (Again / Hard / Good / Easy)
 *
 * @remarks
 * Shared by FlashcardLearn, FlashcardPractice, and FlashcardMistakeReview,
 * which previously each hand-rolled a byte-for-byte-identical copy of this
 * button row. Each caller keeps its own show/hide wrapper (Learn swaps it in
 * via a ternary, Practice/MistakeReview gate visibility with opacity) since
 * that mechanism genuinely differs per screen.
 */
"use client";

import type { Grade } from "../domain";

interface GradeButtonsProps {
    onGrade: (grade: Grade) => void;
    /** Drives the "Easy" button's background — the only per-deck themed grade. */
    themeHex: string;
}

const GradeButtons = ({ onGrade, themeHex }: GradeButtonsProps) => {
    return (
        <div className="grid w-full grid-cols-2 gap-3">
            <button
                aria-label="Again — card will repeat soon"
                onClick={() => void onGrade("Again")}
                className="border-danger/60 rounded-[1.25rem] border-2 border-b-8 bg-[#ff4b4b] py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b4b] focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
            >
                Again
            </button>
            <button
                aria-label="Hard — interval shortened"
                onClick={() => void onGrade("Hard")}
                className="bg-survival rounded-[1.25rem] border-2 border-b-8 border-[#e07000]/60 py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9600] focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
            >
                Hard
            </button>
            <button
                aria-label="Good — normal interval"
                onClick={() => void onGrade("Good")}
                className="border-hiragana-strong/60 bg-hiragana focus-visible:ring-hiragana rounded-[1.25rem] border-2 border-b-8 py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
            >
                Good
            </button>
            <button
                aria-label="Easy — interval extended"
                onClick={() => void onGrade("Easy")}
                className="rounded-[1.25rem] border-2 border-b-8 border-[#0090c0]/60 py-4 text-base font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1cb0f6] focus-visible:ring-offset-2 active:translate-y-0 active:border-b-2"
                style={{ backgroundColor: themeHex }}
            >
                Easy
            </button>
        </div>
    );
};

export default GradeButtons;
