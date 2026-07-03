"use client";

import React from "react";

import { motion, Reorder } from "framer-motion";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/shared/components/ui";
import DraggableCard from "./DraggableCard";

import type { EditorCard } from "../types";

interface LessonBuilderCardListProps {
    cards: EditorCard[];
    setCards: (cards: EditorCard[]) => void;
    updateCard: (id: string, field: keyof EditorCard, value: any) => void;
    deleteCard: (id: string) => void;
    handleImageChange: (file: File | null, id: string) => void;
    themeHex: string;
    saving: boolean;
    aiStatus?: Record<string, { loading: boolean; error?: string }>;
    onAIFill: (id: string, word: string) => void;
    onImageClear: (path: string) => void;
}

const LessonBuilderCardList: React.FC<LessonBuilderCardListProps> = ({
    cards,
    setCards,
    updateCard,
    deleteCard,
    handleImageChange,
    themeHex,
    saving,
    aiStatus,
    onAIFill,
    onImageClear,
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-[#3c3c3c] sm:text-2xl">
                    Cards <span className="text-gray-300">({cards.length})</span>
                </h3>
                <Button
                    variant="ghost"
                    icon={Plus}
                    onClick={() => {
                        const newCard: EditorCard = {
                            id: `c_${uuidv4()}`,
                            primary: "",
                            alternatives: [],
                            meaning: "",
                            example: "",
                            order: cards.length,
                        };
                        setCards([...cards, newCard]);
                    }}
                    className="!text-[10px] !font-black tracking-widest !text-[var(--theme-color)] !uppercase hover:bg-[var(--theme-color)]/5 sm:!text-xs"
                >
                    Add Card
                </Button>
            </div>

            <Reorder.Group
                axis="y"
                values={cards}
                onReorder={setCards}
                className="space-y-6 sm:space-y-8"
            >
                {cards.map((card, index) => (
                    <Reorder.Item
                        key={card.id}
                        value={card}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <DraggableCard
                            card={card}
                            idx={index}
                            onUpdate={(id, field, val) => updateCard(id, field, val)}
                            onRemove={(id) => deleteCard(id)}
                            onAIFill={(id, word) => onAIFill(id, word)}
                            onImageChange={(file, id) => handleImageChange(file, id)}
                            onImageClear={(path) => onImageClear(path)}
                            themeHex={themeHex}
                            saving={saving}
                            aiLoading={aiStatus?.[card.id]?.loading || false}
                            aiError={aiStatus?.[card.id]?.error}
                        />
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative"
            >
                <div className="absolute inset-0 -z-10 rounded-3xl border-2 border-b-8 border-dashed border-gray-200 sm:rounded-[2rem]" />
                <button
                    onClick={() => {
                        const newCard: EditorCard = {
                            id: `c_${uuidv4()}`,
                            primary: "",
                            alternatives: [],
                            meaning: "",
                            example: "",
                            order: cards.length,
                        };
                        setCards([...cards, newCard]);
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-3xl p-6 text-[11px] font-black tracking-widest text-gray-400 uppercase transition-all group-hover:text-[var(--theme-color)] sm:rounded-[2rem] sm:p-8 sm:text-sm"
                >
                    <Plus size={18} className="sm:size-[20px]" />
                    Add New Flashcard
                </button>
            </motion.div>
        </div>
    );
};

export default LessonBuilderCardList;
