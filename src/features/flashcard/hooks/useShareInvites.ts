"use client";

import { useState } from "react";

import { useAppStore } from "@/lib/app-store";
import { useAlert } from "@/shared/providers";
import { inviteByEmail, revokeEmailInvite } from "../services";

import type { DeckAccessRole, Lesson } from "../types";

type Role = DeckAccessRole;

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
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<Role>("viewer");
    const [inviteError, setInviteError] = useState<string | null>(null);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        const email = inviteEmail.trim().toLowerCase();

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setInviteError("Please enter a valid email address.");
            return;
        }

        // Don't invite the owner
        if (email === user?.email?.toLowerCase()) {
            setInviteError("You can't invite yourself.");
            return;
        }

        setInviteError(null);
        setSaving(true);
        try {
            const ownerId = lesson.ownerId ?? lesson.userId;
            if (!ownerId) return;
            await inviteByEmail(
                ownerId,
                lesson.id,
                email,
                inviteRole as "viewer" | "commenter" | "editor",
                user?.displayName,
                user?.photoURL ?? null,
                lesson.title,
            );
            setInviteEmail("");
            showAlert("success", `Invitation sent to ${email}`);
        } catch (err) {
            console.error("[ShareModal] handleInvite failed:", err);
            setInviteError("Failed to send invite. Please try again.");
            showAlert("error", "Invitation failed");
        } finally {
            setSaving(false);
        }
    };

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
        inviteEmail,
        setInviteEmail,
        inviteRole,
        setInviteRole,
        inviteError,
        setInviteError,
        handleInvite,
        handleRevokeEmailInvite,
    };
}
