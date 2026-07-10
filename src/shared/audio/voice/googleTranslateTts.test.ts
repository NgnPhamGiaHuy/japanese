import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AudioEvent } from "../telemetry";

type MockVoice = {
    lang: string;
    name: string;
    voiceURI: string;
};

type MockAudioInstance = {
    load: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
    onerror: (() => void) | null;
    onplaying: (() => void) | null;
    pause: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    preload: string;
    removeAttribute: ReturnType<typeof vi.fn>;
    src: string;
    volume: number;
};

type MockUtterance = {
    lang: string;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    pitch: number;
    rate: number;
    text: string;
    voice?: MockVoice;
    volume: number;
};

const kyokoVoice: MockVoice = {
    lang: "ja-JP",
    name: "Kyoko",
    voiceURI: "kyoko",
};

let audioInstances: MockAudioInstance[] = [];
let speechSynthesisMock: {
    addEventListener: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    getVoices: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
};

function installBrowserGlobals(
    options: {
        audioPlayFails?: boolean;
        hasAudio?: boolean;
        hasUtterance?: boolean;
        voices?: MockVoice[];
    } = {},
): void {
    const {
        audioPlayFails = false,
        hasAudio = true,
        hasUtterance = true,
        voices = [kyokoVoice],
    } = options;

    speechSynthesisMock = {
        addEventListener: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn(() => voices),
        resume: vi.fn(),
        speak: vi.fn(),
    };

    vi.stubGlobal("window", {
        addEventListener: vi.fn(),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
        setTimeout: globalThis.setTimeout.bind(globalThis),
        speechSynthesis: speechSynthesisMock,
    });

    if (!hasUtterance) {
        vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    } else {
        vi.stubGlobal(
            "SpeechSynthesisUtterance",
            class MockSpeechSynthesisUtterance implements MockUtterance {
                lang = "";
                onend: (() => void) | null = null;
                onerror: ((event: { error: string }) => void) | null = null;
                pitch = 1;
                rate = 1;
                voice?: MockVoice;
                volume = 1;

                constructor(public text: string) {}
            },
        );
    }

    if (!hasAudio) {
        vi.stubGlobal("Audio", undefined);
        return;
    }

    const AudioMock = vi.fn(function MockAudio(this: MockAudioInstance, src: string) {
        this.load = vi.fn();
        this.onended = null;
        this.onerror = null;
        this.onplaying = null;
        this.pause = vi.fn();
        this.play = audioPlayFails
            ? vi.fn().mockRejectedValue(new DOMException("blocked", "NotAllowedError"))
            : vi.fn().mockResolvedValue(undefined);
        this.preload = "";
        this.removeAttribute = vi.fn();
        this.src = src;
        this.volume = 1;

        audioInstances.push(this);
    });

    vi.stubGlobal("Audio", AudioMock);
}

/**
 * Imports the transport and the telemetry bus from the SAME freshly-reset module graph, so the
 * module-scoped singletons under test are the ones the assertions observe.
 */
async function importAudioModule() {
    vi.resetModules();
    const telemetry = await import("../telemetry");
    const transport = await import("./googleTranslateTts");

    const events: AudioEvent[] = [];
    telemetry.subscribeAudioEvents((event) => events.push(event));

    /** Thin adapter, so these tests stay about behaviour rather than argument plumbing. */
    const playAudio = (text: string) => void transport.speakNow(text, { source: "test" });

    return { playAudio, stopAllAudio: transport.stopVoice, ...telemetry, events };
}

