/**
 * Deterministic UI/game sound-effect presets.
 *
 * Sound rules:
 * - A named cue always maps to the same preset.
 * - Presets do not use randomness, so tone is stable across sessions.
 * - SFX is short feedback only; pronunciation audio is handled by the voice transport.
 */

import type { SfxCue } from "./types";

type ToneStep = {
    frequency: number;
    endFrequency?: number;
    delay: number;
    duration: number;
    peak: number;
    type?: OscillatorType;
};

const CORRECT_TONES: ToneStep[] = [
    { frequency: 523.25, endFrequency: 516, delay: 0, duration: 0.34, peak: 0.34 },
    { frequency: 659.25, endFrequency: 652, delay: 0.09, duration: 0.42, peak: 0.31 },
    { frequency: 1046.5, delay: 0.09, duration: 0.16, peak: 0.07 },
];

const WRONG_TONES: ToneStep[] = [
    { frequency: 293.66, endFrequency: 230, delay: 0, duration: 0.36, peak: 0.34, type: "sine" },
    { frequency: 246.94, endFrequency: 196, delay: 0.02, duration: 0.32, peak: 0.22, type: "sine" },
];

const CLICK_TONES: ToneStep[] = [
    { frequency: 980, endFrequency: 720, delay: 0, duration: 0.035, peak: 0.16, type: "sine" },
];

const CUE_TONES: Record<SfxCue, ToneStep[]> = {
    correct: CORRECT_TONES,
    wrong: WRONG_TONES,
    click: CLICK_TONES,
};

/**
 * Minimum gap between two plays of the same cue.
 *
 * @remarks
 * `click` is raised above its original 24ms because Survival's Drop mode fires it on every
 * matching keystroke: at 24ms a 40wpm typist hears roughly 200 clicks a minute.
 */
export const SFX_THROTTLE_MS: Record<SfxCue, number> = {
    click: 45,
    correct: 90,
    wrong: 110,
};

/**
 * How long each cue rings, in milliseconds.
 *
 * @remarks
 * Derived from the preset envelopes: `max(delay + duration)` plus the 30ms oscillator stop pad.
 * The audio sequencer uses this to start pronunciation *after* the cue has decayed, rather than
 * guessing with a hard-coded delay.
 */
export const SFX_TAIL_MS: Record<SfxCue, number> = {
    correct: 540,
    wrong: 390,
    click: 65,
};

function applyEnvelope(gain: GainNode, start: number, peak: number, duration: number): void {
    const attack = Math.min(0.006, duration * 0.25);
    gain.gain.cancelScheduledValues(start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
}

function scheduleTone(ctx: AudioContext, destination: AudioNode, step: ToneStep): void {
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
    gain.connect(destination);

    // Release the graph explicitly once the tone has rung out. A `correct` cue allocates three
    // oscillators and three gain nodes, and Survival's Drop mode can fire it several times a
    // second; leaving them connected to the channel bus relies entirely on the engine noticing
    // they are finished.
    osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
    };

    osc.start(start);
    osc.stop(start + step.duration + 0.03);
}

/** Schedules every tone of a cue against the given channel input. */
export function scheduleCue(ctx: AudioContext, destination: AudioNode, cue: SfxCue): void {
    CUE_TONES[cue].forEach((step) => scheduleTone(ctx, destination, step));
}
