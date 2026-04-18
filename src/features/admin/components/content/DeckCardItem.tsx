"use client";

import { Image as ImageIcon, MessageSquare } from "lucide-react";

import { Badge, Card } from "@/shared/components/ui";

interface DeckCardItemProps {
    card: any;
}

/**
 * Vocabulary Item Card for the Deck Preview.
 *
 * @remarks Displays primary text, meaning, and optional metadata/examples.
 * Strictly presentational component for usage within the DeckDetailsPanel.
 */
export const DeckCardItem = ({ card }: DeckCardItemProps) => {
    return (
        <Card
            variant="dashboard"
            padding="sm"
            className="rounded-xl border-2 border-gray-200 bg-white transition-all hover:border-[#1cb0f6]/30"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg font-black text-[#3c3c3c]">{card.primary}</span>
                        {card.imageUrl && <ImageIcon size={14} className="text-[#58cc02]" />}
                    </div>
                    <p className="text-sm font-bold text-gray-500">{card.meaning}</p>
                </div>
                <Badge
                    variant="default"
                    className="!bg-[#1cb0f6]/10 !text-[10px] !font-black tracking-wider !text-[#1cb0f6] uppercase"
                >
                    {card.interval > 0 ? `${card.interval}d` : "New"}
                </Badge>
            </div>

            {card.example && (
                <div className="mt-3 flex gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-xs font-bold text-[#4b4b4b] italic">
                    <MessageSquare size={14} className="shrink-0 text-gray-400" />"{card.example}"
                </div>
            )}
        </Card>
    );
};
