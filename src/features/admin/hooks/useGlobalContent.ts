"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAdminToken } from "./useAdminToken";
import {
    deleteGlobalFlashcardAction,
    fetchDeckCardsAction,
    fetchGlobalContentAction,
} from "../actions";
import { adminQueryKeys } from "../utils/queryKeys";

export function useGlobalContent() {
    const getAdminIdToken = useAdminToken();
    const queryClient = useQueryClient();
    const [selectedDeckPath, setSelectedDeckPath] = useState<string | null>(null);

    const query = useQuery({
        queryKey: adminQueryKeys.content(),
        queryFn: async () => {
            await getAdminIdToken();
            const result = await fetchGlobalContentAction();
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
    });

    const loadCardsMutation = useMutation({
        mutationFn: async (path: string) => {
            await getAdminIdToken();
            const result = await fetchDeckCardsAction(path);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (path: string) => {
            await getAdminIdToken();
            const result = await deleteGlobalFlashcardAction(path);
            if (!result.ok) throw new Error(result.error);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.content() });
            queryClient.invalidateQueries({ queryKey: [adminQueryKeys.dashboard()] });
            if (selectedDeckPath) setSelectedDeckPath(null);
        },
    });

    return {
        ...query,
        deleteCard: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        loadCards: loadCardsMutation.mutateAsync,
        isLoadingCards: loadCardsMutation.isPending,
        cards: loadCardsMutation.data,
        selectedDeckPath,
        setSelectedDeckPath,
    };
}
