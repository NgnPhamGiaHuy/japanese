---
name: design-system
description: Design-system rules and token reference for this Japanese-learning app (Next.js 16 + Tailwind v4), formalized from a full codebase audit on 2026-07-03 (no external style guide exists — this repo's own dominant patterns are the source of truth). Use this skill whenever building a new UI component, page, form, dialog, card, or button, or touching any className/styling in this repo — before writing JSX, check colors, spacing, radius, and typography against the tokens here and reuse an existing src/shared/components/ui primitive instead of one-off styling. Trigger this even if the user doesn't say "design system" or "style guide" — a hardcoded hex color, an arbitrary Tailwind bracket value (text-[13px], rounded-[17px], mt-[9px]), or a new hand-rolled card/button/input/modal in this repo should all be caught here first, before implementation, not after.
metadata:
  scope: project
  source_audit: 2026-07-03
---

# Design System — Kana & Nihongo Master

This app has a real component library and a real color palette already — they just weren't written down or fully wired up. This skill is that write-up. Follow it as if it were the design spec, because for this project, it is: no external guide exists, so these are the app's own dominant patterns, formalized.

## The gate

Before implementing any new component, page section, or style change in this repo:

1. **Check whether an existing primitive already does this.** Look at the list below and at `src/shared/components/ui/`. Passing a new prop to `Button` or `Card` is almost always correct; a new file that reimplements a card/button/badge is almost never correct.
2. **Check whether the values you're about to write (color, size, radius, spacing) already have a name.** See `references/tokens.md`. A hardcoded hex or an arbitrary bracket value (`text-[13px]`, `rounded-[17px]`) is a signal to stop and use the token, not proceed.
3. **If something is genuinely missing** (see "Confirmed gaps" below), build it as a shared primitive in `src/shared/components/ui`, or extend the closest existing one — don't work around the gap locally. Only add a *new* token when the same need recurs; don't mint a token for a single use.
4. **If asked to do something that conflicts with this** — a one-off hex, an arbitrary bracket value, a parallel card/button implementation — say so and propose the compliant alternative instead of silently complying. That's the point of this skill.

This is about new/changed code. It is not a mandate to go rewrite unrelated files you're not touching — most of the app was already brought into line with this system on 2026-07-04 (see `references/tokens.md` for what's still a known, deliberate exception rather than an oversight).

## Relationship to this project's other rules

This skill governs visual values and primitives only. Code *organization* — feature structure, layer responsibilities, naming, file-size limits — is enforced by ESLint and described in the root README; follow both at once. A new `Input` primitive still belongs in `src/shared/components/ui`, stays UI-only, and still needs a passing build.

## Quick reference

**Existing primitives — use these, don't reimplement:**
`Button` (all buttons/CTAs incl. icon+label, loading, active, alphabet-aware theming, `size="icon"` for icon-only) · `Input` (`variant="default"` bordered / `variant="underline"` inline-title) · `Textarea` · `Card` (all card containers; `interactive` for hover-lift, `padding="compact"` for the `p-5` tier) · `Modal` / `ConfirmModal` (all dialogs — both already have focus trap, Escape-to-close, and `role="dialog"` via `useDialogA11y`) · `Alert` (all toasts/notifications) · `Badge` (all pills/tags/chips) · `Select` (all dropdowns) · `EmptyState` (all "no data" states) · `LoadingSpinner` · `DatePicker` · `StatCard` · `ActionCard` · `ModeSelectionCard` · `UserAvatar` / `UserMeta` · `NotFoundScreen` · `SettingsMenu` · `ReorderList` / `ReorderItem` · `AdminTable` (admin tables — except `AdminReportsPageContent`, whose row shape is a deliberate exception, see `tokens.md`). Full list and props: read the files directly in `src/shared/components/ui/` — they're short and worth actually opening rather than guessing at their API. `cn()` (clsx + tailwind-merge) lives in `src/shared/utils/cn.ts` — use it, don't concatenate classes as raw template strings.

**Confirmed gaps still open — build these as shared primitives the first time a real need appears, don't work around them:**
- `Skeleton` — no shared loading-placeholder yet (`DashboardLoading.tsx`'s pattern is the best starting point)
- A documented rule for persistent-banner vs. transient-toast error UX — both patterns exist and are each internally consistent, but there's no written rule for which to use when
- `HOVER_LIFT` / `HOVER_SUBTLE` / `DISABLED` shared style constants — the app splits between a "3D lift" hover and a plain background-shift hover with no documented rule for which applies where

**Never do this:**
- Hardcode a hex color in a component — resolve through a token (see `references/tokens.md`). Before adding a *new* color, check it isn't already one of the 13 existing color tokens.
- Use an arbitrary Tailwind bracket value (`text-[11px]`, `rounded-[2rem]`, `mt-[13px]`) — use the scale step it's meant to be, or add a properly named token if a genuinely new step is needed. Check `tokens.md`'s exceptions list first though — a few arbitrary-looking values are deliberate, not drift.
- Concatenate conditional/variant Tailwind classes as raw template strings — use `cn()` (see above). This is exactly how `Button.tsx`'s `ghost` variant used to silently collide with its own base radius before `cn()` was adopted.
- Ship a new interactive element without a visible `focus-visible` ring (match `Button.tsx`'s `focus-visible:ring-katakana` pattern), or a new dialog without `useDialogA11y` (see `Modal.tsx` for the reference implementation).

**Full detail:** `references/tokens.md` — colors, typography scale, spacing/radius/shadow/transition/z-index, accessibility rules, and the list of deliberate exceptions found while rolling this out across the app on 2026-07-04.
