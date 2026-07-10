"use client";

/**
 * Deterministic audio cues.
 *
 * @remarks
 * Gameplay code used to schedule sound with three uncoordinated clocks: a global debounce timer,
 * ad-hoc `setTimeout`s per feature, and the game engines' own advance timers. None of them knew
 * how long a sound actually lasted, so:
 *
 * - Every pronunciation delay (220/250/300ms) landed *inside* the `correct` cue's ~540ms tail,
 *   even though three separate comments claimed the SFX was heard first.
 * - Two matched pairs less than 300ms apart stacked raw timers, and each new pronunciation cut
 *   the previous one off mid-word.
 *
 * A sequence is a list of steps run in order against a named key. The key owns an interruption
 * policy, so a second sequence on the same key either replaces, queues behind, or is ignored by
 * the first — instead of every caller racing through the same global timer slot.
 */
import { playSfx, registerAudioStopHook, speak } from "./manager";
import { SFX_TAIL_MS } from "./sfx.presets";
import { emitAudioEvent } from "./telemetry";

import type { SfxCue, SpeakOptions } from "./types";

/**
 * How far a pronunciation may overlap the decaying tail of the cue before it.
 *
 * @remarks
 * Waiting for the full tail feels sluggish; the last 150ms of the envelope is already near
 * silence, so starting there reads as "cue, then voice" while keeping the pacing tight.
 */
const TAIL_OVERLAP_MS = 150;

/** Beyond this, queued cues are stale — the learner has moved on. */
const DEFAULT_QUEUE_DEPTH = 2;

export type SequenceStep =
    /** Fire a UI cue. Never queues, never blocks. */
    | { sfx: SfxCue }
    /** Wait out the named cue's envelope (minus a small overlap) before continuing. */
    | { waitForTail: SfxCue }
    | { waitMs: number }
    /** Speak, and wait for playback to finish before the next step. */
    | { speak: { text: string; options: SpeakOptions } }
    | { call: () => void };

export type SequencePolicy =
    /** Cancel whatever is running on this key and start immediately. */
    | "replace"
    /** Run after the current sequence finishes, up to `queueDepth` deep. */
    | "queue"
    /** Do nothing if this key is already busy. */
    | "ignore-if-busy";

export interface SequenceOptions {
    policy?: SequencePolicy;
    queueDepth?: number;
}

export type SequenceStatus = "completed" | "cancelled" | "ignored";

interface RunningSequence {
    cancelled: boolean;
    /** Rejects the in-flight `waitMs`, so cancellation is immediate rather than after the delay. */
    clearTimer: (() => void) | null;
}

interface QueuedSequence {
    steps: SequenceStep[];
    resolve: (status: SequenceStatus) => void;
}

const running = new Map<string, RunningSequence>();
const queues = new Map<string, QueuedSequence[]>();

function tailDelayMs(cue: SfxCue): number {
    return Math.max(0, SFX_TAIL_MS[cue] - TAIL_OVERLAP_MS);
}

function delay(ms: number, sequence: RunningSequence): Promise<void> {
    if (ms <= 0) return Promise.resolve();

    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            sequence.clearTimer = null;
            resolve();
        }, ms);

        sequence.clearTimer = () => {
            clearTimeout(timer);
            resolve();
        };
    });
}

async function runSteps(steps: SequenceStep[], sequence: RunningSequence): Promise<SequenceStatus> {
    for (const step of steps) {
        if (sequence.cancelled) return "cancelled";

        if ("sfx" in step) {
            playSfx(step.sfx);
        } else if ("waitForTail" in step) {
            await delay(tailDelayMs(step.waitForTail), sequence);
        } else if ("waitMs" in step) {
            await delay(step.waitMs, sequence);
        } else if ("speak" in step) {
            const handle = speak(step.speak.text, step.speak.options);
            await handle.done;
        } else if ("call" in step) {
            step.call();
        }
    }

    return sequence.cancelled ? "cancelled" : "completed";
}

function cancel(sequence: RunningSequence): void {
    sequence.cancelled = true;
    sequence.clearTimer?.();
}

async function drain(key: string): Promise<void> {
    const queue = queues.get(key);
    const next = queue?.shift();
    if (!next) {
        running.delete(key);
        return;
    }

    const sequence: RunningSequence = { cancelled: false, clearTimer: null };
    running.set(key, sequence);

    const status = await runSteps(next.steps, sequence);
    next.resolve(status);

    if (running.get(key) === sequence) await drain(key);
}

/**
 * Runs `steps` in order under `key`.
 *
 * @returns The sequence's terminal status. `"ignored"` means the key was busy under an
 *   `ignore-if-busy` policy — a fast typist completing words back-to-back gets the cue every time
 *   and the pronunciation only when there is room for it.
 */
export function sequence(
    key: string,
    steps: SequenceStep[],
    options: SequenceOptions = {},
): Promise<SequenceStatus> {
    const { policy = "replace", queueDepth = DEFAULT_QUEUE_DEPTH } = options;
    const current = running.get(key);

    if (current && policy === "ignore-if-busy") {
        return Promise.resolve("ignored");
    }

    if (current && policy === "queue") {
        const queue = queues.get(key) ?? [];
        if (queue.length >= queueDepth) {
            // The learner is further ahead than the audio. Drop the oldest rather than fall behind.
            const dropped = queue.shift();
            dropped?.resolve("cancelled");
            emitAudioEvent({ type: "suppressed", source: key, reason: "queue-overflow" });
        }
        return new Promise<SequenceStatus>((resolve) => {
            queue.push({ steps, resolve });
            queues.set(key, queue);
        });
    }

    if (current) cancel(current);

    const self: RunningSequence = { cancelled: false, clearTimer: null };
    running.set(key, self);

    return runSteps(steps, self).then(async (status) => {
        if (running.get(key) === self) await drain(key);
        return status;
    });
}

/** Aborts every sequence. Registered as a stop hook, so navigation and unload reach it. */
export function abortAllSequences(): void {
    running.forEach(cancel);
    running.clear();
    queues.forEach((queue) => queue.forEach((item) => item.resolve("cancelled")));
    queues.clear();
}

registerAudioStopHook(() => abortAllSequences());
