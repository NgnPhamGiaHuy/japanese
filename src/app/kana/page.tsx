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
import { useKanaDataset } from "@/features/kana/hooks/useKanaDataset";
import { AlphabetSwitcher } from "@/features/kana/components";
import { useKanaStore } from "@/store/useKanaStore";
import { useAppStore } from "@/store/useAppStore";
import { BottomNav } from "@/shared/components/layout";
import { HANDWRITING_FONT, PRINT_FONT } from "@/shared/constants/fonts";

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
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-gray-200 rounded-[1rem] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                Audio Preferences
            </div>
            <button
                type="button"
                onClick={onToggleAutoPlay}
                className="w-full text-left px-3 py-3 text-sm font-bold text-[#3c3c3c] hover:bg-gray-50 rounded-xl flex items-center justify-between transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Volume2 size={16} className="text-gray-500" /> Autoplay
                    Audio
                </span>
                <div
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${globalAutoPlay ? primaryBg : "bg-gray-200"}`}
                >
                    <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${globalAutoPlay ? "translate-x-4" : "translate-x-0"}`}
                    />
                </div>
            </button>

            <div className="px-3 py-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 mt-2 mb-1">
                Display Preferences
            </div>
            <button
                type="button"
                onClick={onToggleHandwriting}
                className="w-full text-left px-3 py-3 text-sm font-bold text-[#3c3c3c] hover:bg-gray-50 rounded-xl flex items-center justify-between transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Type size={16} className="text-gray-500" /> Handwriting
                    Font
                </span>
                <div
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${useHandwriting ? primaryBg : "bg-gray-200"}`}
                >
                    <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${useHandwriting ? "translate-x-4" : "translate-x-0"}`}
                    />
                </div>
            </button>

            <div className="px-3 py-2 text-xs font-black text-red-500 uppercase tracking-wider border-b border-gray-100 mt-2 mb-1">
                Danger Zone
            </div>
            {!showConfirmReset ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRequestReset();
                    }}
                    className="w-full text-left px-3 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                >
                    <Trash2 size={16} /> Reset Progress
                </button>
            ) : (
                <div className="px-3 py-2 flex flex-col gap-2 animate-in zoom-in duration-200 bg-red-50 rounded-xl mt-1 border border-red-100">
                    <span className="text-xs font-bold text-red-600">
                        Are you sure? This cannot be undone.
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onWipeProgress}
                            className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            Wipe it
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancelResetConfirm();
                            }}
                            className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50"
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
            className={`w-full h-full flex items-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none shadow-sm group hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:scale-[0.99] ${
                primary
                    ? `${primaryBg} text-white border-b-4 ${primaryBorderB} ${primaryHover} active:border-b-0`
                    : `bg-white ${primaryText} border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2`
            }`}
        >
            <div
                className={`${primary ? "bg-white/20" : primaryBgLight} p-3 md:p-4 rounded-xl md:rounded-2xl mr-4 group-hover:scale-110 transition-transform`}
            >
                <Play
                    size={28}
                    strokeWidth={2.5}
                    fill="currentColor"
                    className="md:w-8 md:h-8"
                />
            </div>
            <div className="text-left flex-1 flex flex-col justify-center">
                <div
                    className="text-xl md:text-2xl text-[#3c3c3c] group-hover:text-black"
                    style={primary ? { color: "white" } : undefined}
                >
                    Learn Characters
                </div>
                <div className="w-full bg-black/10 rounded-full h-1.5 md:h-2 my-2 md:my-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${primary ? "bg-white" : primaryBg}`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <div
                    className={`text-[10px] md:text-xs font-bold ${primary ? "text-white/80" : "text-gray-500"}`}
                >
                    {learnedCount} / {totalChars} Mastered
                </div>
            </div>
            {primary && (
                <ChevronRight
                    size={28}
                    strokeWidth={3}
                    className="ml-2 opacity-50 md:w-8 md:h-8 shrink-0 text-white"
                />
            )}
        </Link>
    );
}

