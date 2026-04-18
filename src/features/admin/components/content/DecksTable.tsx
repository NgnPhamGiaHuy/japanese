import { format } from "date-fns";
import { Calendar, Eye, Layers, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui";
import DecksTableRow from "./DecksTableRow";
import { AdminTable } from "../shared";

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
        <AdminTable>
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
        </AdminTable>
    );
};

export default DecksTable;
