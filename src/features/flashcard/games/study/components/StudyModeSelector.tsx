/**
 * StudyModeSelector — Mode Selection Screen
 *
 * @remarks
 * Displays deck status and available study modes.
 * Recommends optimal mode based on SRS state.
 */

"use client";

import { useState } from "react";

import { AlertCircle, BookOpen, RefreshCw, RotateCcw } from "lucide-react";

import { Button, ConfirmModal } from "@/shared/components/ui";
import ModeButton from "./ModeButton";

import type { Lesson, StudyMode } from "@/features/flashcard/core/types";
import type { DeckAction, DeckStatus } from "@/features/flashcard/core/utils";

interface StudyModeSelectorProps {
    lesson: Lesson;
    status: DeckStatus;
    action: DeckAction;
    mistakeCount: number;
    onSelectMode: (mode: StudyMode) => void;
    onClose: () => void;
    onReset?: () => Promise<void>;
}

const StudyModeSelector = ({
    lesson,
    status,
    action,
    mistakeCount,
    onSelectMode,
    onClose,
    onReset,
}: StudyModeSelectorProps) => {
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const themeHex = lesson.themeColor || "#1cb0f6";
    const learnCount = status.newCount;
    const practiceCount = status.dueCount;

    const handleReset = async () => {
        if (!onReset) return;
        setResetting(true);
        try {
            await onReset();
            setShowResetConfirm(false);
        } finally {
            setResetting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div
                        className="mb-4 flex h-20 w-20 -rotate-3 items-center justify-center rounded-[1.75rem] border-b-6 text-white shadow-sm"
                        style={{ backgroundColor: themeHex, borderColor: `${themeHex}BB` }}
                    >
                        <span className="text-4xl font-black">{lesson.cardCount}</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">{lesson.title}</h1>
                    <p className="mt-1 text-sm font-bold text-slate-400">
                        {status.totalCount} cards total
                    </p>
                </div>

                <div className="mb-8 flex gap-3">
                    <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
                        <div className="text-xl font-black text-[#1cb0f6]">{status.newCount}</div>
                        <div className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                            New
                        </div>
                    </div>
                    <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
                        <div className="text-xl font-black text-[#ff9600]">{status.dueCount}</div>
                        <div className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                            Due
                        </div>
                    </div>
                    <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
                        <div className="text-xl font-black text-[#58cc02]">
                            {status.totalCount - status.newCount}
                        </div>
                        <div className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                            Learned
                        </div>
                    </div>
                </div>

                <div className="flex w-full max-w-sm flex-col gap-3">
                    {action === "continue" && (
                        <ModeButton
                            label="Continue Learning"
                            sub={`${practiceCount} card${practiceCount !== 1 ? "s" : ""} due for review`}
                            icon={<RefreshCw size={22} strokeWidth={2.5} />}
                            color={themeHex}
                            primary
                            onClick={() => onSelectMode("practice")}
                        />
                    )}
                    {action === "learn" && (
                        <ModeButton
                            label="Start Learning"
                            sub={`${learnCount} new card${learnCount !== 1 ? "s" : ""} to introduce`}
                            icon={<BookOpen size={22} strokeWidth={2.5} />}
                            color={themeHex}
                            primary
                            onClick={() => onSelectMode("learn")}
                        />
                    )}
                    {action === "idle" && (
                        <div className="rounded-2xl border-2 border-[#e2f6e2] bg-[#f0faf0] p-4 text-center">
                            <p className="text-sm font-bold text-[#58cc02]">
                                🎉 All caught up! Come back later for more reviews.
                            </p>
                        </div>
                    )}

                    <div className="my-1 h-px w-full bg-gray-200" />

                    {action !== "learn" && (
                        <ModeButton
                            label="Learn New"
                            sub={learnCount > 0 ? `${learnCount} new cards` : "No new cards"}
                            icon={<BookOpen size={20} strokeWidth={2.5} />}
                            color="#1cb0f6"
                            disabled={learnCount === 0}
                            onClick={() => onSelectMode("learn")}
                        />
                    )}

                    {action !== "continue" && (
                        <ModeButton
                            label="Practice"
                            sub={
                                practiceCount > 0 ? `${practiceCount} cards due` : "Nothing due yet"
                            }
                            icon={<RefreshCw size={20} strokeWidth={2.5} />}
                            color="#ff9600"
                            disabled={practiceCount === 0 && status.newCount === 0}
                            onClick={() => onSelectMode("practice")}
                        />
                    )}

                    {mistakeCount > 0 && (
                        <ModeButton
                            label="Review Mistakes"
                            sub={`${mistakeCount} card${mistakeCount !== 1 ? "s" : ""} to revisit`}
                            icon={<AlertCircle size={20} strokeWidth={2.5} />}
                            color="#ea2b2b"
                            onClick={() => onSelectMode("mistake-review")}
                        />
                    )}

                    {onReset && (
                        <>
                            <div className="my-1 h-px w-full bg-gray-200" />

                            <Button
                                variant="ghost"
                                onClick={() => setShowResetConfirm(true)}
                                className="!flex !items-center !justify-center !gap-2 !py-2 !text-sm !font-bold !text-slate-400 shadow-none transition-colors hover:!text-red-600 hover:shadow-none active:translate-y-0"
                                icon={RotateCcw}
                                iconSize={14}
                            >
                                Reset Progress
                            </Button>
                        </>
                    )}

                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="!py-3 !text-sm !font-black !text-slate-400 shadow-none transition-colors hover:!text-slate-800 hover:shadow-none active:translate-y-0"
                    >
                        Back to Deck
                    </Button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showResetConfirm}
                title="Reset Progress?"
                message={`This will reset all SRS progress for every card in "${lesson.title}". All intervals and review dates will be cleared. This cannot be undone.`}
                variant="danger"
                confirmText="Reset All"
                loading={resetting}
                onConfirm={handleReset}
                onClose={() => setShowResetConfirm(false)}
            />
        </>
    );
};

export default StudyModeSelector;
