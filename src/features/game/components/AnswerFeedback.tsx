"use client";

import { Check, X } from "lucide-react";
import type { KanaChar } from "@/features/kana/types/kana.types";

interface AnswerFeedbackProps {
    status: "idle" | "correct" | "wrong";
    question: KanaChar | null;
    primaryBg: string;
    activeFont: string;
}

export default function AnswerFeedback({
    status,
    question,
    primaryBg,
    activeFont,
}: AnswerFeedbackProps) {
    if (status === "idle") return <div className="mt-4 md:mt-6 h-12 md:h-16" />;

    return (
        <div className="mt-4 md:mt-6 h-12 md:h-16 w-full flex items-center justify-center rounded-xl md:rounded-2xl font-black text-base md:text-xl px-2">
            {status === "correct" && (
                <div
                    className={`text-white w-full h-full flex items-center justify-center rounded-xl gap-1.5 md:gap-2 animate-in zoom-in shadow-sm ${primaryBg}`}
                >
                    <Check
                        size={20}
                        strokeWidth={3}
                        className="md:w-6 md:h-6 shrink-0"
                    />
                    <span className="truncate">Brilliant!</span>
                    <span className="bg-black/10 px-2 py-0.5 rounded-lg text-xs md:text-sm ml-1 flex items-center gap-1 font-bold shrink-0">
                        <span
                            style={{ fontFamily: activeFont }}
                            className="text-base md:text-lg font-medium leading-none mt-0.5"
                        >
                            {question?.char}
                        </span>
                        <span className="opacity-50 mx-0.5">-</span>
                        <span className="uppercase tracking-wider">
                            {question?.romaji}
                        </span>
                    </span>
                </div>
            )}
            {status === "wrong" && (
                <div className="text-[#ea2b2b] bg-[#ffdfe0] w-full h-full flex items-center justify-center rounded-xl gap-1.5 md:gap-2 animate-in zoom-in shadow-sm">
                    <X
                        size={20}
                        strokeWidth={3}
                        className="md:w-6 md:h-6 shrink-0"
                    />
                    <span className="truncate">Answer:</span>
                    <span className="bg-[#ea2b2b]/10 text-[#ea2b2b] px-2 py-0.5 rounded-lg text-xs md:text-sm ml-1 flex items-center gap-1 font-bold shrink-0">
                        <span
                            style={{ fontFamily: activeFont }}
                            className="text-base md:text-lg font-medium leading-none mt-0.5"
                        >
                            {question?.char}
                        </span>
                        <span className="opacity-50 mx-0.5">-</span>
                        <span className="uppercase tracking-wider">
                            {question?.romaji}
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
}
