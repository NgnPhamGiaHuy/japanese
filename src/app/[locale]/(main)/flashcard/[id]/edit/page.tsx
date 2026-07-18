/**
 * @file FlashcardEditPage
 * Logic orchestrator for editing personal or shared flashcard decks.
 * Integrates with LessonBuilder for the UI.
 */

"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { use } from "react";

import LessonBuilder from "@/features/flashcard/components/LessonBuilder";
import { useEditableLesson } from "@/features/flashcard/hooks";
import { useRouter } from "@/i18n/navigation";
import { LoadingSpinner } from "@/shared/components/ui";
import { useAlert } from "@/shared/providers";

/**
 * Flashcard Edit View
 *
 * @remarks
 * This page handles two distinct flows:
 * 1. **Personal Edit**: Simple CRUD on the user's own deck.
 * 2. **Shared Edit (Collaboration)**: Editing a deck owned by another user
 *    (requires `ownerId` in search params). Fetches data from the owner's
 *    Firestore namespace using `isSharedEdit` logic.
 */
export default function FlashcardEditPage({ params }: { params: Promise<{ id: string }> }) {
    const t = useTranslations("FlashcardDetail");
    const tCommon = useTranslations("Common");
    const { id } = use(params);
    const { showAlert } = useAlert();
    const router = useRouter();
    const searchParams = useSearchParams();

    /**
     * ownerId param is set when editing a shared lesson (editor role).
     * If present and different from current user, we switch to collaborative mode.
     */
    const ownerId = searchParams.get("ownerId");
    const returnTo = searchParams.get("returnTo");

    const { lesson, cards, loading, isSharedEdit, saveFullLesson, deleteLesson } =
        useEditableLesson(id, ownerId);

    /**
     * Returns to the `returnTo` param when present (e.g. shared-edit mode,
     * which links in from a specific share page rather than plain history),
     * otherwise falls back to browser history.
     */
    const handleBack = () => {
        if (returnTo) {
            router.push(returnTo);
            return;
        }
        router.back();
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!lesson) {
        return (
            <div className="bg-bg fixed inset-0 flex items-center justify-center">
                <p className="font-bold text-gray-400">{t("deckNotFoundMessage")}</p>
            </div>
        );
    }

    return (
        <LessonBuilder
            editingLesson={{
                ...lesson,
                ownerId: ownerId ?? lesson.ownerId ?? lesson.userId,
                userId: ownerId ?? lesson.userId,
            }}
            initialCards={cards}
            onSave={async (updatedLesson, updatedCards, isNew) => {
                try {
                    await saveFullLesson(updatedLesson, updatedCards, isNew);
                    showAlert("success", isNew ? t("deckCreated") : t("changesSaved"));
                    handleBack();
                } catch (err) {
                    console.error("[EditPage] Save failed:", err);
                    showAlert("error", t("saveFailed"));
                }
            }}
            onDelete={async () => {
                if (!isSharedEdit) {
                    try {
                        await deleteLesson(id);
                        showAlert("success", tCommon("deckDeleted"));
                        handleBack();
                    } catch (err) {
                        console.error("[EditPage] Delete failed:", err);
                        showAlert("error", tCommon("deleteDeckFailed"));
                    }
                } else {
                    showAlert("error", t("onlyOwnerCanDelete"));
                }
            }}
            onClose={handleBack}
        />
    );
}
