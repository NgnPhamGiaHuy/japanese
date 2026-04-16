"use client";

/**
 * 🎧 Duolingo-Inspired SFX Engine
 *
 * ✅ correct  — Warm two-tone upward "ding-dong" with harmonic shimmer + reverb tail
 * ❌ wrong    — Low punchy dual-note descending "bwong" + bandpassed noise thud
 * 👆 click    — Crisp, gentle sine-click (UI tap feel)
 *
 * Signal chain:
 *   synth nodes → dryGain → masterGain → compressor → destination
 *                         ↘ convolver → wetGain ↗
 */

type SFXType = "correct" | "wrong" | "click";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let impulseBuffer: AudioBuffer | null = null;

// ─────────────────────────────────────────────
// 🔊 AUDIO ENGINE BOOTSTRAP
// ─────────────────────────────────────────────

function getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Master gain: comfortable listening level, not clipping
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.72;

        // Transparent compressor — subtle glue, not heavy limiting
        compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, audioCtx.currentTime);
        compressor.knee.setValueAtTime(8, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(3, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0.005, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.15, audioCtx.currentTime);

        masterGain.connect(compressor);
        compressor.connect(audioCtx.destination);

        impulseBuffer = buildImpulse(audioCtx, 0.9, 2.2);
    }

    if (audioCtx.state === "suspended") {
        void audioCtx.resume();
    }

    return audioCtx;
}

/** Unlock audio context on first user gesture */
if (typeof window !== "undefined") {
    const unlock = () => {
        const ctx = getContext();
        if (ctx) {
            void ctx.resume().then(() => {
                window.removeEventListener("mousedown", unlock);
                window.removeEventListener("touchstart", unlock);
                window.removeEventListener("keydown", unlock);
            });
        }
    };
    window.addEventListener("mousedown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
}

// ─────────────────────────────────────────────
// 🔧 DSP UTILITIES
// ─────────────────────────────────────────────

/**
 * Route a node into the master bus (optionally through a gain scalar).
 */
function toMaster(node: AudioNode, gainValue = 1.0): void {
    if (!masterGain || !audioCtx) return;
    if (gainValue === 1.0) {
        node.connect(masterGain);
    } else {
        const g = audioCtx.createGain();
        g.gain.value = gainValue;
        node.connect(g);
        g.connect(masterGain);
    }
}

/**
 * Apply a fast attack → exponential decay envelope to a GainNode.
 */
function applyEnvelope(
    gain: GainNode,
    now: number,
    peak: number,
    attackSec = 0.008,
    decaySec = 1.0,
): void {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + attackSec);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attackSec + decaySec);
}

/**
 * Build a smooth exponential-decay reverb impulse response.
 * @param decay  total length in seconds
 * @param amount density (higher = more diffuse reflections)
 */
function buildImpulse(ctx: AudioContext, decay = 1.2, amount = 2.0): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * decay);
    const buf = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            const t = i / length;
            // Randomised noise shaped by a power-law decay curve
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, amount);
        }
    }

    return buf;
}

/**
 * Attach a convolution reverb to an existing source node.
 * Returns the wet output GainNode (already connected to master).
 */
function addReverb(ctx: AudioContext, source: AudioNode, wetLevel: number): void {
    if (!impulseBuffer) return;
    const conv = ctx.createConvolver();
    conv.buffer = impulseBuffer;
    source.connect(conv);
    toMaster(conv, wetLevel);
}

// ─────────────────────────────────────────────
// ✅ CORRECT — Duolingo "ding-dong" upward chord
// ─────────────────────────────────────────────
/**
 * Two-tone ascending chord that mimics Duolingo's success chime:
 *   - First note  : C5 (523 Hz) — warm sine + 2nd harmonic shimmer
 *   - Second note  : E5 (659 Hz) — slightly delayed, brighter
 *   - Shared reverb tail for perceived space
 *
 * Together they play as an upward major-third "ding ↑ dong".
 */
