import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { DEFAULT_DECK_THEME_COLOR, lessonMetadataSchema } from "@/features/flashcard/types";
import messages from "@/messages/en.json";
import LessonBuilderMeta from "./LessonBuilderMeta";

import type { LessonMetadata, LessonMetadataInput } from "@/features/flashcard/types";

/**
 * LessonBuilderMeta is a presentational component driven entirely by
 * react-hook-form props (register/formErrors/setFormValue) — this harness
 * owns the actual `useForm()` call, exactly like useLessonBuilder does.
 */
function Harness() {
    const form = useForm<LessonMetadataInput, unknown, LessonMetadata>({
        resolver: zodResolver(lessonMetadataSchema),
        defaultValues: {
            title: "",
            description: "",
            categories: ["vocabulary"],
            themeColor: DEFAULT_DECK_THEME_COLOR,
        },
    });
    const [tagInput, setTagInput] = useState("");
    const categories = form.watch("categories") ?? [];
    const themeHex = form.watch("themeColor") || DEFAULT_DECK_THEME_COLOR;
    const onSubmit = form.handleSubmit(() => {});

    return (
        <NextIntlClientProvider locale="en" messages={messages}>
            <div>
                <button type="button" onClick={onSubmit}>
                    Submit
                </button>
                <LessonBuilderMeta
                    register={form.register}
                    formErrors={form.formState.errors}
                    setFormValue={form.setValue}
                    categories={categories}
                    tagInput={tagInput}
                    setTagInput={setTagInput}
                    addTag={(val) => {
                        const trimmed = val.trim().toLowerCase();
                        const current = form.getValues("categories") || [];
                        if (trimmed && current.length < 3) {
                            form.setValue("categories", [...current, trimmed]);
                            setTagInput("");
                        }
                    }}
                    removeCategory={(cat) =>
                        form.setValue(
                            "categories",
                            (form.getValues("categories") || []).filter((c) => c !== cat),
                        )
                    }
                    themeHex={themeHex}
                    saving={false}
                />
            </div>
        </NextIntlClientProvider>
    );
}

describe("LessonBuilderMeta", () => {
    test("shows a schema-derived inline error when submitting an empty title", async () => {
        const screen = await render(<Harness />);

        await screen.getByText("Submit").click();

        const error = screen.getByText("Title is required");
        await expect.element(error).toBeInTheDocument();

        const titleInput = screen.getByPlaceholder("Deck Title ✱ (e.g. JLPT N5 Verbs)");
        await expect.element(titleInput).toHaveAttribute("aria-invalid", "true");
    });

    test("clears the title error once a valid title is typed", async () => {
        const screen = await render(<Harness />);

        await screen.getByText("Submit").click();
        await expect.element(screen.getByText("Title is required")).toBeInTheDocument();

        const titleInput = screen.getByPlaceholder("Deck Title ✱ (e.g. JLPT N5 Verbs)");
        await userEvent.type(titleInput.element(), "My Deck");

        await expect.poll(() => screen.getByText("Title is required").query()).toBeNull();
    });

    test("adding a suggested tag renders it as a pill and disables the suggestion", async () => {
        const screen = await render(<Harness />);

        const kanjiSuggestion = screen.getByRole("button", { name: "Kanji" });
        await kanjiSuggestion.click();

        await expect.element(screen.getByText("TYPE:KANJI")).toBeInTheDocument();
        await expect.element(kanjiSuggestion).toBeDisabled();
    });

    test("clicking a theme swatch updates the active swatch border", async () => {
        const screen = await render(<Harness />);

        const swatches = screen.container.querySelectorAll('button[style*="background-color"]');
        expect(swatches.length).toBeGreaterThan(1);

        const secondSwatch = swatches[1] as HTMLButtonElement;
        await userEvent.click(secondSwatch);

        await expect.poll(() => secondSwatch.className).toContain("border-black");
    });
});
