"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { useAIDeck } from "@/features/ai";
import { aiGenerateInputSchema } from "@/shared/schemas";

import type { AIGenerateInput } from "@/shared/schemas";
import type { ImportRow } from "../components/ImportPreview";

const QUICK_DEFAULT_COUNT = 12;
const QUICK_DEFAULT_LEVEL = "N5" as const;

interface UseAIBulkFormParams {
    onPreview: (rows: ImportRow[]) => void;
    existingWords?: string[];
}

/**
 * Owns AIBulkPanel's form state (mode/topic/count/level) and the generate
 * call — T-109e's second rhf+zodResolver conversion, alongside
 * useLessonBuilder/useShareInvites. Every field is a custom button group or
 * a controlled input (no native `<select>`), so all four are exposed as
 * `watch()`-sourced values + plain setters (same shape as useLessonBuilder's
 * `addTag`/`removeCategory` for its own non-native-input fields) rather
 * than wired through `register()` — `handleSubmit`'s zodResolver validation
 * runs against the current form values either way, so this costs nothing
 * validation-wise while keeping the component's existing controlled-input
 * JSX unchanged.
 */
export function useAIBulkForm({ onPreview, existingWords = [] }: UseAIBulkFormParams) {
    const { status, error, generate } = useAIDeck();
    const form = useForm<AIGenerateInput>({
        resolver: zodResolver(aiGenerateInputSchema),
        defaultValues: {
            mode: "quick",
            topic: "",
            count: QUICK_DEFAULT_COUNT,
            level: QUICK_DEFAULT_LEVEL,
        },
    });
    const { handleSubmit, watch, setValue } = form;

    const mode = watch("mode");
    const topic = watch("topic");
    const count = watch("count");
    const level = watch("level");

    const isLoading = status === "loading";
    const effectiveCount = mode === "quick" ? QUICK_DEFAULT_COUNT : count;
    const effectiveLevel = mode === "quick" ? QUICK_DEFAULT_LEVEL : level;

    const handleGenerate = handleSubmit(async (data) => {
        const cards = await generate(data.topic, effectiveCount, effectiveLevel, existingWords);
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
    });

    return {
        mode,
        setMode: (value: AIGenerateInput["mode"]) => setValue("mode", value),
        topic,
        setTopic: (value: string) => setValue("topic", value),
        count,
        setCount: (value: AIGenerateInput["count"]) => setValue("count", value),
        level,
        setLevel: (value: AIGenerateInput["level"]) => setValue("level", value),
        isLoading,
        error,
        effectiveCount,
        effectiveLevel,
        handleGenerate,
    };
}
