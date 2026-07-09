import { useMemo, useRef, useState } from "react";

import { v4 as uuidv4 } from "uuid";

import useAICard from "@/features/ai/hooks/useAICard";
import { useAppStore } from "@/lib/app-store";
import { useAlert } from "@/shared/providers";
import { deleteCardImage, uploadCardImage } from "../services";
import { CardValidationError } from "../utils/card.validator";
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

/** Serializes cards to the CSV text shown in the paste-mode textarea. */
function buildPasteText(cards: EditorCard[]): string {
    const lines = cards.map((c) => {
        const parts = [
            c.primary || "",
            joinAlternatives(c.alternatives),
            c.meaning || "",
            c.example || "",
        ];
        return parts.map((p) => (p.includes(",") ? `"${p.replace(/"/g, '""')}"` : p)).join(",");
    });
    return lines.join("\n");
}

interface UseLessonBuilderParams {
    initialLesson?: Lesson;
    initialCards?: FlashCard[];
    onSave: (lesson: Lesson, cards: FlashCard[], isNew: boolean) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
}

export function useLessonBuilder({
    initialLesson,
    initialCards,
    onSave,
    onDelete,
    onClose,
}: UseLessonBuilderParams) {
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
    const [pasteText, setPasteText] = useState(() => buildPasteText(cards));
    const [previewRows, setPreviewRows] = useState<any[] | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [inputMode, setInputMode] = useState<"ai" | "manual" | "paste" | "uploads">("manual");
    const [aiStatus, setAiStatus] = useState<Record<string, { loading: boolean; error?: string }>>(
        {},
    );
    const [saving, setSaving] = useState(false);

    const aiCard = useAICard();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const themeHex = lesson.themeColor || "#1cb0f6";
    const clearedImagePathsRef = useRef<string[]>([]);

    // pasteText mirrors `cards` as CSV, except while the user is actively editing
    // the paste textarea (inputMode === "paste") — synced during render (not an
    // effect) so a cards/mode change takes effect immediately.
    const [prevCardsForPaste, setPrevCardsForPaste] = useState(cards);
    const [prevInputModeForPaste, setPrevInputModeForPaste] = useState(inputMode);
    if (
        inputMode !== "paste" &&
        (cards !== prevCardsForPaste || inputMode !== prevInputModeForPaste)
    ) {
        setPrevCardsForPaste(cards);
        setPrevInputModeForPaste(inputMode);
        setPasteText(buildPasteText(cards));
    }

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

    const handleSave = async () => {
        if (!lesson.title?.trim()) return showAlert("warning", "Title is required");
        setSaving(true);
        try {
            const processed: FlashCard[] = [];
            for (const c of cards) {
                const { imageFile, ...base } = c;
                if (imageFile && user) {
                    const res = await uploadCardImage(imageFile, user.uid, base.id);
                    if (base.imagePath) deleteCardImage(base.imagePath).catch(() => {});
                    processed.push({
                        ...base,
                        imageUrl: res.imageUrl,
                        imagePath: res.imagePath,
                    } as FlashCard);
                } else processed.push(base as FlashCard);
            }
            await onSave(lesson as Lesson, processed, !initialLesson);
            for (const path of clearedImagePathsRef.current) deleteCardImage(path).catch(() => {});
            clearedImagePathsRef.current = [];
        } catch (err) {
            if (err instanceof CardValidationError)
                showAlert(
                    "error",
                    "Some cards violate atomic principle (one word/phrase per card).",
                );
            else console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !initialLesson?.id) return;
        if (!confirm("Are you sure you want to delete this deck?")) return;
        setSaving(true);
        try {
            await onDelete(initialLesson.id);
            onClose();
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed to delete deck");
        } finally {
            setSaving(false);
        }
    };

    return {
        saving,
        handleSave,
        handleDelete,
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
