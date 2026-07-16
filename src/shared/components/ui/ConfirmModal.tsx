"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, Info, Trash2, X } from "lucide-react";

import Button from "./Button";

/** Supported visual variants for the confirmation modal. */
export type ConfirmVariant = "danger" | "warning" | "info";

/** Attributes for rendering a ConfirmModal. */
interface ConfirmModalProps {
    /** Whether the modal is currently visible. */
    isOpen: boolean;
    /** Triggered when the user cancels or closes the modal. */
    onClose: () => void;
    /** Triggered when the user confirms the action. */
    onConfirm: () => void;
    /** Primary heading text. */
    title: string;
    /** Secondary descriptive text explaining the action. */
    message: string;
    /** Text for the confirmation button (default: "Confirm"). */
    confirmText?: string;
    /** Text for the cancellation button (default: "Cancel"). */
    cancelText?: string;
    /** Visual theme variant determining colors and icons. */
    variant?: ConfirmVariant;
    /** Whether to show a loading state on the confirm button. */
    loading?: boolean;
}

/**
 * High-stakes confirmation dialog.
 *
 * @remarks
 * Used for dangerous or important actions (e.g., deletions, resets).
 * Features a central themed icon and clear action hierarchy.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Account?"
 *   message="This action is irreversible."
 *   variant="danger"
 * />
 */

const VARIANTS = {
    danger: {
        icon: Trash2,
        color: "red",
        accent: "bg-danger-bg text-danger",
        btnVariant: "primary",
    },
    warning: {
        icon: AlertTriangle,
        color: "orange",
        accent: "bg-orange-50 text-orange-500",
        btnVariant: "primary",
    },
    info: {
        icon: Info,
        color: "blue",
        accent: "bg-blue-50 text-blue-500",
        btnVariant: "primary",
    },
} as const;

const ConfirmModal = ({
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
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />

                {/* Centering layer — pointer-events pass through to the backdrop except over the modal itself */}
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <Dialog.Popup
                        aria-modal="true"
                        className="rounded-5xl pointer-events-auto relative w-full max-w-sm overflow-hidden border-2 border-b-8 border-gray-200 bg-white shadow-2xl transition-all duration-200 data-[ending-style]:translate-y-5 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0"
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 z-10">
                            <Dialog.Close
                                disabled={loading}
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full shadow-none hover:bg-black/5"
                                        icon={X}
                                        iconSize={20}
                                        disabled={loading}
                                    />
                                }
                            />
                        </div>

                        <div className="p-8 pt-10">
                            {/* Icon Circle */}
                            <div
                                className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-4xl border-b-4 border-black/10 ${v.accent}`}
                            >
                                <Icon size={40} strokeWidth={2.5} />
                            </div>

                            {/* Text Header */}
                            <div className="text-center">
                                <Dialog.Title className="text-text mb-2 text-xl font-black">
                                    {title}
                                </Dialog.Title>
                                <Dialog.Description className="text-muted text-base leading-relaxed font-bold">
                                    {message}
                                </Dialog.Description>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex flex-col gap-3">
                                <Button
                                    variant={v.btnVariant}
                                    color={v.color}
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
                                    className="!text-muted w-full !py-4 !text-base !font-black hover:!bg-gray-50 active:translate-y-0"
                                >
                                    {cancelText}
                                </Button>
                            </div>
                        </div>
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ConfirmModal;
