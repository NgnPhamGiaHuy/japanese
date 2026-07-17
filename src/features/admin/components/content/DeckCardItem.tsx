"use client";

import { useTranslations } from "next-intl";

import { Image as ImageIcon, MessageSquare } from "lucide-react";

import { Badge, Card } from "@/shared/components/ui";

import type { FlashCard } from "@/features/flashcard/types";

interface DeckCardItemProps {
    card: FlashCard & { path: string };
}

/**
 * Vocabulary Item Card for the Deck Preview.
 *
 * @remarks Displays primary text, meaning, and optional metadata/examples.
 * Strictly presentational component for usage within the DeckDetailsPanel.
 */
export const DeckCardItem = ({ card }: DeckCardItemProps) => {
    const t = useTranslations("AdminContent");
    return (
        <Card
            variant="dashboard"
            padding="sm"
            className="rounded-xl border-2 border-gray-200 bg-white transition-all hover:border-[#1cb0f6]/30"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-text text-lg font-black">{card.primary}</span>
                        {card.imageUrl && <ImageIcon size={14} className="text-hiragana" />}
                    </div>
                    <p className="text-sm font-bold text-gray-500">{card.meaning}</p>
                </div>
                <Badge
                    variant="default"
                    className="!bg-katakana/10 !text-katakana !text-xs !font-black tracking-wider uppercase"
                >
                    {card.interval > 0 ? `${card.interval}d` : t("newCardBadge")}
                </Badge>
            </div>

            {card.example && (
                <div className="mt-3 flex gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-xs font-bold text-[#4b4b4b] italic">
                    <MessageSquare size={14} className="shrink-0 text-gray-400" />
                    &ldquo;{card.example}&rdquo;
                </div>
            )}
        </Card>
    );
};