function QuizActionCard({ primary }: { primary: boolean }) {
    return (
        <Link
            href="/kana/quiz"
            className={`w-full h-full flex ${primary ? "flex-row items-center text-left" : "flex-col items-center justify-center text-center"} p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none shadow-sm group hover:-translate-y-1 hover:shadow-lg active:translate-y-[2px] active:scale-[0.99] ${
                primary
                    ? "bg-[#ce82ff] text-white border-b-4 border-[#b65ce8] hover:bg-[#b65ce8] active:border-b-0"
                    : "bg-white text-[#ce82ff] border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2"
            }`}
        >
            <div
                className={`${primary ? "bg-white/20 mr-4" : "bg-[#ce82ff]/10 mb-3 md:mb-4"} p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform flex items-center justify-center`}
            >
                <Brain
                    size={primary ? 28 : 32}
                    strokeWidth={2.5}
                    className="md:w-10 md:h-10"
                />
            </div>
            <div
                className={`flex flex-col justify-center ${primary ? "flex-1" : ""}`}
            >
                <span
                    className={`text-lg md:text-2xl ${primary ? "text-white" : "text-[#3c3c3c] group-hover:text-black"}`}
                >
                    Recall Quiz
                </span>
                {primary && (
                    <div className="text-[10px] md:text-xs font-bold text-white/80 mt-1 md:mt-2">
                        Daily review ready!
                    </div>
                )}
            </div>
            {primary && (
                <ChevronRight
                    size={28}
                    strokeWidth={3}
                    className="ml-2 opacity-50 text-white md:w-8 md:h-8 shrink-0"
                />
            )}
        </Link>
    );
}

