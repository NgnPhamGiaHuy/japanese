"use client";

/**
 * Owns the single AudioContext and the per-channel gain nodes.
 *
 * @remarks
 * Only the `sfx` channel is a real gain node today: pronunciation plays through an
 * HTMLAudioElement or `speechSynthesis`, whose volume the manager sets directly on the transport.
 * When the voice pipeline moves to decoded buffers, a `voice` gain node joins the same master bus
 * and that asymmetry disappears.
 *
 * Gesture unlocking lives in `unlock.ts`, not here — the context is one of two things that need
 * unlocking, and they share one listener set.
 */
type AudioContextConstructor = typeof AudioContext;
type WindowWithWebkitAudio = Window &
    typeof globalThis & {
        webkitAudioContext?: AudioContextConstructor;
    };

const MASTER_VOLUME = 0.66;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let sfxGain: GainNode | null = null;

function getAudioContextConstructor(): AudioContextConstructor | undefined {
    if (typeof window === "undefined") return undefined;
    const soundWindow = window as WindowWithWebkitAudio;
    return soundWindow.AudioContext ?? soundWindow.webkitAudioContext;
}

/** Lazily constructs the context graph: channel gains → master → compressor → destination. */
export function getContext(): AudioContext | null {
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

        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = 1;

        sfxGain.connect(masterGain);
        masterGain.connect(compressor);
        compressor.connect(audioCtx.destination);
    }

    return audioCtx;
}

/** The node SFX sources connect into. Null until the context exists. */
export function getSfxInput(): GainNode | null {
    getContext();
    return sfxGain;
}

export function setSfxGain(value: number): void {
    if (!sfxGain) return;
    sfxGain.gain.value = Math.min(Math.max(value, 0), 1);
}

export async function resumeContext(ctx: AudioContext): Promise<void> {
    if (ctx.state === "suspended") {
        await ctx.resume().catch(() => undefined);
    }
}

// ── Idle suspension ──────────────────────────────────────────────────────────

/** How long the context may sit silent before it stops holding the audio hardware open. */
const IDLE_SUSPEND_MS = 30_000;

let idleTimer: ReturnType<typeof setTimeout> | null = null;

function clearIdleTimer(): void {
    if (idleTimer === null) return;
    clearTimeout(idleTimer);
    idleTimer = null;
}

/**
 * Suspends the context immediately.
 *
 * @remarks
 * Called when the tab is hidden and after a stretch of silence. The context used to enter
 * `running` on the first click anywhere in the app — including the login screen — and stay there
 * for the rest of the session, holding a render thread and, on iOS, the audio session.
 */
export function suspendAudioContext(): void {
    clearIdleTimer();
    if (audioCtx && audioCtx.state === "running") {
        void audioCtx.suspend().catch(() => undefined);
    }
}

/** Restarts the idle countdown. */
function noteAudioActivity(): void {
    if (typeof window === "undefined") return;
    clearIdleTimer();
    idleTimer = setTimeout(suspendAudioContext, IDLE_SUSPEND_MS);
}

/**
 * Runs `schedule` against a context that is guaranteed to be running.
 *
 * @remarks
 * Scheduling against a suspended context would peg every tone to a frozen `currentTime`, so the
 * first sound after an idle period would clip. Resuming is asynchronous, hence the callback.
 */
export function scheduleWhenRunning(ctx: AudioContext, schedule: () => void): void {
    noteAudioActivity();

    if (ctx.state === "running") {
        schedule();
        return;
    }

    void resumeContext(ctx).then(() => {
        if (ctx.state === "running") schedule();
    });
}
