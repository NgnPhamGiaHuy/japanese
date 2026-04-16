/**
 * @file LessonBuilder
 * Orchestrator for creating and editing flashcard decks (lessons).
 * Supports manual entry, AI-assisted generation, CSV imports, and text pasting.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { Image as ImageIcon, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";

import { AIBulkPanel, useAICard } from "@/features/ai";
import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import { hexToThemeColor } from "@/shared/utils";
import { useAppStore } from "@/store";
import { ImportPreview } from "./ImportPreview";
import { useCards } from "../hooks/useCards";
import { deleteCardImage, uploadCardImage } from "../services";
import { CardValidationError } from "../utils/card.validator";
import { parseCSV, parseText } from "../utils/parser";

import type { ImportRow } from "./ImportPreview";
import type { FlashCard, Lesson } from "../types";

/** Extended FlashCard type for managing temporary local file state during editing */
type EditorCard = FlashCard & { imageFile?: File; previewUrl?: string };

interface LessonBuilderProps {
    /** Callback triggered when the user commits the full deck (new or edited) */
    onSave: (lesson: Lesson, cards: FlashCard[], isNew: boolean) => Promise<void>;

    /** Optional callback for deleting the entire deck (only for owners in edit mode) */
    onDelete?: (id: string) => Promise<void>;

    /** Triggered when closing the builder (cancel or finish) */
    onClose: () => void;

    /** Existing lesson data if in edit mode */
    editingLesson?: Lesson | null;

    /** Pre-loaded card data (usually for shared decks or deep-linked edits) */
    initialCards?: FlashCard[];
}

/**
 * Factory for creating a skeleton card with unique ID.
 * Generates an ID prefix 'c_' to distinguish from Firestore IDs.
 */
const makeCard = (): EditorCard => ({
    id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    lessonId: "",
    primary: "",
    alternatives: [],
    meaning: "",
    example: "",
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: 0,
});

/**
 * LessonBuilder Component
 *
 * @remarks
 * A high-complexity component that manages:
 * 1. **Multi-Source Ingestion**: Switchable modes for AI Bulk generation, manual entry, CSV uploads, or raw text pasting.
 * 2. **AI Assistance**: Individual card "AI Fill" feature powered by `useAICard`.
 * 3. **Image Lifecycle**: Local preview generation using `URL.createObjectURL` and late-binding storage uploads.
 * 4. **Validation**: Ensures every card has at least a word and a meaning before saving.
 *
 * @example
 * <LessonBuilder editingLesson={myDeck} onSave={handleSave} onClose={closeModal} />
 */
