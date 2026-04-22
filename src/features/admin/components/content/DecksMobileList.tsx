"use client";

import { format } from "date-fns";
import { Calendar, Eye, Layers, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { AdminDeck } from "../../types";

interface DecksMobileListProps {
    items: AdminDeck[];
    onView: (path: string, title: string) => void;
    onDelete: (path: string) => void;
    isDeleting: boolean;
}

/**
 * Mobile card list for the Decks table.
 *
 * @remarks Replaces the multi-column table on small screens with a
 * compact card per deck that shows all key info and inline actions.
 */
const DecksMobileList = ({ items, onView, onDelete, isDeleting }: DecksMobileListProps) => {
    return (
        <div className="divide-y divide-gray-100">
            {items.map((deck) => (
                <div
                    key={deck.path}
                    className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50/50"
                >
                    {/* Color swatch */}
                    <div
                        className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: deck.themeColor || "#1cb0f6" }}
                    />

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-[#3c3c3c]">{deck.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs font-bold text-[#afafaf]">
                            {deck.description || "No description provided."}
                        </p>

                        {/* Tags */}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {(deck.categories?.length
                                ? deck.categories.slice(0, 3)
                                : ["other"]
                            ).map((cat) => (
                                <span
                                    key={cat}
                                    className="rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-tight uppercase"
                                    style={{
                                        backgroundColor: `${deck.themeColor || "#1cb0f6"}15`,
                                        color: deck.themeColor || "#1cb0f6",
                                    }}
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>

                        {/* Meta row */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-[#afafaf]">
                            {/* Owner */}
                            <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                                    {deck.ownerAvatar ? (
                                        <img
                                            src={deck.ownerAvatar}
                                            alt={deck.ownerName ?? "Owner"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[8px] font-black text-[#afafaf]">
                                            {(deck.ownerName ||
                                                deck.ownerEmail ||
                                                "?")[0]?.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span>{deck.ownerName || deck.ownerEmail || "Unknown"}</span>
                            </div>

                            {/* Card count */}
                            <div className="flex items-center gap-1">
                                <Layers size={10} className="text-[#ce82ff]" />
                                <span className="font-black text-[#3c3c3c]">{deck.cardCount}</span>
                                <span className="tracking-widest uppercase">words</span>
                            </div>

                            {/* Date */}
                            {deck.createdAt && (
                                <div className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    {format(new Date(deck.createdAt), "MMM d, yyyy")}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-1.5">
                        <Button
                            variant="ghost"
                            onClick={() => onView(deck.path, deck.title)}
                            className="h-8 w-8 !p-0 hover:bg-[#1cb0f6]/10 hover:text-[#1cb0f6]"
                            title="View cards"
                        >
                            <Eye size={15} />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onDelete(deck.path)}
                            disabled={isDeleting}
                            className="h-8 w-8 !p-0 hover:bg-red-50 hover:text-[#ea2b2b]"
                            title="Delete deck"
                        >
                            <Trash2 size={15} />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DecksMobileList;
