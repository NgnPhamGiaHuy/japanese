"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Database, Filter } from "lucide-react";

import { Button, ConfirmModal, EmptyState, LoadingSpinner } from "@/shared/components/ui";
import { ContentOverviewStats } from "./ContentOverviewStats";
import DeckDetailsPanel from "./DeckDetailsPanel";
import DecksTable from "./DecksTable";
import { AdminErrorState, AdminPageHeader, AdminPageLayout, AdminSearchInput } from "../shared";
import { useGlobalContent } from "../../hooks";

/**
 * Global Content Moderation Page.
 *
 * @remarks Orchestrates the auditing of community-generated flashcard sets.
 * Delegates data visualization to ContentOverviewStats and list rendering to DecksTable.
 */
const AdminContentPageContent = () => {
    const t = useTranslations("AdminContent");
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

    const filteredItems = useMemo(
        () =>
            data?.items.filter(
                (item) =>
                    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
            ) || [],
        [data, searchTerm],
    );

    if (isLoading)
        return (
            <AdminPageLayout>
                <LoadingSpinner fullScreen={false} label={t("loadingDecks")} />
            </AdminPageLayout>
        );
    if (error)
        return (
            <AdminPageLayout>
                <AdminErrorState message={error.message} onRetry={() => refetch()} />
            </AdminPageLayout>
        );

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
                title={t("title")}
                description={t("description")}
                icon={Database}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" className="gap-2 !px-4 !py-2 text-sm">
                            <Filter size={14} />
                            {t("filterByOwner")}
                        </Button>
                    </div>
                }
            />

            <ContentOverviewStats totalDecks={data?.total || 0} />

            <AdminSearchInput
                placeholder={t("searchPlaceholder")}
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
                <EmptyState
                    title={searchTerm ? t("noResultsFound") : t("noDecksAvailable")}
                    description={
                        searchTerm
                            ? t("noMatchSearch", { search: searchTerm })
                            : t("willAppearHere")
                    }
                    icon={Database}
                    action={
                        searchTerm ? (
                            <Button variant="secondary" onClick={() => setSearchTerm("")}>
                                {t("clearSearch")}
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

            <ConfirmModal
                isOpen={!!deckToDelete}
                onClose={() => setDeckToDelete(null)}
                onConfirm={handleDelete}
                title={t("deleteDeckTitle")}
                message={t("deleteDeckMessage")}
                variant="danger"
                loading={isDeleting}
            />
        </AdminPageLayout>
    );
};

export default AdminContentPageContent;
