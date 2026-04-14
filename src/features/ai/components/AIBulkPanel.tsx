"use client";

import { useState } from "react";

import { AlertCircle, Loader2, Settings2, Sparkles, Zap } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils";
import { useAIDeck } from "../hooks";

import type { ImportRow } from "@/features/flashcard/components/ImportPreview";
import type { AIGenerateMode, JLPTLevel } from "../types";

interface AIBulkPanelProps {
    themeColor: string;
    onPreview: (rows: ImportRow[]) => void;
    existingWords?: string[];
}

const LEVEL_OPTIONS: { value: JLPTLevel; label: string; sub: string }[] = [
    { value: "N5", label: "N5", sub: "Beginner" },
    { value: "N4", label: "N4", sub: "Elementary" },
    { value: "N3", label: "N3", sub: "Intermediate" },
    { value: "N2", label: "N2", sub: "Upper-Int." },
    { value: "General", label: "Mix", sub: "N5–N3" },
];

const COUNT_OPTIONS = [8, 12, 16, 20];

const QUICK_DEFAULT_COUNT = 12;
const QUICK_DEFAULT_LEVEL: JLPTLevel = "N5";

const TOPIC_SUGGESTIONS = [
    "N5 food vocabulary",
    "daily greetings",
    "family members",
    "colors & numbers",
    "weather expressions",
    "transport & travel",
    "school subjects",
    "shopping phrases",
    "body parts",
    "time expressions",
];

interface ModeChipProps {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    sub: string;
    onClick: () => void;
    color: string;
}

const ModeChip = ({ active, icon, label, sub, onClick, color }: ModeChipProps) => (
    <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-left transition-all"
        style={
            active
                ? { backgroundColor: color, borderColor: `${color}BB`, color: "white" }
                : { backgroundColor: "white", borderColor: "#e5e7eb", color: "#3c3c3c" }
        }
    >
        <span className="shrink-0">{icon}</span>
        <span>
            <div className="text-sm font-black">{label}</div>
            <div
                className="text-[10px] font-bold"
                style={{ color: active ? "rgba(255,255,255,0.75)" : "#afafaf" }}
            >
                {sub}
            </div>
        </span>
    </button>
);

const AIBulkPanel = ({ themeColor, onPreview, existingWords = [] }: AIBulkPanelProps) => {
    const { status, error, generate } = useAIDeck();

    const [mode, setMode] = useState<AIGenerateMode>("quick");
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(QUICK_DEFAULT_COUNT);
    const [level, setLevel] = useState<JLPTLevel>(QUICK_DEFAULT_LEVEL);

    const themeColorStr = hexToThemeColor(themeColor);
    const isLoading = status === "loading";

    const effectiveCount = mode === "quick" ? QUICK_DEFAULT_COUNT : count;
    const effectiveLevel = mode === "quick" ? QUICK_DEFAULT_LEVEL : level;

    const handleGenerate = async () => {
        const cards = await generate(topic, effectiveCount, effectiveLevel, existingWords);
        if (!cards) return;

        const rows: ImportRow[] = cards.map((c, i) => ({
            id: `ai_${Date.now()}_${i}`,
            kanji: c.kanji ?? c.kanaPrimary,
            furigana: c.furigana ?? "",
            meaning: c.meaning,
            example: c.example,
            isInvalid: false,
        }));

        onPreview(rows);
    };

    return (
        <div className="space-y-6 rounded-4xl border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${themeColor}18` }}
                >
                    <Sparkles size={20} style={{ color: themeColor }} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-[#3c3c3c]">Generate Deck with AI</h3>
                    <p className="text-[10px] font-bold tracking-wide text-[#afafaf] uppercase">
                        Describe a topic · review before saving
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <ModeChip
                    active={mode === "quick"}
                    icon={<Zap size={16} />}
                    label="Quick"
                    sub={`${QUICK_DEFAULT_COUNT} cards · ${QUICK_DEFAULT_LEVEL}`}
                    onClick={() => setMode("quick")}
                    color={themeColor}
                />
                <ModeChip
                    active={mode === "guided"}
                    icon={<Settings2 size={16} />}
                    label="Guided"
                    sub="Custom count & level"
                    onClick={() => setMode("guided")}
                    color={themeColor}
                />
            </div>

            <div>
                <label className="mb-2 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                    Topic or Theme
                </label>
                <input
                    type="text"
                    className="w-full rounded-2xl border-2 border-b-4 border-gray-200 bg-white px-5 py-4 text-lg font-bold text-[#3c3c3c] placeholder-gray-300 transition-colors outline-none"
                    placeholder="e.g. N5 food vocabulary"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isLoading}
                    onFocus={(e) => (e.currentTarget.style.borderColor = themeColor)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                    onKeyDown={(e) =>
                        e.key === "Enter" && !isLoading && topic.trim() && handleGenerate()
                    }
                    maxLength={80}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                    {TOPIC_SUGGESTIONS.slice(0, 5).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setTopic(s)}
                            disabled={isLoading}
                            className="rounded-xl border-2 border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black tracking-wide text-[#afafaf] uppercase transition-all hover:border-gray-300 hover:text-[#3c3c3c] disabled:opacity-40"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {mode === "guided" && (
                <div className="space-y-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                    <div>
                        <label className="mb-2 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            Number of Cards
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {COUNT_OPTIONS.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setCount(n)}
                                    disabled={isLoading}
                                    className="rounded-xl border-2 border-b-4 py-2.5 text-sm font-black transition-all disabled:opacity-40"
                                    style={
                                        count === n
                                            ? {
                                                  backgroundColor: themeColor,
                                                  borderColor: `${themeColor}BB`,
                                                  color: "white",
                                              }
                                            : {
                                                  backgroundColor: "white",
                                                  borderColor: "#e5e7eb",
                                                  color: "#3c3c3c",
                                              }
                                    }
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                            JLPT Level
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                            {LEVEL_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setLevel(opt.value)}
                                    disabled={isLoading}
                                    className="rounded-xl border-2 border-b-4 py-2 text-center transition-all disabled:opacity-40"
                                    style={
                                        level === opt.value
                                            ? {
                                                  backgroundColor: themeColor,
                                                  borderColor: `${themeColor}BB`,
                                                  color: "white",
                                              }
                                            : {
                                                  backgroundColor: "white",
                                                  borderColor: "#e5e7eb",
                                                  color: "#3c3c3c",
                                              }
                                    }
                                >
                                    <div className="text-[10px] font-black">{opt.label}</div>
                                    <div
                                        className="text-[8px] font-bold opacity-70"
                                        style={
                                            level === opt.value
                                                ? { color: "white" }
                                                : { color: "#afafaf" }
                                        }
                                    >
                                        {opt.sub}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-[#ffdfe0] bg-[#fff5f5] px-4 py-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#ea2b2b]" />
                    <p className="text-sm font-bold text-[#ea2b2b]">{error}</p>
                </div>
            )}

            <Button
                variant="primary"
                color={themeColorStr}
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="w-full py-4 text-lg"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Generating {effectiveCount} cards…
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        Preview {effectiveCount} Generated Cards
                    </>
                )}
            </Button>

            {isLoading ? (
                <div className="space-y-2 text-center">
                    <p className="text-sm font-bold text-[#afafaf]">
                        Gemini is crafting your flashcards…
                    </p>
                    <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full animate-pulse rounded-full"
                            style={{ backgroundColor: themeColor, width: "60%" }}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-center text-xs font-bold text-[#afafaf]">
                    AI generates cards with hints &amp; quiz answers → you review &amp; edit → then
                    save
                </p>
            )}
        </div>
    );
};

export default AIBulkPanel;
