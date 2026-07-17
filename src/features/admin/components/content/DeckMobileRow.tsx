"use client";

import { useTranslations } from "next-intl";

import { flexRender } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, Layers } from "lucide-react";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";

import type { Row } from "@tanstack/react-table";
import type { AdminDeck } from "../../types";

interface DeckMobileRowProps {
    row: Row<AdminDeck>;
}

/**
 * Mobile card layout for a single deck row.
 *
 * @remarks Extracted from `DecksMobileList.tsx`'s per-item JSX into a
 * single-row component, mirroring `UserMobileRow.tsx`'s pattern: the
 * actions buttons are already configured on the "actions" column cell, so
 * this just `flexRender`s that cell rather than re-declaring onView/onDelete.
 */
const DeckMobileRow = ({ row }: DeckMobileRowProps) => {
    const t = useTranslations("AdminContent");
    const tCommon = useTranslations("AdminCommon");
    const deck = row.original;
    const actionsCell = row.getVisibleCells().find((c) => c.column.id === "actions");

    return (
        <div className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50/50">
            {/* Color swatch */}
            <div
                className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: deck.themeColor || DEFAULT_DECK_THEME_COLOR }}
            />

            {/* Main info */}
            <div className="min-w-0 flex-1">
                <p className="text-text text-sm font-black">{deck.title}</p>
                <p className="text-muted mt-0.5 line-clamp-1 text-xs font-bold">
                    {deck.description || tCommon("noDescription")}
                </p>

                {/* Tags */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                    {(deck.categories?.length ? deck.categories.slice(0, 3) : ["other"]).map(
                        (cat) => (
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
                        ),
                    )}
                </div>

                {/* Meta row */}
                <div className="text-muted mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
                    {/* Owner */}
                    <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                            {deck.ownerAvatar ? (
                                <img
                                    src={deck.ownerAvatar}
                                    alt={deck.ownerName ?? t("ownerAvatarAlt")}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-muted text-[8px] font-black">
                                    {(deck.ownerName || deck.ownerEmail || "?")[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <span>{deck.ownerName || deck.ownerEmail || t("unknownOwner")}</span>
                    </div>

                    {/* Card count */}
                    <div className="flex items-center gap-1">
                        <Layers size={10} className="text-both" />
                        <span className="text-text font-black">{deck.cardCount}</span>
                        <span className="tracking-widest uppercase">{tCommon("words")}</span>
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

            {/* Actions — reuse the already-configured cell */}
            {actionsCell && (
                <div className="flex shrink-0 flex-col gap-1.5">
                    {flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
                </div>
            )}
        </div>
    );
};

export default DeckMobileRow;
