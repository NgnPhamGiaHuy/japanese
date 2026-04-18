"use client";

import React, { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Save, X } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";
import { useAppStore } from "@/store";
import LessonBuilderCardList from "./LessonBuilderCardList";
import LessonBuilderImportPane from "./LessonBuilderImportPane";
import LessonBuilderMeta from "./LessonBuilderMeta";
import { useLessonBuilder } from "../hooks/useLessonBuilder";
import { deleteCardImage, uploadCardImage } from "../services";
import { CardValidationError } from "../utils/card.validator";

import type { FlashCard, Lesson } from "../types";

interface LessonBuilderProps {
    editingLesson?: Lesson;
    initialCards?: FlashCard[];
    onSave: (lesson: Lesson, cards: FlashCard[], isNew: boolean) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
}

const LessonBuilder: React.FC<LessonBuilderProps> = ({
    editingLesson,
    initialCards,
    onSave,
    onDelete,
    onClose,
}) => {
    const builder = useLessonBuilder({ initialLesson: editingLesson, initialCards });
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!builder.lesson.title?.trim()) return showAlert("warning", "Title is required");
        setSaving(true);
        try {
            const processed: FlashCard[] = [];
            for (const c of builder.cards) {
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
            await onSave(builder.lesson as Lesson, processed, !editingLesson);
            for (const path of builder.clearedImagePathsRef.current)
                deleteCardImage(path).catch(() => {});
            builder.clearedImagePathsRef.current = [];
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
        if (!onDelete || !editingLesson?.id) return;
        if (!confirm("Are you sure you want to delete this deck?")) return;
        setSaving(true);
        try {
            await onDelete(editingLesson.id);
            onClose();
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed to delete deck");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]"
            style={{ "--theme-color": builder.themeHex } as React.CSSProperties}
        >
            <header className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <Button variant="ghost" onClick={onClose} icon={X} disabled={saving} />
                <h2 className="text-lg font-black text-[#3c3c3c] sm:text-xl">
                    {editingLesson ? "Edit Deck" : "New Deck"}
                </h2>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    icon={Save}
                    className="shadow-lg !py-2 !text-xs sm:!py-3 sm:!text-sm"
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </header>
            <main className="mx-auto w-full max-w-3xl space-y-8 p-4 pt-8 pb-32 sm:space-y-12 sm:p-8 lg:max-w-5xl">
                <LessonBuilderMeta {...builder} saving={saving} />
                <LessonBuilderImportPane
                    {...builder}
                    existingWords={builder.existingWordsForAI}
                    handleImportConfirm={builder.handleImportConfirm}
                    saving={saving}
                    onAISuccess={(title, description) =>
                        builder.setLesson((prev) => ({ ...prev, title, description }))
                    }
                />
                <AnimatePresence mode="wait">
                    {(builder.inputMode === "manual" || builder.inputMode === "paste") && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <LessonBuilderCardList
                                cards={builder.cards}
                                setCards={builder.setCards}
                                updateCard={builder.updateCard}
                                deleteCard={builder.deleteCard}
                                handleImageChange={builder.handleImageChange}
                                themeHex={builder.themeHex}
                                saving={saving}
                                aiStatus={builder.aiStatus}
                                onAIFill={builder.handleAIFillCard}
                                onImageClear={(path) =>
                                    builder.clearedImagePathsRef.current.push(path)
                                }
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {editingLesson && onDelete && (
                    <div className="mt-8 border-t-2 border-gray-100 pt-12 pb-24">
                        <Button
                            variant="secondary"
                            color="red"
                            disabled={saving}
                            onClick={handleDelete}
                            className="w-full !rounded-2xl !py-4 text-lg font-black"
                        >
                            Delete Deck
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LessonBuilder;
