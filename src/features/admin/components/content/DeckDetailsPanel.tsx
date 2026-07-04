"use client";

import { useId } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Book, X } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import { useDialogA11y } from "@/shared/hooks";
import { DeckCardItem } from "./DeckCardItem";

interface DeckDetailsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    deckTitle: string;
    cards: any[] | undefined;
    isLoading: boolean;
}

/**
 * Slide-over Panel for Deck Content Preview.
 *
 * @remarks Facilitates administrative review of vocabulary items within a specific deck.
 * Uses Framer Motion for smooth transitions and DeckCardItem for word rendering.
 */
const DeckDetailsPanel = ({
    isOpen,
    onClose,
    deckTitle,
    cards,
    isLoading,
}: DeckDetailsPanelProps) => {
    const titleId = useId();
    const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-[#3c3c3c]/30 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 z-50 h-full w-full max-w-xl bg-white shadow-2xl ring-1 ring-gray-100"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b-2 border-gray-50 p-6">
                                <div>
                                    <h3 id={titleId} className="text-text text-xl font-black">
                                        {deckTitle}
                                    </h3>
                                    <p className="text-muted text-sm font-bold">
                                        Global Content Preview
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="text-muted hover:text-text bg-gray-50 hover:bg-gray-100"
                                    icon={X}
                                    iconSize={20}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {isLoading ? (
                                    <div className="flex h-64 flex-col items-center justify-center">
                                        <LoadingSpinner fullScreen={false} />
                                        <p className="text-muted mt-4 text-xs font-black tracking-widest uppercase">
                                            Gathering words...
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
                                                    This deck is currently empty.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t-2 border-gray-50 bg-gray-50/30 p-6">
                                <div className="text-muted flex items-center justify-between text-xs font-black tracking-widest uppercase">
                                    <span>{cards?.length || 0} vocabulary items total</span>
                                    <span>Read-only Administrative View</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DeckDetailsPanel;
