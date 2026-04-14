"use client";

import Link from "next/link";
import { useState } from "react";

import {
    BarChart2,
    Brain,
    ChevronRight,
    Flame,
    PenTool,
    Play,
    Settings,
    Trash2,
    Type,
    Volume2,
} from "lucide-react";

import { AlphabetSwitcher } from "@/features/kana/components";
import { useKanaDataset } from "@/features/kana/hooks";
import { useBestScores, useUserProgress } from "@/features/user/hooks";
import { HANDWRITING_FONT, PRINT_FONT } from "@/shared/constants";
import { useAppStore } from "@/store";

function KanaSettingsMenu({
    primaryBg,
    globalAutoPlay,
    useHandwriting,
    showConfirmReset,
    onToggleAutoPlay,
    onToggleHandwriting,
    onRequestReset,
    onCancelResetConfirm,
    onWipeProgress,
}: {
    primaryBg: string;
    globalAutoPlay: boolean;
    useHandwriting: boolean;
    showConfirmReset: boolean;
    onToggleAutoPlay: () => void;
    onToggleHandwriting: () => void;
    onRequestReset: () => void;
    onCancelResetConfirm: () => void;
    onWipeProgress: () => void;
}) {
    return (
        <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-56 rounded-[1rem] border-2 border-gray-200 bg-white p-2 shadow-xl duration-200">
            <div className="mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-gray-500 uppercase">
                Audio Preferences
            </div>
            <button
                type="button"
                onClick={onToggleAutoPlay}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-[#3c3c3c] transition-colors hover:bg-gray-50"
            >
                <span className="flex items-center gap-2">
                    <Volume2 size={16} className="text-gray-500" /> Autoplay Audio
                </span>
                <div
                    className={`flex h-6 w-10 items-center rounded-full px-1 transition-colors ${globalAutoPlay ? primaryBg : "bg-gray-200"}`}
                >
                    <div
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${globalAutoPlay ? "translate-x-4" : "translate-x-0"}`}
                    />
                </div>
            </button>

            <div className="mt-2 mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-gray-500 uppercase">
                Display Preferences
            </div>
            <button
                type="button"
                onClick={onToggleHandwriting}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-[#3c3c3c] transition-colors hover:bg-gray-50"
            >
                <span className="flex items-center gap-2">
                    <Type size={16} className="text-gray-500" /> Handwriting Font
                </span>
                <div
                    className={`flex h-6 w-10 items-center rounded-full px-1 transition-colors ${useHandwriting ? primaryBg : "bg-gray-200"}`}
                >
                    <div
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${useHandwriting ? "translate-x-4" : "translate-x-0"}`}
                    />
                </div>
            </button>

            <div className="mt-2 mb-1 border-b border-gray-100 px-3 py-2 text-xs font-black tracking-wider text-red-500 uppercase">
                Danger Zone
            </div>
            {!showConfirmReset ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRequestReset();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
                >
                    <Trash2 size={16} /> Reset Progress
                </button>
            ) : (
                <div className="animate-in zoom-in mt-1 flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 duration-200">
                    <span className="text-xs font-bold text-red-600">
                        Are you sure? This cannot be undone.
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onWipeProgress}
                            className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-600"
                        >
                            Wipe it
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelResetConfirm();
                            }}
                            className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function LearnActionCard({
    primary,
    progressPct,
    learnedCount,
    totalChars,
    primaryBg,
    primaryBorderB,
    primaryHover,
    primaryText,
    primaryBgLight,
}: {
    primary: boolean;
    progressPct: number;
    learnedCount: number;
    totalChars: number;
    primaryBg: string;
    primaryBorderB: string;
    primaryHover: string;
    primaryText: string;
    primaryBgLight: string;
}) {
    return (
        <Link
            href="/kana/learn"
            className={`group flex h-full w-full items-center rounded-[1.5rem] p-5 font-extrabold shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:scale-[0.99] md:rounded-[2rem] md:p-6 ${
                primary
                    ? `${primaryBg} border-b-4 text-white ${primaryBorderB} ${primaryHover} active:border-b-0`
                    : `bg-white ${primaryText} border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2`
            }`}
        >
            <div
                className={`${primary ? "bg-white/20" : primaryBgLight} mr-4 rounded-xl p-3 transition-transform group-hover:scale-110 md:rounded-2xl md:p-4`}
            >
                <Play size={28} strokeWidth={2.5} fill="currentColor" className="md:h-8 md:w-8" />
            </div>
            <div className="flex flex-1 flex-col justify-center text-left">
                <div
                    className="text-xl text-[#3c3c3c] group-hover:text-black md:text-2xl"
                    style={primary ? { color: "white" } : undefined}
                >
                    Learn Characters
                </div>
                <div className="my-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 md:my-3 md:h-2">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${primary ? "bg-white" : primaryBg}`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <div
                    className={`text-[10px] font-bold md:text-xs ${primary ? "text-white/80" : "text-gray-500"}`}
                >
                    {learnedCount} / {totalChars} Mastered
                </div>
            </div>
            {primary && (
                <ChevronRight
                    size={28}
                    strokeWidth={3}
                    className="ml-2 shrink-0 text-white opacity-50 md:h-8 md:w-8"
                />
            )}
        </Link>
    );
}

function QuizActionCard({ primary }: { primary: boolean }) {
    return (
        <Link
            href="/kana/quiz"
            className={`flex h-full w-full ${primary ? "flex-row items-center text-left" : "flex-col items-center justify-center text-center"} group rounded-[1.5rem] p-5 font-extrabold shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:scale-[0.99] md:rounded-[2rem] md:p-6 ${
                primary
                    ? "border-b-4 border-[#b65ce8] bg-[#ce82ff] text-white hover:bg-[#b65ce8] active:border-b-0"
                    : "border-2 border-b-4 border-gray-200 bg-white text-[#ce82ff] hover:border-gray-300 active:border-b-2"
            }`}
        >
            <div
                className={`${primary ? "mr-4 bg-white/20" : "mb-3 bg-[#ce82ff]/10 md:mb-4"} flex items-center justify-center rounded-xl p-3 transition-transform group-hover:scale-110 md:rounded-2xl md:p-4`}
            >
                <Brain size={primary ? 28 : 32} strokeWidth={2.5} className="md:h-10 md:w-10" />
            </div>
            <div className={`flex flex-col justify-center ${primary ? "flex-1" : ""}`}>
                <span
                    className={`text-lg md:text-2xl ${primary ? "text-white" : "text-[#3c3c3c] group-hover:text-black"}`}
                >
                    Recall Quiz
                </span>
                {primary && (
                    <div className="mt-1 text-[10px] font-bold text-white/80 md:mt-2 md:text-xs">
                        Daily review ready!
                    </div>
                )}
            </div>
            {primary && (
                <ChevronRight
                    size={28}
                    strokeWidth={3}
                    className="ml-2 shrink-0 text-white opacity-50 md:h-8 md:w-8"
                />
            )}
        </Link>
    );
}

export default function KanaHubPage() {
    const { dataset, alphabet, setAlphabet } = useKanaDataset();
    const { userData, resetProgress } = useUserProgress();
    const { bestScores } = useBestScores();
    const { useHandwriting, globalAutoPlay, toggleHandwriting, toggleAutoPlay } = useAppStore();

    const [showSettings, setShowSettings] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const learnedChars = userData.learnedChars || [];
    const learnedCount = learnedChars.filter((c) => dataset.some((d) => d.char === c)).length;
    const totalChars = dataset.length;
    const progressPct = Math.min(Math.round((learnedCount / totalChars) * 100), 100);
    const isBeginner = progressPct < 80;

    const isH = alphabet === "hiragana";
    const isBoth = alphabet === "both";
    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;

    const primaryBg = isBoth ? "bg-[#ce82ff]" : isH ? "bg-[#58cc02]" : "bg-[#1cb0f6]";
    const primaryBorderB = isBoth
        ? "border-[#b65ce8]"
        : isH
          ? "border-[#58a700]"
          : "border-[#1899d6]";
    const primaryHover = isBoth
        ? "hover:bg-[#b65ce8]"
        : isH
          ? "hover:bg-[#46a302]"
          : "hover:bg-[#149fdf]";
    const primaryText = isBoth ? "text-[#ce82ff]" : isH ? "text-[#58cc02]" : "text-[#1cb0f6]";
    const primaryBgLight = isBoth ? "bg-[#ce82ff]/10" : isH ? "bg-[#58cc02]/10" : "bg-[#1cb0f6]/10";

    const bestInfinity = bestScores[`infinity_${alphabet}`] ?? 0;

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8]">
            <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-2xl px-4 pt-6 pb-28 duration-500">
                <AlphabetSwitcher value={alphabet} onChange={setAlphabet} />

                <div className="mb-6 flex w-full items-center justify-between md:mb-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl font-medium text-white md:h-16 md:w-16 md:rounded-2xl ${isBoth ? "px-1 text-center text-xl leading-tight font-black md:text-2xl" : "text-3xl md:text-4xl"} -rotate-6 transform border-b-4 shadow-sm transition-colors duration-500 ${primaryBg} ${primaryBorderB}`}
                            style={{ fontFamily: activeFont }}
                        >
                            {isBoth ? "あ/ア" : isH ? "あ" : "ア"}
                        </div>
                        <div>
                            <h1 className="text-xl leading-tight font-extrabold text-[#3c3c3c] md:text-3xl">
                                Kana Master
                            </h1>
                            <p className="text-xs font-bold text-[#afafaf] md:text-sm">
                                Level:{" "}
                                <span className={primaryText}>
                                    {isBeginner ? "Novice" : "Scholar"}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowSettings(!showSettings)}
                            className={`rounded-xl border-2 p-2.5 transition-all duration-200 hover:shadow-md active:scale-95 md:rounded-2xl md:p-3 ${showSettings ? "border-gray-300 bg-gray-100 text-gray-800" : "border-gray-200 bg-white text-gray-500 hover:text-gray-700"}`}
                            title="Settings"
                        >
                            <Settings size={20} strokeWidth={2.5} className="md:h-6 md:w-6" />
                        </button>
                        {showSettings && (
                            <KanaSettingsMenu
                                primaryBg={primaryBg}
                                globalAutoPlay={globalAutoPlay}
                                useHandwriting={useHandwriting}
                                showConfirmReset={showConfirmReset}
                                onToggleAutoPlay={() => {
                                    toggleAutoPlay();
                                    setShowSettings(false);
                                }}
                                onToggleHandwriting={() => {
                                    toggleHandwriting();
                                    setShowSettings(false);
                                }}
                                onRequestReset={() => setShowConfirmReset(true)}
                                onCancelResetConfirm={() => setShowConfirmReset(false)}
                                onWipeProgress={() => {
                                    resetProgress();
                                    setShowSettings(false);
                                    setShowConfirmReset(false);
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="flex w-full flex-col gap-8 pb-6 md:gap-10">
                    <div className="flex flex-col gap-3 md:gap-4">
                        <h2 className="pl-2 text-xs font-black tracking-widest text-gray-600 uppercase md:text-sm">
                            Up Next For You
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
                            <div className="md:col-span-2">
                                {isBeginner ? (
                                    <LearnActionCard
                                        primary
                                        progressPct={progressPct}
                                        learnedCount={learnedCount}
                                        totalChars={totalChars}
                                        primaryBg={primaryBg}
                                        primaryBorderB={primaryBorderB}
                                        primaryHover={primaryHover}
                                        primaryText={primaryText}
                                        primaryBgLight={primaryBgLight}
                                    />
                                ) : (
                                    <QuizActionCard primary />
                                )}
                            </div>
                            <div className="md:col-span-1">
                                {isBeginner ? (
                                    <QuizActionCard primary={false} />
                                ) : (
                                    <LearnActionCard
                                        primary={false}
                                        progressPct={progressPct}
                                        learnedCount={learnedCount}
                                        totalChars={totalChars}
                                        primaryBg={primaryBg}
                                        primaryBorderB={primaryBorderB}
                                        primaryHover={primaryHover}
                                        primaryText={primaryText}
                                        primaryBgLight={primaryBgLight}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 md:gap-4">
                        <h2 className="pl-2 text-xs font-black tracking-widest text-gray-600 uppercase md:text-sm">
                            Practice & Challenges
                        </h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
                            <Link
                                href="/kana/practice"
                                className="group flex h-full w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-b-4 border-gray-200 bg-white p-5 font-extrabold text-[#00d1e0] shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:border-gray-300 hover:shadow-md active:translate-y-[2px] active:border-b-2 md:rounded-[2rem] md:p-6"
                            >
                                <div className="mb-3 flex items-center justify-center rounded-xl bg-[#00d1e0]/10 p-3 transition-transform group-hover:scale-110 md:mb-4 md:rounded-2xl md:p-4">
                                    <PenTool
                                        size={28}
                                        strokeWidth={2.5}
                                        className="md:h-8 md:w-8"
                                    />
                                </div>
                                <span className="text-sm text-[#3c3c3c] group-hover:text-black md:text-lg">
                                    Writing
                                </span>
                            </Link>

                            <Link
                                href="/kana/survival"
                                className="group relative flex h-full w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-b-4 border-gray-200 bg-white p-5 font-extrabold text-[#ff9600] shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:border-gray-300 hover:shadow-md active:translate-y-[2px] active:border-b-2 md:rounded-[2rem] md:p-6"
                            >
                                <div className="mb-3 flex items-center justify-center rounded-xl bg-[#ff9600]/10 p-3 transition-transform group-hover:scale-110 md:mb-4 md:rounded-2xl md:p-4">
                                    <Flame size={28} strokeWidth={2.5} className="md:h-8 md:w-8" />
                                </div>
                                <span className="text-sm text-[#3c3c3c] group-hover:text-black md:text-lg">
                                    Survival
                                </span>
                                {bestInfinity > 0 ? (
                                    <span className="absolute top-3 right-3 rounded-full bg-[#ff9600] px-2 py-0.5 text-[9px] font-black text-white shadow-sm md:text-[10px]">
                                        Inf: {bestInfinity}
                                    </span>
                                ) : null}
                            </Link>

                            <Link
                                href="/kana/chart"
                                className="group col-span-2 flex h-full w-full flex-col items-center justify-center rounded-[1.5rem] border-2 border-b-4 border-gray-200 bg-white p-5 font-extrabold text-slate-500 shadow-sm transition-all duration-200 select-none hover:-translate-y-1 hover:border-gray-300 hover:text-slate-700 hover:shadow-md active:translate-y-[2px] active:border-b-2 md:col-span-1 md:rounded-[2rem] md:p-6"
                            >
                                <div className="mb-3 flex items-center justify-center rounded-xl bg-slate-100 p-3 text-slate-500 transition-transform group-hover:scale-110 group-hover:text-slate-700 md:mb-4 md:rounded-2xl md:p-4">
                                    <BarChart2
                                        size={28}
                                        strokeWidth={2.5}
                                        className="md:h-8 md:w-8"
                                    />
                                </div>
                                <span className="text-sm text-[#3c3c3c] group-hover:text-black md:text-lg">
                                    Reference Chart
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
