/**
 * DetailCardsPanel — Center panel with drag-drop card grid
 *
 * @remarks
 * Manages card reordering using dnd-kit with fractional indexing.
 * Delegates rendering to SortableCardItem components.
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";
import { reorderWithFractionalIndex } from "@/shared/utils/reorder";
import SortableCardItem from "./SortableCardItem";

import type { DragEndEvent } from "@dnd-kit/core";
import type { DetailCardsPanelProps } from "../types";

const DetailCardsPanel = ({
    ctx,
    selectedCardId,
    onSelectCard,
    onReorderCard,
}: DetailCardsPanelProps) => {
    const t = useTranslations("FlashcardDetail");
    const { lesson, cards, ownerId, lessonId, role } = ctx;
    const themeHex = lesson.themeColor || DEFAULT_DECK_THEME_COLOR;
    const canEdit = role === "owner" || role === "editor";
    const [orderedCards, setOrderedCards] = useState(cards);

    // Render-time reset: sync orderedCards whenever a new `cards` value
    // arrives (Firestore update, or a different lesson) — orderedCards
    // locally diverges from `cards` during the optimistic drag-then-save
    // window in handleDragEnd below.
    const [prevCards, setPrevCards] = useState(cards);
    if (cards !== prevCards) {
        setPrevCards(cards);
        setOrderedCards(cards);
    }

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = orderedCards.findIndex((c) => c.id === active.id);
        const newIndex = orderedCards.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const { nextItems, changes } = reorderWithFractionalIndex(orderedCards, oldIndex, newIndex);

        setOrderedCards(nextItems);

        if (!onReorderCard) return;
        try {
            await onReorderCard(changes);
        } catch (err) {
            console.error("[handleDragEnd] Reorder failed:", err);
            setOrderedCards(cards);
        }
    };

    return (
        <main className="flex flex-col">
            <h2 className="text-text mb-4 border-b-2 border-gray-200 pb-2 text-xl font-black">
                {t("cardsPreview", { count: orderedCards.length })}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={orderedCards.map((c) => c.id)}
                        strategy={rectSortingStrategy}
                    >
                        {orderedCards.map((card) => (
                            <SortableCardItem
                                key={card.id}
                                card={card}
                                isSelected={selectedCardId === card.id}
                                onClick={() => onSelectCard(card.id)}
                                themeHex={themeHex}
                                ownerId={ownerId}
                                lessonId={lessonId}
                                canReorder={canEdit}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </main>
    );
};

export default DetailCardsPanel;