function synthCorrect(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // ── Note layout (Duolingo-style ascending two-tone) ──────────────────
    const notes: Array<{ freq: number; delay: number; peak: number; decay: number }> = [
        { freq: 523.25, delay: 0.0, peak: 0.55, decay: 0.55 }, // C5 — first chime
        { freq: 659.25, delay: 0.1, peak: 0.5, decay: 0.7 }, // E5 — second chime (delayed)
    ];

    // Shared bus so both notes feed the same reverb
    const dryBus = ctx.createGain();
    dryBus.gain.value = 1;

    notes.forEach(({ freq, delay, peak, decay }) => {
        const t = now + delay;

        // Fundamental sine — warm body
        const fundamental = ctx.createOscillator();
        fundamental.type = "sine";
        fundamental.frequency.setValueAtTime(freq, t);
        // Very slight natural pitch drift (like a struck bell slowing down)
        fundamental.frequency.exponentialRampToValueAtTime(freq * 0.985, t + decay);

        const fundGain = ctx.createGain();
        applyEnvelope(fundGain, t, peak, 0.006, decay);

        fundamental.connect(fundGain);
        fundGain.connect(dryBus);
        fundamental.start(t);
        fundamental.stop(t + decay + 0.05);

        // 2nd harmonic (octave) — adds shimmer/brightness without being harsh
        const harmonic = ctx.createOscillator();
        harmonic.type = "sine";
        harmonic.frequency.setValueAtTime(freq * 2, t);
        harmonic.frequency.exponentialRampToValueAtTime(freq * 2 * 0.99, t + decay * 0.7);

        const harmGain = ctx.createGain();
        // Harmonic is quieter and decays faster — realistic bell physics
        applyEnvelope(harmGain, t, peak * 0.18, 0.005, decay * 0.5);

        harmonic.connect(harmGain);
        harmGain.connect(dryBus);
        harmonic.start(t);
        harmonic.stop(t + decay * 0.55 + 0.05);

        // Subtle transient "click" at the moment of strike for presence
        const ding = ctx.createOscillator();
        ding.type = "triangle";
        ding.frequency.setValueAtTime(freq * 3.5, t);

        const dingGain = ctx.createGain();
        applyEnvelope(dingGain, t, peak * 0.12, 0.003, 0.04);

        ding.connect(dingGain);
        dingGain.connect(dryBus);
        ding.start(t);
        ding.stop(t + 0.05);
    });

    // Dry path → master
    toMaster(dryBus);

    // Reverb: subtle room — not a cave, just presence
    addReverb(ctx, dryBus, 0.18);
}

// ─────────────────────────────────────────────
// ❌ WRONG — Duolingo "bwong" descending thud
// ─────────────────────────────────────────────
/**
 * Duolingo wrong sound characteristics:
 *   - Two low-pitched tones a small interval apart (discord/dissonance)
 *   - Fast attack, medium decay (~0.5s)
 *   - Soft bandpassed noise transient for a tactile "thud" feel
 *   - NO harsh buzzing — it should feel gentle but clearly negative
 */
function synthWrong(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // Two slightly discordant tones for a muffled "bwong" feel
    const tones = [
        { freq: 290, peak: 0.5, decay: 0.45 }, // root
        { freq: 240, peak: 0.38, decay: 0.35 }, // minor-second below — creates mild dissonance
    ];

    tones.forEach(({ freq, peak, decay }) => {
        const osc = ctx.createOscillator();
        // Sine gives warmth; triangle is too buzzy for a sad sound
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        // Descending pitch drift — characteristic of a "wrong" feedback
        osc.frequency.exponentialRampToValueAtTime(freq * 0.82, now + decay);

        const gain = ctx.createGain();
        applyEnvelope(gain, now, peak, 0.008, decay);

        osc.connect(gain);
        toMaster(gain);
        osc.start(now);
        osc.stop(now + decay + 0.05);
    });

    // Bandpassed noise for a muffled "thud" transient (not raw hiss)
    const bufLen = Math.floor(ctx.sampleRate * 0.15);
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    // Bandpass: center ~200 Hz, Q=3 → punchy body, no sibilance
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 200;
    bpf.Q.value = 3;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    noiseSource.connect(bpf);
    bpf.connect(noiseGain);
    toMaster(noiseGain);
    noiseSource.start(now);
}

// ─────────────────────────────────────────────
// 👆 CLICK — Crisp tactile UI tap
// ─────────────────────────────────────────────
/**
 * Short sine-burst at ~1000 Hz — feels like a physical button tap.
 * Much gentler than the old 3500 Hz triangle which sounded like a bug chirp.
 */
function synthClick(ctx: AudioContext): void {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1050, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.018);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    toMaster(gain);
    osc.start(now);
    osc.stop(now + 0.03);
}

// ─────────────────────────────────────────────
// 🎮 PUBLIC API
// ─────────────────────────────────────────────

export function playSFX(type: SFXType, volume = 1): void {
    const ctx = getContext();
    if (!ctx || !masterGain) return;

    // Clamp volume to a safe ceiling — avoid accidental clipping
    masterGain.gain.value = Math.min(volume * 0.72, 1.0);

    switch (type) {
        case "correct":
            synthCorrect(ctx);
            break;
        case "wrong":
            synthWrong(ctx);
            break;
        case "click":
            synthClick(ctx);
            break;
    }
}
