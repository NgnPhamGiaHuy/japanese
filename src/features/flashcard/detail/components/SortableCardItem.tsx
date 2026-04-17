/**
 * SortableCardItem — Individual draggable card component
 *
 * @remarks
 * Uses dnd-kit sortable for 2D grid drag-drop.
 * Supports text selection while maintaining drag functionality.
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import CardCommentBadge from "./CardCommentBadge";

import type { SortableCardItemProps } from "../types";

const SortableCardItem = ({
    card,
    isSelected,
    onClick,
    themeHex,
    ownerId,
    lessonId,
    canReorder,
}: SortableCardItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card.id,
        disabled: !canReorder,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.72 : undefined,
        "--theme": themeHex,
        borderColor: isSelected ? themeHex : undefined,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex flex-col rounded-3xl border-2 bg-white p-6 shadow-sm transition-all hover:bg-gray-50/50 hover:shadow-md active:border-blue-200 active:bg-blue-50/50 ${
                isSelected ? "border-[var(--theme)]" : "border-gray-200"
            }`}
        >
            {canReorder && (
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 active:cursor-grabbing"
                    aria-label="Reorder card"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical size={18} />
                </button>
            )}

            <div
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    onClick();
                }}
                onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                        target.classList.contains("select-text") ||
                        target.closest(".select-text")
                    ) {
                        e.stopPropagation();
                    }
                }}
                className="flex flex-1 cursor-pointer flex-col"
            >
                <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between gap-4">
                        <span className="cursor-text text-3xl font-black tracking-tight text-[#3c3c3c] select-text">
                            {card.primary}
                        </span>
                        <div className="shrink-0 pt-1">
                            <CardCommentBadge
                                ownerId={ownerId}
                                lessonId={lessonId}
                                cardId={card.id}
                            />
                        </div>
                    </div>

                    {card.alternatives.length > 0 && (
                        <div className="mb-4 cursor-text text-sm font-bold text-[#afafaf] select-text">
                            {card.alternatives[0]}
                        </div>
                    )}

                    <div
                        className="mt-auto inline-block cursor-text rounded-xl px-0 py-1 text-xl font-black select-text"
                        style={{ color: themeHex }}
                    >
                        {card.meaning}
                    </div>
                </div>

                {card.imageUrl && (
                    <div className="mt-6 aspect-video overflow-hidden rounded-2xl border-2 border-gray-50 bg-gray-50/50">
                        <img
                            src={card.imageUrl}
                            alt="Card preview"
                            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SortableCardItem;
