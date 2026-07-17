"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { AlertCircle, Settings2, Sparkles, Zap } from "lucide-react";

import useAIDeck from "@/features/ai/hooks/useAIDeck";
import { Button, Input } from "@/shared/components/ui";
import { hexToThemeColor } from "@/shared/utils";

import type { AIGenerateMode, JLPTLevel } from "@/features/ai/types";
import type { ImportRow } from "./ImportPreview";

interface AIBulkPanelProps {
    themeColor: string;
    onPreview: (rows: ImportRow[]) => void;
    existingWords?: string[];
}

/**
 * Values only — labels live in LessonBuilder.levelOption.*, resolved by the
 * component, since a plain module-level array can't call useTranslations().
 */
const LEVEL_VALUES: JLPTLevel[] = ["N5", "N4", "N3", "N2", "General"];

const COUNT_OPTIONS = [8, 12, 16, 20];

const QUICK_DEFAULT_COUNT = 12;
const QUICK_DEFAULT_LEVEL: JLPTLevel = "N5";

/** Keys into LessonBuilder.topicSuggestion.* — same reasoning as LEVEL_VALUES. */
const TOPIC_SUGGESTION_KEYS = [
    "n5Food",
    "dailyGreetings",
    "familyMembers",
    "colorsNumbers",
    "weatherExpressions",
    "transportTravel",
    "schoolSubjects",
    "shoppingPhrases",
    "bodyParts",
    "timeExpressions",
] as const;

interface ModeChipProps {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    sub: string;
    onClick: () => void;
    color: string;
}

const ModeChip = ({ active, icon, label, sub, onClick, color }: ModeChipProps) => {
    return (
        <Button
            onClick={onClick}
            variant={active ? "primary" : "secondary"}
            className="flex-1 !px-4 !py-3 !text-left"
            style={
                active
                    ? { backgroundColor: color, borderBottomColor: `${color}CC` }
                    : { backgroundColor: "white", borderBottomColor: "#e5e7eb" }
            }
        >
            <div className="flex items-center gap-3">
                <span className="shrink-0">{icon}</span>
                <div className="flex flex-col">
                    <div className={`text-sm font-black ${active ? "text-white" : "text-text"}`}>
                        {label}
                    </div>
                    <div
                        className="text-xs font-bold"
                        style={{ color: active ? "rgba(255,255,255,0.75)" : "#afafaf" }}
                    >
                        {sub}
                    </div>
                </div>
            </div>
        </Button>
    );
};

