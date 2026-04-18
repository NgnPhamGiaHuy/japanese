"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLessonBuilder } from "../hooks/useLessonBuilder";
import { LessonBuilderMeta } from "./LessonBuilderMeta";
import { LessonBuilderCardList } from "./LessonBuilderCardList";
import { LessonBuilderImportPane } from "./LessonBuilderImportPane";
import type { FlashCard, Lesson } from "../types";
import { X, Save } from "lucide-react";
import { Button } from "@/shared/components/ui";

interface LessonBuilderProps {
    editingLesson?: Lesson;
    initialCards?: FlashCard[];
    onSave: (lesson: Lesson, cards: FlashCard[], isNew: boolean) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    onClose: () => void;
}

/**
 * Senior-level orchestrator for the complex Lesson Creation workflow.
 * Adheres to strict 200-line limit and separation of concerns.
 */
const LessonBuilder: React.FC<LessonBuilderProps> = ({
    editingLesson,
    initialCards,
    onSave,
    onClose,
}) => {
    const builder = useLessonBuilder({ initialLesson: editingLesson, initialCards });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!builder.lesson.title?.trim()) return;
        setSaving(true);
        try {
            await onSave(builder.lesson as Lesson, builder.cards as FlashCard[], !editingLesson);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#F7F7F8]"
            style={{ "--theme-color": builder.themeHex } as React.CSSProperties}
        >
            <header className="sticky top-0 z-50 flex items-center justify-between border-b-2 border-gray-200 bg-white px-6 py-4">
                <Button variant="ghost" onClick={onClose} icon={X} disabled={saving} />
                <h2 className="text-xl font-black text-[#3c3c3c]">
                    {editingLesson ? "Edit Deck" : "New Deck"}
                </h2>
                <Button 
                    variant="primary" 
                    onClick={handleSave} 
                    disabled={saving} 
                    icon={Save}
                    className="shadow-lg"
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
            </header>

            <main className="mx-auto w-full max-w-3xl space-y-12 p-8 pb-32">
                <LessonBuilderMeta {...builder} saving={saving} />

                <LessonBuilderImportPane 
                    {...builder} 
                    existingWords={builder.existingWordsForAI}
                    handleImportConfirm={builder.handleImportConfirm}
                    saving={saving} 
                />

                <AnimatePresence mode="wait">
                    {builder.inputMode === "manual" && (
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
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default LessonBuilder;
