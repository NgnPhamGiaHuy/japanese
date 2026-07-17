"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import Button from "./Button";

/** Attributes for rendering a Drawer component. */
interface DrawerProps {
    /** Whether the drawer is currently visible. */
    isOpen: boolean;
    /** Triggered when the user requests to close the drawer. */
    onClose: () => void;
    /** Primary heading text displayed in the header. */
    title?: string;
    /** The content to be displayed inside the drawer body. */
    children: React.ReactNode;
    /** Edge the drawer slides in from. */
    side?: "left" | "right" | "bottom";
}

const SIDE_CLASSES: Record<NonNullable<DrawerProps["side"]>, string> = {
    right: "inset-y-0 right-0 h-full w-full max-w-sm rounded-l-3xl border-l-2 sm:max-w-md data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
    left: "inset-y-0 left-0 h-full w-full max-w-sm rounded-r-3xl border-r-2 sm:max-w-md data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-3xl border-t-2 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
};

/**
 * Slide-in drawer, positioned on the same Base UI Dialog primitive as
 * Modal.tsx (E6-T2) — not `vaul`, which is unmaintained. Base UI's own
 * guidance is that a panel sliding from an edge without gesture/swipe
 * support is "a positioned Dialog," so this reuses Dialog rather than Base
 * UI's separate gesture-driven Drawer primitive.
 *
 * @example
 * <Drawer isOpen={isOpen} onClose={close} title="Filters" side="right">
 *   <FilterForm />
 * </Drawer>
 */
const Drawer = ({ isOpen, onClose, title, children, side = "right" }: DrawerProps) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
                <Dialog.Popup
                    aria-modal="true"
                    aria-label={title ? undefined : "Dialog"}
                    className={`fixed z-50 flex flex-col overflow-hidden border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${SIDE_CLASSES[side]}`}
                >
                    <div className="flex items-center justify-between border-b border-gray-100 p-6">
                        {title && (
                            <Dialog.Title className="text-text text-xl font-black">
                                {title}
                            </Dialog.Title>
                        )}
                        <Dialog.Close
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full shadow-none hover:bg-black/5"
                                    icon={X}
                                    iconSize={20}
                                />
                            }
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">{children}</div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default Drawer;
