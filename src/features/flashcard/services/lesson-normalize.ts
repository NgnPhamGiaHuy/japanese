/**
 * @file lesson-normalize
 * Read-time Lesson schema healing — split out of lesson.service.ts
 * (E11-T3). Pure (no Firestore access), so directly unit-testable.
 */
import type { Lesson } from "../types";

/** Newest-first tiebreak for lessons with no order value (or an equal one) —
 *  a brand-new, never-reordered deck should appear at the top of the
 *  dashboard, not fall to wherever its id happens to sort. */
export const newestFirst = (a: Lesson, b: Lesson) => b.createdAt - a.createdAt;

/**
 * Normalizes a Lesson snapshot so that:
 * - `roles` always includes the owner role (roles are source-of-truth)
 * - `ownerName` has a best-effort fallback (zero-join)
 *
 * LDG-22 (2026-08-04): the legacy `__ownerIdFallback`/`userId` owner fallback
 * and the `sharedBy`/`sharedByName`/`sharedAt` → `lastSharedBy*` mapping were
 * removed — empirically confirmed zero remaining documents needed them
 * (every lesson doc already carries `ownerId`, `roles`, and `lastSharedBy*`).
 */
export function normalizeLesson(raw: unknown): Lesson {
    const doc = (raw ?? ({} as Lesson)) as Lesson;

    const ownerId = doc.ownerId;

    const rolesFromDoc = doc.roles as NonNullable<Lesson["roles"]> | undefined;
    const normalizedRoles: NonNullable<Lesson["roles"]> | undefined = ownerId
        ? {
              ...(rolesFromDoc ?? {}),
              ...(rolesFromDoc?.[ownerId] ? {} : { [ownerId]: "owner" }),
          }
        : rolesFromDoc;

    const lastSharedBy = doc.lastSharedBy;
    const lastSharedByName =
        doc.lastSharedByName ??
        (lastSharedBy ? (doc.collaboratorMeta?.[lastSharedBy]?.displayName ?? null) : null);

    const createdAt = typeof doc.createdAt === "number" ? doc.createdAt : Date.now();

    const title = String(doc.title ?? "");
    const description = String(doc.description ?? "");
    const cardCount = typeof doc.cardCount === "number" ? doc.cardCount : 0;

    const ownerNameFromMeta = ownerId ? doc.collaboratorMeta?.[ownerId]?.displayName : undefined;
    const ownerNameRaw = (doc.ownerName ?? ownerNameFromMeta ?? "Unknown") as unknown;
    const ownerName =
        typeof ownerNameRaw === "string" && ownerNameRaw.trim().length > 0
            ? ownerNameRaw
            : "Unknown";

    const ownerAvatarRaw = (doc.ownerAvatar ?? null) as unknown;
    const ownerAvatar =
        typeof ownerAvatarRaw === "string" && ownerAvatarRaw.trim().length > 0
            ? ownerAvatarRaw
            : null;

    const lastSharedByNameRaw = lastSharedByName as unknown;
    const lastSharedByNameFinal =
        typeof lastSharedByNameRaw === "string" && lastSharedByNameRaw.trim().length > 0
            ? lastSharedByNameRaw
            : null;

    const lastSharedByAvatarRaw = (doc.lastSharedByAvatar ?? null) as unknown;
    const lastSharedByAvatar =
        typeof lastSharedByAvatarRaw === "string" && lastSharedByAvatarRaw.trim().length > 0
            ? lastSharedByAvatarRaw
            : null;

    return {
        // Preserve anything else for forward compatibility first.
        ...(doc as unknown as Record<string, unknown>),

        // Identity + required fields
        id: String(doc.id ?? ""),
        title,
        description,
        createdAt,
        cardCount,

        // Core identity
        ownerId,
        ownerName,
        ownerAvatar,

        // Access control (roles is source of truth)
        roles: normalizedRoles,

        // Existing flags + metadata
        allowLinkAccess: doc.allowLinkAccess,
        publicRole: doc.publicRole,
        invitedEmails: doc.invitedEmails,
        collaboratorMeta: doc.collaboratorMeta,
        isPublic: doc.isPublic,
        shareId: doc.shareId,
        themeColor: doc.themeColor,

        // UI metadata
        lastSharedBy,
        lastSharedByName: lastSharedByNameFinal,
        lastSharedByAvatar,
        lastSharedAt: doc.lastSharedAt,
    } as Lesson;
}
