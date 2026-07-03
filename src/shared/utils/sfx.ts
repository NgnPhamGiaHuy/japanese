"use client";

/**
 * Deterministic UI/game sound effects.
 *
 * Sound rules:
 * - A named event always maps to the same preset.
 * - Presets do not use randomness, so tone is stable across sessions.
 * - SFX is short feedback only; pronunciation audio is handled by `audio.ts`.
 * - The AudioContext is resumed from user interaction to satisfy browser autoplay policy.
 */

export type SFXType = "correct" | "wrong" | "click";

type AudioContextConstructor = typeof AudioContext;
type WindowWithWebkitAudio = Window &
    typeof globalThis & {
        webkitAudioContext?: AudioContextConstructor;
    };

type ToneStep = {
    frequency: number;
    endFrequency?: number;
    delay: number;
    duration: number;
    peak: number;
    type?: OscillatorType;
};

const MASTER_VOLUME = 0.66;
const SFX_THROTTLE_MS: Record<SFXType, number> = {
    click: 24,
    correct: 90,
    wrong: 110,
};

const CORRECT_TONES: ToneStep[] = [
    { frequency: 523.25, endFrequency: 516, delay: 0, duration: 0.34, peak: 0.34 },
    { frequency: 659.25, endFrequency: 652, delay: 0.09, duration: 0.42, peak: 0.31 },
    { frequency: 1046.5, delay: 0.09, duration: 0.16, peak: 0.07 },
];

const WRONG_TONES: ToneStep[] = [
    {
        frequency: 293.66,
        endFrequency: 230,
        delay: 0,
        duration: 0.36,
        peak: 0.34,
        type: "sine",
    },
    {
        frequency: 246.94,
        endFrequency: 196,
        delay: 0.02,
        duration: 0.32,
        peak: 0.22,
        type: "sine",
    },
];

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let lastPlayedAt: Partial<Record<SFXType, number>> = {};

function getAudioContextConstructor(): AudioContextConstructor | undefined {
    if (typeof window === "undefined") return undefined;
    const soundWindow = window as WindowWithWebkitAudio;
    return soundWindow.AudioContext ?? soundWindow.webkitAudioContext;
}

function getContext(): AudioContext | null {
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) return null;

    if (!audioCtx) {
        audioCtx = new AudioContextCtor();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = MASTER_VOLUME;

        compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
        compressor.knee.setValueAtTime(10, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(2.5, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0.004, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.12, audioCtx.currentTime);

        masterGain.connect(compressor);
        compressor.connect(audioCtx.destination);
    }

    return audioCtx;
}

function clampVolume(volume: number): number {
    return Math.min(Math.max(volume, 0), 1.25);
}

function routeToMaster(node: AudioNode, volume = 1): void {
    if (!audioCtx || !masterGain) return;
    const gain = audioCtx.createGain();
    gain.gain.value = clampVolume(volume);
    node.connect(gain);
    gain.connect(masterGain);
}

function applyEnvelope(gain: GainNode, start: number, peak: number, duration: number): void {
    const attack = Math.min(0.006, duration * 0.25);
    gain.gain.cancelScheduledValues(start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
}

function scheduleTone(ctx: AudioContext, step: ToneStep, volume: number): void {
    const start = ctx.currentTime + step.delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = step.type ?? "sine";
    osc.frequency.setValueAtTime(step.frequency, start);
    if (step.endFrequency) {
        osc.frequency.exponentialRampToValueAtTime(step.endFrequency, start + step.duration);
    }

    applyEnvelope(gain, start, step.peak, step.duration);
    osc.connect(gain);
    routeToMaster(gain, volume);
    osc.start(start);
    osc.stop(start + step.duration + 0.03);
}

function playCorrect(ctx: AudioContext, volume: number): void {
    CORRECT_TONES.forEach((step) => scheduleTone(ctx, step, volume));
}

function playWrong(ctx: AudioContext, volume: number): void {
    WRONG_TONES.forEach((step) => scheduleTone(ctx, step, volume));
}

function playClick(ctx: AudioContext, volume: number): void {
    scheduleTone(
        ctx,
        {
            frequency: 980,
            endFrequency: 720,
            delay: 0,
            duration: 0.035,
            peak: 0.16,
            type: "sine",
        },
        volume,
    );
}

async function resumeContext(ctx: AudioContext): Promise<void> {
    if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
    }
}

function unlockAudio(): void {
    const ctx = getContext();
    if (!ctx) return;
    void resumeContext(ctx);
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
        window.addEventListener(eventName, unlockAudio, { passive: true });
    });
}

function shouldThrottle(type: SFXType): boolean {
    const now = performance.now();
    const last = lastPlayedAt[type] ?? 0;
    if (now - last < SFX_THROTTLE_MS[type]) return true;
    lastPlayedAt = { ...lastPlayedAt, [type]: now };
    return false;
}

export function playSFX(type: SFXType, volume = 1): void {
    const ctx = getContext();
    if (!ctx || shouldThrottle(type)) return;

    void resumeContext(ctx);

    switch (type) {
        case "correct":
            playCorrect(ctx, volume);
            break;
        case "wrong":
            playWrong(ctx, volume);
            break;
        case "click":
            playClick(ctx, volume);
            break;
    }
}
