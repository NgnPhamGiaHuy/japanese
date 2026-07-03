import { isValidElement } from "react";

import { describe, expect, it, vi } from "vitest";

import { playAudio } from "@/shared/utils";
import { ChartCell } from "./ChartCell";

import type { ReactElement } from "react";
import type { KanaChar } from "@/features/kana/types";

vi.mock("@/shared/utils", () => ({
    playAudio: vi.fn(),
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
        });

        expect(isValidElement(rendered)).toBe(true);

        const root = rendered as ReactElement<{
            children: ReactElement<{ onClick: () => void; title: string }>;
        }>;
        const button = root.props.children;

        expect(button.props.title).toBe("Play ア");
        button.props.onClick();

        expect(playAudio).toHaveBeenCalledTimes(1);
        expect(playAudio).toHaveBeenCalledWith("ア");
    });
});
