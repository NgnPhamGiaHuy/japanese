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

type NormalizeLessonInput = Lesson & {
    /**
     * Internal, non-persisted hint.
     * Used when the snapshot doesn't include an owner field (legacy docs).
     */
    __ownerIdFallback?: string;
    /**
     * Legacy share fields (not referenced by the app code directly anymore).
     * We keep mapping for backward compatibility.
     */
    sharedBy?: string;
    sharedByName?: string | null;
    sharedAt?: number;
};

/**
 * Normalizes a Lesson snapshot so that:
 * - `ownerId` and legacy `userId` are both present (compat)
 * - `roles` always includes the owner role (roles are source-of-truth)
 * - `ownerName` has a best-effort fallback (zero-join)
 * - legacy share fields are mapped into `lastSharedBy*`
 *
 * Never deletes legacy fields immediately.
 */
export function normalizeLesson(raw: unknown): Lesson {
    const input = raw as NormalizeLessonInput;
    const { __ownerIdFallback, sharedBy, sharedByName, sharedAt, ...doc } =
        input ?? ({} as NormalizeLessonInput);

    const ownerId = (doc.ownerId ?? doc.userId ?? __ownerIdFallback) as string | undefined;

    const rolesFromDoc = doc.roles as NonNullable<Lesson["roles"]> | undefined;
    const normalizedRoles: NonNullable<Lesson["roles"]> | undefined = ownerId
        ? {
              ...(rolesFromDoc ?? {}),
              ...(rolesFromDoc?.[ownerId] ? {} : { [ownerId]: "owner" }),
          }
        : rolesFromDoc;

    const collaborators =
        doc.collaborators ?? (normalizedRoles ? Object.keys(normalizedRoles) : undefined);

    const lastSharedBy = (doc.lastSharedBy ?? sharedBy) as string | undefined;
    const lastSharedByName =
        doc.lastSharedByName ??
        sharedByName ??
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
        ...(doc as Record<string, unknown>),

        // Identity + required fields
        id: String(doc.id ?? ""),
        title,
        description,
        createdAt,
        cardCount,

        // Core identity + legacy compatibility
        ownerId,
        ownerName,
        ownerAvatar,
        userId: (doc.userId ?? ownerId) as string | undefined,

        // Access control (roles is source of truth)
        roles: normalizedRoles,
        collaborators,

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
        lastSharedAt: doc.lastSharedAt ?? sharedAt,
    } as Lesson;
}
