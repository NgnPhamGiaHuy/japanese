"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { ChevronRight, Info, Languages, LogOut, Monitor, ShieldAlert, Volume2 } from "lucide-react";
import { m } from "motion/react";

import { useUserProgress } from "@/features/user/hooks";
import { signOut } from "@/features/user/services";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useAppStore } from "@/lib/app-store";
import { ScreenHeader } from "@/shared/components/layout";
import { Button, Card, ConfirmModal, UserMeta } from "@/shared/components/ui";
import { SPACING } from "@/shared/constants";

import type { LucideIcon } from "lucide-react";

interface SettingsPageClientProps {
    /** E14-T1 managed flag (locale_switch_enabled) — a kill switch for the UI control, not for /ja routing itself. */
    localeSwitchEnabled: boolean;
}

export default function SettingsPageClient({ localeSwitchEnabled }: SettingsPageClientProps) {
    const t = useTranslations("SettingsPage");
    const {
        user,
        useHandwriting,
        globalAutoPlay,
        sfxMuted,
        voiceMuted,
        toggleHandwriting,
        toggleAutoPlay,
        toggleSfxMuted,
        toggleVoiceMuted,
    } = useAppStore();
    const { resetProgress } = useUserProgress();
    const router = useRouter();
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <div className="bg-bg min-h-dvh pb-28">
            <ScreenHeader title={t("title")} backHref="/profile" />

            <main className={`mx-auto max-w-2xl ${SPACING.pagePadding} pt-6 pb-12`}>
                <div className="mb-10 flex flex-col items-center justify-center gap-4 text-center sm:mb-12">
                    <UserMeta
                        name={user?.displayName || t("guest")}
                        avatar={user?.photoURL || null}
                        subtitle={t("currentSession")}
                        className="scale-125"
                    />
                </div>

                <div className="space-y-10">
                    {/* Appearance */}
                    <SettingsSection title={t("appearance")} icon={Monitor}>
                        <SettingsToggle
                            label={t("handwritingFont")}
                            sub={t("handwritingFontSub")}
                            value={useHandwriting}
                            onToggle={toggleHandwriting}
                            color="purple"
                        />
                        {localeSwitchEnabled && (
                            <SettingsLocaleSwitch label={t("language")} sub={t("languageSub")} />
                        )}
                    </SettingsSection>

                    {/* Audio — three independent controls, so muting one never silences another */}
                    <SettingsSection title={t("audio")} icon={Volume2}>
                        <SettingsToggle
                            label={t("soundEffects")}
                            sub={t("soundEffectsSub")}
                            value={!sfxMuted}
                            onToggle={toggleSfxMuted}
                            color="orange"
                        />
                        <SettingsToggle
                            label={t("pronunciation")}
                            sub={t("pronunciationSub")}
                            value={!voiceMuted}
                            onToggle={toggleVoiceMuted}
                            color="green"
                        />
                        <SettingsToggle
                            label={t("autoPlay")}
                            sub={t("autoPlaySub")}
                            value={globalAutoPlay}
                            onToggle={toggleAutoPlay}
                            color="blue"
                        />
                    </SettingsSection>

                    {/* Account */}
                    <SettingsSection title={t("accountSecurity")} icon={LogOut}>
                        <SettingsAction
                            label={t("signOut")}
                            sub={t("signOutSub")}
                            onClick={handleSignOut}
                            variant="danger"
                        />
                    </SettingsSection>

                    {/* Data */}
                    <SettingsSection title={t("dataPrivacy")} icon={ShieldAlert}>
                        <SettingsAction
                            label={t("resetData")}
                            sub={t("resetDataSub")}
                            onClick={() => setShowResetConfirm(true)}
                            variant="danger"
                        />
                        <div className="px-6 py-6">
                            <p className="text-text text-lg font-black">
                                {t("pronunciationAudioTitle")}
                            </p>
                            <p className="text-muted text-sm font-bold">
                                {t("pronunciationAudioDescription")}
                            </p>
                        </div>
                    </SettingsSection>

                    {/* About */}
                    <SettingsSection title={t("about")} icon={Info}>
                        <div className="px-6 py-6">
                            <p className="text-text text-xl font-black">{t("appName")}</p>
                            <p className="text-muted text-sm font-bold">{t("appVersion")}</p>
                            <div className="mt-6 space-y-1 border-t-2 border-gray-100 pt-6">
                                <p className="text-muted text-xs font-bold">{t("kanaCredit")}</p>
                                <p className="text-muted text-xs font-bold">
                                    {t("firebaseCredit")}
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
                title={t("resetTitle")}
                message={t("resetMessage")}
                variant="danger"
                confirmText={t("resetConfirm")}
            />
        </div>
    );
}

// ─── Local Components ─────────────────────────────────────────────────────────

interface SettingsSectionProps {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}

function SettingsSection({ title, icon: Icon, children }: SettingsSectionProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-3">
                <Icon size={14} className="text-muted" />
                <h3 className="text-muted text-xs font-black tracking-widest uppercase">{title}</h3>
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
        blue: "!bg-katakana !border-katakana-strong",
        green: "!bg-hiragana !border-hiragana-strong",
        purple: "!bg-both !border-both-strong",
        orange: "!bg-survival !border-survival-strong",
    };

    return (
        <div className="flex items-center justify-between px-6 py-6 transition-colors hover:bg-gray-50/50">
            <div className="min-w-0 flex-1 pr-6">
                <div className="text-text text-lg font-black">{label}</div>
                <div className="text-muted text-sm font-bold">{sub}</div>
            </div>
            <Button
                variant="ghost"
                onClick={onToggle}
                role="switch"
                aria-checked={value}
                aria-label={label}
                className={`!relative !h-8 !w-14 !shrink-0 !rounded-full !border-2 !border-b-4 !p-0 shadow-none transition-all duration-200 hover:shadow-none active:translate-y-[2px] ${
                    value
                        ? colors[color]
                        : "!border-gray-300 !bg-gray-200 hover:!bg-gray-200 active:!bg-gray-200"
                }`}
            >
                <m.div
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
                <div className={`text-lg font-black ${isDanger ? "text-danger" : "text-text"}`}>
                    {label}
                </div>
                <div className="text-muted text-sm font-bold">{sub}</div>
            </div>
            <ChevronRight
                size={24}
                className={`!shrink-0 opacity-30 ${isDanger ? "text-danger" : "text-text"}`}
            />
        </Button>
    );
}

/** English/Japanese locale pill-switch. Navigates the current path in the target locale — the URL prefix changes, everything else about the page stays the same. */
function SettingsLocaleSwitch({ label, sub }: { label: string; sub: string }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className="flex items-center justify-between px-6 py-6 transition-colors hover:bg-gray-50/50">
            <div className="min-w-0 flex-1 pr-6">
                <div className="flex items-center gap-2">
                    <Languages size={16} className="text-muted" />
                    <div className="text-text text-lg font-black">{label}</div>
                </div>
                <div className="text-muted text-sm font-bold">{sub}</div>
            </div>
            <div className="border-both-strong flex shrink-0 gap-1 rounded-full border-2 border-b-4 bg-gray-100 p-1">
                {routing.locales.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => router.replace(pathname, { locale: option })}
                        aria-pressed={locale === option}
                        className={`rounded-full px-3 py-1.5 text-xs font-black tracking-wide uppercase transition-colors ${
                            locale === option
                                ? "bg-both text-white shadow-sm"
                                : "text-muted hover:text-text"
                        }`}
                    >
                        {option === "en" ? "EN" : "日本語"}
                    </button>
                ))}
            </div>
        </div>
    );
}
