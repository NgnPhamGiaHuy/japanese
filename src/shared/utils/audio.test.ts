import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockVoice = {
    lang: string;
    name: string;
    voiceURI: string;
};

type MockAudioInstance = {
    load: ReturnType<typeof vi.fn>;
    onended: (() => void) | null;
    onerror: (() => void) | null;
    pause: ReturnType<typeof vi.fn>;
    play: ReturnType<typeof vi.fn>;
    preload: string;
    removeAttribute: ReturnType<typeof vi.fn>;
    src: string;
    volume: number;
};

type MockUtterance = {
    lang: string;
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
    options: { audioPlayFails?: boolean; hasAudio?: boolean } = {},
): void {
    const { audioPlayFails = false, hasAudio = true } = options;

    speechSynthesisMock = {
        addEventListener: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn(() => [kyokoVoice]),
        resume: vi.fn(),
        speak: vi.fn(),
    };

    vi.stubGlobal("window", {
        addEventListener: vi.fn(),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
        setTimeout: globalThis.setTimeout.bind(globalThis),
        speechSynthesis: speechSynthesisMock,
    });

    vi.stubGlobal(
        "SpeechSynthesisUtterance",
        class MockSpeechSynthesisUtterance implements MockUtterance {
            lang = "";
            pitch = 1;
            rate = 1;
            voice?: MockVoice;
            volume = 1;

            constructor(public text: string) {}
        },
    );

    if (!hasAudio) {
        vi.stubGlobal("Audio", undefined);
        return;
    }

    const AudioMock = vi.fn(function MockAudio(this: MockAudioInstance, src: string) {
        this.load = vi.fn();
        this.onended = null;
        this.onerror = null;
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

async function importAudioModule() {
    vi.resetModules();
    return import("./audio");
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

    it("debounces delayed pronunciation feedback and only plays the latest text", async () => {
        vi.useFakeTimers();
        installBrowserGlobals();
        const { playPronunciationFeedback } = await importAudioModule();

        playPronunciationFeedback("あ", 200);
        playPronunciationFeedback("い", 200);

        await vi.advanceTimersByTimeAsync(199);
        expect(globalThis.Audio).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);

        expect(globalThis.Audio).toHaveBeenCalledTimes(1);
        expect(decodeURIComponent(audioInstances[0].src)).toContain("q=い");
        expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
    });
});
