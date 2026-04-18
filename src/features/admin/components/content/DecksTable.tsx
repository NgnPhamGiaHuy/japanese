import { format } from "date-fns";
import { Calendar, Eye, Layers, Trash2 } from "lucide-react";

import { Button, Card } from "@/shared/components/ui";
import DecksTableRow from "./DecksTableRow";

import type { AdminDeck } from "../../types";

interface DecksTableProps {
    items: AdminDeck[];
    onDelete: (path: string) => void;
    onView: (path: string, title: string) => void;
    isDeleting: boolean;
}

/**
 * Global Decks Administrative Table.
 *
 * @remarks Displays all platform flashcard sets.
 * Delegates individual row rendering to DecksTableRow for modularity.
 */
const DecksTable = ({ items, onDelete, onView, isDeleting }: DecksTableProps) => {
    return (
        <Card
            padding="none"
            className="overflow-hidden border-2 border-b-8 border-gray-100 bg-white"
        >
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b-2 border-gray-50 bg-gray-50/30">
                            <th className="px-6 py-4 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Flashcard Set (Deck)
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Owner
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Size
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Created
                            </th>
                            <th className="px-6 py-4 text-right text-[10px] font-black tracking-widest text-[#afafaf] uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((deck) => (
                            <DecksTableRow
                                key={deck.id}
                                deck={deck}
                                onView={onView}
                                onDelete={onDelete}
                                isDeleting={isDeleting}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            {items.length === 0 && (
                <div className="py-20 text-center">
                    <p className="text-sm font-bold text-[#afafaf]">
                        No flashcard sets found in the system.
                    </p>
                </div>
            )}
        </Card>
    );
};

export default DecksTable;
