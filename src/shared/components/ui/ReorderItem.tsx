"use client";

import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";

interface ReorderItemProps<T> {
    value: T;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
    as?: "div" | "li";
    handleClassName?: string;
    handleIconSize?: number;
    showHandle?: boolean;
    handlePositionClassName?: string;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

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
