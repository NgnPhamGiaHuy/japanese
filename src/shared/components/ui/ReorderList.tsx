"use client";

import { Reorder } from "framer-motion";

/** Attributes for rendering a ReorderList. */
interface ReorderListProps<T> {
    /** The list of items to be managed by the reorder logic. */
    items: T[];
    /** Triggered when the items are reordered by the user. */
    onReorder: (items: T[]) => void;
    /** The set of ReorderItem components to render. */
    children: React.ReactNode;
    /** Additional CSS classes for the list container. */
    className?: string;
    /** The axis along which reordering is allowed. */
    axis?: "x" | "y";
    /** The HTML element to render the list container as. */
    as?: "div" | "ul" | "ol";
}

/**
 * Animated list container for drag-and-drop reordering.
 *
 * @remarks
 * Orchestrates reordering animations for its children.
 * Works in conjunction with `ReorderItem` to provide a seamless drag experience.
 *
 * @example
 * <ReorderList items={items} onReorder={setItems}>
 *   {items.map(item => <ReorderItem key={item.id} value={item}>{item.text}</ReorderItem>)}
 * </ReorderList>
 */
const ReorderList = <T,>({
    items,
    onReorder,
    children,
    className,
    axis = "y",
    as = "div",
}: ReorderListProps<T>) => {
    return (
        <Reorder.Group
            as={as}
            axis={axis}
            values={items}
            onReorder={onReorder}
            className={className}
        >
            {children}
        </Reorder.Group>
    );
};

export default ReorderList;
