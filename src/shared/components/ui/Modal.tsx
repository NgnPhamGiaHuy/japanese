"use client";

import { useId } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { useDialogA11y } from "@/shared/hooks";
import Button from "./Button";

/** Attributes for rendering a Modal component. */
interface ModalProps {
    /** Whether the modal is currently visible. */
    isOpen: boolean;
    /** Triggered when the user requests to close the modal. */
    onClose: () => void;
    /** Primary heading text displayed in the header. */
    title?: string;
    /** The content to be displayed inside the modal body. */
    children: React.ReactNode;
    /** Predefined maximum width for the modal container. */
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

const MAX_WIDTHS = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
};

/**
 * Reusable Base Modal Component.
 *
 * @remarks
 * Shared across the entire platform. Handles backdrop,
 * animations, and accessible close behavior.
 *
 * @example
 * <Modal isOpen={isOpen} onClose={close} title="Edit Profile">
 *   <ProfileForm />
 * </Modal>
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = "md" }: ModalProps) => {
    const titleId = useId();
    const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        aria-label={title ? undefined : "Dialog"}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative w-full ${MAX_WIDTHS[maxWidth]} rounded-5xl flex max-h-[90vh] flex-col overflow-hidden border-2 border-b-8 border-gray-200 bg-white shadow-2xl`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            {title && (
                                <h3 id={titleId} className="text-xl font-black text-[#3c3c3c]">
                                    {title}
                                </h3>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full shadow-none hover:bg-black/5"
                                icon={X}
                                iconSize={20}
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
