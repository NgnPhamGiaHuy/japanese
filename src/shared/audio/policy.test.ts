import { describe, expect, it } from "vitest";

import { allowSpeech } from "./policy";

describe("speech policy", () => {
    describe("feedback stage", () => {
        it("always allows playback — the answer is already on screen", () => {
            expect(allowSpeech({ stage: "feedback", trigger: "auto" })).toBe(true);
            expect(allowSpeech({ stage: "feedback", trigger: "auto", questionType: "read" })).toBe(
                true,
            );
        });
    });

    describe("prompt stage", () => {
        it("blocks auto playback, because hearing the word gives away the answer", () => {
            expect(allowSpeech({ stage: "prompt", trigger: "auto", questionType: "read" })).toBe(
                false,
            );
            expect(allowSpeech({ stage: "prompt", trigger: "auto", questionType: "type" })).toBe(
                false,
            );
            expect(allowSpeech({ stage: "prompt", trigger: "auto" })).toBe(false);
        });

        it("allows auto playback for listening questions, where the audio IS the prompt", () => {
            expect(allowSpeech({ stage: "prompt", trigger: "auto", questionType: "listen" })).toBe(
                true,
            );
        });
    });

    describe("user-initiated playback", () => {
        it("is never gated — a learner cannot surprise themselves with an answer", () => {
            expect(allowSpeech({ stage: "prompt", trigger: "user", questionType: "read" })).toBe(
                true,
            );
            expect(allowSpeech({ stage: "feedback", trigger: "user" })).toBe(true);
        });
    });
});
