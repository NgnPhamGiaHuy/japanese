/**
 * DetailCardsPanel — Center panel with drag-drop card grid
 *
 * @remarks
 * Manages card reordering using dnd-kit with fractional indexing.
 * Delegates rendering to SortableCardItem components.
 */

"use client";

import { useEffect, useState } from "react";

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
    const { lesson, cards, ownerId, lessonId, role } = ctx;
    const themeHex = lesson.themeColor || "#1cb0f6";
    const canEdit = role === "owner" || role === "editor";
    const [orderedCards, setOrderedCards] = useState(cards);

    useEffect(() => {
        setOrderedCards(cards);
    }, [cards]);

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

        const { nextItems, movedId, newOrder } = reorderWithFractionalIndex(
            orderedCards,
            oldIndex,
            newIndex,
        );

        setOrderedCards(nextItems);

        if (!onReorderCard) return;
        try {
            await onReorderCard(movedId, newOrder);
        } catch (err) {
            console.error("[handleDragEnd] Reorder failed:", err);
            setOrderedCards(cards);
        }
    };

    return (
        <main className="flex flex-col">
            <h2 className="mb-4 border-b-2 border-gray-200 pb-2 text-xl font-black text-[#3c3c3c]">
                Preview ({orderedCards.length} Cards)
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