export default function KanaHubPage() {
    const { dataset, alphabet, setAlphabet } = useKanaDataset();
    const { learnedChars, bestScores, resetProgress } = useKanaStore();
    const {
        useHandwriting,
        globalAutoPlay,
        toggleHandwriting,
        toggleAutoPlay,
    } = useAppStore();

    const [showSettings, setShowSettings] = useState(false);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const learnedCount = learnedChars.filter((c) =>
        dataset.some((d) => d.char === c)
    ).length;
    const totalChars = dataset.length;
    const progressPct = Math.min(
        Math.round((learnedCount / totalChars) * 100),
        100
    );
    const isBeginner = progressPct < 80;

    const isH = alphabet === "hiragana";
    const isBoth = alphabet === "both";
    const activeFont = useHandwriting ? HANDWRITING_FONT : PRINT_FONT;

    const primaryBg = isBoth
        ? "bg-[#ce82ff]"
        : isH
          ? "bg-[#58cc02]"
          : "bg-[#1cb0f6]";
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
    const primaryText = isBoth
        ? "text-[#ce82ff]"
        : isH
          ? "text-[#58cc02]"
          : "text-[#1cb0f6]";
    const primaryBgLight = isBoth
        ? "bg-[#ce82ff]/10"
        : isH
          ? "bg-[#58cc02]/10"
          : "bg-[#1cb0f6]/10";

    const bestInfinity = bestScores[`infinity_${alphabet}`] ?? 0;

    return (
        <div className="min-h-[100dvh] bg-[#f7f7f8] text-[#3c3c3c] flex flex-col selection:bg-[#1cb0f6] selection:text-white">
            <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
                <div className="w-full max-w-5xl px-0 sm:px-6 h-full min-h-0 flex flex-col relative">
                    <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar flex flex-col h-full w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 md:pt-8 pb-6 px-3 md:px-6 relative">
                    <AlphabetSwitcher value={alphabet} onChange={setAlphabet} />

                    <div className="w-full flex justify-between items-center mb-6 md:mb-10">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div
                                className={`w-12 h-12 md:w-16 md:h-16 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-medium ${isBoth ? "text-xl md:text-2xl font-black px-1 leading-tight text-center" : "text-3xl md:text-4xl"} shadow-sm border-b-4 transform -rotate-6 transition-colors duration-500 ${primaryBg} ${primaryBorderB}`}
                                style={{ fontFamily: activeFont }}
                            >
                                {isBoth ? "あ/ア" : isH ? "あ" : "ア"}
                            </div>
                            <div>
                                <h1 className="font-extrabold text-[#3c3c3c] text-xl md:text-3xl leading-tight">
                                    Kana Master
                                </h1>
                                <p className="text-xs md:text-sm font-bold text-[#afafaf]">
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
                                className={`p-2.5 md:p-3 border-2 rounded-xl md:rounded-2xl transition-all duration-200 hover:shadow-md active:scale-95 ${showSettings ? "bg-gray-100 border-gray-300 text-gray-800" : "bg-white border-gray-200 text-gray-500 hover:text-gray-700"}`}
                                title="Settings"
                            >
                                <Settings
                                    size={20}
                                    strokeWidth={2.5}
                                    className="md:w-6 md:h-6"
                                />
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
                                    onRequestReset={() =>
                                        setShowConfirmReset(true)
                                    }
                                    onCancelResetConfirm={() =>
                                        setShowConfirmReset(false)
                                    }
                                    onWipeProgress={() => {
                                        resetProgress();
                                        setShowSettings(false);
                                        setShowConfirmReset(false);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-8 md:gap-10 pb-6">
                        <div className="flex flex-col gap-3 md:gap-4">
                            <h2 className="text-xs md:text-sm font-black text-gray-600 uppercase tracking-widest pl-2">
                                Up Next For You
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
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
                            <h2 className="text-xs md:text-sm font-black text-gray-600 uppercase tracking-widest pl-2">
                                Practice & Challenges
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                                <Link
                                    href="/kana/practice"
                                    className="w-full h-full bg-white text-[#00d1e0] border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2 active:translate-y-[2px] flex flex-col items-center justify-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none shadow-sm group hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="bg-[#00d1e0]/10 p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform mb-3 md:mb-4 flex items-center justify-center">
                                        <PenTool
                                            size={28}
                                            strokeWidth={2.5}
                                            className="md:w-8 md:h-8"
                                        />
                                    </div>
                                    <span className="text-sm md:text-lg text-[#3c3c3c] group-hover:text-black">
                                        Writing
                                    </span>
                                </Link>

                                <Link
                                    href="/kana/survival"
                                    className="w-full h-full bg-white text-[#ff9600] border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2 active:translate-y-[2px] flex flex-col items-center justify-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none group shadow-sm relative hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="bg-[#ff9600]/10 p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform mb-3 md:mb-4 flex items-center justify-center">
                                        <Flame
                                            size={28}
                                            strokeWidth={2.5}
                                            className="md:w-8 md:h-8"
                                        />
                                    </div>
                                    <span className="text-sm md:text-lg text-[#3c3c3c] group-hover:text-black">
                                        Survival
                                    </span>
                                    {bestInfinity > 0 ? (
                                        <span className="absolute top-3 right-3 bg-[#ff9600] text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                            Inf: {bestInfinity}
                                        </span>
                                    ) : null}
                                </Link>

                                <Link
                                    href="/kana/chart"
                                    className="w-full h-full bg-white text-slate-500 border-2 border-b-4 border-gray-200 hover:border-gray-300 active:border-b-2 active:translate-y-[2px] flex flex-col items-center justify-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-extrabold transition-all duration-200 select-none group shadow-sm col-span-2 md:col-span-1 hover:-translate-y-1 hover:shadow-md hover:text-slate-700"
                                >
                                    <div className="bg-slate-100 p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 transition-transform text-slate-500 group-hover:text-slate-700 mb-3 md:mb-4 flex items-center justify-center">
                                        <BarChart2
                                            size={28}
                                            strokeWidth={2.5}
                                            className="md:w-8 md:h-8"
                                        />
                                    </div>
                                    <span className="text-sm md:text-lg text-[#3c3c3c] group-hover:text-black">
                                        Reference Chart
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <BottomNav />
        </div>
    );
}
