/**
 * SortableDeckCard — Draggable wrapper for DeckCard
 *
 * @remarks
 * Adds drag-drop functionality to DeckCard for reordering.
 */

import { memo } from "react";

import { ReorderItem } from "@/shared/components/ui";
import DeckCard from "./DeckCard";

import type { SortableDeckCardProps } from "../types";

const SortableDeckCard = memo(
    ({ canReorder, onDragStart, onDragEnd, ...deckCardProps }: SortableDeckCardProps) => {
        return (
            <ReorderItem
                value={deckCardProps.lesson}
                disabled={!canReorder}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                handleIconSize={20}
                handlePositionClassName="absolute -right-2 top-1/2 -translate-y-1/2 sm:-right-3"
                handleClassName="absolute -right-2 top-1/2 z-20 flex h-14 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-300 shadow-sm transition-all hover:scale-110 hover:border-gray-300 hover:text-gray-500 active:cursor-grabbing active:scale-95 group-hover:block sm:-right-3 md:hidden md:group-hover:flex"
                className="group relative"
            >
                <DeckCard {...deckCardProps} />
            </ReorderItem>
        );
    },
);

export default SortableDeckCard;
