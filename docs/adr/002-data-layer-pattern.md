# ADR 002 — Data-layer pattern: realtime `onSnapshot` vs. the one-shot Query bridge

**Status**: Accepted, implemented
**Date**: 2026-07-16

## Context

The app has two genuinely different data-access needs, and until now only one of them had an
explicit convention:

1. **Live data** — cards, lessons, progress, comments, notifications — needs to update in the UI
   the instant it changes in Firestore, without a manual refresh. This has always been served by
   bespoke `onSnapshot` hooks/services, client-side and authoritative.
2. **One-shot reads and mutations** — a document fetched once, not subscribed to — had no
   consistent treatment. Some were wrapped in `@tanstack/react-query`'s generic `useQuery`
   (`useFlashcardLoader.ts`'s shared-deck load, the admin dashboard hooks); most were raw
   `getDoc`/`getDocs` calls inside a bare `useEffect`, refetched unconditionally on every mount
   with no caching at all (e.g. the cross-user "shared edit" fetch in
   `app/(main)/flashcard/[id]/edit/page.tsx`, before this ADR).

The risk this ADR closes off: a realtime-Firestore-*binding* library (`reactfire`,
`react-firebase-hooks`) looks like it would unify both needs, but doing so would let a one-shot
query silently double-source data a live listener already owns — two independent read paths for
the same document, no single source of truth, and a live view that can visibly desync from a
cached one. Neither library has a credible 2026 story for this stack either (`reactfire`'s last
significant release predates React 19 / Firebase 12 compatibility work; `react-firebase-hooks` is
in the same position).

## Decisions

### 1. Realtime data stays on bespoke `onSnapshot` hooks — unconditionally

All 10 existing realtime hooks/services (`useCardsWithProgress`, `useDeckProgressStatus`,
`useLessons`, `comment.service`, `lesson.service`, `card.service`, `user.service`, `game.service`,
`NotificationsContext`, `notification.service`) are correct as they stand and are not migrated to
anything. This is the authoritative path for any data that must reflect live Firestore state —
client-side, subscribed, never polled, never routed through a query cache.

### 2. One-shot reads/mutations get an *optional* bridge: `@tanstack-query-firebase/react`

Where a one-shot read or mutation genuinely benefits from a query cache — deduping repeat fetches
across remounts, avoiding a redundant refetch when a cached result is still fresh — bridge it via
`@tanstack-query-firebase/react`'s Firestore-specific hooks (`useDocumentQuery`,
`useCollectionQuery`, `useSetDocumentMutation`, etc.), not a hand-rolled `useEffect` + `useState`
pair. These hooks wrap exactly one `getDoc`/`getDocs`/write call each and share the app's existing
single `QueryClientProvider` (`lib/providers.tsx`, `staleTime: 30_000` by default) — no new
provider, no new caching layer to reason about.

This is deliberately narrow. It does **not** apply to:
- Any read a component could instead subscribe to live (that's rule 1, always wins).
- A **composite** operation that does several reads/writes internally as one business step (e.g.
  `getSharedLesson`'s decode-shareId → fetch-owner-lesson → fetch-owner-cards → merge-viewer-progress
  pipeline). `@tanstack-query-firebase/react`'s hooks each wrap a single Firestore call; forcing a
  multi-step function through several of them adds indirection without benefit. Plain
  `@tanstack/react-query`'s generic `useQuery({ queryFn: () => myCompositeLoad() })` — already used
  by `useFlashcardLoader.ts` and the admin dashboard hooks — remains the right tool for that shape,
  and is unaffected by this ADR.
- Read-then-write steps that are just part of a larger mutation (an existence check before a
  write, a diff before an upsert). Those stay inline in the service function that owns the write.

**Reference implementation**: `app/(main)/flashcard/[id]/edit/page.tsx`'s cross-user "shared edit"
fetch — a genuine one-shot read of another user's lesson + cards, never covered by any `onSnapshot`
listener (the realtime hooks only ever watch the *current* user's own data) — was migrated from a
raw `getDoc`/`getDocs` pair inside `useEffect` to `useDocumentQuery` + `useCollectionQuery`, gated
by `enabled` so the queries never run outside the actual cross-user-edit case.

### 3. `onSnapshot`-owned data is never double-sourced

If a document or collection already has a live subscriber anywhere in the app, no one-shot Query
bridge is introduced for that same data, even in a different component. One document, one source
of truth, one update path. This is a hard rule, not a style preference — a cached one-shot read
sitting alongside a live listener for the same data is exactly the failure mode this ADR exists to
prevent.

### 4. No realtime-Firestore-binding library, ever

`reactfire` and `react-firebase-hooks` are not, and will not be, added as dependencies. The
bespoke `onSnapshot` hooks are the realtime layer; nothing wraps or replaces them.

## What was explicitly not done

- **No wholesale migration of every one-shot read.** Only call sites that were genuinely a single,
  uncomposed `getDoc`/`getDocs` with no existing cache treatment were bridged. A repo-wide sweep
  found exactly one such call site (see above) plus one structurally-eligible-but-dead-code
  candidate (`comment.service.ts`'s `getComments()`, superseded everywhere by the realtime
  `subscribeToComments` and never called) — not a large-scale rewrite.
- **No change to `useFlashcardLoader.ts` or the admin dashboard hooks.** Both already use plain
  `@tanstack/react-query` correctly for composite one-shot loads; migrating them to
  `@tanstack-query-firebase/react` would not change behavior, only add decomposition for no benefit.
- **No new `QueryClientProvider` or cache configuration.** The bridge hooks use the app's one
  existing client and its existing defaults.

## Consequences

- Contributors adding a new one-shot Firestore read now have an explicit default: is it live data?
  Use `onSnapshot`. Is it a single one-shot read/write with no existing listener? Consider
  `@tanstack-query-firebase/react`. Is it several reads/writes as one step? Plain `useQuery`/
  `useMutation` around the composite function, same as today.
- The realtime idiom is unchanged and remains the app's only source of truth for live state —
  this ADR adds a narrow option alongside it, not a replacement for any part of it.
