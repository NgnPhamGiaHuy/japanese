/**
 * @file rbac.test.ts
 * Unit tests for the sharing-RBAC engine (T-117b).
 *
 * @remarks
 * `resolveRole` is the single source of truth for every permission decision
 * in the sharing feature (per rbac.ts's own docblock). These tests assert
 * against resolveRole's actual documented semantics — the 5-step priority
 * order in particular — not against shared.service.ts's separately-drifted
 * inline copy of this same access-check concept (OP-5). A test suite built
 * against the wrong copy would certify the divergent behavior instead of
 * catching it.
 */
import { describe, expect, it } from "vitest";

import { canComment, canEdit, canView, resolveRole, sanitizePublicRole } from "./rbac";

describe("resolveRole — owner resolution (step 1)", () => {
    it("resolves owner when the caller's UID matches ownerId", () => {
        expect(resolveRole({ lesson: { ownerId: "u1" }, userId: "u1" })).toBe("owner");
    });

    it("does not resolve owner via the legacy userId field — ownerId is the only source of truth (LDG-22, 2026-08-04)", () => {
        const lesson = { userId: "u1" };
        expect(resolveRole({ lesson, userId: "u1" })).toBe("none");
    });

    it("does not resolve owner for an anonymous caller (no userId)", () => {
        expect(resolveRole({ lesson: { ownerId: "u1" }, userId: null })).toBe("none");
    });

    it("owner status wins even if the same UID also has a conflicting explicit role entry", () => {
        const lesson = { ownerId: "u1", roles: { u1: "viewer" as const } };
        expect(resolveRole({ lesson, userId: "u1" })).toBe("owner");
    });
});

describe("resolveRole — explicit UID-based role (step 2)", () => {
    it("resolves each explicitly-assigned role for the calling UID", () => {
        expect(resolveRole({ lesson: { roles: { u1: "editor" } }, userId: "u1" })).toBe("editor");
        expect(resolveRole({ lesson: { roles: { u1: "commenter" } }, userId: "u1" })).toBe(
            "commenter",
        );
        expect(resolveRole({ lesson: { roles: { u1: "viewer" } }, userId: "u1" })).toBe("viewer");
    });

    it("only resolves the calling user's own entry, never another collaborator's", () => {
        const lesson = { roles: { u1: "editor" as const, u2: "viewer" as const } };
        expect(resolveRole({ lesson, userId: "u2" })).toBe("viewer");
    });

    it("takes priority over public link access", () => {
        const lesson = {
            roles: { u1: "viewer" as const },
            allowLinkAccess: true,
            publicRole: "commenter" as const,
        };
        expect(resolveRole({ lesson, userId: "u1" })).toBe("viewer");
    });
});

describe("resolveRole — pending email invite (step 3)", () => {
    it("resolves a pending invite by email when the caller has no explicit UID-based role yet", () => {
        const lesson = {
            invitedEmails: { "friend@example.com": { role: "commenter" as const, invitedAt: 0 } },
        };
        expect(resolveRole({ lesson, userId: "u1", userEmail: "friend@example.com" })).toBe(
            "commenter",
        );
    });

    it("normalizes case and surrounding whitespace before lookup", () => {
        const lesson = {
            invitedEmails: { "friend@example.com": { role: "viewer" as const, invitedAt: 0 } },
        };
        expect(resolveRole({ lesson, userEmail: "  Friend@Example.COM  " })).toBe("viewer");
    });

    it("an email invite MAY carry 'editor' — unlike public link access, an explicit invite is not capped", () => {
        const lesson = {
            invitedEmails: { "friend@example.com": { role: "editor" as const, invitedAt: 0 } },
        };
        expect(resolveRole({ lesson, userEmail: "friend@example.com" })).toBe("editor");
    });

    it("an explicit UID-based role takes priority over a stale pending invite for the same person", () => {
        const lesson = {
            roles: { u1: "viewer" as const },
            invitedEmails: { "friend@example.com": { role: "editor" as const, invitedAt: 0 } },
        };
        expect(resolveRole({ lesson, userId: "u1", userEmail: "friend@example.com" })).toBe(
            "viewer",
        );
    });

    it("does not match when no invite exists for the caller's email", () => {
        const lesson = {
            invitedEmails: { "friend@example.com": { role: "editor" as const, invitedAt: 0 } },
        };
        expect(resolveRole({ lesson, userEmail: "someone-else@example.com" })).toBe("none");
    });
});

