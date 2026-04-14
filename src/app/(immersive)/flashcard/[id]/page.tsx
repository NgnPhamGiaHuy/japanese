"use client";

import { notFound, useRouter, useSearchParams } from "next/navigation";
import { use, useMemo, useState } from "react";

import { AlertCircle, BookOpen, RefreshCw, RotateCcw } from "lucide-react";

import {
    FlashcardLearn,
    FlashcardMistakeReview,
    FlashcardPractice,
} from "@/features/flashcard/components";
import { useCards } from "@/features/flashcard/hooks/useCards";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import {
    buildSession,
    getDeckStatus,
    processAnswer,
    recommendedAction,
} from "@/features/flashcard/logic/learningEngine";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { useAppStore } from "@/store";

import type { StudyMode } from "@/features/flashcard/types/flashcard.types";

export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { lessons, loading: lessonsLoading } = useLessons();
    const { cards, loading: cardsLoading, resetLesson } = useCards(id);
    const { addXP, completedLesson } = useUserProgress();
    const { user } = useAppStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialMode = searchParams.get("mode") as StudyMode | null;
    const [mode, setMode] = useState<StudyMode | null>(initialMode);
    const [mistakeIds, setMistakeIds] = useState<string[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const session = useMemo(() => {
        if (!mode) return null;
        return buildSession(cards, mode, mistakeIds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    if (lessonsLoading || cardsLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#F7F7F8]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1cb0f6]" />
            </div>
        );
    }

    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return notFound();

    const themeHex = lesson.themeColor || "#1cb0f6";
    const status = getDeckStatus(cards);
    const action = recommendedAction(status);

    // ── Shared callbacks ─────────────────────────────────────────────────────

    const handleClose = () => router.push("/flashcard");

    const handleAnswer = async (
        card: import("@/features/flashcard/types/flashcard.types").FlashCard,
        knew: boolean,
    ) => {
        if (!user || !mode) return;
        await processAnswer(user.uid, card, knew);
    };

    const handleComplete = async (
        stats: import("@/features/flashcard/types/flashcard.types").StudyStats,
        overrideXp?: number,
    ) => {
        const xp = overrideXp ?? stats.correct * 2;
        addXP(xp);
        completedLesson();

        if (stats.mistakeCardIds.length > 0) {
            setMistakeIds(stats.mistakeCardIds);
            setMode(null);
        } else {
            router.push("/flashcard");
        }
    };

    const handleReset = async () => {
        if (!user) return;
        setResetting(true);
        try {
            await resetLesson(id);
            setMistakeIds([]);
            setMode(null);
            setShowResetConfirm(false);
        } finally {
            setResetting(false);
        }
    };

    // ── Mode selection ───────────────────────────────────────────────────────
    if (!mode || !session) {
        const learnCount = status.newCount;
        const practiceCount = status.dueCount;
        const mistakeCount = mistakeIds.length;

        return (
            <>
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F7F7F8] p-6">
                    {/* Deck identity */}
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div
                            className="mb-4 flex h-20 w-20 -rotate-3 items-center justify-center rounded-[1.75rem] border-b-6 text-white shadow-sm"
                            style={{ backgroundColor: themeHex, borderColor: `${themeHex}BB` }}
                        >
                            <span className="text-4xl font-black">{lesson.cardCount}</span>
                        </div>
                        <h1 className="text-2xl font-black text-[#3c3c3c]">{lesson.title}</h1>
                        <p className="mt-1 text-sm font-bold text-[#afafaf]">
                            {status.totalCount} cards total
                        </p>
                    </div>

                    {/* Progress summary pills */}
                    <div className="mb-8 flex gap-3">
                        <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
                            <div className="text-xl font-black text-[#1cb0f6]">
                                {status.newCount}
                            </div>
                            <div className="text-[9px] font-black tracking-widest text-[#afafaf] uppercase">
                                New
                            </div>
                        </div>
                        <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
                            <div className="text-xl font-black text-[#ff9600]">
                                {status.dueCount}
                            </div>
                            <div className="text-[9px] font-black tracking-widest text-[#afafaf] uppercase">
                                Due
                            </div>
                        </div>
                        <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
                            <div className="text-xl font-black text-[#58cc02]">
                                {status.totalCount - status.newCount}
                            </div>
                            <div className="text-[9px] font-black tracking-widest text-[#afafaf] uppercase">
                                Learned
                            </div>
                        </div>
                    </div>

                    {/* Mode buttons */}
                    <div className="flex w-full max-w-sm flex-col gap-3">
                        {action === "continue" && (
                            <ModeButton
                                label="Continue Learning"
                                sub={`${practiceCount} card${practiceCount !== 1 ? "s" : ""} due for review`}
                                icon={<RefreshCw size={22} strokeWidth={2.5} />}
                                color={themeHex}
                                primary
                                onClick={() => setMode("practice")}
                            />
                        )}
                        {action === "learn" && (
                            <ModeButton
                                label="Start Learning"
                                sub={`${learnCount} new card${learnCount !== 1 ? "s" : ""} to introduce`}
                                icon={<BookOpen size={22} strokeWidth={2.5} />}
                                color={themeHex}
                                primary
                                onClick={() => setMode("learn")}
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
                                onClick={() => setMode("learn")}
                            />
                        )}

                        {action !== "continue" && (
                            <ModeButton
                                label="Practice"
                                sub={
                                    practiceCount > 0
                                        ? `${practiceCount} cards due`
                                        : "Nothing due yet"
                                }
                                icon={<RefreshCw size={20} strokeWidth={2.5} />}
                                color="#ff9600"
                                disabled={practiceCount === 0 && status.newCount === 0}
                                onClick={() => setMode("practice")}
                            />
                        )}

                        {mistakeCount > 0 && (
                            <ModeButton
                                label="Review Mistakes"
                                sub={`${mistakeCount} card${mistakeCount !== 1 ? "s" : ""} to revisit`}
                                icon={<AlertCircle size={20} strokeWidth={2.5} />}
                                color="#ea2b2b"
                                onClick={() => setMode("mistake-review")}
                            />
                        )}

                        <div className="my-1 h-px w-full bg-gray-200" />

                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-[#afafaf] transition-colors hover:text-[#ea2b2b]"
                        >
                            <RotateCcw size={14} />
                            Reset Progress
                        </button>

                        <button
                            onClick={handleClose}
                            className="py-3 text-sm font-black text-[#afafaf] transition-colors hover:text-[#3c3c3c]"
                        >
                            Back to My Decks
                        </button>
                    </div>
                </div>

                {/* Reset Confirmation Modal */}
                {showResetConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
                        <div className="w-full max-w-sm rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-8 shadow-xl">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                                <RotateCcw size={28} className="text-[#ea2b2b]" />
                            </div>
                            <h2 className="mb-2 text-xl font-black text-[#3c3c3c]">
                                Reset Progress?
                            </h2>
                            <p className="mb-6 text-sm font-bold text-[#afafaf]">
                                This will reset all SRS progress for every card in{" "}
                                <span className="text-[#3c3c3c]">{lesson.title}</span>. All
                                intervals and review dates will be cleared. This cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    disabled={resetting}
                                    className="flex-1 rounded-2xl border-2 border-b-4 border-gray-200 bg-white py-3 text-sm font-black text-[#3c3c3c] transition-all hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void handleReset()}
                                    disabled={resetting}
                                    className="flex-1 rounded-2xl border-2 border-b-4 border-red-400 bg-[#ea2b2b] py-3 text-sm font-black text-white transition-all hover:bg-red-600 disabled:opacity-50"
                                >
                                    {resetting ? "Resetting…" : "Reset All"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ── Render active mode ───────────────────────────────────────────────────
    if (mode === "learn") {
        return (
            <FlashcardLearn
                lesson={lesson}
                cards={session.queue}
                onClose={handleClose}
                onAnswer={handleAnswer}
                onComplete={(stats) => void handleComplete(stats)}
            />
        );
    }

    if (mode === "practice") {
        return (
            <FlashcardPractice
                lesson={lesson}
                cards={session.queue}
                onClose={handleClose}
                onAnswer={handleAnswer}
                onComplete={(stats) => void handleComplete(stats)}
            />
        );
    }

    if (mode === "mistake-review") {
        return (
            <FlashcardMistakeReview
                lesson={lesson}
                cards={session.queue}
                onClose={handleClose}
                onAnswer={handleAnswer}
                onComplete={(stats) => void handleComplete(stats)}
            />
        );
    }

    return null;
}

// ─── Reusable mode button ─────────────────────────────────────────────────────

interface ModeButtonProps {
    label: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    primary?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

function ModeButton({
    label,
    sub,
    icon,
    color,
    primary = false,
    disabled = false,
    onClick,
}: ModeButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 px-5 py-4 text-left transition-all active:translate-y-[2px] active:border-b-2 ${
                disabled
                    ? "cursor-not-allowed opacity-40"
                    : "hover:-translate-y-0.5 hover:shadow-md"
            } ${primary ? "text-white shadow-sm" : "bg-white text-[#3c3c3c]"}`}
            style={
                primary
                    ? { backgroundColor: color, borderColor: `${color}BB` }
                    : { borderColor: "#e5e7eb" }
            }
        >
            <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={
                    primary
                        ? { backgroundColor: "rgba(255,255,255,0.2)" }
                        : { backgroundColor: `${color}18`, color }
                }
            >
                {icon}
            </div>
            <div className="flex-1">
                <div
                    className={`text-base font-black ${primary ? "text-white" : "text-[#3c3c3c]"}`}
                >
                    {label}
                </div>
                <div
                    className={`text-xs font-bold ${primary ? "text-white/70" : "text-[#afafaf]"}`}
                >
                    {sub}
                </div>
            </div>
        </button>
    );
}
