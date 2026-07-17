import { NextIntlClientProvider } from "next-intl";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { DEFAULT_DECK_THEME_COLOR } from "@/features/flashcard/types";
import messages from "@/messages/en.json";
import { shareInviteSchema } from "@/shared/schemas";
import ShareCollaboratorsPanel from "./ShareCollaboratorsPanel";

import type { ShareInvite } from "@/shared/schemas";
import type { Lesson } from "../types";

const baseLesson: Lesson = {
    id: "lesson-1",
    title: "Test Deck",
    description: "",
    createdAt: 0,
    cardCount: 0,
};

/**
 * ShareCollaboratorsPanel is a presentational component driven by
 * react-hook-form props (registerInvite/inviteControl/inviteError) — this
 * harness owns the actual `useForm()` call, exactly like useShareInvites does.
 */
function Harness({ onInvite }: { onInvite: (data: ShareInvite) => void }) {
    const form = useForm<ShareInvite>({
        resolver: zodResolver(shareInviteSchema),
        defaultValues: { email: "", role: "viewer" },
    });
    const submit = form.handleSubmit(onInvite);

    return (
        <NextIntlClientProvider locale="en" messages={messages}>
            <ShareCollaboratorsPanel
                lesson={baseLesson}
                roles={{ "owner-uid": "owner" }}
                saving={false}
                themeHex={DEFAULT_DECK_THEME_COLOR}
                registerInvite={form.register}
                inviteControl={form.control}
                inviteError={form.formState.errors.email?.message ?? null}
                onInvite={submit}
                onRevokeInvite={() => {}}
                onUpdateUserRole={() => {}}
                onRemoveUser={() => {}}
            />
        </NextIntlClientProvider>
    );
}

describe("ShareCollaboratorsPanel", () => {
    test("shows a schema-derived inline error for an invalid email", async () => {
        const onInvite = vi.fn();
        const screen = await render(<Harness onInvite={onInvite} />);

        const emailInput = screen.getByPlaceholder("Invite by email address");
        await userEvent.type(emailInput.element(), "not-an-email");
        await screen.getByText("Invite").click();

        await expect.element(screen.getByText("Enter a valid email address")).toBeInTheDocument();
        await expect.element(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(onInvite).not.toHaveBeenCalled();
    });

    test("submits the trimmed, lowercased email and selected role for a valid invite", async () => {
        const onInvite = vi.fn();
        const screen = await render(<Harness onInvite={onInvite} />);

        const emailInput = screen.getByPlaceholder("Invite by email address");
        await userEvent.type(emailInput.element(), "  Friend@Example.com  ");
        await screen.getByText("Invite").click();

        await expect.poll(() => onInvite.mock.calls.length).toBe(1);
        expect(onInvite.mock.calls[0][0]).toEqual({ email: "friend@example.com", role: "viewer" });
    });

    test("submitting via Enter in the email field triggers the same validated invite", async () => {
        const onInvite = vi.fn();
        const screen = await render(<Harness onInvite={onInvite} />);

        const emailInput = screen.getByPlaceholder("Invite by email address");
        await userEvent.type(emailInput.element(), "friend@example.com{Enter}");

        await expect.poll(() => onInvite.mock.calls.length).toBe(1);
    });
});
