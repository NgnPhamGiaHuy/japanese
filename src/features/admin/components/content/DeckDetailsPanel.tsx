"use client";

import { useTranslations } from "next-intl";

import { Dialog } from "@base-ui/react/dialog";
import { Book, X } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import { DeckCardItem } from "./DeckCardItem";

import type { FlashCard } from "@/features/flashcard";

interface DeckDetailsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    deckTitle: string;
    cards: (FlashCard & { path: string })[] | undefined;
    isLoading: boolean;
}

/**
 * Slide-over Panel for Deck Content Preview.
 *
 * @remarks Facilitates administrative review of vocabulary items within a specific deck.
 * Uses DeckCardItem for word rendering.
 */
const DeckDetailsPanel = ({
    isOpen,
    onClose,
    deckTitle,
    cards,
    isLoading,
}: DeckDetailsPanelProps) => {
    const t = useTranslations("AdminContent");
    const tCommon = useTranslations("Common");
    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#3c3c3c]/30 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />

                {/* Panel */}
                <Dialog.Popup
                    aria-modal="true"
                    className="fixed top-0 right-0 z-50 h-full w-full max-w-xl bg-white shadow-2xl ring-1 ring-gray-100 transition-transform duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full"
                >
                    <div className="flex h-full flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b-2 border-gray-50 p-6">
                            <div>
                                <Dialog.Title className="text-text text-xl font-black">
                                    {deckTitle}
                                </Dialog.Title>
                                <p className="text-muted text-sm font-bold">
                                    {t("globalContentPreview")}
                                </p>
                            </div>
                            <Dialog.Close
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={tCommon("close")}
                                        className="text-muted hover:text-text bg-gray-50 hover:bg-gray-100"
                                        icon={X}
                                        iconSize={20}
                                    />
                                }
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {isLoading ? (
                                <div className="flex h-64 flex-col items-center justify-center">
                                    <LoadingSpinner fullScreen={false} />
                                    <p className="text-muted mt-4 text-xs font-black tracking-widest uppercase">
                                        {t("gatheringWords")}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cards?.map((card, idx) => (
                                        <DeckCardItem key={card.id || idx} card={card} />
                                    ))}

                                    {(!cards || cards.length === 0) && (
                                        <div className="py-20 text-center">
                                            <Book
                                                size={48}
                                                className="mx-auto mb-4 text-gray-100"
                                            />
                                            <p className="text-muted text-sm font-bold">
                                                {t("deckEmpty")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t-2 border-gray-50 bg-gray-50/30 p-6">
                            <div className="text-muted flex items-center justify-between text-xs font-black tracking-widest uppercase">
                                <span>
                                    {t("vocabularyItemsTotal", { count: cards?.length || 0 })}
                                </span>
                                <span>{t("readOnlyView")}</span>
                            </div>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default DeckDetailsPanel;
