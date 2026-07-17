import { isValidElement } from "react";

import { describe, expect, it, vi } from "vitest";

import { speak } from "@/shared/audio";
import { ChartCell } from "./ChartCell";

import type { ReactElement } from "react";
import type { KanaChar } from "@/features/kana/types";

vi.mock("@/shared/audio", () => ({
    speak: vi.fn(),
}));

const kana: KanaChar = {
    char: "ア",
    group: "vowel",
    romaji: "a",
};

describe("ChartCell", () => {
    it("plays the kana character when the chart cell is clicked", () => {
        const rendered = ChartCell({
            isHiragana: false,
            item: kana,
            learned: false,
            showRomaji: true,
            playLabel: "Play",
        });

        expect(isValidElement(rendered)).toBe(true);

        const root = rendered as ReactElement<{
            children: ReactElement<{ onClick: () => void; title: string }>;
        }>;
        const button = root.props.children;

        expect(button.props.title).toBe("Play ア");
        button.props.onClick();

        expect(speak).toHaveBeenCalledTimes(1);
        // A chart tap is an explicit request, so it must never be gated by the auto-play setting.
        expect(speak).toHaveBeenCalledWith("ア", { trigger: "user", source: "kana-chart" });
    });
});
