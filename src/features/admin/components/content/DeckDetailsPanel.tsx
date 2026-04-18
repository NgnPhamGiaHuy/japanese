"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Book, Image as ImageIcon, MessageSquare, X } from "lucide-react";

import { Badge, Card, LoadingSpinner } from "@/shared/components/ui";
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
                        className="fixed inset-0 z-[60] bg-[#3c3c3c]/30 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 z-[70] h-full w-full max-w-xl bg-white shadow-2xl ring-1 ring-gray-100"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b-2 border-gray-50 p-6">
                                <div>
                                    <h3 className="text-xl font-black text-[#3c3c3c]">
                                        {deckTitle}
                                    </h3>
                                    <p className="text-sm font-bold text-[#afafaf]">
                                        Global Content Preview
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50 text-[#afafaf] transition-all hover:bg-gray-100 hover:text-[#3c3c3c]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {isLoading ? (
                                    <div className="flex h-64 flex-col items-center justify-center">
                                        <LoadingSpinner fullScreen={false} />
                                        <p className="mt-4 text-xs font-black tracking-widest text-[#afafaf] uppercase">
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
                                                <p className="text-sm font-bold text-[#afafaf]">
                                                    This deck is currently empty.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t-2 border-gray-50 bg-gray-50/30 p-6">
                                <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
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
