"use client";

import { useMemo, useState } from "react";

import { v4 as uuidv4 } from "uuid";

import type { EditorCard, FlashCard, Lesson } from "../types";

interface UseLessonBuilderProps {
    initialLesson?: Lesson;
    initialCards?: FlashCard[];
}

/**
 * Hook to manage the state and logic for building or editing a flashcard lesson.
 * Strictly encapsulates business logic from the UI as per project standards.
 */
export function useLessonBuilder({ initialLesson, initialCards }: UseLessonBuilderProps = {}) {
    const [lesson, setLesson] = useState<Partial<Lesson>>(
        initialLesson || {
            title: "",
            description: "",
            themeColor: "#1cb0f6",
            createdAt: Date.now(),
            cardCount: 0,
            categories: ["vocabulary"],
        },
    );

    const [cards, setCards] = useState<EditorCard[]>(
        initialCards?.map((c) => ({ ...c })) || [
            { id: uuidv4(), primary: "", alternatives: [], meaning: "", order: 0 },
        ],
    );

    const [pasteText, setPasteText] = useState("");
    const [previewRows, setPreviewRows] = useState<any[] | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [inputMode, setInputMode] = useState<"ai" | "manual" | "paste" | "file">("manual");

    // Memoized theme hex for CSS variables
    const themeHex = useMemo(() => lesson.themeColor || "#1cb0f6", [lesson.themeColor]);

    /** Deduplicated list of Japanese words for AI bulk generation context */
    const existingWordsForAI = useMemo(
        () =>
            Array.from(
                new Set(
                    cards
                        .flatMap((card) => [card.primary || "", ...(card.alternatives || [])])
                        .map((value) => value.trim())
                        .filter((value) => value.length > 0),
                ),
            ),
        [cards],
    );

    const addTag = (val: string) => {
        const trimmed = val.trim().toLowerCase();
        if (!trimmed) return;

        const currentCats = lesson.categories || [];
        if (!currentCats.includes(trimmed) && currentCats.length < 3) {
            setLesson((prev) => ({ ...prev, categories: [...currentCats, trimmed] }));
            setTagInput("");
        }
    };

    const removeCategory = (cat: string) => {
        setLesson((prev) => ({ ...prev, categories: prev.categories?.filter((c) => c !== cat) }));
    };

    const addCard = () => {
        setCards((prev) => [
            ...prev,
            { id: uuidv4(), primary: "", alternatives: [], meaning: "", order: prev.length },
        ]);
    };

    const deleteCard = (id: string) => {
        setCards((prev) => {
            const filtered = prev.filter((c) => c.id !== id);
            return filtered.length > 0
                ? filtered
                : [{ id: uuidv4(), primary: "", alternatives: [], meaning: "", order: 0 }];
        });
    };

    const updateCard = (id: string, field: keyof EditorCard, value: any) => {
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    };

    const handleImageChange = (file: File | null, id: string) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        updateCard(id, "imageFile", file);
        updateCard(id, "previewUrl", previewUrl);
    };

    const handleLiveSync = (rawText: string) => {
        const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
        const newCards = lines.map((line, index) => {
            const parts = line.split(",").map((p) => p.trim());
            return {
                id: `sync_${index}`,
                primary: parts[0] || "",
                alternatives: parts[1] ? [parts[1]] : [],
                meaning: parts[2] || "",
                example: parts[3] || "",
                order: index,
            };
        });
        if (newCards.length > 0) {
            setCards(newCards);
        }
    };

    const handleImportConfirm = (validRows: any[]) => {
        const newCards = validRows.map((r) => ({
            id: uuidv4(),
            primary: r.primary || r.alternative || "",
            alternatives: r.alternative ? [r.alternative] : [],
            meaning: r.meaning,
            example: r.example,
            order: cards.length,
        }));

        if (inputMode === "ai") {
            setCards((prev) => [...prev, ...newCards]);
        } else {
            setCards(newCards);
        }
        setPreviewRows(null);
        setInputMode("manual");
    };

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
        existingWordsForAI,
        addTag,
        removeCategory,
        addCard,
        deleteCard,
        updateCard,
        handleImageChange,
        handleLiveSync,
        handleImportConfirm,
    };
}
