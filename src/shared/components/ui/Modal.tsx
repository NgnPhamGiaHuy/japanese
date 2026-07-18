"use client";

import { Dialog } from "@base-ui/react/dialog";

import { DIALOG_BACKDROP_CLASSNAME, DialogCloseButton } from "./DialogChrome";

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
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Backdrop className={DIALOG_BACKDROP_CLASSNAME} />

                {/* Centering layer — pointer-events pass through to the backdrop except over the modal itself */}
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <Dialog.Popup
                        aria-modal="true"
                        aria-label={title ? undefined : "Dialog"}
                        className={`pointer-events-auto relative w-full ${MAX_WIDTHS[maxWidth]} rounded-5xl flex max-h-[90vh] flex-col overflow-hidden border-2 border-b-8 border-gray-200 bg-white shadow-2xl transition-all duration-200 data-[ending-style]:translate-y-5 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            {title && (
                                <Dialog.Title className="text-text text-xl font-black">
                                    {title}
                                </Dialog.Title>
                            )}
                            <DialogCloseButton />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">{children}</div>
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default Modal;
