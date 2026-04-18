"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import Button from "./Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
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
 * @remarks Shared across the entire platform. Handles backdrop,
 * animations, and accessible close behavior.
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = "md" }: ModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative w-full ${MAX_WIDTHS[maxWidth]} flex max-h-[90vh] flex-col overflow-hidden rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white shadow-2xl`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            {title && (
                                <h3 className="text-xl font-black text-[#3c3c3c]">{title}</h3>
                            )}
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="!h-10 !w-10 !rounded-full !p-0 shadow-none hover:!bg-black/5"
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
