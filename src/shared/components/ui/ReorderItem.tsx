"use client";

import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";

/** Attributes for rendering a ReorderItem. */
interface ReorderItemProps<T> {
    /** The value representing the item, used for reordering logic. */
    value: T;
    /** Whether the item is non-interactive. */
    disabled?: boolean;
    /** Additional CSS classes for the item container. */
    className?: string;
    /** The content to be displayed inside the item. */
    children: React.ReactNode;
    /** The HTML element to render the item as. */
    as?: "div" | "li";
    /** Optional override for the drag handle CSS classes. */
    handleClassName?: string;
    /** Size of the drag handle icon in pixels. */
    handleIconSize?: number;
    /** Whether to display the drag handle. */
    showHandle?: boolean;
    /** Optional override for the drag handle position classes. */
    handlePositionClassName?: string;
    /** Triggered when dragging starts. */
    onDragStart?: () => void;
    /** Triggered when dragging ends. */
    onDragEnd?: () => void;
}

/**
 * Animated list item with drag-to-reorder capabilities.
 *
 * @remarks
 * Must be used within a `ReorderList`. Uses `framer-motion` for physics-based
 * reordering animations and custom drag handle support.
 *
 * @example
 * <ReorderItem value={item} onDragEnd={handleReorder}>
 *   <div>{item.name}</div>
 * </ReorderItem>
 */
const ReorderItem = <T,>({
    value,
    disabled = false,
    className,
    children,
    as = "div",
    handleClassName,
    handleIconSize = 24,
    showHandle = true,
    handlePositionClassName = "absolute top-1/2 -left-8 -translate-y-1/2 md:-left-10",
    onDragStart,
    onDragEnd,
}: ReorderItemProps<T>) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            as={as}
            value={value}
            dragListener={false}
            dragControls={dragControls}
            className={className}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            initial={false}
            transition={{ duration: 0.2 }}
        >
            {!disabled && showHandle && (
                <button
                    type="button"
                    onPointerDown={(e) => dragControls.start(e)}
                    className={
                        handleClassName ??
                        `${handlePositionClassName} cursor-pointer opacity-0 transition-all group-hover:opacity-100 hover:scale-110 active:cursor-grabbing`
                    }
                    aria-label="Reorder item"
                >
                    <GripVertical
                        size={handleIconSize}
                        className="text-gray-300 hover:text-gray-500"
                    />
                </button>
            )}
            {children}
        </Reorder.Item>
    );
};

export default ReorderItem;
