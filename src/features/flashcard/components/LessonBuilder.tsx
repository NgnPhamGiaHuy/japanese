"use client";

import React from "react";

import { Save, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { Button } from "@/shared/components/ui";
import LessonBuilderCardList from "./LessonBuilderCardList";
import LessonBuilderImportPane from "./LessonBuilderImportPane";
import LessonBuilderMeta from "./LessonBuilderMeta";
import { useLessonBuilder } from "../hooks/useLessonBuilder";

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
    const builder = useLessonBuilder({
        initialLesson: editingLesson,
        initialCards,
        onSave,
        onDelete,
        onClose,
    });
    const { saving, handleSave, handleDelete } = builder;

    return (
        <div
            className="bg-bg fixed inset-0 z-50 flex flex-col overflow-y-auto"
            style={{ "--theme-color": builder.themeHex } as React.CSSProperties}
        >
            <header className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    icon={X}
                    disabled={saving}
                    aria-label="Close"
                />
                <h2 className="text-text text-lg font-black sm:text-xl">
                    {editingLesson ? "Edit Deck" : "New Deck"}
                </h2>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    icon={Save}
                    className="!py-2 !text-xs shadow-lg sm:!py-3 sm:!text-sm"
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
                    onAISuccess={(title, description) => {
                        builder.setFormValue("title", title, { shouldDirty: true });
                        builder.setFormValue("description", description, { shouldDirty: true });
                    }}
                />
                <AnimatePresence mode="wait">
                    {(builder.inputMode === "manual" || builder.inputMode === "paste") && (
                        <m.div
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
                        </m.div>
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