const AIBulkPanel = ({ themeColor, onPreview, existingWords = [] }: AIBulkPanelProps) => {
    const t = useTranslations("LessonBuilder");
    const { status, error, generate } = useAIDeck();

    const [mode, setMode] = useState<AIGenerateMode>("quick");
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(QUICK_DEFAULT_COUNT);
    const [level, setLevel] = useState<JLPTLevel>(QUICK_DEFAULT_LEVEL);

    const levelOptions = LEVEL_VALUES.map((value) => ({
        value,
        label: t(`levelOption.${value}.label`),
        sub: t(`levelOption.${value}.sub`),
    }));
    const topicSuggestions = TOPIC_SUGGESTION_KEYS.map((key) => t(`topicSuggestion.${key}`));

    const themeColorStr = hexToThemeColor(themeColor);
    const isLoading = status === "loading";

    const effectiveCount = mode === "quick" ? QUICK_DEFAULT_COUNT : count;
    const effectiveLevel = mode === "quick" ? QUICK_DEFAULT_LEVEL : level;

    const handleGenerate = async () => {
        const cards = await generate(topic, effectiveCount, effectiveLevel, existingWords);
        if (!cards) return;

        const rows: ImportRow[] = cards.map((c, i) => ({
            id: `ai_${Date.now()}_${i}`,
            primary: c.primary ?? "",
            alternatives: c.alternatives ?? [],
            meaning: c.meaning ?? "",
            example: c.example ?? "",
            isInvalid: !(c.primary?.trim() && (c.meaning || "").trim()),
        }));

        onPreview(rows);
    };

    return (
        <div className="space-y-6 rounded-3xl border-2 border-b-8 border-gray-200 bg-white p-4 shadow-sm sm:rounded-4xl sm:p-6">
            <div className="flex items-center gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${themeColor}18` }}
                >
                    <Sparkles size={18} style={{ color: themeColor }} className="sm:size-5" />
                </div>
                <div>
                    <h3 className="text-text text-lg font-black sm:text-xl">
                        {t("generateWithAI")}
                    </h3>
                    <p className="text-muted text-xs font-bold tracking-wide uppercase sm:text-xs">
                        {t("generateWithAISubtitle")}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <ModeChip
                    active={mode === "quick"}
                    icon={<Zap size={14} className="sm:size-4" />}
                    label={t("modeQuick")}
                    sub={t("modeQuickSub", {
                        count: QUICK_DEFAULT_COUNT,
                        level: QUICK_DEFAULT_LEVEL,
                    })}
                    onClick={() => setMode("quick")}
                    color={themeColor}
                />
                <ModeChip
                    active={mode === "guided"}
                    icon={<Settings2 size={14} className="sm:size-4" />}
                    label={t("modeGuided")}
                    sub={t("modeGuidedSub")}
                    onClick={() => setMode("guided")}
                    color={themeColor}
                />
            </div>

            <div>
                <label className="text-muted mb-2 block text-xs font-black tracking-widest uppercase">
                    {t("topicOrTheme")}
                </label>
                <Input
                    type="text"
                    variant="default"
                    className="h-auto rounded-2xl border-b-4 px-4 py-3.5 text-base sm:px-5 sm:py-4 sm:text-lg"
                    style={{ "--theme-color": themeColor } as React.CSSProperties}
                    placeholder={t("topicPlaceholder")}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) =>
                        e.key === "Enter" && !isLoading && topic.trim() && handleGenerate()
                    }
                    maxLength={80}
                />

                <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                    {topicSuggestions.slice(0, 5).map((s) => (
                        <Button
                            key={s}
                            variant="ghost"
                            onClick={() => setTopic(s)}
                            disabled={isLoading}
                            className="!text-muted hover:text-text border-2 border-gray-200 bg-white !px-2.5 !py-1 !text-xs !font-black tracking-wide uppercase shadow-none hover:border-gray-300 hover:shadow-none sm:!px-3 sm:!py-1.5 sm:!text-xs"
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {mode === "guided" && (
                <div className="space-y-4 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-4">
                    <div>
                        <label className="text-muted mb-2 block text-xs font-black tracking-widest uppercase">
                            {t("numberOfCards")}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {COUNT_OPTIONS.map((n) => (
                                <Button
                                    key={n}
                                    onClick={() => setCount(n)}
                                    disabled={isLoading}
                                    variant={count === n ? "primary" : "secondary"}
                                    className="!py-2 !text-xs !font-black transition-all sm:!py-2.5 sm:!text-sm"
                                    style={
                                        count === n
                                            ? {
                                                  backgroundColor: themeColor,
                                                  borderBottomColor: `${themeColor}CC`,
                                              }
                                            : {
                                                  backgroundColor: "white",
                                                  borderBottomColor: "#e5e7eb",
                                              }
                                    }
                                >
                                    {n}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-muted mb-2 block text-xs font-black tracking-widest uppercase">
                            {t("jlptLevel")}
                        </label>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-1.5">
                            {levelOptions.map((opt) => (
                                <Button
                                    key={opt.value}
                                    onClick={() => setLevel(opt.value)}
                                    disabled={isLoading}
                                    variant={level === opt.value ? "primary" : "secondary"}
                                    className="!px-0 !py-2 !text-center transition-all sm:!py-2"
                                    style={
                                        level === opt.value
                                            ? {
                                                  backgroundColor: themeColor,
                                                  borderBottomColor: `${themeColor}CC`,
                                              }
                                            : {
                                                  backgroundColor: "white",
                                                  borderBottomColor: "#e5e7eb",
                                              }
                                    }
                                >
                                    <div className="text-xs font-black">{opt.label}</div>
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
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-[#ffdfe0] bg-[#fff5f5] px-4 py-3">
                    <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-danger text-sm font-bold">{error}</p>
                </div>
            )}

            <Button
                variant="primary"
                color={themeColorStr}
                onClick={handleGenerate}
                loading={isLoading}
                disabled={!topic.trim()}
                className="w-full py-4 text-lg"
                icon={Sparkles}
            >
                {isLoading
                    ? t("generatingCards", { count: effectiveCount })
                    : t("previewGeneratedCards", { count: effectiveCount })}
            </Button>

            {isLoading ? (
                <div className="space-y-2 text-center">
                    <p className="text-muted text-sm font-bold">{t("geminiCrafting")}</p>
                    <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full animate-pulse rounded-full"
                            style={{ backgroundColor: themeColor, width: "60%" }}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-muted text-center text-xs font-bold">{t("aiGenerateFooter")}</p>
            )}
        </div>
    );
};

export default AIBulkPanel;
