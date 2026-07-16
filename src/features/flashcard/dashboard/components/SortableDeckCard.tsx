/**
 * SortableDeckCard — Draggable wrapper for DeckCard
 *
 * @remarks
 * Adds drag-drop functionality to DeckCard for reordering, via @dnd-kit
 * (see DetailCardsPanel/SortableCardItem for the same pattern applied to
 * cards within a deck).
 */

import { memo } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import DeckCard from "./DeckCard";

import type { SortableDeckCardProps } from "../types";

const SortableDeckCard = memo(function SortableDeckCard({
    canReorder,
    ...deckCardProps
}: SortableDeckCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: deckCardProps.lesson.id,
        disabled: !canReorder,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.72 : undefined,
    } as React.CSSProperties;

    return (
        <div ref={setNodeRef} style={style} className="group relative">
            {canReorder && (
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="absolute top-1/2 -right-2 z-20 flex h-14 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-300 shadow-sm transition-all group-hover:block hover:scale-110 hover:border-gray-300 hover:text-gray-500 active:scale-95 active:cursor-grabbing sm:-right-3 md:hidden md:group-hover:flex"
                    aria-label="Reorder deck"
                >
                    <GripVertical size={20} className="text-gray-300 hover:text-gray-500" />
                </button>
            )}
            <DeckCard {...deckCardProps} />
        </div>
    );
});

export default SortableDeckCard;
