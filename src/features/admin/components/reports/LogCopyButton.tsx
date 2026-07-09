"use client";

import { Check, Copy } from "lucide-react";

import { Button } from "@/shared/components/ui";
import { useCopyToClipboard } from "@/shared/hooks";

/**
 * Utility button for copying text to the clipboard.
 *
 * @remarks
 * Uses a minimal ghost variant to avoid visual clutter. Provides temporary
 * visual feedback via a checkmark icon after successful copying.
 */
const LogCopyButton = ({ text, title }: { text: string; title?: string }) => {
    const { copied, copy } = useCopyToClipboard(1500);
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await copy(text);
    };
    return (
        <Button
            variant="ghost"
            color="gray"
            onClick={handleCopy}
            title={title ?? "Copy"}
            icon={copied ? Check : Copy}
            iconSize={12}
            iconClassName={copied ? "text-hiragana" : "text-muted"}
            className="hover:text-text h-6 w-6 !p-0 transition-colors hover:!bg-transparent"
        />
    );
};

export default LogCopyButton;
