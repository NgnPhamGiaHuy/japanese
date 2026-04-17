/**
 * FlashcardDetailLayout — Deck Detail View Orchestrator
 *
 * @remarks
 * Three-zone interface: Actions (Left), Preview (Center), Comments (Right).
 * Delegates rendering to specialized components for each zone.
 *
 * Responsibilities:
 * - Compose layout structure
 * - Manage selected card state
 * - Coordinate zone components
 *
 * NO business logic, NO drag-drop implementation, NO permission checks.
 */

"use client";

import { useState } from "react";

import DetailActionsPanel from "./DetailActionsPanel";
import DetailCardsPanel from "./DetailCardsPanel";
import DetailCommentsPanel from "./DetailCommentsPanel";
import DetailHeader from "./DetailHeader";

import type { DeckContext, FlashcardDetailLayoutProps } from "../types";

export type { DeckContext, DeckRole } from "../types";

/**
 * Flashcard Detail Layout
 *
 * @remarks
 * Pure composition — delegates all logic to specialized components.
 * Each panel is self-contained and independently scrollable.
 */
const FlashcardDetailLayout = ({
    ctx,
    currentUserId,
    currentUserName,
    currentUserEmail,
    onDuplicate,
    onCopyLink,
    linkCopied = false,
    onEdit,
    onManageAccess,
    saving = false,
    onReorderCard,
}: FlashcardDetailLayoutProps) => {
    const { lesson, cards } = ctx;
    const [selectedCardId, setSelectedCardId] = useState<string | null>(
        cards.length > 0 ? cards[0].id : null,
    );

    return (
        <div className="min-h-screen bg-[#F7F7F8]">
            <DetailHeader ctx={ctx} onEdit={onEdit} />

            <div className="mx-auto mt-4 max-w-7xl px-6 pb-24">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[25%_45%_30%] lg:items-start">
                    <DetailActionsPanel
                        ctx={ctx}
                        currentUserId={currentUserId}
                        onDuplicate={onDuplicate}
                        onCopyLink={onCopyLink}
                        linkCopied={linkCopied}
                        onEdit={onEdit}
                        onManageAccess={onManageAccess}
                        saving={saving}
                    />

                    <DetailCardsPanel
                        ctx={ctx}
                        selectedCardId={selectedCardId}
                        onSelectCard={setSelectedCardId}
                        onReorderCard={onReorderCard}
                    />

                    <DetailCommentsPanel
                        ctx={ctx}
                        selectedCardId={selectedCardId}
                        currentUserId={currentUserId}
                        currentUserName={currentUserName}
                        currentUserEmail={currentUserEmail}
                    />
                </div>
            </div>
        </div>
    );
};

export default FlashcardDetailLayout;
