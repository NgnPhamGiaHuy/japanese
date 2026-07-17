"use client";

import { useTranslations } from "next-intl";

import { AlertTriangle } from "lucide-react";

import { Button, EmptyState } from "@/shared/components/ui";

interface AdminErrorStateProps {
    message: string;
    onRetry?: () => void;
}

/**
 * Admin Standard Error State.
 *
 * @remarks Captures and displays administrative-level errors with an
 * optional retry trigger. Uses a destructive color palette for high visibility.
 */
const AdminErrorState = ({ message, onRetry }: AdminErrorStateProps) => {
    const t = useTranslations("AdminCommon");
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-4">
            <EmptyState
                icon={AlertTriangle}
                title={t("unableToLoad")}
                description={message}
                iconBg="bg-danger"
                iconBorder="border-danger-strong"
            />
            {onRetry && (
                <div className="flex justify-center">
                    <Button variant="secondary" onClick={onRetry}>
                        {t("retry")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AdminErrorState;
