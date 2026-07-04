# Design tokens — full reference

Formalized from the app's own dominant patterns (audited 2026-07-03, 196 files across `src/app`, `src/features`, `src/shared`; rolled out across most of the app 2026-07-04). Existing hex values are kept byte-for-byte throughout — adopting these tokens should never change how the app looks, only how the value is referenced.

## Color

### Core (wired into the `@theme` block in `src/app/globals.css` — usable as `bg-hiragana`, `text-katakana`, `ring-katakana`, etc.)

| Token | Hex | Role |
|---|---|---|
| `hiragana` | `#58cc02` | Hiragana alphabet mode |
| `katakana` | `#1cb0f6` | Katakana alphabet mode; also the app's primary "interactive" blue |
| `both` | `#ce82ff` | "Both alphabets" mode |
| `survival` | `#ff9600` | Survival game mode |
| `danger` | `#ea2b2b` | Errors, destructive actions |
| `bg` | `#f7f7f8` | Page background |
| `text` | `#3c3c3c` | Primary text |
| `muted` | `#afafaf` | Secondary/tertiary text, icons |

Prefer the utility class (`text-muted`, `border-katakana`) over `var(--color-x)` in new code — both work, but the utility is shorter and what `cn()`-based components expect to merge cleanly.

### Semantic / neutral tokens (also wired into `@theme`)

| Token | Hex | Why |
|---|---|---|
| `surface` | `#ffffff` | Card/content background, distinct from page `bg` |
| `border` | `#e5e7eb` | Neutral border — this is exactly Tailwind's stock `gray-200`; the app still uses both interchangeably for the same color without preferring the named one, that's fine |
| `danger-bg` | `#ffdfe0` | Light error surface (already used in `DashboardError.tsx`) |
| `teal` | `#00d1e0` | Extra brand accent, already live in `Button.tsx`'s `THEMES.teal` |
| `pink` | `#ff66bb` | Extra brand accent, already live in `Button.tsx`'s `THEMES.pink` |

Tailwind's default `gray-*` scale (used 500+ times) is, in practice, already this app's neutral scale. Don't replace it with a custom neutral palette — just don't let it silently drift into `slate`/`zinc` on new code either.

### State variants (`-strong` / `-hover`)

