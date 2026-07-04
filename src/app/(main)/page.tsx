"use client";

import Link from "next/link";

import { AlertTriangle, BookOpen, Clock, Flame, Gamepad2, Trophy } from "lucide-react";

import { useCardsWithProgress, useLessons } from "@/features/flashcard/hooks";
import { getDueCards } from "@/features/flashcard/utils/learningEngine";
import { useUserProgress } from "@/features/user/hooks";
import { useAppStore } from "@/lib/app-store";
import { Button, Card, StatCard } from "@/shared/components/ui";
import { SECTION_HEADING, SPACING } from "@/shared/constants";

export default function HomePage() {
    const { userData } = useUserProgress();
    const { user } = useAppStore();
    const { lessons } = useLessons();

    // Load all the user's own cards merged with their progress.
    // ownerId === user.uid because this is the dashboard for personal decks only.
    const { cards } = useCardsWithProgress("", user?.uid ?? "");

    const recentLessons = [...lessons].sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
    const dueCards = getDueCards(cards);

    // easeFactor lives on UserCardProgress — safe to read from CardWithProgress
    const weakCards = cards.filter((c) => c.easeFactor < 2.0);

    return (
        <div className="min-h-dvh bg-bg">
            <div
                className={`${SPACING.pagePadding} mx-auto max-w-2xl ${SPACING.sectionGap} pt-6 pb-28`}
            >
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-text">
                            Konnichiwa!
                        </h1>
                        <p className="mt-1 font-bold text-muted">
                            Ready to learn Japanese today?
                        </p>
                    </div>
                    <div className="flex h-16 w-16 rotate-3 transform items-center justify-center rounded-2xl border-b-4 border-survival-strong bg-survival text-2xl font-black text-white shadow-sm">
                        {userData.streak}
                        <Flame size={24} className="ml-1" fill="currentColor" />
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon={<Trophy className="h-8 w-8 text-survival" />}
                        title="Total XP"
                        value={userData.xp}
                    />
                    <StatCard
                        icon={<BookOpen className="h-8 w-8 text-katakana" />}
                        title="Lessons Done"
                        value={userData.lessonsCompleted}
                    />
                </div>

                {/* Deck Learning System Overview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col justify-between rounded-4xl border-2 border-b-8 border-katakana-strong bg-katakana p-6 text-white shadow-sm">
                        <div>
                            <Clock size={32} className="mb-2 opacity-80" />
                            <div className="text-4xl font-black">{dueCards.length}</div>
                            <h3 className="text-xs font-black tracking-widest text-white/90 uppercase">
                                Daily Reviews
                            </h3>
                        </div>
                        <Button
                            variant="ghost"
                            className="mt-4 bg-white text-katakana hover:bg-gray-100"
                            onClick={() => (window.location.href = "/flashcard")}
                        >
                            Review Now
                        </Button>
                    </div>
                    <div className="flex flex-col justify-between rounded-4xl border-2 border-b-8 border-[#ea2b2b] bg-[#ff4b4b] p-6 text-white shadow-sm">
                        <div>
                            <AlertTriangle size={32} className="mb-2 opacity-80" />
                            <div className="text-4xl font-black">{weakCards.length}</div>
                            <h3 className="text-xs font-black tracking-widest text-white/90 uppercase">
                                Weak Cards
                            </h3>
                        </div>
                        <Button
                            variant="ghost"
                            className="mt-4 bg-white text-[#ff4b4b] hover:bg-gray-100"
                            onClick={() => (window.location.href = "/flashcard")}
                        >
                            Practice Weak
                        </Button>
                    </div>
                </div>

                {/* Kana Section */}
                <div>
                    <h2 className={`${SECTION_HEADING} mb-4`}>Kana Practice</h2>
                    <Link
                        href="/kana"
                        className="block rounded-4xl border-2 border-b-8 border-hiragana-hover bg-gradient-to-br from-hiragana to-katakana p-6 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-katakana focus-visible:ring-offset-2 active:translate-y-[2px] active:border-b-4"
                    >
                        <div className="mb-2 text-4xl font-medium">あ → ア</div>
                        <p className="text-xl font-black">Master Hiragana &amp; Katakana</p>
                        <p className="mt-1 text-sm font-bold text-white/80">
                            Learn, Quiz, Survival Mode &amp; more →
                        </p>
                    </Link>
                </div>

                {/* Flashcard Section */}
                <div>
                    <div className="mb-4 flex items-end justify-between">
                        <h2 className={SECTION_HEADING}>Jump Back In</h2>
                        <Link
                            href="/flashcard"
                            className="rounded-md text-sm font-black text-katakana hover:text-katakana-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-katakana focus-visible:ring-offset-2"
                        >
                            See all →
                        </Link>
                    </div>
                    <div className={`flex flex-col ${SPACING.cardGap}`}>
                        {recentLessons.map((lesson) => (
                            <Link key={lesson.id} href={`/flashcard/${lesson.id}`}>
                                <Card
                                    interactive
                                    padding="compact"
                                    className="group flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="text-lg font-black text-text group-hover:text-black">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-sm font-bold text-muted">
                                            {lesson.cardCount} cards
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border-b-4 border-katakana-strong bg-katakana p-4 text-white transition-colors group-hover:bg-katakana-hover">
                                        <Gamepad2 fill="currentColor" size={24} />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
