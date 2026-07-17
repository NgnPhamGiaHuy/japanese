/**
 * useDashboardModals — Modal state management for dashboard
 *
 * @remarks
 * Handles share modal and delete confirmation modal states.
 */

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useLessons } from "@/features/flashcard/hooks";
import { useAlert } from "@/shared/providers";

import type { Lesson } from "@/features/flashcard/types";

export function useDashboardModals() {
    const t = useTranslations("Common");
    const { deleteLesson, shareLesson, updateLessonRoles } = useLessons();
    const { showAlert } = useAlert();

    const [sharingLesson, setSharingLesson] = useState<Lesson | null>(null);
    const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deletingLesson) return;
        setIsDeleting(true);
        try {
            await deleteLesson(deletingLesson.id);
            showAlert("success", t("deckDeleted"));
            setDeletingLesson(null);
        } catch (err) {
            console.error("[handleDelete] Delete failed:", err);
            showAlert("error", t("deleteDeckFailed"));
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        sharingLesson,
        setSharingLesson,
        deletingLesson,
        setDeletingLesson,
        isDeleting,
        handleDelete,
        shareLesson,
        updateLessonRoles,
    };
}
