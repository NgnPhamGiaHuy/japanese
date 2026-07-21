"use client";

import { useTranslations } from "next-intl";

import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, Eye, Layers, Trash2 } from "lucide-react";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard";
import { Button } from "@/shared/components/ui";

import type { AdminDeck } from "../types";

const col = createColumnHelper<AdminDeck>();

interface ColumnProps {
    onView: (path: string, title: string) => void;
    onDelete: (path: string) => void;
    isDeleting: boolean;
}

/**
 * Column configurations for the admin Content (decks) table.
 *
 * @remarks
 * Extracted from `DecksTableRow.tsx`'s JSX, cell-for-cell, onto the shared
 * `@tanstack/react-table` engine. Every column is a display column
 * (no accessor) — Content had no sorting before this migration and this
 * doesn't add any; each cell combines multiple `AdminDeck` fields the same
 * way the original hand-rolled `<td>`s did, which a single accessor
 * couldn't represent anyway.
 */
export const useDecksTableColumns = ({ onView, onDelete, isDeleting }: ColumnProps) => {
    const t = useTranslations("AdminContent");
    const tCommon = useTranslations("AdminCommon");
    const columns = [
        col.display({
            id: "deck",
            header: () => t("columnDeck"),
            cell: ({ row }) => {
                const deck = row.original;
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-text text-sm font-black">{deck.title}</span>
                        <span className="text-muted line-clamp-1 max-w-md text-xs font-bold">
                            {deck.description || tCommon("noDescription")}
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
                                        backgroundColor: `${deck.themeColor || DEFAULT_DECK_THEME_COLOR}15`,
                                        color: deck.themeColor || DEFAULT_DECK_THEME_COLOR,
                                    }}
                                >
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            },
        }),
        col.display({
            id: "owner",
            header: () => t("columnOwner"),
            cell: ({ row }) => {
                const deck = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-2 ring-white">
                            {deck.ownerAvatar ? (
                                <img
                                    src={deck.ownerAvatar}
                                    alt={deck.ownerName ?? t("ownerAvatarAlt")}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-muted text-xs font-black">
                                    {(deck.ownerName || deck.ownerEmail || "?")[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-text text-xs font-black">
                                {deck.ownerName || tCommon("unknownUser")}
                            </span>
                            <span className="text-muted text-xs font-bold">
                                {deck.ownerEmail || deck.ownerId}
                            </span>
                        </div>
                    </div>
                );
            },
        }),
        col.display({
            id: "size",
            header: () => t("columnSize"),
            cell: ({ row }) => (
                <div className="text-text flex items-center gap-1.5 text-sm font-black">
                    <Layers size={14} className="text-both" />
                    {row.original.cardCount}
                    <span className="text-muted ml-1 text-xs font-bold tracking-widest uppercase">
                        {tCommon("words")}
                    </span>
                </div>
            ),
        }),
        col.display({
            id: "created",
            header: () => t("columnCreated"),
            cell: ({ row }) => (
                <div className="text-muted flex items-center gap-2 text-xs font-bold">
                    <Calendar size={12} />
                    {row.original.createdAt
                        ? format(new Date(row.original.createdAt), "MMM d, yyyy")
                        : "—"}
                </div>
            ),
        }),
        col.display({
            id: "actions",
            meta: { align: "end" },
            header: () => <div className="w-full text-right">{t("columnActions")}</div>,
            cell: ({ row }) => {
                const deck = row.original;
                return (
                    <div className="text-muted flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            icon={Eye}
                            iconSize={16}
                            onClick={() => onView(deck.path, deck.title)}
                            className="hover:bg-katakana/10 hover:text-katakana"
                            aria-label={t("viewAria", { title: deck.title })}
                        />
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            icon={Trash2}
                            iconSize={16}
                            onClick={() => onDelete(deck.path)}
                            disabled={isDeleting}
                            className="hover:text-danger hover:bg-red-50"
                            aria-label={t("deleteAria", { title: deck.title })}
                        />
                    </div>
                );
            },
        }),
    ];

    return columns;
};
