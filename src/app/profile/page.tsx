"use client";

import { Flame, Trophy, BookOpen } from "lucide-react";
import { useUserProgress } from "@/features/user/hooks/useUserProgress";
import { useLessons } from "@/features/flashcard/hooks/useLessons";
import { useKanaStore } from "@/store/useKanaStore";
import { StatCard } from "@/shared/components/ui";
import { BottomNav, ScreenHeader } from "@/shared/components/layout";
import { SPACING } from "@/shared/constants";

export default function ProfilePage() {
    const { userData } = useUserProgress();
    const { lessons } = useLessons();
    const { learnedChars } = useKanaStore();

    const level = Math.floor(userData.xp / 500) + 1;
    const xpInLevel = userData.xp % 500;
    const xpToNext = 500;

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader title="Profile" />
            <div className={`max-w-md mx-auto ${SPACING.pagePadding} pt-6`}>
                {/* Avatar */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-28 h-28 bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] rounded-[3rem] flex items-center justify-center text-white text-6xl font-medium mb-4 shadow-sm border-b-8 border-[#1899d6] transform -rotate-3">
                        あ
                    </div>
                    <h2 className="text-2xl font-black text-[#3c3c3c]">
                        Learner
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#ff9600] font-black text-lg">
                            Lv.{level}
                        </span>
                        <span className="text-[#afafaf] font-bold text-base">
                            ·
                        </span>
                        <span className="text-[#afafaf] font-bold text-sm">
                            {userData.xp} XP total
                        </span>
                    </div>
                    <div className="w-full mt-4">
                        <div className="flex justify-between text-xs font-bold text-[#afafaf] mb-1">
                            <span>Level {level}</span>
                            <span>
                                {xpInLevel} / {xpToNext} XP
                            </span>
                            <span>Level {level + 1}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#1cb0f6] to-[#ce82ff] rounded-full transition-all duration-500"
                                style={{
                                    width: `${(xpInLevel / xpToNext) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <StatCard
                        icon={<Flame className="text-[#ff9600] w-7 h-7" />}
                        title="Day Streak"
                        value={userData.streak}
                    />
                    <StatCard
                        icon={<Trophy className="text-[#ce82ff] w-7 h-7" />}
                        title="Total XP"
                        value={userData.xp}
                    />
                    <StatCard
                        icon={<BookOpen className="text-[#1cb0f6] w-7 h-7" />}
                        title="Kana Known"
                        value={learnedChars.length}
                    />
                </div>

                {/* Activity */}
                <div className="bg-white p-6 rounded-[2rem] border-2 border-b-4 border-gray-200 shadow-sm">
                    <h3 className="font-black text-[#3c3c3c] text-lg mb-4">
                        Activity
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <span className="font-bold text-[#afafaf]">
                                Decks created
                            </span>
                            <span className="font-black text-[#3c3c3c]">
                                {lessons.length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <span className="font-bold text-[#afafaf]">
                                Lessons completed
                            </span>
                            <span className="font-black text-[#3c3c3c]">
                                {userData.lessonsCompleted}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
}
