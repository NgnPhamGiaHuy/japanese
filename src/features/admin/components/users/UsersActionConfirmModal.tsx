"use client";

import { useTranslations } from "next-intl";

import { ConfirmModal } from "@/shared/components/ui";

interface UsersActionConfirmModalProps {
    pendingAction: { type: "delete" | "promote" | "demote"; uids: string[] } | null;
    isProcessing: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

/**
 * Specialized Confirmation Modal for User Management.
 *
 * @remarks Handles bulk and individual permission/deletion confirmations.
 */
const UsersActionConfirmModal = ({
    pendingAction,
    isProcessing,
    onClose,
    onConfirm,
}: UsersActionConfirmModalProps) => {
    const t = useTranslations("AdminUsers");
    if (!pendingAction) return null;

    const { type, uids } = pendingAction;
    const actionLabel = t(
        type === "delete" ? "actionDelete" : type === "promote" ? "actionPromote" : "actionDemote",
    );

    return (
        <ConfirmModal
            isOpen={!!pendingAction}
            onClose={onClose}
            onConfirm={onConfirm}
            title={t(
                type === "delete"
                    ? "deleteUsersTitle"
                    : type === "promote"
                      ? "promoteUsersTitle"
                      : "demoteUsersTitle",
            )}
            message={
                uids.length === 1
                    ? t("confirmSingleAction", { action: actionLabel })
                    : t("confirmBulkAction", { action: actionLabel, count: uids.length })
            }
            variant={type === "delete" ? "danger" : "info"}
            loading={isProcessing}
        />
    );
};

export default UsersActionConfirmModal;
