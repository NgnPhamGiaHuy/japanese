"use client";

import { FileText, Settings, Shield } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { AdminCard } from "../shared";

/**
 * Administrative Quick Actions Card.
 *
 * @remarks Provides immediate access to frequent administrative tasks like
 * global settings, content audits, and security reviews.
 */
const QuickActionsCard = () => {
    return (
        <AdminCard title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
                <Button
                    variant="ghost"
                    className="!justify-start gap-3 !px-3 !py-2 !text-xs !text-[#3c3c3c]"
                >
                    <Settings size={14} className="text-[#afafaf]" />
                    Global Settings
                </Button>
                <Button
                    variant="ghost"
                    className="!justify-start gap-3 !px-3 !py-2 !text-xs !text-[#3c3c3c]"
                >
                    <FileText size={14} className="text-[#afafaf]" />
                    Content Audit
                </Button>
                <Button
                    variant="ghost"
                    className="!justify-start gap-3 !px-3 !py-2 !text-xs !text-[#3c3c3c]"
                >
                    <Shield size={14} className="text-[#afafaf]" />
                    Security Review
                </Button>
            </div>
        </AdminCard>
    );
};

export default QuickActionsCard;
