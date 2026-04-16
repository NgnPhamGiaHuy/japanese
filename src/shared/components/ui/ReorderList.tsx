"use client";

import { Reorder } from "framer-motion";

interface ReorderListProps<T> {
    items: T[];
    onReorder: (items: T[]) => void;
    children: React.ReactNode;
    className?: string;
    axis?: "x" | "y";
    as?: "div" | "ul" | "ol";
}

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
