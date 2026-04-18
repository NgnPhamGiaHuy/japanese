"use client";

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
    return (
        <div className="space-y-4">
            <EmptyState
                icon={AlertTriangle}
                title="Unable to load admin data"
                description={message}
                iconBg="bg-[#ea2b2b]"
                iconBorder="border-[#b82222]"
            />
            {onRetry && (
                <div className="flex justify-center">
                    <Button variant="secondary" onClick={onRetry}>
                        Retry
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AdminErrorState;