async function flushMicrotasks(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe("audio pronunciation pipeline", () => {
    beforeEach(() => {
        audioInstances = [];
        vi.clearAllMocks();
        installBrowserGlobals();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("plays Japanese text through the media TTS path immediately", async () => {
        const { playAudio } = await importAudioModule();

        playAudio(" あ ");

        expect(globalThis.Audio).toHaveBeenCalledTimes(1);
        expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
        expect(audioInstances[0].src).toContain("translate_tts");
        expect(audioInstances[0].src).toContain("tl=ja");
        expect(decodeURIComponent(audioInstances[0].src)).toContain("q=あ");
        expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
    });

    it("falls back to browser speech when media playback is blocked", async () => {
        installBrowserGlobals({ audioPlayFails: true });
        const { playAudio } = await importAudioModule();

        playAudio("こんにちは");
        await flushMicrotasks();

        expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
        expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);

        const utterance = speechSynthesisMock.speak.mock.calls[0][0] as MockUtterance;
        expect(utterance.text).toBe("こんにちは");
        expect(utterance.lang).toBe("ja-JP");
        expect(utterance.rate).toBe(0.82);
        expect(utterance.voice).toBe(kyokoVoice);
    });

    it("falls back to browser speech when media audio is unavailable", async () => {
        installBrowserGlobals({ hasAudio: false });
        const { playAudio } = await importAudioModule();

        playAudio("ア");

        expect(speechSynthesisMock.speak).toHaveBeenCalledTimes(1);

        const utterance = speechSynthesisMock.speak.mock.calls[0][0] as MockUtterance;
        expect(utterance.text).toBe("ア");
        expect(utterance.lang).toBe("ja-JP");
    });

    /** Last-wins: the transport never plays two pronunciations at once. */
    it("cancels the previous pronunciation when a new one starts", async () => {
        const { playAudio } = await importAudioModule();

        playAudio("あ");
        playAudio("い");

        expect(globalThis.Audio).toHaveBeenCalledTimes(2);
        expect(audioInstances[0].pause).toHaveBeenCalledTimes(1);
        expect(decodeURIComponent(audioInstances[1].src)).toContain("q=い");
    });

    it("registers exactly one voiceschanged listener regardless of playback count", async () => {
        const { playAudio } = await importAudioModule();

        for (let i = 0; i < 100; i++) playAudio("あ");

        expect(speechSynthesisMock.addEventListener).toHaveBeenCalledTimes(1);
        expect(speechSynthesisMock.addEventListener.mock.calls[0][0]).toBe("voiceschanged");
    });

    describe("stopAllAudio", () => {
        it("tears down audible media and reports the cancellation", async () => {
            const { playAudio, stopAllAudio, events } = await importAudioModule();

            playAudio("あ");
            expect(audioInstances[0].pause).not.toHaveBeenCalled();

            stopAllAudio("navigation");

            expect(audioInstances[0].pause).toHaveBeenCalledTimes(1);
            expect(audioInstances[0].removeAttribute).toHaveBeenCalledWith("src");
            expect(speechSynthesisMock.cancel).toHaveBeenCalled();
            expect(events).toContainEqual({ type: "cancelled", by: "navigation" });
        });
    });

    describe("telemetry", () => {
        it("reports a successful media tier result when playback ends", async () => {
            const { playAudio, events } = await importAudioModule();

            playAudio("あ");
            audioInstances[0].onended?.();

            expect(events).toContainEqual({ type: "tier_start", tier: "media" });
            expect(events).toContainEqual({ type: "tier_result", tier: "media", ok: true });
        });

        it("reports the fallback reason when media play() is rejected", async () => {
            installBrowserGlobals({ audioPlayFails: true });
            const { playAudio, events } = await importAudioModule();

            playAudio("あ");
            await flushMicrotasks();

            expect(events).toContainEqual({
                type: "fallback",
                from: "media",
                reason: "NotAllowedError",
            });
            expect(events).toContainEqual({ type: "tier_start", tier: "speech" });
        });

        it("reports a terminal failure when speech synthesis errors", async () => {
            installBrowserGlobals({ audioPlayFails: true });
            const { playAudio, events } = await importAudioModule();

            playAudio("あ");
            await flushMicrotasks();

            const utterance = speechSynthesisMock.speak.mock.calls[0][0] as MockUtterance;
            utterance.onerror?.({ error: "language-unavailable" });

            expect(events).toContainEqual({
                type: "tier_result",
                tier: "speech",
                ok: false,
                reason: "language-unavailable",
            });
            expect(events).toContainEqual({
                type: "failure",
                reason: "speech:language-unavailable",
            });
        });

        it("reports no_ja_voice when the device has no Japanese voice installed", async () => {
            installBrowserGlobals({
                audioPlayFails: true,
                voices: [{ lang: "en-US", name: "Alex", voiceURI: "alex" }],
            });
            const { playAudio, events } = await importAudioModule();

            playAudio("あ");
            await flushMicrotasks();

            expect(events).toContainEqual({ type: "no_ja_voice" });
        });

        it("reports voices_empty when the voice list has not loaded yet", async () => {
            installBrowserGlobals({ audioPlayFails: true, voices: [] });
            const { playAudio, events } = await importAudioModule();

            playAudio("あ");
            await flushMicrotasks();

            expect(events).toContainEqual({ type: "voices_empty" });
        });

        it("reports a terminal failure when neither tier is available", async () => {
            installBrowserGlobals({ hasAudio: false, hasUtterance: false });
            const { playAudio, events } = await importAudioModule();

            playAudio("あ");

            expect(events).toContainEqual({ type: "failure", reason: "speech-unavailable" });
            expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
        });
    });
});
