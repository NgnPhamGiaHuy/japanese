import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configureAudio, resetAudioManager, stopAllAudio } from "./manager";
import { abortAllSequences, sequence } from "./sequencer";
import { SFX_TAIL_MS } from "./sfx.presets";
import { resetAudioTelemetry } from "./telemetry";
import { DEFAULT_AUDIO_SETTINGS } from "./types";

/**
 * `speak` reaches the transport, which is inert under Node (no `window`), so every pronunciation
 * resolves immediately. To exercise the ordering and interruption rules we need a step whose
 * duration we control — `waitMs` plus fake timers gives us that.
 */
const flush = () => vi.advanceTimersByTimeAsync(0);

describe("audio sequencer", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetAudioManager();
        abortAllSequences();
        resetAudioTelemetry();
        configureAudio({ getSettings: () => DEFAULT_AUDIO_SETTINGS });
    });

    afterEach(() => {
        abortAllSequences();
        vi.useRealTimers();
    });

    it("runs steps in order", async () => {
        const seen: string[] = [];

        const done = sequence("k", [
            { call: () => seen.push("a") },
            { waitMs: 100 },
            { call: () => seen.push("b") },
        ]);

        await flush();
        expect(seen).toEqual(["a"]);

        await vi.advanceTimersByTimeAsync(100);
        expect(await done).toBe("completed");
        expect(seen).toEqual(["a", "b"]);
    });

    /**
     * The defect this fixes: every pronunciation delay used to be shorter than the cue it was
     * supposed to follow, so voice and tone overlapped in every single game mode.
     */
    it("waits out a cue's tail before continuing", async () => {
        const seen: string[] = [];
        const done = sequence("k", [
            { waitForTail: "correct" },
            { call: () => seen.push("spoke") },
        ]);

        await vi.advanceTimersByTimeAsync(SFX_TAIL_MS.correct - 200);
        expect(seen).toEqual([]);

        await vi.advanceTimersByTimeAsync(200);
        await done;
        expect(seen).toEqual(["spoke"]);
    });

    describe("replace policy", () => {
        it("cancels the running sequence and skips its remaining steps", async () => {
            const seen: string[] = [];

            const first = sequence("k", [{ waitMs: 500 }, { call: () => seen.push("first") }]);
            await flush();

            const second = sequence("k", [{ call: () => seen.push("second") }]);

            expect(await first).toBe("cancelled");
            expect(await second).toBe("completed");

            await vi.advanceTimersByTimeAsync(1000);
            expect(seen).toEqual(["second"]);
        });
    });

    describe("queue policy", () => {
        it("runs queued sequences one after another instead of cutting them off", async () => {
            const seen: string[] = [];
            const opts = { policy: "queue" as const };

            const first = sequence("k", [{ waitMs: 100 }, { call: () => seen.push("1") }], opts);
            const second = sequence("k", [{ waitMs: 100 }, { call: () => seen.push("2") }], opts);

            await vi.advanceTimersByTimeAsync(100);
            expect(seen).toEqual(["1"]);

            await vi.advanceTimersByTimeAsync(100);
            expect(await first).toBe("completed");
            expect(await second).toBe("completed");
            expect(seen).toEqual(["1", "2"]);
        });

        it("drops the oldest waiter once the queue is full", async () => {
            const seen: string[] = [];
            const opts = { policy: "queue" as const, queueDepth: 1 };

            void sequence("k", [{ waitMs: 100 }, { call: () => seen.push("running") }], opts);
            const queued = sequence("k", [{ call: () => seen.push("queued") }], opts);
            const newest = sequence("k", [{ call: () => seen.push("newest") }], opts);

            expect(await queued).toBe("cancelled");

            await vi.advanceTimersByTimeAsync(200);
            expect(await newest).toBe("completed");
            expect(seen).toEqual(["running", "newest"]);
        });
    });

    describe("ignore-if-busy policy", () => {
        it("drops the new sequence rather than interrupting the running one", async () => {
            const seen: string[] = [];
            const opts = { policy: "ignore-if-busy" as const };

            const first = sequence(
                "k",
                [{ waitMs: 100 }, { call: () => seen.push("first") }],
                opts,
            );
            await flush();

            const second = sequence("k", [{ call: () => seen.push("second") }], opts);
            expect(await second).toBe("ignored");

            await vi.advanceTimersByTimeAsync(100);
            expect(await first).toBe("completed");
            expect(seen).toEqual(["first"]);
        });
    });

    it("keeps different keys independent", async () => {
        const seen: string[] = [];

        const a = sequence("a", [{ waitMs: 50 }, { call: () => seen.push("a") }]);
        const b = sequence("b", [{ waitMs: 50 }, { call: () => seen.push("b") }]);

        await vi.advanceTimersByTimeAsync(50);
        expect(await a).toBe("completed");
        expect(await b).toBe("completed");
        expect(seen.sort()).toEqual(["a", "b"]);
    });

    /** Navigation and tab-hide must not leave a pronunciation to fire on the next screen. */
    it("aborts every sequence when audio is stopped", async () => {
        const seen: string[] = [];

        const running = sequence("k", [{ waitMs: 500 }, { call: () => seen.push("late") }]);
        await flush();

        stopAllAudio("navigation");

        expect(await running).toBe("cancelled");
        await vi.advanceTimersByTimeAsync(1000);
        expect(seen).toEqual([]);
    });
});
