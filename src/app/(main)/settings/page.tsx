"use client";

import { ScreenHeader } from "@/shared/components/layout";
import { SPACING } from "@/shared/constants";
import { clearCharStats } from "@/shared/utils/stats";
import { useAppStore } from "@/store/useAppStore";
import { useKanaStore } from "@/store/useKanaStore";

export default function SettingsPage() {
    const { useHandwriting, globalAutoPlay, toggleHandwriting, toggleAutoPlay } = useAppStore();
    const { resetProgress } = useKanaStore();

    return (
        <div className="min-h-[100dvh] bg-[#F7F7F8] pb-28">
            <ScreenHeader title="Settings" />
            <div className={`mx-auto max-w-md ${SPACING.pagePadding} pt-6`}>
                <div className="space-y-4">
                    {/* Appearance */}
                    <div className="divide-y-2 divide-gray-100 overflow-hidden rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white shadow-sm">
                        <div className="bg-gray-50 px-6 py-4">
                            <h3 className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Appearance
                            </h3>
                        </div>
                        <ToggleRow
                            label="Handwriting Font"
                            sub="Use brush-style kana font"
                            value={useHandwriting}
                            onToggle={toggleHandwriting}
                            color="purple"
                        />
                        <ToggleRow
                            label="Auto-Play Audio"
                            sub="Read kana aloud automatically"
                            value={globalAutoPlay}
                            onToggle={toggleAutoPlay}
                            color="blue"
                        />
                    </div>

                    {/* Data */}
                    <div className="divide-y-2 divide-gray-100 overflow-hidden rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white shadow-sm">
                        <div className="bg-gray-50 px-6 py-4">
                            <h3 className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Data
                            </h3>
                        </div>
                        <DangerRow
                            label="Reset Kana Progress"
                            sub="Clear all learned characters"
                            onClick={() => {
                                if (confirm("Reset kana progress?")) resetProgress();
                            }}
                        />
                        <DangerRow
                            label="Reset Character Stats"
                            sub="Clear accuracy records for smart review"
                            onClick={() => {
                                if (confirm("Clear all character stats?")) clearCharStats();
                            }}
                        />
                    </div>

                    {/* About */}
                    <div className="overflow-hidden rounded-[2rem] border-2 border-b-4 border-gray-200 bg-white shadow-sm">
                        <div className="bg-gray-50 px-6 py-4">
                            <h3 className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                About
                            </h3>
                        </div>
                        <div className="space-y-1 px-6 py-4">
                            <p className="font-black text-[#3c3c3c]">Kana &amp; Nihongo Master</p>
                            <p className="text-sm font-bold text-[#afafaf]">
                                Unified Japanese learning app · v2.0
                            </p>
                            <p className="mt-2 text-xs font-bold text-[#afafaf]">
                                Kana data from KanjiVG · Powered by Firebase
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleRow({
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
    color: string;
}) {
    const colors: Record<string, string> = {
        blue: "bg-[#1cb0f6] border-[#1899d6]",
        green: "bg-[#58cc02] border-[#58a700]",
        purple: "bg-[#ce82ff] border-[#b65ce8]",
        orange: "bg-[#ff9600] border-[#cc7800]",
    };
    return (
        <div className="flex items-center justify-between px-6 py-4">
            <div>
                <div className="font-black text-[#3c3c3c]">{label}</div>
                <div className="text-sm font-bold text-[#afafaf]">{sub}</div>
            </div>
            <button
                onClick={onToggle}
                className={`relative h-8 w-14 rounded-full border-2 border-b-4 transition-all duration-200 ${value ? `${colors[color]}` : "border-gray-300 bg-gray-200"}`}
            >
                <div
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${value ? "left-7" : "left-1"}`}
                />
            </button>
        </div>
    );
}

function DangerRow({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
    return (
        <button
            className="group flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#ffdfe0]"
            onClick={onClick}
        >
            <div>
                <div className="font-black text-[#ea2b2b]">{label}</div>
                <div className="text-sm font-bold text-[#afafaf]">{sub}</div>
            </div>
            <span className="text-lg font-black text-[#ea2b2b] opacity-50 group-hover:opacity-100">
                ›
            </span>
        </button>
    );
}
