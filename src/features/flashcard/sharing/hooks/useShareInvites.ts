"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { shareInviteSchema } from "@/features/flashcard/types";
import { useAppStore } from "@/lib/app-store";
import { useAlert } from "@/shared/providers";
import { inviteByEmail, revokeEmailInvite } from "../../services";

import type { ShareInvite } from "@/features/flashcard/types";
import type { Lesson } from "../../types";

interface UseShareInvitesParams {
    lesson: Lesson;
    /** Shared saving flag — ShareModal disables its whole UI during any in-flight action. */
    setSaving: (saving: boolean) => void;
}

/**
 * Owns ShareModal's email-invite flow — form state, validation, and the
 * invite/revoke service calls — so the component stays UI-only.
 */
export function useShareInvites({ lesson, setSaving }: UseShareInvitesParams) {
    const t = useTranslations("ShareModal");
    const { user } = useAppStore();
    const { showAlert } = useAlert();
    const form = useForm<ShareInvite>({
        resolver: zodResolver(shareInviteSchema),
        defaultValues: { email: "", role: "viewer" },
    });
    const { register, control, handleSubmit, setError, reset, formState } = form;

    const handleInvite = handleSubmit(async (data) => {
        // Don't invite the owner
        if (data.email === user?.email?.toLowerCase()) {
            setError("email", { message: t("cannotInviteSelf") });
            return;
        }

        setSaving(true);
        try {
            const ownerId = lesson.ownerId ?? lesson.userId;
            if (!ownerId) return;
            await inviteByEmail(
                ownerId,
                lesson.id,
                data.email,
                data.role,
                user?.displayName,
                user?.photoURL ?? null,
                lesson.title,
            );
            reset({ email: "", role: data.role });
            showAlert("success", t("inviteSent", { email: data.email }));
        } catch (err) {
            console.error("[ShareModal] handleInvite failed:", err);
            setError("email", { message: t("sendInviteFailed") });
            showAlert("error", t("inviteFailed"));
        } finally {
            setSaving(false);
        }
    });

    const handleRevokeEmailInvite = async (email: string) => {
        const ownerId = lesson.ownerId ?? lesson.userId;
        if (!ownerId) return;
        setSaving(true);
        try {
            await revokeEmailInvite(ownerId, lesson.id, email);
            showAlert("success", t("inviteRevoked"));
        } catch (err) {
            console.error("[ShareModal] handleRevokeEmailInvite failed:", err);
            showAlert("error", t("revokeFailed"));
        } finally {
            setSaving(false);
        }
    };

    return {
        register,
        control,
        handleInvite,
        handleRevokeEmailInvite,
        inviteError: formState.errors.email?.message ?? null,
    };
}
