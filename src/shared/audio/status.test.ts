import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `status.ts` subscribes to the telemetry bus at module scope, so each test needs a fresh module
 * graph — otherwise `resetAudioTelemetry` would tear down the subscription for every later test.
 */
async function importStatusModule() {
    vi.resetModules();
    const telemetry = await import("./telemetry");
    const status = await import("./status");
    return { ...telemetry, ...status };
}

describe("audio status", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("starts healthy", async () => {
        const { getAudioStatus } = await importStatusModule();
        expect(getAudioStatus()).toBe("ok");
    });

    it("degrades on the first failure, then reports unavailable", async () => {
        const { emitAudioEvent, getAudioStatus } = await importStatusModule();

        emitAudioEvent({ type: "failure", reason: "speech-unavailable" });
        expect(getAudioStatus()).toBe("degraded");

        emitAudioEvent({ type: "failure", reason: "speech-unavailable" });
        expect(getAudioStatus()).toBe("unavailable");
    });

    it("recovers as soon as any tier plays successfully", async () => {
        const { emitAudioEvent, getAudioStatus } = await importStatusModule();

        emitAudioEvent({ type: "failure", reason: "media-error" });
        emitAudioEvent({ type: "failure", reason: "media-error" });
        expect(getAudioStatus()).toBe("unavailable");

        emitAudioEvent({ type: "tier_result", tier: "speech", ok: true });
        expect(getAudioStatus()).toBe("ok");
    });

    it("does not count a suppressed request as a failure", async () => {
        const { emitAudioEvent, getAudioStatus } = await importStatusModule();

        emitAudioEvent({ type: "suppressed", source: "speed", reason: "autoplay-disabled" });
        emitAudioEvent({ type: "suppressed", source: "speed", reason: "voice-muted" });

        expect(getAudioStatus()).toBe("ok");
    });

    it("notifies subscribers only when the status actually changes", async () => {
        const { emitAudioEvent, subscribeAudioStatus } = await importStatusModule();
        const listener = vi.fn();
        subscribeAudioStatus(listener);

        emitAudioEvent({ type: "failure", reason: "a" }); // ok → degraded
        emitAudioEvent({ type: "failure", reason: "b" }); // degraded → unavailable
        emitAudioEvent({ type: "failure", reason: "c" }); // stays unavailable

        expect(listener).toHaveBeenCalledTimes(2);
    });
});
