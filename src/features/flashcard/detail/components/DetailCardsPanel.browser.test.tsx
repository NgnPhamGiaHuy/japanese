/**
 * @file DetailCardsPanel.browser.test.tsx
 * Covers the deck detail grid's permission gate on card reordering.
 *
 * SCOPE, AND WHAT IS DELIBERATELY NOT HERE
 * ────────────────────────────────────────
 * The drag interaction itself is NOT tested, and that is a known gap rather
 * than an oversight. dnd-kit's sensors did not activate under this tier for
 * either input path tried: a mouse drag (`userEvent.dragAndDrop` moves in too
 * few steps for the panel's 8px `MouseSensor` activation constraint) or the
 * keyboard sensor (focus the grip, Space, arrow, Space). Synthetic
 * MouseEvent/PointerEvent/KeyboardEvent sequences dispatched from a page script
 * do not activate it either. Asserting a reorder here would therefore have
 * meant asserting something the harness cannot actually perform.
 *
 * What still covers the rest of that path: `utils/reorder.test.ts` proves the
 * fractional-index arithmetic, and `handleDragEnd` is a thin wiring layer over
 * it. The genuinely uncovered part is sensor activation → collision detection →
 * the optimistic swap and its rollback, which wants a Playwright E2E driving
 * `mouse.down`/`move`×N/`up` against the running app.
 *
 * The gate below is worth its own test regardless of that: it is a permission
 * guarantee (`canEdit(role)`), not a drag detail, and a viewer silently gaining
 * a reorder handle would be a real access-control regression.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import DetailCardsPanel from "./DetailCardsPanel";

import type { DeckContext } from "../types";
import type { FlashCard, Lesson } from "../../types";

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}));

// The badge subscribes to Firestore for a per-card comment count — irrelevant
// here, and it would pull the whole client SDK into the test graph.
vi.mock("./CardCommentBadge", () => ({ default: () => null }));

const card = (id: string, primary: string, order: string): FlashCard => ({
    id,
    primary,
    meaning: `${primary}-meaning`,
    alternatives: [],
    example: "",
    order,
    lessonId: "l1",
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: 0,
});

const CARDS = [card("c1", "alpha", "a0"), card("c2", "bravo", "a1"), card("c3", "charlie", "a2")];

const GRIP = 'button[aria-label="reorderCard"]';

function makeCtx(overrides: Partial<DeckContext> = {}): DeckContext {
    return {
        lesson: { id: "l1", title: "Deck", themeColor: "#1cb0f6" } as Lesson,
        cards: CARDS,
        ownerId: "u1",
        lessonId: "l1",
        role: "owner",
        isOwner: true,
        basePath: "/flashcard/l1",
        ...overrides,
    };
}

const renderPanel = (ctx: DeckContext) =>
    render(
        <DetailCardsPanel
            ctx={ctx}
            selectedCardId={null}
            onSelectCard={vi.fn()}
            onReorderCard={vi.fn()}
        />,
    );

describe("DetailCardsPanel — who may reorder", () => {
    it("renders the whole deck in stored order", async () => {
        const screen = await renderPanel(makeCtx());
        const primaries = [...screen.container.querySelectorAll<HTMLElement>("*")]
            .filter((el) => el.childElementCount === 0)
            .map((el) => el.textContent?.trim() ?? "")
            .filter((text) => ["alpha", "bravo", "charlie"].includes(text));

        expect(primaries).toEqual(["alpha", "bravo", "charlie"]);
    });

    it("gives an owner a drag handle on every card", async () => {
        const screen = await renderPanel(makeCtx());
        expect(screen.container.querySelectorAll(GRIP)).toHaveLength(CARDS.length);
    });

    it("gives an editor a drag handle — reordering is an edit right, not an ownership one", async () => {
        const screen = await renderPanel(makeCtx({ role: "editor", isOwner: false }));
        expect(screen.container.querySelectorAll(GRIP)).toHaveLength(CARDS.length);
    });

    it("gives a viewer none, so the deck cannot be reordered without edit rights", async () => {
        const screen = await renderPanel(makeCtx({ role: "viewer", isOwner: false }));
        expect(screen.container.querySelectorAll(GRIP)).toHaveLength(0);
    });

    it("gives a commenter none either", async () => {
        const screen = await renderPanel(makeCtx({ role: "commenter", isOwner: false }));
        expect(screen.container.querySelectorAll(GRIP)).toHaveLength(0);
    });
});
