import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";

import useAICard from "@/features/ai/hooks/useAICard";
import { useAppStore } from "@/lib/app-store";
import { useAlert } from "@/shared/providers";
import { lessonMetadataSchema } from "@/shared/schemas";
import { deleteCardImage, uploadCardImage } from "../services";
import { CardValidationError } from "../utils/card.validator";
import { joinAlternatives } from "../utils/formatting";
import { parseText } from "../utils/parser";

import type { LessonMetadata, LessonMetadataInput } from "@/shared/schemas";
import type { ImportRow } from "../components/ImportPreview";
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
    const form = useForm<LessonMetadataInput, unknown, LessonMetadata>({
        resolver: zodResolver(lessonMetadataSchema),
        defaultValues: {
            title: initialLesson?.title ?? "",
            description: initialLesson?.description ?? "",
            categories: initialLesson?.categories ?? ["vocabulary"],
            type: initialLesson?.type,
            themeColor: initialLesson?.themeColor ?? "#1cb0f6",
        },
    });
    const { register, setValue, getValues, handleSubmit, formState } = form;

    const [cards, setCards] = useState<EditorCard[]>(initialCards?.map((c) => ({ ...c })) || []);
    const [pasteText, setPasteText] = useState(() => buildPasteText(cards));
    const [previewRows, setPreviewRows] = useState<ImportRow[] | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [inputMode, setInputMode] = useState<"ai" | "manual" | "paste" | "uploads">("manual");
    const [aiStatus, setAiStatus] = useState<Record<string, { loading: boolean; error?: string }>>(
        {},
    );
    const [saving, setSaving] = useState(false);

    const aiCard = useAICard();
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    // Narrow watches — only these two rerender the tree on change (swatch click,
    // add/remove tag), unlike title/description which stay uncontrolled via `register`.
    const themeHex = form.watch("themeColor") || "#1cb0f6";
    const categories = form.watch("categories") || [];
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

    const updateCard = <K extends keyof EditorCard>(id: string, field: K, value: EditorCard[K]) =>
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

    const handleImportConfirm = (validRows: ImportRow[]) => {
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

    const handleSave = handleSubmit(
        async (data) => {
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
                const mergedLesson = {
                    ...initialLesson,
                    ...data,
                    createdAt: initialLesson?.createdAt ?? Date.now(),
                } as Lesson;
                await onSave(mergedLesson, processed, !initialLesson);
                for (const path of clearedImagePathsRef.current)
                    deleteCardImage(path).catch(() => {});
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
        },
        () => showAlert("warning", formState.errors.title?.message ?? "Title is required"),
    );

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
        register,
        formErrors: formState.errors,
        setFormValue: setValue,
        categories,
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
            const current = getValues("categories") || [];
            if (trimmed && current.length < 3) {
                setValue("categories", [...current, trimmed], { shouldDirty: true });
                setTagInput("");
            }
        },
        removeCategory: (cat: string) =>
            setValue(
                "categories",
                (getValues("categories") || []).filter((c) => c !== cat),
                { shouldDirty: true },
            ),
        addCard: () => setCards((prev) => [...prev, makeCard(prev.length)]),
        deleteCard: (id: string) => setCards((prev) => prev.filter((c) => c.id !== id)),
        handleImageChange: (file: File | null, id: string) => {
            if (!file) return;
            updateCard(id, "imageFile", file);
            updateCard(id, "previewUrl", URL.createObjectURL(file));
        },
    };
}
