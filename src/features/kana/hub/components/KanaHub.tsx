/**
 * KanaHub — Central hub for kana learning modes
 *
 * @remarks
 * Orchestrates navigation to different kana learning modes with progress tracking.
 */

"use client";

import { useTranslations } from "next-intl";

import { BarChart2, Brain, ChevronRight, Flame, PenTool, Play, Type, Volume2 } from "lucide-react";

import { AlphabetSwitcher } from "@/features/kana/components";
import { Link } from "@/i18n/navigation";
import { ActionCard } from "@/shared/components/ui";
import SettingsMenu from "./SettingsMenu";
import { useKanaHubState } from "../hooks/useKanaHubState";

export default function KanaHub() {
    const t = useTranslations("KanaHub");
    const tCommon = useTranslations("Common");
    const {
        alphabet,
        setAlphabet,
        showSettings,
        setShowSettings,
        showConfirmReset,
        setShowConfirmReset,
        useHandwriting,
        globalAutoPlay,
        toggleHandwriting,
        toggleAutoPlay,
        progressPct,
        learnedCount,
        totalChars,
        isBeginner,
        isBoth,
        themeColors,
        bestInfinity,
        handleResetProgress,
    } = useKanaHubState();

    const { primaryBg, primaryBorderB, primaryText } = themeColors;

    return (
        <div className="bg-bg min-h-dvh">
            <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-2xl px-4 pt-6 pb-28 duration-500">
                <AlphabetSwitcher value={alphabet} onChange={setAlphabet} />

                <div className="mb-6 flex w-full items-center justify-between md:mb-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl font-medium text-white md:h-16 md:w-16 md:rounded-2xl ${isBoth ? "px-1 text-center text-xl leading-tight font-black md:text-2xl" : "text-3xl md:text-4xl"} -rotate-6 transform border-b-4 shadow-sm transition-colors duration-500 ${primaryBg} ${primaryBorderB}`}
                        >
                            {isBoth ? "あ/ア" : alphabet === "hiragana" ? "あ" : "ア"}
                        </div>
                        <div>
                            <h1 className="text-text text-lg leading-tight font-black md:text-3xl">
                                {tCommon("brandName")}
                            </h1>
                            <p className="text-muted text-xs font-bold md:text-sm">
                                {t("levelLabel")}{" "}
                                <span className={primaryText}>
                                    {isBeginner ? t("novice") : t("scholar")}
                                </span>
                            </p>
                        </div>
                    </div>

                    <SettingsMenu
                        isOpen={showSettings}
                        onToggle={() => setShowSettings(!showSettings)}
                        primaryBg={primaryBg}
                        audioToggle={{
                            label: t("autoplayAudio"),
                            icon: Volume2,
                            value: globalAutoPlay,
                            onChange: () => {
                                toggleAutoPlay();
                                setShowSettings(false);
                            },
                        }}
                        displayToggle={{
                            label: t("handwritingFont"),
                            icon: Type,
                            value: useHandwriting,
                            onChange: () => {
                                toggleHandwriting();
                                setShowSettings(false);
                            },
                        }}
                        dangerAction={{
                            label: t("resetProgress"),
                            showConfirm: showConfirmReset,
                            onRequestConfirm: () => setShowConfirmReset(true),
                            onCancelConfirm: () => setShowConfirmReset(false),
                            onConfirm: handleResetProgress,
                            confirmText: t("wipeIt"),
                        }}
                    />
                </div>

                <div className="flex w-full flex-col gap-8 pb-6 md:gap-10">
                    <div className="flex flex-col gap-3 md:gap-4">
                        <h2 className="pl-2 text-xs font-black tracking-widest text-gray-600 uppercase md:text-sm">
                            {t("upNextForYou")}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
                            <div className="md:col-span-2">
                                {isBeginner ? (
                                    <ActionCard
                                        href="/kana/learn"
                                        primary
                                        icon={
                                            <Play
                                                size={28}
                                                strokeWidth={2.5}
                                                fill="currentColor"
                                                className="md:h-8 md:w-8"
                                            />
                                        }
                                        title={t("learnCharacters")}
                                        progress={{
                                            value: progressPct,
                                            label: t("masteredProgress", {
                                                learned: learnedCount,
                                                total: totalChars,
                                            }),
                                        }}
                                        {...themeColors}
                                    />
                                ) : (
                                    <ActionCard
                                        href="/kana/quiz"
                                        primary
                                        icon={
                                            <Brain
                                                size={28}
                                                strokeWidth={2.5}
                                                className="md:h-10 md:w-10"
                                            />
                                        }
                                        title={tCommon("recallQuiz")}
                                        subtitle={t("dailyReviewReady")}
                                        badge={
                                            <ChevronRight
                                                size={28}
                                                strokeWidth={3}
                                                className="ml-2 shrink-0 text-white opacity-50 md:h-8 md:w-8"
                                            />
                                        }
                                        className="flex-row items-center text-left"
                                        primaryBg="bg-both"
                                        primaryBorderB="border-both-strong"
                                        primaryHover="hover:bg-both-strong"
                                        primaryText="text-both"
                                        primaryBgLight="bg-both/10"
                                    />
                                )}
                            </div>
                            <div className="md:col-span-1">
                                {isBeginner ? (
                                    <ActionCard
                                        href="/kana/quiz"
                                        icon={
                                            <Brain
                                                size={32}
                                                strokeWidth={2.5}
                                                className="md:h-10 md:w-10"
                                            />
                                        }
                                        title={tCommon("recallQuiz")}
                                        primaryBg="bg-both"
                                        primaryBorderB="border-both-strong"
                                        primaryHover="hover:bg-both-strong"
                                        primaryText="text-both"
                                        primaryBgLight="bg-both/10"
                                    />
                                ) : (
                                    <ActionCard
                                        href="/kana/learn"
                                        icon={
                                            <Play
                                                size={28}
                                                strokeWidth={2.5}
                                                fill="currentColor"
                                                className="md:h-8 md:w-8"
                                            />
                                        }
                                        title={t("learnCharacters")}
                                        progress={{
                                            value: progressPct,
                                            label: t("masteredProgress", {
                                                learned: learnedCount,
                                                total: totalChars,
                                            }),
                                        }}
                                        {...themeColors}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 md:gap-4">
                        <h2 className="pl-2 text-xs font-black tracking-widest text-gray-600 uppercase md:text-sm">
                            {t("practiceAndChallenges")}
                        </h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
                            <Link
                                href="/kana/practice"
                                className="group focus-visible:ring-katakana flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-b-4 border-gray-200 bg-white p-5 font-extrabold text-[#00d1e0] shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[2px] active:border-b-2 md:rounded-4xl md:p-6"
                            >
                                <div className="mb-3 flex items-center justify-center rounded-xl bg-[#00d1e0]/10 p-3 transition-transform group-hover:scale-110 md:mb-4 md:rounded-2xl md:p-4">
                                    <PenTool
                                        size={28}
                                        strokeWidth={2.5}
                                        className="md:h-8 md:w-8"
                                    />
                                </div>
                                <span className="text-text text-sm group-hover:text-black md:text-lg">
                                    {t("writing")}
                                </span>
                            </Link>

                            <Link
                                href="/kana/survival"
                                className="group text-survival focus-visible:ring-katakana relative flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-b-4 border-gray-200 bg-white p-5 font-extrabold shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[2px] active:border-b-2 md:rounded-4xl md:p-6"
                            >
                                <div className="bg-survival/10 mb-3 flex items-center justify-center rounded-xl p-3 transition-transform group-hover:scale-110 md:mb-4 md:rounded-2xl md:p-4">
                                    <Flame size={28} strokeWidth={2.5} className="md:h-8 md:w-8" />
                                </div>
                                <span className="text-text text-sm group-hover:text-black md:text-lg">
                                    {t("survival")}
                                </span>
                                {bestInfinity > 0 && (
                                    <span className="bg-survival absolute top-3 right-3 rounded-full px-2 py-0.5 text-xs font-black text-white shadow-sm md:text-xs">
                                        {t("infinityBadge", { count: bestInfinity })}
                                    </span>
                                )}
                            </Link>

                            <Link
                                href="/kana/chart"
                                className="group focus-visible:ring-katakana col-span-2 flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-b-4 border-gray-200 bg-white p-5 font-extrabold text-slate-500 shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:border-gray-300 hover:text-slate-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-[2px] active:border-b-2 md:col-span-1 md:rounded-4xl md:p-6"
                            >
                                <div className="mb-3 flex items-center justify-center rounded-xl bg-slate-100 p-3 text-slate-500 transition-transform group-hover:scale-110 group-hover:text-slate-700 md:mb-4 md:rounded-2xl md:p-4">
                                    <BarChart2
                                        size={28}
                                        strokeWidth={2.5}
                                        className="md:h-8 md:w-8"
                                    />
                                </div>
                                <span className="text-text text-sm group-hover:text-black md:text-lg">
                                    {t("referenceChart")}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
