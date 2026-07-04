"use client";

import { format } from "date-fns";
import { Calendar, Eye, Layers, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui";

import type { AdminDeck } from "../../types";

interface DecksTableRowProps {
    deck: AdminDeck;
    onView: (path: string, title: string) => void;
    onDelete: (path: string) => void;
    isDeleting: boolean;
}

/**
 * Single Row for the Decks Table.
 *
 * @remarks
 * Presents deck metadata and administrative actions.
 * Following component rules, this is strictly presentational.
 *
 * @example
 * <DecksTableRow
 *   deck={deckData}
 *   onView={handleView}
 *   onDelete={handleDelete}
 *   isDeleting={false}
 * />
 */
const DecksTableRow = ({ deck, onView, onDelete, isDeleting }: DecksTableRowProps) => {
    return (
        <tr className="group transition-colors hover:bg-gray-50/50">
            <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-text">{deck.title}</span>
                    <span className="line-clamp-1 max-w-md text-xs font-bold text-muted">
                        {deck.description || "No description provided."}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {(deck.categories && deck.categories.length > 0
                            ? deck.categories.slice(0, 3)
                            : ["other"]
                        ).map((cat) => (
                            <span
                                key={cat}
                                className="rounded-md px-1.5 py-0.5 text-xs font-black tracking-tight uppercase"
                                style={{
                                    backgroundColor: `${deck.themeColor || "#1cb0f6"}15`,
                                    color: deck.themeColor || "#1cb0f6",
                                }}
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-2 ring-white">
                        {deck.ownerAvatar ? (
                            <img
                                src={deck.ownerAvatar}
                                alt={deck.ownerName ?? "Owner Avatar"}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-black text-muted">
                                {(deck.ownerName || deck.ownerEmail || "?")[0]?.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-text">
                            {deck.ownerName || "Unknown User"}
                        </span>
                        <span className="text-xs font-bold text-muted">
                            {deck.ownerEmail || deck.ownerId}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-sm font-black text-text">
                    <Layers size={14} className="text-both" />
                    {deck.cardCount}
                    <span className="ml-1 text-xs font-bold tracking-widest text-muted uppercase">
                        Words
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-xs font-bold text-muted">
                    <Calendar size={12} />
                    {deck.createdAt ? format(new Date(deck.createdAt), "MMM d, yyyy") : "—"}
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2 text-muted">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        icon={Eye}
                        iconSize={16}
                        onClick={() => onView(deck.path, deck.title)}
                        className="hover:bg-katakana/10 hover:text-katakana"
                        aria-label={`View ${deck.title}`}
                    />
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        icon={Trash2}
                        iconSize={16}
                        onClick={() => onDelete(deck.path)}
                        disabled={isDeleting}
                        className="hover:bg-red-50 hover:text-danger"
                        aria-label={`Delete ${deck.title}`}
                    />
                </div>
            </td>
        </tr>
    );
};

export default DecksTableRow;
