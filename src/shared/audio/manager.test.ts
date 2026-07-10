import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { configureAudio, resetAudioManager, speak } from "./manager";
import { resetAudioTelemetry, subscribeAudioEvents } from "./telemetry";
import { DEFAULT_AUDIO_SETTINGS } from "./types";

import type { AudioEvent } from "./telemetry";
import type { AudioSettings } from "./types";

let events: AudioEvent[] = [];

function withSettings(overrides: Partial<AudioSettings>): void {
    configureAudio({ getSettings: () => ({ ...DEFAULT_AUDIO_SETTINGS, ...overrides }) });
}

async function statusOf(handle: ReturnType<typeof speak>): Promise<string> {
    return (await handle.done).status;
}

describe("audio manager", () => {
    beforeEach(() => {
        resetAudioManager();
        resetAudioTelemetry();
        events = [];
        subscribeAudioEvents((event) => events.push(event));
    });

    afterEach(() => {
        resetAudioManager();
        resetAudioTelemetry();
    });

    /**
     * The behaviour this whole refactor exists to fix: `globalAutoPlay` used to be honoured by the
     * three flashcard players and ignored by Speed, Match, Quiz, Survival and Kana Practice.
     * Enforcing it in one place means every mode obeys it by construction.
     */
    describe("auto-play setting (enforced centrally, for every mode)", () => {
        it("suppresses automatic pronunciation when auto-play is off", async () => {
            withSettings({ autoPlay: false });

            const handle = speak("あ", { trigger: "auto", source: "speed" });

            expect(await statusOf(handle)).toBe("suppressed");
            expect(events).toContainEqual({
                type: "suppressed",
                source: "speed",
                reason: "autoplay-disabled",
            });
        });

        it("never suppresses playback the learner explicitly asked for", async () => {
            withSettings({ autoPlay: false });

            const handle = speak("あ", { trigger: "user", source: "kana-chart" });

            expect(await statusOf(handle)).not.toBe("suppressed");
        });

        it("allows automatic pronunciation when auto-play is on", async () => {
            withSettings({ autoPlay: true });

            const handle = speak("あ", { trigger: "auto", source: "match" });

            expect(await statusOf(handle)).not.toBe("suppressed");
        });
    });

    describe("voice mute", () => {
        it("suppresses even user-initiated playback", async () => {
            withSettings({ voiceMuted: true });

            const handle = speak("あ", { trigger: "user", source: "kana-chart" });

            expect(await statusOf(handle)).toBe("suppressed");
            expect(events).toContainEqual({
                type: "suppressed",
                source: "kana-chart",
                reason: "voice-muted",
            });
        });

        it("treats zero volume as muted", async () => {
            withSettings({ voiceVolume: 0 });

            expect(await statusOf(speak("あ", { trigger: "user", source: "x" }))).toBe(
                "suppressed",
            );
        });
    });

    describe("speech policy", () => {
        it("suppresses prompt-stage auto playback so audio cannot leak the answer", async () => {
            withSettings({ autoPlay: true });

            const handle = speak("あ", {
                trigger: "auto",
                source: "kana-quiz",
                stage: "prompt",
                questionType: "read",
            });

            expect(await statusOf(handle)).toBe("suppressed");
            expect(events).toContainEqual({
                type: "suppressed",
                source: "kana-quiz",
                reason: "policy",
            });
        });

        it("permits prompt-stage playback for listening questions", async () => {
            withSettings({ autoPlay: true });

            const handle = speak("あ", {
                trigger: "auto",
                source: "kana-quiz",
                stage: "prompt",
                questionType: "listen",
            });

            expect(await statusOf(handle)).not.toBe("suppressed");
        });

        it("defaults to the feedback stage", async () => {
            withSettings({ autoPlay: true });

            const handle = speak("あ", { trigger: "auto", source: "kana-quiz" });

            expect(await statusOf(handle)).not.toBe("suppressed");
        });
    });

    /**
     * Screen-reader users routinely silence game SFX while relying on pronunciation, so the two
     * channels must never be able to mute each other.
     */
    describe("channel independence", () => {
        it("muting sound effects leaves pronunciation audible", async () => {
            withSettings({ sfxMuted: true });

            expect(await statusOf(speak("あ", { trigger: "user", source: "x" }))).not.toBe(
                "suppressed",
            );
        });

        it("muting pronunciation does not depend on the sound-effect setting", async () => {
            withSettings({ voiceMuted: true, sfxMuted: false });

            expect(await statusOf(speak("あ", { trigger: "user", source: "x" }))).toBe(
                "suppressed",
            );
        });

        it("turning off auto-play still allows an explicit replay", async () => {
            withSettings({ autoPlay: false, voiceMuted: false });

            expect(await statusOf(speak("あ", { trigger: "user", source: "x" }))).not.toBe(
                "suppressed",
            );
            expect(await statusOf(speak("あ", { trigger: "auto", source: "x" }))).toBe(
                "suppressed",
            );
        });
    });

    describe("settings are read per call", () => {
        it("picks up a toggle without any resubscription", async () => {
            let autoPlay = true;
            configureAudio({ getSettings: () => ({ ...DEFAULT_AUDIO_SETTINGS, autoPlay }) });

            expect(await statusOf(speak("あ", { trigger: "auto", source: "s" }))).not.toBe(
                "suppressed",
            );

            autoPlay = false;

            expect(await statusOf(speak("あ", { trigger: "auto", source: "s" }))).toBe(
                "suppressed",
            );
        });
    });
});