Per-hue border/hover colors already exist, hardcoded identically in multiple places (originally defined once in `Button.tsx`'s `THEMES` map, then independently re-typed elsewhere — e.g. `hiragana-strong` `#58a700` and `hiragana-hover` `#46a302` appear in both `Button.tsx` and `settings/page.tsx`). Rather than hand-declaring a `-strong`/`-hover` custom property for every one of the 7 hues (14+ new tokens), prefer deriving them in the `@theme` layer with `color-mix()` against the 8 core tokens above — same visual result, one source of truth per hue. If you need the literal values before that derivation exists: `hiragana-strong #58a700` / `hiragana-hover #46a302` · `katakana-strong #1899d6` / `katakana-hover #149fdf` · `both-strong #b65ce8` · `survival-strong #cc7800` · `danger-strong #b82222` / `danger-hover #d92626` · `teal-strong #00a8b5` / `teal-hover #00b8ca` · `pink-strong #e056a4` / `pink-hover #ff88cc`.

### Focus ring

Reuses `katakana` — no dedicated `--color-focus-ring` custom property, just the token directly. `Button.tsx`'s `base` classes are the reference implementation: `focus:outline-none focus-visible:ring-2 focus-visible:ring-katakana focus-visible:ring-offset-2`. Copy this exact pattern onto any new focusable element rather than inventing a variant of it.

## Typography

Global base (`globals.css`, don't touch): 16px body, 1.6 line-height, 0.05em letter-spacing, `var(--font-ui)` (Nunito) cascading to `var(--font-japanese)` (Noto Sans JP, or Klee One under `body.handwriting-font`). **Never override `font-family` at the component level** — audited at zero overrides app-wide, keep it that way.

| Role | Classes | Notes |
|---|---|---|
| Display | `text-5xl font-black` | Big one-off numbers/hero moments |
| H1 — hero | `text-3xl font-black` | Standalone/full-viewport page headers (home page greeting; also use for EmptyState/NotFoundScreen — they're full-viewport takeovers) |
| H1 — compact | `text-lg font-black` | Sticky header bars (`ScreenHeader`) — a genuinely distinct constrained-chrome context, not an error, but name it so it's chosen on purpose |
| H2 / section | `text-xl font-black` | Already exists as `SECTION_HEADING` in `src/shared/constants/styles.ts` — 100% consistent already, just export it as part of this scale. Also the correct size for dialog/modal titles (matches `Modal.tsx`'s existing `text-xl`). |
| H3 / card title | `text-lg font-black` | Card and list-item titles |
| Meta / eyebrow | `text-xs font-black tracking-widest uppercase` | Uppercase section labels ("APPEARANCE", etc.). **Not** `text-[11px]`/`text-[10px]`/`text-[9px]` — those are drift (185+ instances found), 1–3px off stock `text-xs` for no reason. Collapse into `text-xs`. |
| Body | `text-sm font-bold` | Primary reading copy — dominant pattern already (154 uses) |
| Caption | `text-xs font-bold` | Secondary/meta copy |
| Stat value | `text-3xl`–`text-4xl font-black tracking-tighter` | Big numbers (StatCard etc.) — intentionally larger than headings; this is a distinct role (data display), not a hierarchy violation |

Weight discipline: the app uses almost exclusively `font-black` (900, for every heading) and `font-bold` (700, for everything else) — `font-medium`/`font-semibold`/`font-normal` are essentially unused. Don't introduce a new weight without a real reason; it'll read as inconsistent against 585+ existing instances of the two-weight system.

## Spacing

Already clean — audited at **zero** arbitrary margin/padding/gap values app-wide. Don't introduce a custom spacing scale; use Tailwind's default scale via the existing named constants in `src/shared/constants/styles.ts`:

- `SPACING.pagePadding` = `px-6`
- `SPACING.sectionGap` = `space-y-6`
- `SPACING.cardGap` = `gap-4`
- Card interior padding has two legitimate, coexisting tiers, both now on `Card` directly: `padding="md"` (`p-6`) for static/content cards, `padding="compact"` (`p-5`) for interactive cards (`ActionCard`, `ModeSelectionCard`, `Alert`, `DeckCard` all converge here — that's a real pattern, not an outlier). The old `SPACING.cardPadding` JS constant this used to live in has been removed now that `Card` handles it directly.

## Radius

Verified directly against the installed Tailwind version's actual default scale (`node_modules/tailwindcss/theme.css`): it ships up to `rounded-4xl` at exactly `2rem` (32px). Two custom steps beyond that are now in `@theme`: `--radius-5xl: 2.5rem` and `--radius-6xl: 3rem`.

| Tier | Class | Value | Role |
|---|---|---|---|
| sm | `rounded-xl` | 12px (stock) | Ghost buttons, small icon wells |
| md | `rounded-2xl` | 16px (stock) | Inputs, compact cards, primary/secondary buttons |
| lg | `rounded-3xl` | 24px (stock) | Standard `Card` default/elevated/flat |
| xl | `rounded-4xl` | 32px (stock) | Large icon wells (e.g. `ConfirmModal`'s icon circle) |
| 5xl | `rounded-5xl` | 40px | Dashboard-tier `Card`, `Modal`, `ConfirmModal` |
| 6xl | `rounded-6xl` | 48px | Desktop-enhanced large content cards (responsive `sm:`/`md:` upgrade from `5xl`/`4xl`) |

Named the large tiers `5xl`/`6xl`, not by reusing `4xl` — `4xl` was already claimed by the stock 32px step, and redefining it with a different value would've silently changed every existing `rounded-4xl` usage elsewhere.

**Deliberate exceptions — don't fold these into a tier, they're not drift:** `rounded-[1.25rem]` (12 uses, all in the flashcard grading buttons — Again/Hard/Good/Easy — across `FlashcardLearn.tsx`/`FlashcardPractice.tsx`/`FlashcardMistakeReview.tsx`, all agreeing with each other exactly); `rounded-[1.75rem]` (5 uses, all on `h-20 w-20` icon-well circles on game/quiz result and intro screens, also mutually consistent); `rounded-[3.5rem]` (1 use, the profile page's avatar frame — a genuine one-off, not worth a token). All three were checked for internal consistency before being left alone — if you find a NEW arbitrary radius value that doesn't match one of these three known clusters, it's probably real drift and should collapse into the nearest tier above.

## Shadow

Already healthy — just enforce by role, don't add new ad hoc shadows:

| Role | Class |
|---|---|
| Rest | `shadow-sm` |
| Hover-elevated | `shadow-md` |
| Modal / overlay | `shadow-xl` / `shadow-2xl` |
| Flat / ghost | `shadow-none` |

A handful of arbitrary color-tinted "glow" shadows (`shadow-[0_0_10px_#58cc02]` etc.) are intentional accent effects on specific game/status UI, not part of the core scale — leave them as documented exceptions, don't generalize the pattern.

## Transition & motion

- Standard interactive: `transition-all duration-200` (dominant pattern for hover/press feedback)
- Slow/progress: `duration-500` (progress bars, fills)
- Framer Motion default for pop/bounce interactions: `{ type: "spring", stiffness: 300, damping: 25 }` — this already lands in the same ~200ms comfort zone as the CSS side, don't introduce a third motion language

## Z-index

| Layer | Value | Used for |
|---|---|---|
| Sticky / relative | `z-10` | In-flow sticky contexts |
| Floating tool | `z-20` | Inline toolbars/hints |
| Fixed chrome | `z-40` | Bottom nav, sidebar top bar, `ScreenHeader`'s sticky bar |
| Modal / dropdown | `z-50` | `Modal`, `ConfirmModal`, `ShareModal`, `AdminSidebar`'s drawer, `DeckDetailsPanel`'s backdrop+panel |
| Toast | `z-[100]` | The `Alert`/toast provider only — must stay above any open modal, which is why modals are `z-50` not `z-[100]` |

Don't introduce a new z-index value outside this scale. `LoadingSpinner.tsx`'s fullscreen overlay is still at `z-[100]` (same tier as toast) — noted but deliberately left alone, since there's no concrete evidence (unlike the old Modal/Toast collision) that it actually conflicts with anything today.

## Accessibility (non-negotiable for new interactive components)

- Every focusable element gets a visible `focus-visible` ring (see Focus ring above) — `Button` has this now; match it on anything new.
- Every dialog/modal needs `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape-to-close, and focus return to the trigger element on close — use the shared `useDialogA11y` hook (`src/shared/hooks/`), don't hand-roll this again. `Modal`, `ConfirmModal`, and `ShareModal` all already use it as reference implementations.
- Every disabled control needs `disabled:opacity-50 disabled:pointer-events-none` (already `Button.tsx`'s pattern — match it, don't hand-type `opacity-50` ad hoc).
- Nav links reflect `aria-current="page"` for the active route — `BottomNav` and `AdminSidebar` both do this now.
- **Still an open gap, not yet resolved:** the app splits between a "3D lift" hover (`hover:-translate-y-1 hover:shadow-lg`, primary buttons/cards) and a plain background/color shift (list rows, toggles) with no written rule for which applies where. Until that gets a named `HOVER_LIFT`/`HOVER_SUBTLE` pair of constants, match whichever pattern the closest existing sibling element already uses rather than inventing a third.

## Architecture note: use `cn()`, not raw template strings

`src/shared/utils/cn.ts` wraps `clsx` + `tailwind-merge` (both already-installed dependencies) and is exported from the `shared/utils` barrel: `import { cn } from "@/shared/utils"`. `Button.tsx` and `Card.tsx` both use it — follow their lead for any component composing more than one class source (base + variant + caller-supplied `className`):

```ts
cn(base, sizes[size], variants[variant], activeClass, className)
```

`twMerge` resolves same-property conflicts by argument order — whichever class comes last wins. This is what fixed `Button.tsx`'s `ghost` variant, which used to set two different `border-radius` classes at once with nothing to resolve the collision (harmless while the values were close, but the exact mechanism for a real visible bug once two variants disagree by more). A handful of older components (`clsx` used bare, no `twMerge`) still exist — `AdminSidebar.tsx`, `LogsSummaryHeader.tsx`, `DatePicker.tsx` — fine as-is since they don't compose conflicting Tailwind classes, but reach for `cn()` instead if you're touching them and adding a second class source.
