"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BookOpen, Flame, LogOut, Settings, Trophy } from "lucide-react";

import { useLessons } from "@/features/flashcard/core/hooks";
import { useAdminRole } from "@/features/admin/context/AdminContext";
import { useUserProgress } from "@/features/user/hooks";
import { signOut } from "@/features/user/services";
import { SCREEN_HEADER_BACK_BUTTON_CLASS, ScreenHeader } from "@/shared/components/layout";
import { Button, StatCard } from "@/shared/components/ui";
import { SPACING } from "@/shared/constants";
import { useAppStore } from "@/store";

export default function ProfilePage() {
    const { userData } = useUserProgress();
    const { lessons } = useLessons();
    const { role } = useAdminRole();
    const user = useAppStore((s) => s.user);
    const router = useRouter();

    const displayName = user?.displayName ?? "Learner";
    const photoURL = user?.photoURL ?? null;

    const level = Math.floor(userData.xp / 500) + 1;
    const xpInLevel = userData.xp % 500;
    const xpToNext = 500;

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="Profile"
                right={
                    <div className="flex gap-1">
                        <Link
                            href="/settings"
                            className={SCREEN_HEADER_BACK_BUTTON_CLASS}
                            aria-label="Settings"
                        >
                            <Settings size={22} strokeWidth={2.5} />
                        </Link>
                    </div>
                }
            />
            <div className={`mx-auto max-w-md ${SPACING.pagePadding} pt-6`}>
                {/* Avatar */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 -rotate-3 transform overflow-hidden rounded-[3rem] border-b-8 border-[#1899d6] shadow-sm">
                        {photoURL ? (
                            <Image
                                src={photoURL}
                                alt={displayName}
                                width={112}
                                height={112}
                                className="h-28 w-28 object-cover"
                            />
                        ) : (
                            <div className="flex h-28 w-28 items-center justify-center bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] text-6xl font-medium text-white">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <h2 className="text-2xl font-black text-[#3c3c3c]">{displayName}</h2>
                        {role && (
                            <div className="flex items-center rounded-full border border-[#ea2b2b] bg-[#ea2b2b]/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#ea2b2b] uppercase">
                                {role === "superadmin" ? "Super Staff" : "Staff"}
                            </div>
                        )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-black text-[#ff9600]">Lv.{level}</span>
                        <span className="text-base font-bold text-[#afafaf]">·</span>
                        <span className="text-sm font-bold text-[#afafaf]">
                            {userData.xp} XP total
                        </span>
                    </div>
                    <div className="mt-4 w-full">
                        <div className="mb-1 flex justify-between text-xs font-bold text-[#afafaf]">
                            <span>Level {level}</span>
                            <span>
                                {xpInLevel} / {xpToNext} XP
                            </span>
                            <span>Level {level + 1}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#1cb0f6] to-[#ce82ff] transition-all duration-500"
                                style={{
                                    width: `${(xpInLevel / xpToNext) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="mb-8 grid grid-cols-3 gap-3">
                    <StatCard
                        icon={<Flame className="h-7 w-7 text-[#ff9600]" />}
                        title="Day Streak"
                        value={userData.streak}
                    />
                    <StatCard
                        icon={<Trophy className="h-7 w-7 text-[#ce82ff]" />}
                        title="Total XP"
                        value={userData.xp}
                    />
                    <StatCard
                        icon={<BookOpen className="h-7 w-7 text-[#1cb0f6]" />}
                        title="Kana Known"
                        value={userData.learnedChars?.length || 0}
                    />
                </div>

                {/* Activity */}
                <div className="mb-10 rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-black text-[#3c3c3c]">Activity</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                            <span className="font-bold text-[#afafaf]">Decks created</span>
                            <span className="font-black text-[#3c3c3c]">{lessons.length}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                            <span className="font-bold text-[#afafaf]">Lessons completed</span>
                            <span className="font-black text-[#3c3c3c]">
                                {userData.lessonsCompleted}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Log Out Button */}
                <Button
                    variant="secondary"
                    color="red"
                    icon={LogOut}
                    onClick={handleSignOut}
                    className="w-full py-5 text-lg"
                >
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
