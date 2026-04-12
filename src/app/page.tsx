"use client";

import Link from "next/link";
import { BookOpen, Gamepad2, Trophy, Flame } from "lucide-react";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { StatCard } from "@/shared/components/ui";
import { BottomNav } from "@/shared/components/layout";
import { SPACING, SECTION_HEADING, CARD_INTERACTIVE } from "@/shared/constants";

export default function HomePage() {
    const { userData } = useUserProgress();
    const { lessons } = useLessons();
    const recentLessons = [...lessons]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 2);

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8]">
            <div
                className={`${SPACING.pagePadding} max-w-2xl mx-auto ${SPACING.sectionGap} pb-28 pt-6`}
            >
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#3c3c3c]">
                            Konnichiwa!
                        </h1>
                        <p className="text-[#afafaf] font-bold mt-1">
                            Ready to learn Japanese today?
                        </p>
                    </div>
                    <div className="w-16 h-16 bg-[#ff9600] rounded-2xl border-b-4 border-[#cc7800] flex items-center justify-center text-white font-black text-2xl shadow-sm transform rotate-3">
                        {userData.streak}
                        <Flame size={24} className="ml-1" fill="currentColor" />
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon={<Trophy className="text-[#ff9600] w-8 h-8" />}
                        title="Total XP"
                        value={userData.xp}
                    />
                    <StatCard
                        icon={<BookOpen className="text-[#1cb0f6] w-8 h-8" />}
                        title="Lessons Done"
                        value={userData.lessonsCompleted}
                    />
                </div>

                {/* Kana Section */}
                <div>
                    <h2 className={`${SECTION_HEADING} mb-4`}>Kana Practice</h2>
                    <Link
                        href="/kana"
                        className="block bg-gradient-to-br from-[#58cc02] to-[#1cb0f6] p-6 rounded-[2rem] shadow-sm border-2 border-b-8 border-[#46a302] text-white hover:-translate-y-1 hover:shadow-lg transition-all active:translate-y-[2px] active:border-b-4"
                    >
                        <div className="text-4xl font-medium mb-2">あ → ア</div>
                        <p className="font-black text-xl">
                            Master Hiragana &amp; Katakana
                        </p>
                        <p className="text-white/80 text-sm font-bold mt-1">
                            Learn, Quiz, Survival Mode &amp; more →
                        </p>
                    </Link>
                </div>

                {/* Flashcard Section */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className={SECTION_HEADING}>Jump Back In</h2>
                        <Link
                            href="/flashcard"
                            className="text-[#1cb0f6] font-black text-sm hover:text-[#149fdf]"
                        >
                            See all →
                        </Link>
                    </div>
                    <div className={`flex flex-col ${SPACING.cardGap}`}>
                        {recentLessons.length === 0 && (
                            <Link href="/flashcard/new">
                                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border-2 border-dashed border-gray-300 text-center text-[#afafaf] font-bold hover:border-[#1cb0f6] hover:text-[#1cb0f6] transition-colors cursor-pointer">
                                    + Create your first flashcard deck
                                </div>
                            </Link>
                        )}
                        {recentLessons.map((lesson) => (
                            <Link
                                key={lesson.id}
                                href={`/flashcard/${lesson.id}`}
                            >
                                <div
                                    className={`${CARD_INTERACTIVE} ${SPACING.cardPadding} flex justify-between items-center group`}
                                >
                                    <div>
                                        <h3 className="font-black text-lg text-[#3c3c3c] group-hover:text-black">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-sm font-bold text-[#afafaf]">
                                            {lesson.cards.length} cards
                                        </p>
                                    </div>
                                    <div className="bg-[#1cb0f6] text-white p-4 rounded-2xl border-b-4 border-[#1899d6] group-hover:bg-[#149fdf] transition-colors">
                                        <Gamepad2
                                            fill="currentColor"
                                            size={24}
                                        />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Nav */}
            <BottomNav />
        </div>
    );
}
