"use client";

import { Check, X } from "lucide-react";

import type { KanaChar } from "@/features/kana/types/kana.types";

interface AnswerFeedbackProps {
    status: "idle" | "correct" | "wrong";
    question: KanaChar | null;
    primaryBg: string;
    activeFont: string;
}

const AnswerFeedback = ({ status, question, primaryBg, activeFont }: AnswerFeedbackProps) => {
    if (status === "idle") return <div className="mt-4 h-12 md:mt-6 md:h-16" />;

    return (
        <div className="mt-4 flex h-12 w-full items-center justify-center rounded-xl px-2 text-base font-black shadow-sm md:mt-6 md:h-16 md:rounded-2xl md:text-xl">
            {status === "correct" && (
                <div
                    className={`animate-in zoom-in flex h-full w-full items-center justify-center gap-1.5 rounded-xl text-white md:gap-2 ${primaryBg}`}
                >
                    <Check size={20} strokeWidth={3} className="shrink-0 md:h-6 md:w-6" />
                    <span className="truncate">Brilliant!</span>
                    <span className="ml-1 flex shrink-0 items-center gap-1 rounded-lg bg-black/10 px-2 py-0.5 text-xs font-bold md:text-sm">
                        <span
                            style={{ fontFamily: activeFont }}
                            className="mt-0.5 text-base leading-none font-medium md:text-lg"
                        >
                            {question?.char}
                        </span>
                        <span className="mx-0.5 opacity-50">-</span>
                        <span className="tracking-wider uppercase">{question?.romaji}</span>
                    </span>
                </div>
            )}
            {status === "wrong" && (
                <div className="animate-in zoom-in flex h-full w-full items-center justify-center gap-1.5 rounded-xl bg-[#ffdfe0] text-[#ea2b2b] md:gap-2">
                    <X size={20} strokeWidth={3} className="shrink-0 md:h-6 md:w-6" />
                    <span className="truncate">Answer:</span>
                    <span className="ml-1 flex shrink-0 items-center gap-1 rounded-lg bg-[#ea2b2b]/10 px-2 py-0.5 text-xs font-bold text-[#ea2b2b] md:text-sm">
                        <span
                            style={{ fontFamily: activeFont }}
                            className="mt-0.5 text-base leading-none font-medium md:text-lg"
                        >
                            {question?.char}
                        </span>
                        <span className="mx-0.5 opacity-50">-</span>
                        <span className="tracking-wider uppercase">{question?.romaji}</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default AnswerFeedback;
