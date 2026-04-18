"use client";

import { useState } from "react";

import { Box, Database, Filter, Layers, Search, Trash2 } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import { ContentOverviewStats } from "./ContentOverviewStats";
import DeckDetailsPanel from "./DeckDetailsPanel";
import DecksTable from "./DecksTable";
import { AdminErrorState, AdminPageHeader, AdminPageLayout, AdminStatCard } from "../shared";
import { useGlobalContent } from "../../hooks";

/**
 * Global Content Moderation Page.
 *
 * @remarks Orchestrates the auditing of community-generated flashcard sets.
 * Delegates data visualization to ContentOverviewStats and list rendering to DecksTable.
 */
const AdminContentPageContent = () => {
    const {
        data,
        isLoading,
        error,
        deleteCard,
        isDeleting,
        loadCards,
        isLoadingCards,
        cards,
        selectedDeckPath,
        setSelectedDeckPath,
        refetch,
    } = useGlobalContent();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDeckTitle, setSelectedDeckTitle] = useState("");

    if (isLoading) return <LoadingSpinner fullScreen={false} label="Auditing global decks..." />;
    if (error) return <AdminErrorState message={error.message} onRetry={() => refetch()} />;

    const filteredItems =
        data?.items.filter(
            (item) =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [];

    const handleView = async (path: string, title: string) => {
        setSelectedDeckTitle(title);
        setSelectedDeckPath(path);
        await loadCards(path);
    };

    const handleDelete = async (path: string) => {
        if (
            confirm(
                "Are you sure you want to permanently delete this Entire Flashcard Set (Deck)? All words within this deck will also be removed. This action cannot be undone.",
            )
        ) {
            await deleteCard(path);
        }
    };

    return (
        <AdminPageLayout>
            <AdminPageHeader
                title="Content Management"
                description="Moderate and audit global flashcard sets (decks) and their content."
                icon={Database}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" className="gap-2 !px-4 !py-2 text-sm">
                            <Filter size={14} />
                            Filter by Owner
                        </Button>
                    </div>
                }
            />

            <ContentOverviewStats
                totalDecks={data?.total || 0}
                filteredCount={filteredItems.length}
            />

            <div className="space-y-4">
                <div className="relative">
                    <Search
                        className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search by deck title, description or owner email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 w-full rounded-2xl border-2 border-gray-100 bg-white pr-4 pl-11 text-sm font-black text-[#3c3c3c] transition-all outline-none placeholder:font-bold placeholder:text-[#afafaf] focus:border-[#1cb0f6] focus:ring-4 focus:ring-[#1cb0f6]/5"
                    />
                </div>

                <DecksTable
                    items={filteredItems}
                    onDelete={handleDelete}
                    onView={handleView}
                    isDeleting={isDeleting}
                />
            </div>

            <DeckDetailsPanel
                isOpen={!!selectedDeckPath}
                onClose={() => setSelectedDeckPath(null)}
                deckTitle={selectedDeckTitle}
                cards={cards}
                isLoading={isLoadingCards}
            />
        </AdminPageLayout>
    );
};

export default AdminContentPageContent;
