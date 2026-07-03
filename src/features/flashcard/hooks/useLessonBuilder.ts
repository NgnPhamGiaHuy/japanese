import { useEffect, useMemo, useRef, useState } from "react";

import { v4 as uuidv4 } from "uuid";

import useAICard from "@/features/ai/hooks/useAICard";
import { joinAlternatives } from "../utils/formatting";
import { parseText } from "../utils/parser";

import type { EditorCard, FlashCard, Lesson } from "../types";

export const makeCard = (order = 0): EditorCard => ({
    id: `c_${uuidv4()}`,
    primary: "",
    alternatives: [],
    meaning: "",
    example: "",
    order,
});

export function useLessonBuilder({
    initialLesson,
    initialCards,
}: { initialLesson?: Lesson; initialCards?: FlashCard[] } = {}) {
    const [lesson, setLesson] = useState<Partial<Lesson>>(
        initialLesson || {
            title: "",
            description: "",
            themeColor: "#1cb0f6",
            createdAt: Date.now(),
            categories: ["vocabulary"],
        },
    );
    const [cards, setCards] = useState<EditorCard[]>(initialCards?.map((c) => ({ ...c })) || []);
    const [pasteText, setPasteText] = useState("");
    const [previewRows, setPreviewRows] = useState<any[] | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [inputMode, setInputMode] = useState<"ai" | "manual" | "paste" | "uploads">("manual");
    const [aiStatus, setAiStatus] = useState<Record<string, { loading: boolean; error?: string }>>(
        {},
    );

    const aiCard = useAICard();
    const themeHex = lesson.themeColor || "#1cb0f6";
    const clearedImagePathsRef = useRef<string[]>([]);

    useEffect(() => {
        if (inputMode === "paste") return;
        const lines = cards.map((c) => {
            const parts = [
                c.primary || "",
                joinAlternatives(c.alternatives),
                c.meaning || "",
                c.example || "",
            ];
            return parts.map((p) => (p.includes(",") ? `"${p.replace(/"/g, '""')}"` : p)).join(",");
        });
        setPasteText(lines.join("\n"));
    }, [cards, inputMode, setPasteText]);

    const handleLiveSync = (rawText: string) => {
        const { valid } = parseText(rawText);
        setCards((prev) => {
            // Create a pool of existing cards to match against
            const pool = [...prev];

            return valid.map((parsed, idx) => {
                const key = (parsed.primary || "").trim().toLowerCase();

                // Find first match in pool
                const poolIdx = pool.findIndex(
                    (c) => (c.primary || "").trim().toLowerCase() === key,
                );

                let existing = null;
                if (poolIdx !== -1) {
                    existing = pool[poolIdx];
                    pool.splice(poolIdx, 1);
                }

                return existing ? { ...existing, ...parsed } : { ...makeCard(idx), ...parsed };
            });
        });
    };

    const handleAIFillCard = async (cardId: string, word: string) => {
        if (!word.trim()) return;
        setAiStatus((prev) => ({ ...prev, [cardId]: { loading: true } }));
        const result = await aiCard.generate(word.trim());
        setAiStatus((prev) => ({
            ...prev,
            [cardId]: { loading: false, error: aiCard.error || undefined },
        }));
        if (result) {
            setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...result } : c)));
        }
    };

    const updateCard = (id: string, field: keyof EditorCard, value: any) =>
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

    const handleImportConfirm = (validRows: any[]) => {
        const newCards = validRows.map((r, i) => ({ ...makeCard(cards.length + i), ...r }));
        setCards(
            inputMode === "ai" || inputMode === "uploads"
                ? (prev) => [...prev, ...newCards]
                : newCards,
        );
        setPreviewRows(null);
        setInputMode("manual");
    };

    const existingWordsForAI = useMemo(
        () =>
            Array.from(
                new Set(
                    cards
                        .flatMap((c) => [c.primary || "", ...(c.alternatives || [])])
                        .map((v) => v.trim())
                        .filter(Boolean),
                ),
            ),
        [cards],
    );

    return {
        lesson,
        setLesson,
        cards,
        setCards,
        tagInput,
        setTagInput,
        inputMode,
        setInputMode,
        pasteText,
        setPasteText,
        previewRows,
        setPreviewRows,
        themeHex,
        aiStatus,
        clearedImagePathsRef,
        handleLiveSync,
        handleAIFillCard,
        handleImportConfirm,
        updateCard,
        existingWordsForAI,
        addTag: (val: string) => {
            const trimmed = val.trim().toLowerCase();
            if (trimmed && (lesson.categories || []).length < 3) {
                setLesson((prev) => ({
                    ...prev,
                    categories: [...(prev.categories || []), trimmed],
                }));
                setTagInput("");
            }
        },
        removeCategory: (cat: string) =>
            setLesson((prev) => ({
                ...prev,
                categories: prev.categories?.filter((c) => c !== cat),
            })),
        addCard: () => setCards((prev) => [...prev, makeCard(prev.length)]),
        deleteCard: (id: string) => setCards((prev) => prev.filter((c) => c.id !== id)),
        handleImageChange: (file: File | null, id: string) => {
            if (!file) return;
            updateCard(id, "imageFile", file);
            updateCard(id, "previewUrl", URL.createObjectURL(file));
        },
    };
}
