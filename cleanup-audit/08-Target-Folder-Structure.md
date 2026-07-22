# 08 — Target Folder Structure

## 1. The standard (descriptive, not aspirational)

The codebase already converged on a structure during the modernization; this codifies the majority pattern (frequency data in doc 06 §5). **No feature is forced to have every folder — a folder exists only when it groups ≥2 files.**

```
features/
  <feature>/
    index.ts              # curated, doc-commented barrel — the public API (9/9 today)
    server.ts             # only if server-only exports exist (2/9 today)
    components/           # when ≥2 components
    hooks/                # useX.ts only — non-hooks live in utils/ or domain/
    services/             # *.service.ts + kebab-case helper modules; owns all Firestore IO
    domain/               # pure logic, no IO
    actions/              # *.actions.ts ("use server")
    types/                # *.types.ts + barrel (feature level)
    utils/  constants/  context/  data/     # as needed
    <sub-module>/         # only for large features (flashcard, kana today)
      index.ts            # sub-module barrel (lint-enforced boundary for flashcard)
      components/  hooks/
      types.ts            # single FILE at sub-module level (settled two-tier convention)
```

Small features stay flat: `home/` (4 files) and `command-palette/` (5 files) are **correct as-is** — no folders added for symmetry.

Route layer: `app/**/page.tsx` is a thin orchestrator (param extraction, guards, mounting a feature screen root). Screen assembly, domain math, and flow policy live feature-side.

`shared/` admission rule (now enforced by this audit's evidence bar): **2+ unrelated feature consumers, or app-lifecycle infrastructure.** Single-consumer items go to their feature; speculative generality doesn't qualify. `lib/` unchanged: app-lifecycle infra only.

## 2. Current → Target (only what changes; everything not listed stays put)

### shared/ shrinks (12 moves + 2 splits — doc 07)

```
CURRENT                                      TARGET
shared/
  components/ui/
    SettingsMenu.tsx (+test)          →      features/kana/hub/components/
    ModeSelectionCard.tsx             →      features/kana/quiz/components/
    DatePicker.tsx (+test)            →      features/admin/components/shared/
    Modal.tsx, Textarea.tsx           →      (stay — primitive-family argument)
    UserAvatar.tsx                    →      (investigate: app/[locale]/(main)/_components/)
  utils/
    romaji.ts                         →      features/kana/utils/          (new dir)
    shareToken.ts                     →      features/flashcard/utils/
    reorder.ts (+test)                →      features/flashcard/utils/    (⚠ carries L11 compat — behavior-frozen move)
    time.ts                           →      SPLIT: isOnline → features/admin/utils/ · formatTime → features/kana/utils/ · file deleted
    colors.ts                         →      SPLIT: hexToThemeColor → features/flashcard/utils/ · SEMANTIC_STATUS stays (colors.ts keeps 1 export)
  schemas/
    lesson.schema.ts (+test)          →      features/flashcard/types/     (⚠ carries Q-12 privacyMode/publicRole — ledger rows LDG-04/05 get path update)
    comment.schema.ts (+test)         →      features/flashcard/services/
    ai-generate-input.schema.ts (+t)  →      features/flashcard/builder/
    ai-output.schema.ts (+test)       →      features/ai/schemas/          (rename to avoid JSON-example name collision)
    card.schema.ts                    →      (stays — atomicCard coupling + Q-12 cardContentSchema)
  hooks/
    useNow.ts                         →      features/notifications/hooks/ (new dir)
    usePrefersReducedMotion.ts        →      features/game/hooks/
```

End state: `shared/schemas/` reduces to `card.schema.ts` (+barrel); `shared/hooks/` to `useCopyToClipboard.ts`; `shared/utils/` loses 3 files and slims 2.

### Route-layer logic moves feature-side (doc 06 §3)

```
app/[locale]/(main)/notifications/page.tsx (202 ln)   →  features/notifications/components/NotificationsInbox.tsx + thin page
app/[locale]/login/page.tsx (149 ln, logic only)      →  features/user (useLoginFlow hook / LoginScreen); thin page stays
app/[locale]/(main)/profile/page.tsx:29 (level math)  →  features/user domain helper (screen stays route-side)
app/.../SharedLessonPageClient.tsx:176-226            →  features/flashcard duplicateLesson service (client stays, calls it)
app/[locale]/(main)/settings/SettingsPageClient.tsx   →  (stays — self-contained; no feature invented for it)
```

### In-feature tidy (doc 06 §1)

```
features/kana/hooks/kanaDistractors.ts               →  features/kana/utils/ (non-hook; joins romaji.ts + formatTime)
features/flashcard/games/match/hooks/matchGrid.ts    →  features/flashcard/games/match/ (sibling of config; non-hook)
features/notifications/components/withFreshToken.ts  →  features/notifications/services/ (token utility, not a component)
features/notifications/schema.ts (+test)             →  features/notifications/domain/
features/admin/components/shared/ (20 files)         →  extract table engine: DataTable* + AdminTable* (+ hooks/useDataTable.ts stays) → components/table/
features/admin/components/content/index.ts           →  (deleted — D1, doc 04)
kana single-file dirs (hub/components, hub/hooks, practice/utils)  →  leave (sub-module convention consistency outweighs flattening)
admin/context/, notifications/context/, home/components/           →  leave (context/ is a 4/9-feature convention; not worth breaking)
features/game/services/persist-best-score.ts         →  rename best-score.service.ts ONLY if touched anyway (P4)
```

### What deliberately does NOT change

- **flashcard sub-module regime** — ADR-104's structure, lint-enforced; `games/speed/engine/` depth is earned complexity
- **game as a platform-feature** — its cross-feature component consumption is documented design; no promotion of its kit into `shared/`
- **notifications' headless architecture** — only the inbox *screen* moves in; the act-side seam, registry, and zero-import contract are untouched
- **All gated surfaces** (docs 02/03) — no move touches file contents beyond import paths; `lesson.schema.ts`/`reorder.ts` moves explicitly preserve the gated/compat code byte-for-byte
- **`lib/`** — no changes at all

## 3. Resulting shape deltas

| Metric | Before | After |
| --- | --- | --- |
| `shared/` files (non-test) | 52 | ~38 |
| Single-feature items in `shared/` | 15 | ≤3 (Modal, Textarea, UserAvatar — each with recorded rationale) |
| Route-layer logic-bearing files | 5 | 1 (settings, accepted) |
| Features with `utils/` dir | 3 | 5 (kana, admin gain one — each arriving with ≥2 files) |
| New folders created | — | 3 (`kana/utils/`, `notifications/hooks/`, `admin/components/table/`) — none single-file |
