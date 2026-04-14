"use client";

import Link from "next/link";

import { AlertTriangle, BookOpen, Clock, Flame, Gamepad2, Trophy } from "lucide-react";

import { getDueCards, useCards, useLessons } from "@/features/flashcard";
import { useUserProgress } from "@/features/user";
import { Button, StatCard } from "@/shared/components/ui";
import { CARD_INTERACTIVE, SECTION_HEADING, SPACING } from "@/shared/constants";

export default function HomePage() {
    const { userData } = useUserProgress();
    const { lessons } = useLessons();
    const { cards } = useCards();
    const recentLessons = [...lessons].sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
    const dueCards = getDueCards(cards);
    const weakCards = cards.filter((c) => c.easeFactor < 2.0);

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8]">
            <div
                className={`${SPACING.pagePadding} mx-auto max-w-2xl ${SPACING.sectionGap} pt-6 pb-28`}
            >
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#3c3c3c]">
                            Konnichiwa!
                        </h1>
                        <p className="mt-1 font-bold text-[#afafaf]">
                            Ready to learn Japanese today?
                        </p>
                    </div>
                    <div className="flex h-16 w-16 rotate-3 transform items-center justify-center rounded-2xl border-b-4 border-[#cc7800] bg-[#ff9600] text-2xl font-black text-white shadow-sm">
                        {userData.streak}
                        <Flame size={24} className="ml-1" fill="currentColor" />
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon={<Trophy className="h-8 w-8 text-[#ff9600]" />}
                        title="Total XP"
                        value={userData.xp}
                    />
                    <StatCard
                        icon={<BookOpen className="h-8 w-8 text-[#1cb0f6]" />}
                        title="Lessons Done"
                        value={userData.lessonsCompleted}
                    />
                </div>

                {/* Deck Learning System Overview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col justify-between rounded-[2rem] border-2 border-b-8 border-[#1899d6] bg-[#1cb0f6] p-6 text-white shadow-sm">
                        <div>
                            <Clock size={32} className="mb-2 opacity-80" />
                            <div className="text-4xl font-black">{dueCards.length}</div>
                            <h3 className="font-bold">Daily Reviews</h3>
                        </div>
                        <Button
                            variant="ghost"
                            className="mt-4 bg-white text-[#1cb0f6] hover:bg-gray-100"
                            onClick={() => (window.location.href = "/flashcard")}
                        >
                            Review Now
                        </Button>
                    </div>
                    <div className="flex flex-col justify-between rounded-[2rem] border-2 border-b-8 border-[#ea2b2b] bg-[#ff4b4b] p-6 text-white shadow-sm">
                        <div>
                            <AlertTriangle size={32} className="mb-2 opacity-80" />
                            <div className="text-4xl font-black">{weakCards.length}</div>
                            <h3 className="font-bold">Weak Cards</h3>
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
                        className="block rounded-[2rem] border-2 border-b-8 border-[#46a302] bg-gradient-to-br from-[#58cc02] to-[#1cb0f6] p-6 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:border-b-4"
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
                            className="text-sm font-black text-[#1cb0f6] hover:text-[#149fdf]"
                        >
                            See all →
                        </Link>
                    </div>
                    <div className={`flex flex-col ${SPACING.cardGap}`}>
                        {recentLessons.map((lesson) => (
                            <Link key={lesson.id} href={`/flashcard/${lesson.id}`}>
                                <div
                                    className={`${CARD_INTERACTIVE} ${SPACING.cardPadding} group flex items-center justify-between`}
                                >
                                    <div>
                                        <h3 className="text-lg font-black text-[#3c3c3c] group-hover:text-black">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-sm font-bold text-[#afafaf]">
                                            {lesson.cardCount} cards
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] p-4 text-white transition-colors group-hover:bg-[#149fdf]">
                                        <Gamepad2 fill="currentColor" size={24} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
