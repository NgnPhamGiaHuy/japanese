/**
 * Flashcard Feature — Server Public API
 *
 * @remarks
 * The second of this feature's two entry points (ADR-101 Amendment 1).
 *
 * - `@/features/flashcard`        — client-safe surface. May contain React
 *                                   components and hooks. Importable anywhere.
 * - `@/features/flashcard/server` — this file. Server-only work plus the
 *                                   isomorphic values server code needs, so a
 *                                   Server Component never has to reach into
 *                                   the client barrel.
 *
 * Why the split exists: a barrel is one module, so importing it pulls the
 * feature's whole graph. This feature holds client components, client-only
 * hooks and Admin-SDK services at once. A single barrel therefore cannot
 * serve both sides of the Next.js fence — a client component importing it
 * dragged `firebase-admin` (and `child_process`) into the browser bundle,
 * and a Server Component importing it dragged in hooks calling `useEffect`.
 * Both are build failures, not style preferences.
 *
 * Nothing here may export a React component or a hook.
 */

// ─── Server-only: Admin SDK, public share preview ────────────────────────────
export {
    getPublicSharedLessonPreview,
    listPublicSharedLessonUrls,
} from "./services/shared-preview.service";

// ─── Isomorphic values, re-exported so server code has one import site ───────
// These are plain data and carry no client dependency; they are also available
// from the client barrel. Duplicating the export (not the declaration) is what
// lets a Server Component avoid the client barrel entirely.
export { DEFAULT_DECK_THEME_COLOR } from "./types";
export type { FlashCard } from "./types";