describe("resolveRole — public link access (step 4)", () => {
    it("grants 'viewer' when allowLinkAccess is set with no explicit publicRole", () => {
        expect(resolveRole({ lesson: { allowLinkAccess: true } })).toBe("viewer");
    });

    it("grants 'commenter' when publicRole is explicitly 'commenter'", () => {
        expect(resolveRole({ lesson: { allowLinkAccess: true, publicRole: "commenter" } })).toBe(
            "commenter",
        );
    });

    it("isPublic alone (without allowLinkAccess) also grants public access", () => {
        expect(resolveRole({ lesson: { isPublic: true, publicRole: "commenter" } })).toBe(
            "commenter",
        );
    });

    it("caps public access at 'commenter' even if legacy data has publicRole 'editor'", () => {
        // Guards the exact bug class named in rbac.ts's own docblock: "editor"
        // can never be granted via public link, even from corrupted/legacy
        // Firestore documents predating the type-level cap.
        const lesson = { allowLinkAccess: true, publicRole: "editor" as unknown as "commenter" };
        expect(resolveRole({ lesson })).toBe("viewer");
        expect(resolveRole({ lesson })).not.toBe("editor");
    });
});

describe("resolveRole — deny by default (step 5)", () => {
    it("returns 'none' for an unknown user on a private resource", () => {
        const lesson = { ownerId: "owner-uid" };
        expect(resolveRole({ lesson, userId: "stranger" })).toBe("none");
    });

    it("returns 'none' for a fully anonymous caller (no userId, no userEmail) on a private lesson", () => {
        const lesson = { ownerId: "owner-uid" };
        expect(resolveRole({ lesson })).toBe("none");
    });

    it("returns 'none' when the lesson has no access fields set at all", () => {
        expect(resolveRole({ lesson: {}, userId: "anyone" })).toBe("none");
    });
});

describe("resolveRole — priority cascade (discrimination)", () => {
    // Regression guard: if the five branches were ever reordered, these would
    // fail even though every individual branch still "works" in isolation.
    it("owner wins even when explicit role, invite, and public link would all also match", () => {
        const lesson = {
            ownerId: "u1",
            roles: { u1: "viewer" as const },
            invitedEmails: { "u1@example.com": { role: "commenter" as const, invitedAt: 0 } },
            allowLinkAccess: true,
            publicRole: "commenter" as const,
        };
        expect(resolveRole({ lesson, userId: "u1", userEmail: "u1@example.com" })).toBe("owner");
    });

    it("explicit role wins over invite and public link when the caller is not the owner", () => {
        const lesson = {
            ownerId: "someone-else",
            roles: { u2: "editor" as const },
            invitedEmails: { "u2@example.com": { role: "viewer" as const, invitedAt: 0 } },
            allowLinkAccess: true,
        };
        expect(resolveRole({ lesson, userId: "u2", userEmail: "u2@example.com" })).toBe("editor");
    });

    it("invite wins over public link when neither owner nor explicit role match", () => {
        const lesson = {
            ownerId: "someone-else",
            invitedEmails: { "u3@example.com": { role: "editor" as const, invitedAt: 0 } },
            allowLinkAccess: true,
            publicRole: "commenter" as const,
        };
        expect(resolveRole({ lesson, userId: "u3", userEmail: "u3@example.com" })).toBe("editor");
    });
});

describe("canView / canComment / canEdit", () => {
    it("canView is true for every role except 'none'", () => {
        expect(canView("owner")).toBe(true);
        expect(canView("editor")).toBe(true);
        expect(canView("commenter")).toBe(true);
        expect(canView("viewer")).toBe(true);
        expect(canView("none")).toBe(false);
    });

    it("canComment is true for owner, editor, and commenter only", () => {
        expect(canComment("owner")).toBe(true);
        expect(canComment("editor")).toBe(true);
        expect(canComment("commenter")).toBe(true);
        expect(canComment("viewer")).toBe(false);
        expect(canComment("none")).toBe(false);
    });

    it("canEdit is true for owner and editor only", () => {
        expect(canEdit("owner")).toBe(true);
        expect(canEdit("editor")).toBe(true);
        expect(canEdit("commenter")).toBe(false);
        expect(canEdit("viewer")).toBe(false);
        expect(canEdit("none")).toBe(false);
    });
});

describe("sanitizePublicRole", () => {
    it("passes through 'commenter'", () => {
        expect(sanitizePublicRole("commenter")).toBe("commenter");
    });

    it("defaults everything else to 'viewer', including an attempted 'editor'", () => {
        expect(sanitizePublicRole("editor")).toBe("viewer");
        expect(sanitizePublicRole("viewer")).toBe("viewer");
        expect(sanitizePublicRole(undefined)).toBe("viewer");
        expect(sanitizePublicRole(null)).toBe("viewer");
        expect(sanitizePublicRole("garbage")).toBe("viewer");
    });
});
