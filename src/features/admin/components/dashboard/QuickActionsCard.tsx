"use client";

import { FileText, Settings, Shield } from "lucide-react";

import { Button, Card } from "@/shared/components/ui";

/**
 * Administrative Quick Actions Card.
 *
 * @remarks Provides immediate access to frequent administrative tasks like
 * global settings, content audits, and security reviews.
 */
const QuickActionsCard = () => {
    return (
        <Card variant="dashboard" className="border-2 border-b-8 border-gray-100">
            <h3 className="mb-4 text-xs font-black tracking-widest text-[#3c3c3c] uppercase">
                Quick Actions
            </h3>
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
        </Card>
    );
};

export default QuickActionsCard;
