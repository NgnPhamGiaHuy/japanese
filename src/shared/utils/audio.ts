"use client";

const JAPANESE_VOICE_PRIORITY = [
    "Google 日本語",
    "Google Japanese",
    "Microsoft Nanami",
    "Microsoft Haruka",
    "Kyoko",
    "Otoya",
    "Ayumi",
    "Haruka",
] as const;

const TTS_ENDPOINT = "https://translate.google.com/translate_tts";
const MAX_TTS_TEXT_LENGTH = 180;
const FEEDBACK_DELAY_MS = 220;
const SPEECH_RATE = 0.82;
const SILENT_AUDIO_SRC =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==";

let pronunciationTimer: number | null = null;
let currentAudio: HTMLAudioElement | null = null;
let selectedJapaneseVoiceURI: string | null = null;
let mediaUnlocked = false;
let playbackToken = 0;

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

function normalizePronunciationText(text: string): string {
    return text.trim().replace(/\s+/g, " ").slice(0, MAX_TTS_TEXT_LENGTH);
}

function clearPronunciationTimer(): void {
    if (!isBrowser() || !pronunciationTimer) return;
    window.clearTimeout(pronunciationTimer);
    pronunciationTimer = null;
}

function getSpeechSynthesis(): SpeechSynthesis | null {
    if (!isBrowser()) return null;
    return window.speechSynthesis ?? null;
}

function stopBrowserSpeech(): void {
    const synth = getSpeechSynthesis();
    if (!synth) return;
    synth.cancel();
}

function stopCurrentMedia(): void {
    if (!currentAudio) return;
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
}

function stopActivePronunciation(): void {
    playbackToken += 1;
    stopBrowserSpeech();
    stopCurrentMedia();
}

function buildTtsUrl(text: string): string {
    const params = new URLSearchParams({
        ie: "UTF-8",
        client: "tw-ob",
        tl: "ja",
        q: text,
    });

    return `${TTS_ENDPOINT}?${params.toString()}`;
}

function getJapaneseVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
    const japaneseVoices = synth.getVoices().filter((voice) => {
        const lang = voice.lang.toLowerCase().replace("_", "-");
        return lang === "ja-jp" || lang.startsWith("ja-");
    });

    if (japaneseVoices.length === 0) return undefined;

    const cachedVoice = selectedJapaneseVoiceURI
        ? japaneseVoices.find((voice) => voice.voiceURI === selectedJapaneseVoiceURI)
        : undefined;

    if (cachedVoice) return cachedVoice;

    const preferredVoice =
        JAPANESE_VOICE_PRIORITY.map((name) =>
            japaneseVoices.find((voice) => voice.name.includes(name)),
        ).find(Boolean) ?? japaneseVoices[0];

    selectedJapaneseVoiceURI = preferredVoice.voiceURI;
    return preferredVoice;
}

function warmSpeechVoices(): void {
    const synth = getSpeechSynthesis();
    if (!synth) return;

    synth.getVoices();
    if (typeof synth.addEventListener === "function") {
        synth.addEventListener("voiceschanged", () => synth.getVoices(), { once: true });
    }
}

function playBrowserSpeech(text: string, token: number): boolean {
    const synth = getSpeechSynthesis();
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return false;
    if (playbackToken !== token) return false;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getJapaneseVoice(synth);

    utterance.lang = "ja-JP";
    utterance.rate = SPEECH_RATE;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    try {
        synth.cancel();
        synth.resume();
        synth.speak(utterance);
        return true;
    } catch {
        return false;
    }
}

function playMediaPronunciation(text: string, token: number): boolean {
    if (!isBrowser() || typeof Audio === "undefined") {
        return playBrowserSpeech(text, token);
    }

    let audio: HTMLAudioElement;
    try {
        audio = new Audio(buildTtsUrl(text));
    } catch {
        return playBrowserSpeech(text, token);
    }

    currentAudio = audio;
    audio.preload = "auto";
    audio.volume = 1;

    const fallbackToSpeech = () => {
        if (playbackToken !== token) return;
        if (currentAudio === audio) currentAudio = null;
        playBrowserSpeech(text, token);
    };

    audio.onerror = fallbackToSpeech;
    audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
    };

    const playResult = audio.play();
    if (playResult) {
        playResult.catch(fallbackToSpeech);
    }

    return true;
}

function playPronunciation(text: string): void {
    if (!isBrowser()) return;

    const normalizedText = normalizePronunciationText(text);
    if (!normalizedText) return;

    clearPronunciationTimer();
    stopActivePronunciation();
    warmSpeechVoices();
    playMediaPronunciation(normalizedText, playbackToken);
}

function unlockPronunciationAudio(): void {
    if (!isBrowser() || mediaUnlocked || typeof Audio === "undefined") return;

    warmSpeechVoices();

    try {
        const audio = new Audio(SILENT_AUDIO_SRC);
        audio.volume = 0;
        const playResult = audio.play();
        if (!playResult) {
            mediaUnlocked = true;
            return;
        }

        playResult
            .then(() => {
                mediaUnlocked = true;
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
            })
            .catch(() => undefined);
    } catch {
        mediaUnlocked = false;
    }
}

if (typeof window !== "undefined") {
    const events: Array<keyof WindowEventMap> = [
        "click",
        "keydown",
        "mousedown",
        "pointerup",
        "touchend",
    ];

    events.forEach((eventName) => {
        window.addEventListener(eventName, unlockPronunciationAudio, {
            once: true,
            passive: true,
        });
    });
}

/** Plays Japanese character or word pronunciation. */
export function playAudio(text: string): void {
    playPronunciation(text);
}

export function playPronunciationFeedback(text: string, delayMs = FEEDBACK_DELAY_MS): void {
    if (!isBrowser()) return;

    clearPronunciationTimer();
    pronunciationTimer = window.setTimeout(() => {
        pronunciationTimer = null;
        playPronunciation(text);
    }, delayMs);
}