export const LessonBuilder = ({
    onSave,
    onDelete,
    onClose,
    editingLesson,
    initialCards,
}: LessonBuilderProps) => {
    const isNew = !editingLesson;
    const { user } = useAppStore();
    const { showAlert } = useAlert();

    // Data fetching: Only fetch if initialCards are not provided (Owner edit flow)
    const { cards: existingCards, loading: cardsLoading } = useCards(
        initialCards ? undefined : editingLesson?.id,
        initialCards ? undefined : editingLesson?.userId,
    );

    const [lesson, setLesson] = useState<Lesson>(
        () =>
            editingLesson ?? {
                id: "",
                title: "",
                description: "",
                tags: [],
                createdAt: Date.now(),
                cardCount: 0,
            },
    );
    const [cards, setCards] = useState<EditorCard[]>(initialCards || []);
    const [tagInput, setTagInput] = useState("");
    const [saving, setSaving] = useState(false);

    /** Determines the current ingestion UI (AI vs Manual vs Import) */
    const [importMode, setImportMode] = useState<"ai" | "manual" | "paste" | "file">(
        editingLesson ? "manual" : "ai",
    );
    const [pasteText, setPasteText] = useState("");

    /** Buffer for raw import data awaiting user confirmation/matching in ImportPreview */
    const [previewRows, setPreviewRows] = useState<ImportRow[] | null>(null);

    const [aiLoadingCardIds, setAILoadingCardIds] = useState<Set<string>>(new Set());
    const [aiCardErrors, setAICardErrors] = useState<Record<string, string>>({});

    const aiCard = useAICard();

    /** Track images marked for removal during the edit session to delete from Storage on successful save */
    const clearedImagePathsRef = useRef<string[]>([]);

    // Sync fetched cards when they arrive (standard edit flow)
    useEffect(() => {
        if (!isNew && !initialCards && !cardsLoading) {
            setCards(existingCards);
        }
    }, [isNew, cardsLoading, existingCards, initialCards]);

    /**
     * Contextual AI Fill
     * Uses the current word to fetch alternatives, meaning, and examples.
     *
     * @param cardId - The target card's local/remote ID
     * @param word - The Japanese word to look up
     */
    const handleAIFillCard = async (cardId: string, word: string) => {
        if (!word.trim()) return;
        setAILoadingCardIds((prev) => new Set(prev).add(cardId));
        setAICardErrors((prev) => {
            const n = { ...prev };
            delete n[cardId];
            return n;
        });

        const result = await aiCard.generate(word.trim());

        setAILoadingCardIds((prev) => {
            const next = new Set(prev);
            next.delete(cardId);
            return next;
        });

        if (result) {
            setCards((prev) =>
                prev.map((c) =>
                    c.id === cardId
                        ? {
                              ...c,
                              primary: result.primary || c.primary,
                              alternatives: result.alternatives || c.alternatives || [],
                              meaning: result.meaning,
                              example: result.example,
                              ...(result.distractors !== undefined && {
                                  distractors: result.distractors,
                              }),
                              ...(result.hint !== undefined && { hint: result.hint }),
                              ...(result.usageNote !== undefined && {
                                  usageNote: result.usageNote,
                              }),
                              ...(result.difficulty !== undefined && {
                                  difficulty: result.difficulty,
                              }),
                          }
                        : c,
                ),
            );
        } else if (aiCard.error) {
            setAICardErrors((prev) => ({ ...prev, [cardId]: aiCard.error! }));
        }
    };

    /**
     * Submission Logic
     * 1. Filters out empty cards.
     * 2. Uploads pending image files to Storage.
     * 3. Cleans up redundant Storage paths.
     * 4. Persists the lesson object and card array via `onSave`.
     */
    const handleSave = async () => {
        if (!lesson.title.trim()) {
            showAlert("warning", "Title is required");
            return;
        }

        const invalidCards = cards.filter((c) => !c.primary?.trim() || !c.meaning.trim());
        if (invalidCards.length > 0) {
            showAlert(
                "warning",
                "All cards must have a Primary word and a Meaning. Please check cards with missing information.",
            );
            return;
        }

        const validCards = cards;

        setSaving(true);
        try {
            // Process Image Uploads
            const processedCards: FlashCard[] = [];
            for (const c of validCards) {
                const { imageFile, ...baseCard } = c;
                if (imageFile && user) {
                    // Upload new image
                    const res = await uploadCardImage(imageFile, user.uid, baseCard.id);
                    // Optionally delete old image if replaced
                    if (baseCard.imagePath) {
                        deleteCardImage(baseCard.imagePath).catch(() => {});
                    }
                    processedCards.push({
                        ...baseCard,
                        imageUrl: res.imageUrl,
                        imagePath: res.imagePath,
                    });
                } else {
                    processedCards.push(baseCard);
                }
            }

            await onSave(lesson, processedCards, isNew);

            // Post-success cleanup: Delete images that were explicitly removed during editing
            for (const path of clearedImagePathsRef.current) {
                deleteCardImage(path).catch(() => {});
            }
            clearedImagePathsRef.current = [];
        } catch (err) {
            if (err instanceof CardValidationError) {
                const details = err.violations
                    .map((v) => `"${v.offendingValue}" (${v.rule.replace(/_/g, " ")})`)
                    .join(", ");
                showAlert(
                    "error",
                    `Some cards violate the Atomic Card principle: ${details}. Each card's primary field must contain exactly one word or phrase — no commas, slashes, or parenthetical expressions.`,
                );
            } else {
                throw err;
            }
        } finally {
            setSaving(false);
        }
    };

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim()) {
            if (!lesson.tags.includes(tagInput.trim()))
                setLesson({ ...lesson, tags: [...lesson.tags, tagInput.trim()] });
            setTagInput("");
        }
    };

    /** Curried helper for updating individual card properties within the list state */
    const updateCard = (id: string, field: keyof EditorCard, value: EditorCard[keyof EditorCard]) =>
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

    /** Manages local blob preview for freshly selected image files */
    const handleImageChange = (file: File | null, id: string) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, imageFile: file, previewUrl } : c)),
        );
    };

    const removeCard = (id: string) => {
        setCards((prev) => prev.filter((c) => c.id !== id));
    };

    const themeHex = lesson.themeColor || "#1cb0f6";
    const themeColorStr = hexToThemeColor(themeHex);

    /** Deduplicated list of Japanese words for AI bulk generation context */
    const existingWordsForAI = Array.from(
        new Set(
            cards
                .flatMap((card) => [card.primary, ...(card.alternatives || [])])
                .map((value) => (value || "").trim())
                .filter((value) => value.length > 0),
        ),
    );

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]"
            style={{ "--theme-color": themeHex } as React.CSSProperties}
        >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-gray-200 bg-white/90 px-4 py-4 backdrop-blur-md">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    icon={X}
                    className="px-3 py-2"
                    disabled={saving}
                />
                <h2 className="text-xl font-black text-[#3c3c3c]">
                    {editingLesson ? "Edit Deck" : "New Deck"}
                </h2>
                <Button
                    variant="primary"
                    color={themeColorStr}
                    onClick={handleSave}
                    disabled={saving || cardsLoading}
                    className="min-w-[80px] px-6 py-2 text-sm"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
                </Button>
            </header>

            <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 p-6">
                {/* Meta Panel (Title, Description, Tags, Theme) */}
                <div className="space-y-4 rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm">
                    <input
                        type="text"
                        placeholder="Deck Title ✱ (e.g. JLPT N5 Verbs)"
                        className="w-full border-b-2 border-transparent bg-transparent pb-2 text-3xl font-black text-[#3c3c3c] placeholder-gray-300 transition-colors outline-none focus:border-[var(--theme-color)]"
                        value={lesson.title}
                        onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                        autoFocus={!editingLesson}
                        disabled={saving}
                    />
                    <textarea
                        placeholder="Describe what this deck is about..."
                        className="h-20 w-full resize-none border-b-2 border-transparent bg-transparent font-bold text-[#afafaf] placeholder-gray-300 transition-colors outline-none focus:border-[var(--theme-color)]"
                        value={lesson.description}
                        onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
                        disabled={saving}
                    />
                    <div className="pt-2">
                        <div className="mb-3 flex flex-wrap gap-2">
                            {lesson.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-black text-[#afafaf] uppercase"
                                >
                                    {tag}
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setLesson({
                                                ...lesson,
                                                tags: lesson.tags.filter((t) => t !== tag),
                                            })
                                        }
                                        className="!h-auto !w-auto !p-0.5 hover:text-[#ea2b2b]"
                                        disabled={saving}
                                        icon={X}
                                    />
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Add tag and press Enter..."
                            value={tagInput}
                            className="mb-4 w-full max-w-xs rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-bold placeholder-gray-300 transition-colors outline-none focus:border-[var(--theme-color)]"
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={addTag}
                            disabled={saving}
                        />

                        {/* Theme Picker */}
                        <div className="border-t-2 border-gray-100 pt-4">
                            <label className="mb-3 block text-xs font-black tracking-wider text-[#afafaf] uppercase">
                                Theme Color
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    "#1cb0f6", // Blue (Default)
                                    "#58cc02", // Green
                                    "#ff9600", // Orange
                                    "#ce82ff", // Purple
                                    "#ea2b2b", // Red
                                    "#ff66bb", // Pink
                                ].map((color) => (
                                    <Button
                                        key={color}
                                        type="button"
                                        onClick={() => setLesson({ ...lesson, themeColor: color })}
                                        className={`!h-12 !w-12 !min-w-0 !rounded-full !border-[3px] !p-0 shadow-none transition-all hover:scale-110 hover:shadow-none active:translate-y-0 active:scale-95 ${
                                            (lesson.themeColor || "#1cb0f6") === color
                                                ? "!border-black shadow-sm"
                                                : "!border-transparent opacity-80 hover:opacity-100"
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Mode Tabs (Import Logic Swappers) */}
                <div className="mb-6 flex overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                    {(["ai", "manual", "paste", "file"] as const).map((mode) => (
                        <Button
                            key={mode}
                            variant="ghost"
                            onClick={() => {
                                setImportMode(mode);
                                setPreviewRows(null);
                            }}
                            className={`!flex !flex-1 !items-center !justify-center !gap-1.5 !rounded-none !p-4 !text-xs !font-black !tracking-wider uppercase shadow-none transition-colors hover:shadow-none active:translate-y-0 ${importMode === mode ? "!text-white" : "!text-[#afafaf] hover:!bg-gray-50"}`}
                            style={importMode === mode ? { backgroundColor: themeHex } : {}}
                            icon={mode === "ai" ? Sparkles : undefined}
                            iconSize={14}
                            iconClassName={importMode === "ai" ? "!text-white" : ""}
                        >
                            {mode === "ai" ? "AI" : mode}
                        </Button>
                    ))}
                </div>

                {/* Switchable Import Panels */}
                {previewRows ? (
                    <ImportPreview
                        initialRows={previewRows}
                        themeColor={themeHex}
                        onCancel={() => setPreviewRows(null)}
                        onConfirm={(validRows) => {
                            const newCards = validRows.map((r) => ({
                                ...makeCard(),
                                primary: r.primary || r.alternative || "",
                                alternatives: r.alternative ? [r.alternative] : [],
                                meaning: r.meaning,
                                example: r.example,
                            }));
                            setCards((prev) => [...prev, ...newCards]);
                            setPreviewRows(null);
                            setImportMode("manual");
                            setPasteText("");
                        }}
                    />
                ) : importMode === "ai" ? (
                    <AIBulkPanel
                        themeColor={themeHex}
                        existingWords={existingWordsForAI}
                        onPreview={(rows) => setPreviewRows(rows)}
                    />
                ) : importMode === "paste" ? (
                    <div className="space-y-4">
                        <textarea
                            className="h-64 w-full resize-none rounded-2xl border-2 border-gray-200 bg-white p-4 font-bold text-[#3c3c3c] outline-none focus:border-[var(--theme-color)]"
                            placeholder="Paste your text here...&#10;Format:&#10;primary,meaning&#10;primary,secondary,meaning"
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            disabled={saving}
                        />
                        <Button
                            variant="primary"
                            color={themeColorStr}
                            onClick={() => {
                                const result = parseText(pasteText);
                                const rows: ImportRow[] = [
                                    ...result.valid.map((r, i) => ({
                                        id: `valid_${Date.now()}_${i}`,
                                        primary: r.primary || "",
                                        alternative: r.alternatives?.[0] || "",
                                        meaning: r.meaning || "",
                                        example: r.example || "",
                                        isInvalid: false,
                                        atomicViolation: r.atomicViolation,
                                    })),
                                    ...result.invalid.map((r, i) => ({
                                        id: `invalid_${Date.now()}_${i}`,
                                        primary: r.row || "",
                                        alternative: "",
                                        meaning: "",
                                        example: "",
                                        isInvalid: true,
                                        errorMsg: r.error,
                                        originalText: r.row,
                                    })),
                                ];
                                setPreviewRows(rows);
                            }}
                            disabled={!pasteText.trim()}
                            className="w-full"
                        >
                            Preview
                        </Button>
                    </div>
                ) : importMode === "file" ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-[2rem] border-4 border-dashed border-gray-300 bg-white p-12 text-center transition-colors hover:border-[var(--theme-color)]">
                        <input
                            type="file"
                            accept=".csv,.txt"
                            id="file-upload"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const result = await parseCSV(file);
                                const rows: ImportRow[] = [
                                    ...result.valid.map((r, i) => ({
                                        id: `valid_${Date.now()}_${i}`,
                                        primary: r.primary || "",
                                        alternative: r.alternatives?.[0] || "",
                                        meaning: r.meaning || "",
                                        example: r.example || "",
                                        isInvalid: false,
                                        atomicViolation: r.atomicViolation,
                                    })),
                                    ...result.invalid.map((r, i) => ({
                                        id: `invalid_${Date.now()}_${i}`,
                                        primary: r.row || "",
                                        alternative: "",
                                        meaning: "",
                                        example: "",
                                        isInvalid: true,
                                        errorMsg: r.error,
                                        originalText: r.row,
                                    })),
                                ];
                                setPreviewRows(rows);
                                e.target.value = "";
                            }}
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer text-lg font-bold text-[#afafaf] transition-colors"
                            style={{ color: themeHex }}
                        >
                            Click to select CSV or TXT file
                        </label>
                    </div>
                ) : (
                    /* Manual Card Editor */
                    <div>
                        <div className="mb-4 flex items-end justify-between px-2">
                            <h3 className="text-2xl font-black text-[#3c3c3c]">
                                Cards{" "}
                                {cardsLoading ? (
                                    <Loader2 size={16} className="ml-2 inline animate-spin" />
                                ) : (
                                    `(${cards.length})`
                                )}
                            </h3>
                            <Button
                                onClick={() => setCards([...cards, makeCard()])}
                                disabled={saving || cardsLoading}
                                variant="ghost"
                                className="!flex !items-center !gap-1 !px-2 !text-sm !font-black shadow-none hover:shadow-none"
                                color={themeHex}
                                icon={Plus}
                            >
                                Add Card
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {cards.map((card, idx) => (
                                <div
                                    key={card.id}
                                    className="group relative rounded-[2rem] border-2 border-b-8 border-gray-200 bg-white p-6 shadow-sm transition-colors focus-within:border-[var(--theme-color)]"
                                >
                                    <div className="absolute -top-3 -left-3 flex h-10 w-10 -rotate-3 transform items-center justify-center rounded-xl border-b-4 border-black bg-[#3c3c3c] text-lg font-black text-white shadow-sm">
                                        {idx + 1}
                                    </div>
                                    <Button
                                        variant="primary"
                                        color="red"
                                        onClick={() => removeCard(card.id)}
                                        disabled={saving}
                                        className="absolute -top-3 -right-3 z-10 !h-10 !w-10 rotate-3 transform !p-1 opacity-100 transition-all hover:scale-110 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                                        title="Remove Card"
                                        icon={Trash2}
                                        iconSize={22}
                                    />

                                    <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <div className="mb-1 flex items-center justify-between">
                                                <label className="text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                                    Primary ✱
                                                </label>
                                                <Button
                                                    variant="ghost"
                                                    title={
                                                        card.primary?.trim()
                                                            ? "Auto-fill with AI"
                                                            : "Type a word first"
                                                    }
                                                    loading={aiLoadingCardIds.has(card.id)}
                                                    disabled={saving || !card.primary?.trim()}
                                                    onClick={() =>
                                                        handleAIFillCard(
                                                            card.id,
                                                            card.primary || "",
                                                        )
                                                    }
                                                    className="!flex !h-auto !items-center !gap-1 !px-2 !py-0.5 !text-[9px] !font-black uppercase shadow-none hover:shadow-none"
                                                    color={themeHex}
                                                    icon={Sparkles}
                                                    iconSize={10}
                                                >
                                                    {aiLoadingCardIds.has(card.id)
                                                        ? "Filling…"
                                                        : "AI Fill"}
                                                </Button>
                                            </div>
                                            <input
                                                className={`w-full border-b-2 border-gray-100 bg-transparent pb-2 text-3xl font-black text-[#3c3c3c] transition-colors outline-none focus:border-[var(--theme-color)] ${aiLoadingCardIds.has(card.id) ? "opacity-60" : ""}`}
                                                placeholder="食べる / たべる"
                                                value={card.primary || ""}
                                                onChange={(e) =>
                                                    updateCard(card.id, "primary", e.target.value)
                                                }
                                                disabled={saving || aiLoadingCardIds.has(card.id)}
                                            />
                                            {aiCardErrors[card.id] && (
                                                <p className="mt-1 text-[10px] font-bold text-[#ea2b2b]">
                                                    {aiCardErrors[card.id]}
                                                </p>
                                            )}
                                        </div>
                                        {(["alternative"] as const).map((repKey) => (
                                            <div key={repKey}>
                                                <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                                    Alternative
                                                </label>
                                                <input
                                                    className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-xl font-bold text-[#3c3c3c] transition-colors outline-none focus:border-[var(--theme-color)]"
                                                    placeholder="Alternate form (optional)"
                                                    value={card.alternatives?.[0] || ""}
                                                    onChange={(e) =>
                                                        updateCard(
                                                            card.id,
                                                            "alternatives",
                                                            e.target.value ? [e.target.value] : [],
                                                        )
                                                    }
                                                    disabled={saving}
                                                />
                                            </div>
                                        ))}
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                                Meaning ✱
                                            </label>
                                            <input
                                                className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-xl font-bold text-[#3c3c3c] transition-colors outline-none focus:border-[var(--theme-color)]"
                                                placeholder="To eat"
                                                value={card.meaning}
                                                onChange={(e) =>
                                                    updateCard(card.id, "meaning", e.target.value)
                                                }
                                                disabled={saving}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                                Example Sentence (Optional)
                                            </label>
                                            <input
                                                className="w-full border-b-2 border-gray-100 bg-transparent pb-2 text-base font-bold text-[#3c3c3c] transition-colors outline-none focus:border-[var(--theme-color)]"
                                                placeholder="りんごを食べる。"
                                                value={card.example}
                                                onChange={(e) =>
                                                    updateCard(card.id, "example", e.target.value)
                                                }
                                                disabled={saving}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                                Card Image (Optional)
                                            </label>
                                            <div className="mt-2 flex items-center gap-4">
                                                {card.previewUrl || card.imageUrl ? (
                                                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border-2 border-gray-200">
                                                        <img
                                                            key={card.previewUrl || card.imageUrl}
                                                            src={card.previewUrl || card.imageUrl}
                                                            alt="Card preview"
                                                            className="h-full w-full object-cover"
                                                            crossOrigin="anonymous"
                                                            referrerPolicy="no-referrer"
                                                            onError={(e) => {
                                                                // Fallback if the URL fails
                                                                e.currentTarget.style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                // Track the cleared path so we can delete from Storage on save
                                                                if (card.imagePath) {
                                                                    clearedImagePathsRef.current.push(
                                                                        card.imagePath,
                                                                    );
                                                                }
                                                                setCards((prev) =>
                                                                    prev.map((c) =>
                                                                        c.id === card.id
                                                                            ? {
                                                                                  ...c,
                                                                                  imageFile:
                                                                                      undefined,
                                                                                  previewUrl:
                                                                                      undefined,
                                                                                  imageUrl:
                                                                                      undefined,
                                                                                  imagePath:
                                                                                      undefined,
                                                                              }
                                                                            : c,
                                                                    ),
                                                                );
                                                            }}
                                                            disabled={saving}
                                                            className="absolute inset-0 !flex !h-full !w-full !items-center !justify-center !rounded-xl !bg-black/50 !text-white opacity-0 shadow-none transition-opacity hover:opacity-100 hover:shadow-none active:translate-y-0"
                                                            icon={Trash2}
                                                            iconSize={24}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        id={`img-upload-${card.id}`}
                                                        className="hidden"
                                                        disabled={saving}
                                                        onChange={(e) =>
                                                            handleImageChange(
                                                                e.target.files?.[0] || null,
                                                                card.id,
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            document
                                                                .getElementById(
                                                                    `img-upload-${card.id}`,
                                                                )
                                                                ?.click();
                                                        }}
                                                        className="!rounded-xl !border-2 !border-gray-200 !bg-white !px-4 !py-2 !text-sm !font-bold !text-[#3c3c3c] shadow-sm hover:!bg-gray-50 active:translate-y-0"
                                                    >
                                                        {card.previewUrl || card.imageUrl
                                                            ? "Change Image"
                                                            : "Upload Image"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {cards.length > 0 && (
                                <div className="pt-4 pb-8">
                                    <Button
                                        onClick={() => setCards([...cards, makeCard()])}
                                        disabled={saving || cardsLoading}
                                        variant="secondary"
                                        className="w-full !rounded-[1.5rem] !py-4 !text-sm !font-black"
                                        color={themeHex}
                                        icon={Plus}
                                    >
                                        Add Another Card
                                    </Button>
                                </div>
                            )}

                            {!cardsLoading && cards.length === 0 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setCards([makeCard()])}
                                    className="!flex !h-auto !w-full !cursor-pointer !flex-col !items-center !justify-center !gap-4 !rounded-[2rem] !border-4 !border-dashed !border-gray-300 !bg-white !p-12 !text-center !text-lg !font-bold !text-[#afafaf] shadow-none transition-colors hover:!border-[var(--theme-color)] hover:!bg-white hover:!text-[var(--theme-color)] hover:shadow-none active:translate-y-0"
                                    icon={Plus}
                                    iconSize={48}
                                    iconClassName="!opacity-50 !mb-0"
                                >
                                    <p>Click to add your first card</p>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {editingLesson && onDelete && (
                    <div className="pt-8 pb-12">
                        <Button
                            variant="secondary"
                            color="red"
                            disabled={saving}
                            onClick={async () => {
                                if (confirm("Delete this deck?")) {
                                    setSaving(true);
                                    try {
                                        await onDelete(editingLesson.id);
                                        onClose();
                                    } finally {
                                        setSaving(false);
                                    }
                                }
                            }}
                            className="w-full text-lg"
                        >
                            Delete Deck
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonBuilder;
