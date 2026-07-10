import { afterEach, describe, expect, it, vi } from "vitest";

import {
    emitAudioEvent,
    getAudioCounters,
    resetAudioTelemetry,
    subscribeAudioEvents,
} from "./telemetry";

import type { AudioEvent } from "./telemetry";

describe("audio telemetry bus", () => {
    afterEach(() => {
        resetAudioTelemetry();
    });

    it("fans out events to every subscriber", () => {
        const a: AudioEvent[] = [];
        const b: AudioEvent[] = [];
        subscribeAudioEvents((e) => a.push(e));
        subscribeAudioEvents((e) => b.push(e));

        emitAudioEvent({ type: "no_ja_voice" });

        expect(a).toEqual([{ type: "no_ja_voice" }]);
        expect(b).toEqual([{ type: "no_ja_voice" }]);
    });

    it("stops delivering after unsubscribe", () => {
        const seen: AudioEvent[] = [];
        const unsubscribe = subscribeAudioEvents((e) => seen.push(e));

        emitAudioEvent({ type: "voices_empty" });
        unsubscribe();
        emitAudioEvent({ type: "voices_empty" });

        expect(seen).toHaveLength(1);
    });

    it("never lets a throwing sink break playback or the other sinks", () => {
        const survivor = vi.fn();
        subscribeAudioEvents(() => {
            throw new Error("sink exploded");
        });
        subscribeAudioEvents(survivor);

        expect(() => emitAudioEvent({ type: "unlock", ok: true })).not.toThrow();
        expect(survivor).toHaveBeenCalledTimes(1);
    });

    it("counts failures by reason so causes can be ranked", () => {
        emitAudioEvent({ type: "failure", reason: "speech:language-unavailable" });
        emitAudioEvent({ type: "failure", reason: "speech:language-unavailable" });
        emitAudioEvent({ type: "failure", reason: "speech-unavailable" });

        expect(getAudioCounters()).toMatchObject({
            "failure:speech:language-unavailable": 2,
            "failure:speech-unavailable": 1,
        });
    });

    it("counts tier results by tier and outcome", () => {
        emitAudioEvent({ type: "tier_result", tier: "media", ok: true });
        emitAudioEvent({ type: "tier_result", tier: "media", ok: false, reason: "media-error" });
        emitAudioEvent({ type: "tier_result", tier: "speech", ok: true });

        expect(getAudioCounters()).toMatchObject({
            "tier_result:media:ok": 1,
            "tier_result:media:media-error": 1,
            "tier_result:speech:ok": 1,
        });
    });
});
