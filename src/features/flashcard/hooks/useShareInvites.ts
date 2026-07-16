"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { useAppStore } from "@/lib/app-store";
import { useAlert } from "@/shared/providers";
import { shareInviteSchema } from "@/shared/schemas";
import { inviteByEmail, revokeEmailInvite } from "../services";

import type { ShareInvite } from "@/shared/schemas";
import type { Lesson } from "../types";

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
            setError("email", { message: "You can't invite yourself." });
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
            showAlert("success", `Invitation sent to ${data.email}`);
        } catch (err) {
            console.error("[ShareModal] handleInvite failed:", err);
            setError("email", { message: "Failed to send invite. Please try again." });
            showAlert("error", "Invitation failed");
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
            showAlert("success", "Invitation revoked");
        } catch (err) {
            console.error("[ShareModal] handleRevokeEmailInvite failed:", err);
            showAlert("error", "Failed to revoke invitation");
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
