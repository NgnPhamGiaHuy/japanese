"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Music, ShieldAlert, LogOut, Info, ChevronRight } from "lucide-react";

import { useUserProgress } from "@/features/user/hooks";
import { signOut } from "@/features/user/services";
import { ScreenHeader } from "@/shared/components/layout";
import { Button, Card, ConfirmModal, UserMeta } from "@/shared/components/ui";
import { SPACING } from "@/shared/constants";
import { useAppStore } from "@/store";

export default function SettingsPage() {
    const { user, useHandwriting, globalAutoPlay, toggleHandwriting, toggleAutoPlay } =
        useAppStore();
    const { resetProgress } = useUserProgress();
    const router = useRouter();
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader title="Settings" backHref="/profile" />

            <main className={`mx-auto max-w-2xl ${SPACING.pagePadding} pt-6 pb-12`}>
                <div className="mb-10 flex flex-col items-center justify-center gap-4 text-center sm:mb-12">
                    <UserMeta
                        name={user?.displayName || "Guest"}
                        avatar={user?.photoURL || null}
                        subtitle="Current Session"
                        className="scale-125"
                    />
                </div>

                <div className="space-y-10">
                    {/* Appearance & Audio */}
                    <SettingsSection title="Appearance" icon={Monitor}>
                        <SettingsToggle
                            label="Handwriting Font"
                            sub="Use brush-style kana font"
                            value={useHandwriting}
                            onToggle={toggleHandwriting}
                            color="purple"
                        />
                        <SettingsToggle
                            label="Auto-Play Audio"
                            sub="Read kana aloud automatically"
                            value={globalAutoPlay}
                            onToggle={toggleAutoPlay}
                            color="blue"
                        />
                    </SettingsSection>

                    {/* Account */}
                    <SettingsSection title="Account & Security" icon={LogOut}>
                        <SettingsAction
                            label="Sign Out"
                            sub="Log out of your account"
                            onClick={handleSignOut}
                            variant="danger"
                        />
                    </SettingsSection>

                    {/* Data */}
                    <SettingsSection title="Data & Privacy" icon={ShieldAlert}>
                        <SettingsAction
                            label="Reset Progress Data"
                            sub="Clear learned characters and accuracy stats"
                            onClick={() => setShowResetConfirm(true)}
                            variant="danger"
                        />
                    </SettingsSection>

                    {/* About */}
                    <SettingsSection title="About" icon={Info}>
                        <div className="px-6 py-6">
                            <p className="text-xl font-black text-[#3c3c3c]">
                                Kana &amp; Nihongo Master
                            </p>
                            <p className="text-sm font-bold text-[#afafaf]">
                                Unified Japanese learning app · v2.0
                            </p>
                            <div className="mt-6 space-y-1 border-t-2 border-gray-100 pt-6">
                                <p className="text-xs font-bold text-[#afafaf]">
                                    Kana data from KanjiVG
                                </p>
                                <p className="text-xs font-bold text-[#afafaf]">
                                    Powered by Firebase
                                </p>
                            </div>
                        </div>
                    </SettingsSection>
                </div>
            </main>

            <ConfirmModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={() => {
                    resetProgress();
                    setShowResetConfirm(false);
                }}
                title="Reset Progress?"
                message="This will permanently clear all your learned characters and accuracy stats. This action cannot be undone."
                variant="danger"
                confirmText="Reset Everything"
            />
        </div>
    );
}

// ─── Local Components ─────────────────────────────────────────────────────────

interface SettingsSectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
}

function SettingsSection({ title, icon: Icon, children }: SettingsSectionProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-3">
                <Icon size={14} className="text-[#afafaf]" />
                <h3 className="text-[11px] font-black tracking-widest text-[#afafaf] uppercase">
                    {title}
                </h3>
            </div>
            <Card padding="none" className="overflow-hidden border-b-8">
                <div className="divide-y-2 divide-gray-100">{children}</div>
            </Card>
        </section>
    );
}

function SettingsToggle({
    label,
    sub,
    value,
    onToggle,
    color,
}: {
    label: string;
    sub: string;
    value: boolean;
    onToggle: () => void;
    color: "blue" | "green" | "purple" | "orange";
}) {
    const colors = {
        blue: "!bg-[#1cb0f6] !border-[#1899d6]",
        green: "!bg-[#58cc02] !border-[#58a700]",
        purple: "!bg-[#ce82ff] !border-[#b65ce8]",
        orange: "!bg-[#ff9600] !border-[#cc7800]",
    };

    return (
        <div className="flex items-center justify-between px-6 py-6 transition-colors hover:bg-gray-50/50">
            <div className="min-w-0 flex-1 pr-6">
                <div className="text-lg font-black text-[#3c3c3c]">{label}</div>
                <div className="text-sm font-bold text-[#afafaf]">{sub}</div>
            </div>
            <Button
                variant="ghost"
                onClick={onToggle}
                className={`!relative !h-8 !w-14 !shrink-0 !rounded-full !border-2 !border-b-4 !p-0 shadow-none transition-all duration-200 hover:shadow-none active:translate-y-[2px] ${
                    value
                        ? colors[color]
                        : "!border-gray-300 !bg-gray-200 hover:!bg-gray-200 active:!bg-gray-200"
                }`}
            >
                <motion.div
                    animate={{ x: value ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                />
            </Button>
        </div>
    );
}

function SettingsAction({
    label,
    sub,
    onClick,
    variant = "default",
}: {
    label: string;
    sub: string;
    onClick: () => void;
    variant?: "default" | "danger";
}) {
    const isDanger = variant === "danger";

    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={`!flex !w-full !items-center !justify-between !rounded-none !px-6 !py-6 !text-left shadow-none transition-colors hover:shadow-none active:translate-y-0 ${
                isDanger ? "hover:!bg-red-50" : "hover:!bg-gray-50"
            }`}
        >
            <div className="min-w-0 flex-1 pr-6">
                <div
                    className={`text-lg font-black ${isDanger ? "text-[#ea2b2b]" : "text-[#3c3c3c]"}`}
                >
                    {label}
                </div>
                <div className="text-sm font-bold text-[#afafaf]">{sub}</div>
            </div>
            <ChevronRight
                size={24}
                className={`!shrink-0 opacity-30 ${isDanger ? "text-[#ea2b2b]" : "text-[#3c3c3c]"}`}
            />
        </Button>
    );
}
