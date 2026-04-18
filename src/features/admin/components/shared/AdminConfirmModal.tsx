"use client";

import { ConfirmModal } from "@/shared/components/ui";

interface AdminConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "info" | "warning";
    isLoading?: boolean;
}

/**
 * Standardized Confirmation Modal for Administrative Actions.
 *
 * @remarks Wraps the base UI ConfirmModal with an Admin-specific context.
 * Used for all destructive or significant CRUD operations in the Admin module.
 *
 * @example
 * <AdminConfirmModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item?"
 *   message="This action cannot be undone."
 *   variant="danger"
 * />
 */
const AdminConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "info",
    isLoading = false,
}: AdminConfirmModalProps) => {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={title}
            message={message}
            confirmText={confirmText}
            cancelText={cancelText}
            variant={variant}
            loading={isLoading}
        />
    );
};

export default AdminConfirmModal;
