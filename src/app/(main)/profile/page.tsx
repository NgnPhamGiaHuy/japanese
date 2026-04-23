"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Flame, LogOut, Settings, Trophy, ChevronRight, Zap } from "lucide-react";

import { useAdminRole } from "@/features/admin/context/AdminContext";
import { useLessons } from "@/features/flashcard/core/hooks";
import { useUserProgress } from "@/features/user/hooks";
import { signOut } from "@/features/user/services";
import { SCREEN_HEADER_BACK_BUTTON_CLASS, ScreenHeader } from "@/shared/components/layout";
import { Badge, Button, Card, StatCard } from "@/shared/components/ui";
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

    const totalAttempts = Object.values(userData.charStats).reduce((acc, s) => acc + s.attempts, 0);
    const totalCorrect = Object.values(userData.charStats).reduce((acc, s) => acc + s.correct, 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader
                title="Profile"
                right={
                    <Link
                        href="/settings"
                        className={SCREEN_HEADER_BACK_BUTTON_CLASS}
                        aria-label="Settings"
                    >
                        <Settings size={22} strokeWidth={2.5} />
                    </Link>
                }
            />

            <main className={`mx-auto max-w-2xl ${SPACING.pagePadding} pt-8 pb-12`}>
                <div className="space-y-10">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="rotate-3 transform overflow-hidden rounded-[3.5rem] border-4 border-white bg-white shadow-xl ring-8 ring-[#1cb0f6]/10">
                                {photoURL ? (
                                    <Image
                                        src={photoURL}
                                        alt={displayName}
                                        width={128}
                                        height={128}
                                        className="h-32 w-32 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-32 w-32 items-center justify-center bg-gradient-to-br from-[#1cb0f6] to-[#ce82ff] text-6xl font-black text-white">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-[#ff9600] text-sm font-black text-white shadow-lg">
                                {level}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <h2 className="text-3xl font-black text-[#3c3c3c]">
                                    {displayName}
                                </h2>
                                {role && (
                                    <Badge variant="danger" size="md" className="tracking-wider">
                                        {role === "superadmin" ? "Staff+" : "Staff"}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-base font-bold text-[#afafaf]">
                                Learning Japanese since {new Date().getFullYear()}
                            </p>
                        </div>

                        {/* XP Progress */}
                        <div className="mt-8 w-full max-w-md">
                            <div className="mb-2 flex items-end justify-between px-1">
                                <div className="text-left">
                                    <p className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                        Current Progress
                                    </p>
                                    <p className="text-sm font-black text-[#1cb0f6]">
                                        {xpInLevel} / {xpToNext} XP
                                    </p>
                                </div>
                                <p className="text-xs font-black text-[#ce82ff]">
                                    {Math.round((xpInLevel / xpToNext) * 100)}%
                                </p>
                            </div>
                            <div className="h-4 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(xpInLevel / xpToNext) * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#1cb0f6] via-[#ce82ff] to-[#1cb0f6] bg-[length:200%_100%]"
                                    style={{
                                        animation: "gradient-shift 3s linear infinite",
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Trophy size={14} className="text-[#afafaf]" />
                            <h3 className="text-[11px] font-black tracking-widest text-[#afafaf] uppercase">
                                Statistics
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
                            <StatCard
                                icon={<Flame className="h-7 w-7 text-[#ff9600]" />}
                                title="Day Streak"
                                value={userData.streak}
                                color="#ff9600"
                                index={1}
                            />
                            <StatCard
                                icon={<Zap className="h-7 w-7 text-[#ce82ff]" />}
                                title="Total XP"
                                value={userData.xp}
                                color="#ce82ff"
                                index={2}
                            />
                            <StatCard
                                icon={<BookOpen className="h-7 w-7 text-[#1cb0f6]" />}
                                title="Kana Known"
                                value={userData.learnedChars?.length || 0}
                                color="#1cb0f6"
                                index={3}
                            />
                        </div>
                    </section>

                    {/* Activity List */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Zap size={14} className="text-[#afafaf]" />
                            <h3 className="text-[11px] font-black tracking-widest text-[#afafaf] uppercase">
                                Recent Activity
                            </h3>
                        </div>
                        <Card padding="none" className="overflow-hidden border-b-8">
                            <div className="divide-y-2 divide-gray-100">
                                <ActivityRow
                                    label="Learning Decks"
                                    value={lessons.length}
                                    sub="Custom collections created"
                                />
                                <ActivityRow
                                    label="Lessons Finished"
                                    value={userData.lessonsCompleted}
                                    sub="Successful study sessions"
                                />
                                <ActivityRow
                                    label="Perfect Matches"
                                    value={accuracy !== null ? `${accuracy}%` : "—"}
                                    sub="Overall accuracy rate"
                                />
                            </div>
                        </Card>
                    </section>

                    {/* Danger Zone */}
                    <div className="pt-4">
                        <Button
                            variant="secondary"
                            color="red"
                            icon={LogOut}
                            onClick={handleSignOut}
                            className="w-full !rounded-[2rem] border-b-8 py-5 text-lg"
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ActivityRow({ label, value, sub }: { label: string; value: string | number; sub: string }) {
    return (
        <div className="flex items-center justify-between px-6 py-6 transition-colors hover:bg-gray-50/50">
            <div className="min-w-0 flex-1 pr-6">
                <div className="truncate text-lg font-black text-[#3c3c3c]">{label}</div>
                <div className="truncate text-sm font-bold text-[#afafaf]">{sub}</div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-xl font-black text-[#1cb0f6]">{value}</div>
                <ChevronRight size={20} className="shrink-0 opacity-20 text-[#3c3c3c]" />
            </div>
        </div>
    );
}
