"use client";

import { useState } from "react";

import { Box, Database, Filter, Layers, Trash2 } from "lucide-react";

import { Button, LoadingSpinner } from "@/shared/components/ui";
import { ContentOverviewStats } from "./ContentOverviewStats";
import DeckDetailsPanel from "./DeckDetailsPanel";
import DecksTable from "./DecksTable";
import {
    AdminConfirmModal,
    AdminEmptyState,
    AdminErrorState,
    AdminPageHeader,
    AdminPageLayout,
    AdminSearchInput,
    AdminStatCard,
} from "../shared";
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
    const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

    if (isLoading)
        return (
            <AdminPageLayout>
                <LoadingSpinner fullScreen={false} label="Auditing global decks..." />
            </AdminPageLayout>
        );
    if (error)
        return (
            <AdminPageLayout>
                <AdminErrorState message={error.message} onRetry={() => refetch()} />
            </AdminPageLayout>
        );

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

    const handleDelete = async () => {
        if (!deckToDelete) return;
        await deleteCard(deckToDelete);
        setDeckToDelete(null);
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

            <AdminSearchInput
                placeholder="Search by deck title, description or owner email..."
                value={searchTerm}
                onChange={setSearchTerm}
            />

            {filteredItems.length > 0 ? (
                <DecksTable
                    items={filteredItems}
                    onDelete={(path) => setDeckToDelete(path)}
                    onView={handleView}
                    isDeleting={isDeleting}
                />
            ) : (
                <AdminEmptyState
                    title={searchTerm ? "No results found" : "No decks available"}
                    description={
                        searchTerm
                            ? `No flashcard sets match "${searchTerm}". Try a different term.`
                            : "Platform flashcard sets will appear here once users create them."
                    }
                    icon={Database}
                    action={
                        searchTerm ? (
                            <Button variant="secondary" onClick={() => setSearchTerm("")}>
                                Clear Search
                            </Button>
                        ) : undefined
                    }
                />
            )}

            <DeckDetailsPanel
                isOpen={!!selectedDeckPath}
                onClose={() => setSelectedDeckPath(null)}
                deckTitle={selectedDeckTitle}
                cards={cards}
                isLoading={isLoadingCards}
            />

            <AdminConfirmModal
                isOpen={!!deckToDelete}
                onClose={() => setDeckToDelete(null)}
                onConfirm={handleDelete}
                title="Delete Flashcard Set?"
                message="Are you sure you want to permanently delete this Entire Flashcard Set (Deck)? All words within this deck will also be removed. This action cannot be undone."
                variant="danger"
                isLoading={isDeleting}
            />
        </AdminPageLayout>
    );
};

export default AdminContentPageContent;
