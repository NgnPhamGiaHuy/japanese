/**
 * @file action-registry.test.ts
 * Guards the act-side seam (T-102a).
 *
 * @remarks
 * The behaviour worth testing here is not "a Map stores things" — it is the
 * degraded path. ADR-102 names the seam's new failure mode explicitly: a
 * missed registration turns a working action into a silently missing button.
 * These tests pin the two properties that make that failure survivable —
 * the lookup never throws, and the absence is always reported.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    __resetNotificationActionsForTest,
    getNotificationActions,
    hasNotificationActions,
    registerNotificationActions,
    resolveNotificationActions,
} from "./action-registry";

import type { NotificationActionContext } from "./action-registry";
import type { AppNotification } from "../types";

const ctx: NotificationActionContext = {
    idToken: "token",
    userId: "user-1",
    notification: { id: "n1", type: "invite" } as AppNotification,
};

beforeEach(() => {
    __resetNotificationActionsForTest();
});

describe("notification action registry", () => {
    it("returns the handlers a producing feature registered", async () => {
        const onDecline = vi.fn();
        registerNotificationActions("invite", { onDecline });

        expect(hasNotificationActions("invite")).toBe(true);
        await getNotificationActions("invite")?.onDecline?.(ctx);
        expect(onDecline).toHaveBeenCalledWith(ctx);
    });

    it("reports nothing when a registered kind is resolved", () => {
        const report = vi.fn();
        registerNotificationActions("invite", { onDecline: vi.fn() });

        expect(resolveNotificationActions("invite", report)).toBeDefined();
        expect(report).not.toHaveBeenCalled();
    });

    it("degrades to undefined rather than throwing when nothing is registered", () => {
        const report = vi.fn();
        // The inbox must still render — without the action, not with an error.
        expect(() => resolveNotificationActions("invite", report)).not.toThrow();
        expect(resolveNotificationActions("invite", report)).toBeUndefined();
    });

    it("reports the missing registration, naming the kind and the fix", () => {
        const report = vi.fn();
        resolveNotificationActions("invite", report);

        expect(report).toHaveBeenCalledTimes(1);
        const message = report.mock.calls[0][0] as string;
        expect(message).toContain("invite");
        expect(message).toContain("registerNotificationActions");
    });

    it("reports a missing kind once, not on every render", () => {
        const report = vi.fn();
        // The inbox re-renders freely; a per-render report would bury the
        // signal it exists to raise.
        resolveNotificationActions("invite", report);
        resolveNotificationActions("invite", report);
        resolveNotificationActions("invite", report);

        expect(report).toHaveBeenCalledTimes(1);
    });

    it("keeps kinds independent", () => {
        const report = vi.fn();
        registerNotificationActions("invite", { onDecline: vi.fn() });

        expect(resolveNotificationActions("invite", report)).toBeDefined();
        expect(resolveNotificationActions("comment", report)).toBeUndefined();
        expect(report).toHaveBeenCalledTimes(1);
    });

    it("treats re-registration as idempotent replacement", () => {
        // Fast Refresh and StrictMode re-run the composition root; that must
        // not throw or accumulate stale handlers.
        const first = vi.fn();
        const second = vi.fn();
        registerNotificationActions("invite", { onDecline: first });
        registerNotificationActions("invite", { onDecline: second });

        void getNotificationActions("invite")?.onDecline?.(ctx);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
    });

    it("lets a kind register no handlers without being treated as unhandled", () => {
        // Kinds needing only the inbox's own behaviour are legitimately empty.
        const report = vi.fn();
        registerNotificationActions("comment_resolved", {});

        expect(resolveNotificationActions("comment_resolved", report)).toEqual({});
        expect(report).not.toHaveBeenCalled();
    });
});
