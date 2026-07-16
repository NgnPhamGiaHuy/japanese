import { describe, expect, it } from "vitest";

import { lessonMetadataSchema, privacyModeSchema, shareInviteSchema } from "./lesson.schema";

describe("lessonMetadataSchema", () => {
    it("accepts a fully-populated valid lesson", () => {
        const result = lessonMetadataSchema.safeParse({
            title: "Lesson 9 Vocabulary: Daily Schedule & Time",
            description: "Master the core vocabulary from Irodori A1 Lesson 9",
            categories: ["vocabulary"],
            type: "vocal",
            themeColor: "#1cb0f6",
        });
        expect(result.success).toBe(true);
    });

    it("accepts the minimal required shape, defaulting description", () => {
        const result = lessonMetadataSchema.safeParse({ title: "New Deck" });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.description).toBe("");
    });

    it("rejects an empty title", () => {
        expect(lessonMetadataSchema.safeParse({ title: "" }).success).toBe(false);
    });

    it("rejects a title that is only whitespace", () => {
        expect(lessonMetadataSchema.safeParse({ title: "   " }).success).toBe(false);
    });

    it("rejects a malformed themeColor", () => {
        expect(lessonMetadataSchema.safeParse({ title: "x", themeColor: "blue" }).success).toBe(
            false,
        );
        expect(lessonMetadataSchema.safeParse({ title: "x", themeColor: "#fff" }).success).toBe(
            false,
        );
    });

    it("accepts a valid 6-digit hex themeColor", () => {
        expect(lessonMetadataSchema.safeParse({ title: "x", themeColor: "#1CB0F6" }).success).toBe(
            true,
        );
    });
});

describe("privacyModeSchema", () => {
    it("accepts the three known modes", () => {
        for (const mode of ["restricted", "link", "public"]) {
            expect(privacyModeSchema.safeParse(mode).success).toBe(true);
        }
    });

    it("rejects an unknown mode", () => {
        expect(privacyModeSchema.safeParse("everyone").success).toBe(false);
    });
});

describe("shareInviteSchema", () => {
    it("accepts a valid invite and lowercases the email", () => {
        const result = shareInviteSchema.safeParse({ email: "User@Example.com", role: "viewer" });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.email).toBe("user@example.com");
    });

    it("rejects an invalid email", () => {
        expect(shareInviteSchema.safeParse({ email: "not-an-email", role: "viewer" }).success).toBe(
            false,
        );
    });

    it("rejects an unknown role", () => {
        expect(
            shareInviteSchema.safeParse({ email: "user@example.com", role: "superadmin" }).success,
        ).toBe(false);
    });
});
