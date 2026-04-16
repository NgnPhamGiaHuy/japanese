/**
 * @file FlashcardStudyPage
 * Central entry point for studying a specific flashcard deck.
 * Handles mode selection (Learn, Practice, Mistake Review) based on SRS status.
 */

"use client";

import { notFound, useRouter, useSearchParams } from "next/navigation";
import { use, useMemo, useState } from "react";

import { AlertCircle, BookOpen, RefreshCw, RotateCcw } from "lucide-react";

import { FlashcardLearn, FlashcardMistakeReview, FlashcardPractice } from "@/features/flashcard";
import { useCards, useLessons } from "@/features/flashcard/hooks";
import {
    buildSession,
    getDeckStatus,
    processAnswer,
    recommendedAction,
} from "@/features/flashcard/logic";
import { useUserProgress } from "@/features/user/hooks";
import { Button } from "@/shared/components/ui";
import { useAppStore } from "@/store";

import type { StudyMode } from "@/features/flashcard/types/flashcard.types";

/**
 * Main Study Page Component
 *
 * @remarks
 * This component acts as an orchestrator for different study modes. It evaluates the
 * Spaced Repetition System (SRS) status of the deck to recommend "New" or "Due" cards.
 */
export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { lessons, loading: lessonsLoading } = useLessons();
    const { cards, loading: cardsLoading, resetLesson } = useCards(id);
    const { addXP, completedLesson } = useUserProgress();
    const { user } = useAppStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    /**
     * Current study mode. If null, the user is presented with the mode selection menu.
     */
    const initialMode = searchParams.get("mode") as StudyMode | null;
    const [mode, setMode] = useState<StudyMode | null>(initialMode);

    /**
     * Temporary storage for cards failed during the current session
     */
    const [mistakeIds, setMistakeIds] = useState<string[]>([]);

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    /**
     * Builds the study session queue based on the selected mode and card states.
     * Uses memoization to prevent unnecessary reshuffling of the queue.
     */
    const session = useMemo(() => {
        if (!mode) return null;
        return buildSession(cards, mode, mistakeIds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // Loading State: Centered spinner
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

    /**
     * Returns to the deck details page
     */
    const handleClose = () => router.push(`/flashcard/${id}`);

    /**
     * Processes an individual card answer and updates SRS data in the backend.
     *
     * @param card - The flashcard being reviewed
     * @param knew - Whether the user got the answer correct
     */
    const handleAnswer = async (
        card: import("@/features/flashcard/types/flashcard.types").FlashCard,
        knew: boolean,
    ) => {
        if (!user || !mode) return;
        await processAnswer(user.uid, card, knew);
    };

    /**
     * Handles session completion, XP calculation, and transition back or to mistakes.
     *
     * @param stats - Accumulated results from the study session
     * @param overrideXp - Optional fixed XP award (used for specialized modes)
     */
    const handleComplete = async (
        stats: import("@/features/flashcard/types/flashcard.types").StudyStats,
        overrideXp?: number,
    ) => {
        const xp = overrideXp ?? stats.correct * 2;
        addXP(xp);
        completedLesson();

        // If there were mistakes, offer a "Review Mistakes" session immediately
        if (stats.mistakeCardIds.length > 0) {
            setMistakeIds(stats.mistakeCardIds);
            setMode(null);
        } else {
            router.push("/flashcard");
        }
    };

    /**
     * Resets all SRS progress for this deck.
     * DANGEROUS: Clears all history for the current user.
     */
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
    // Rendered when no active session is running
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
                        {/* Primary Recommendation: Continue Practice (Due) */}
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
                        {/* Primary Recommendation: Start Learning (New) */}
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
                        {/* Empty State Recommendation */}
                        {action === "idle" && (
                            <div className="rounded-2xl border-2 border-[#e2f6e2] bg-[#f0faf0] p-4 text-center">
                                <p className="text-sm font-bold text-[#58cc02]">
                                    🎉 All caught up! Come back later for more reviews.
                                </p>
                            </div>
                        )}

                        <div className="my-1 h-px w-full bg-gray-200" />

                        {/* Secondary Options */}
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

                        <Button
                            variant="ghost"
                            onClick={() => setShowResetConfirm(true)}
                            className="!flex !items-center !justify-center !gap-2 !py-2 !text-sm !font-bold !text-[#afafaf] shadow-none transition-colors hover:!text-[#ea2b2b] hover:shadow-none active:translate-y-0"
                            icon={RotateCcw}
                            iconSize={14}
                        >
                            Reset Progress
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="!py-3 !text-sm !font-black !text-[#afafaf] shadow-none transition-colors hover:!text-[#3c3c3c] hover:shadow-none active:translate-y-0"
                        >
                            Back to Deck
                        </Button>
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
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowResetConfirm(false)}
                                    disabled={resetting}
                                    className="!flex-1 !rounded-2xl !border-2 !border-b-4 !border-gray-200 !bg-white !py-3 !text-sm !font-black !text-[#3c3c3c] shadow-none transition-all hover:!bg-gray-50 hover:shadow-none active:translate-y-0 disabled:opacity-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    color="red"
                                    onClick={() => void handleReset()}
                                    disabled={resetting}
                                    className="!flex-1 !rounded-2xl !border-2 !border-b-4 !py-3 !text-sm !font-black transition-all disabled:opacity-50"
                                >
                                    {resetting ? "Resetting…" : "Reset All"}
                                </Button>
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
    /** Main display text */
    label: string;
    /** Descriptive subtext (e.g., "5 cards due") */
    sub: string;
    /** Icon from lucide-react or custom SVG */
    icon: React.ReactNode;
    /** Brand color for the icon background/primary button state */
    color: string;
    /** If true, uses the color as background. If false, uses a clean white style. */
    primary?: boolean;
    /** Prevents interaction and reduces opacity */
    disabled?: boolean;
    onClick: () => void;
}

/**
 * Custom button for mode selection with a premium "Duolingo-style" aesthetic.
 */
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
        <Button
            variant="ghost"
            onClick={onClick}
            disabled={disabled}
            className={`!flex !w-full !items-center !gap-4 !rounded-2xl !border-2 !border-b-4 !px-5 !py-4 !text-left shadow-none !transition-all hover:shadow-none active:translate-y-[2px] active:border-b-2 ${
                disabled
                    ? "!cursor-not-allowed !opacity-40"
                    : "hover:!-translate-y-0.5 hover:!shadow-md"
            } ${primary ? "!text-white shadow-sm" : "!bg-white !text-[#3c3c3c]"}`}
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
            <div className="flex flex-1 flex-col">
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
        </Button>
    );
}
