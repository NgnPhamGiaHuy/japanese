"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";

import Button from "./Button";

export type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
    loading?: boolean;
}

const VARIANTS = {
    danger: {
        icon: Trash2,
        color: "red",
        accent: "bg-[#ffdfe0] text-[#ea2b2b]",
        btnVariant: "primary" as const,
    },
    warning: {
        icon: AlertTriangle,
        color: "orange",
        accent: "bg-orange-50 text-orange-500",
        btnVariant: "primary" as const,
    },
    info: {
        icon: Info,
        color: "blue",
        accent: "bg-blue-50 text-blue-500",
        btnVariant: "primary" as const,
    },
};

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    loading = false,
}: ConfirmModalProps) => {
    const v = VARIANTS[variant];
    const Icon = v.icon;

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
                        className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border-2 border-b-8 border-gray-200 bg-white shadow-2xl"
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 z-10">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="!h-10 !w-10 !rounded-full !p-0 shadow-none hover:!bg-black/5"
                                icon={X}
                                iconSize={20}
                                disabled={loading}
                            />
                        </div>

                        <div className="p-8 pt-10">
                            {/* Icon Circle */}
                            <div
                                className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border-b-4 border-black/10 ${v.accent}`}
                            >
                                <Icon size={40} strokeWidth={2.5} />
                            </div>

                            {/* Text Header */}
                            <div className="text-center">
                                <h3 className="mb-2 text-2xl font-black text-[#3c3c3c]">{title}</h3>
                                <p className="text-base leading-relaxed font-bold text-[#afafaf]">
                                    {message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex flex-col gap-3">
                                <Button
                                    variant={v.btnVariant}
                                    color={v.color as any}
                                    onClick={onConfirm}
                                    loading={loading}
                                    className="w-full !py-4 !text-base"
                                >
                                    {confirmText}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="w-full !py-4 !text-base !font-black !text-[#afafaf] hover:!bg-gray-50 active:translate-y-0"
                                >
                                    {cancelText}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
