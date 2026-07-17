"use client";

import { useTranslations } from "next-intl";

import { Check, Volume2, X } from "lucide-react";

import { speak } from "@/shared/audio";
import { Button } from "@/shared/components/ui";

import type { KanaChar, QuestionType } from "@/features/kana/types";

interface AnswerFeedbackProps {
    status: "idle" | "correct" | "wrong";
    question: KanaChar | null;
    /** Carried for callers' convenience; feedback-stage replay does not depend on it. */
    questionType?: QuestionType;
    primaryBg: string;
    onReplayAudio?: () => void;
}

const AnswerFeedback = ({ status, question, primaryBg, onReplayAudio }: AnswerFeedbackProps) => {
    const t = useTranslations("AnswerFeedback");

    if (status === "idle") return <div className="mt-4 h-12 md:mt-6 md:h-16" />;

    // The visual result is carried by colour, a shake animation and a tone — none of which a
    // screen-reader user perceives. Announce the outcome and the answer in words.
    const announcement = t(status === "correct" ? "announcementCorrect" : "announcementIncorrect", {
        char: question?.char ?? "",
        romaji: question?.romaji ?? "",
    });

    // Once the answer is on screen, replaying its pronunciation cannot leak anything, so every
    // question type gets the button. Prompt-stage gating is the speech policy's job, not this one.
    // Written as an explicit null check so TypeScript narrows `question` inside the branches.
    const canReplayAudio = question !== null;

    const replay = () => {
        if (question) speak(question.char, { trigger: "user", source: "kana-feedback" });
    };

    return (
        <div className="mt-4 flex h-12 w-full items-center justify-center rounded-xl text-base font-black shadow-sm md:mt-6 md:h-16 md:rounded-2xl md:text-xl">
            <span role="status" aria-live="polite" className="sr-only">
                {announcement}
            </span>
            {status === "correct" && (
                <div
                    className={`animate-in zoom-in flex h-full w-full items-center justify-center gap-1.5 rounded-xl px-2 text-white md:gap-2 ${primaryBg}`}
                >
                    <Check size={20} strokeWidth={3} className="shrink-0 md:h-6 md:w-6" />
                    <span className="truncate">{t("brilliant")}</span>
                    <span className="ml-1 flex shrink-0 items-center gap-1 rounded-lg bg-black/10 px-2 py-0.5 text-xs font-bold md:text-sm">
                        <span className="mt-0.5 text-base leading-none font-medium md:text-lg">
                            {question?.char}
                        </span>
                        <span className="mx-0.5 opacity-50">-</span>
                        <span className="tracking-wider uppercase">{question?.romaji}</span>
                    </span>
                    {canReplayAudio && (
                        <Button
                            variant="ghost"
                            onClick={onReplayAudio ?? replay}
                            className="!ml-1 !shrink-0 !rounded-lg !bg-black/10 !p-1.5 text-white shadow-none transition-colors hover:!bg-black/20 hover:shadow-none active:translate-y-0"
                            aria-label={t("replayAudio")}
                            icon={Volume2}
                            iconSize={14}
                        />
                    )}
                </div>
            )}
            {status === "wrong" && (
                <div className="animate-in zoom-in bg-danger-bg text-danger flex h-full w-full items-center justify-center gap-1.5 rounded-xl px-2 md:gap-2">
                    <X size={20} strokeWidth={3} className="shrink-0 md:h-6 md:w-6" />
                    <span className="truncate">{t("answer")}</span>
                    <span className="bg-danger/10 text-danger ml-1 flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold md:text-sm">
                        <span className="mt-0.5 text-base leading-none font-medium md:text-lg">
                            {question?.char}
                        </span>
                        <span className="mx-0.5 opacity-50">-</span>
                        <span className="tracking-wider uppercase">{question?.romaji}</span>
                    </span>
                    {canReplayAudio && (
                        <Button
                            variant="ghost"
                            onClick={onReplayAudio ?? replay}
                            className="!bg-danger/10 hover:!bg-danger/20 !ml-1 !shrink-0 !rounded-lg !p-1.5 text-white shadow-none transition-colors hover:shadow-none active:translate-y-0"
                            aria-label={t("replayAudio")}
                            icon={Volume2}
                            iconSize={14}
                            iconClassName="text-danger"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default AnswerFeedback;
