# 12 — PR Cleanup Plan

Follows the requested 8-PR skeleton; two slots come back **empty by finding** (the audit's most important result) and are re-purposed as documentation PRs rather than padded. Every PR: small, reviewable, reversible (`git revert` of one squash-merge), independently green (each runs `npm run lint` + `npm test` + `next build`; browser tests where components move). Branch naming per repo convention: `cleanup/<n>-<slug>`.

---

**PR 1 — Delete confirmed dead code** *(P1; ~30 lines removed)*
D1 redundant admin content barrel · D2 `getComments` + test case · D3 `AIGenerateMode` + barrel line + schema doc-comment · D4 two unused test helpers · D5 `rmdir` empty `_components/` · D6 two stale comments/docblocks.
*Tests:* full suite; nothing should change but line counts. **Risk: none.**

**PR 2 — ~~Remove obsolete fallbacks~~ → Ledger documentation** *(re-purposed: the fallback audit found zero obsolete fallbacks)*
Add ledger row **LDG-22** (flashcard legacy-doc compat cluster, doc 03 §2 — end state, stages, owner, review-by, gate = "lessons/cards backfill decision") · append the LDG-01 narrowing note (`deckId`/`deckTitle` read-dead; stopping new legacy writes is safe independently) · record the P5 barrel-trim policy decision if the owner has made it.
*Tests:* none (markdown only). **Risk: none.**

**PR 3 — ~~Remove legacy implementations~~ → *empty by finding***
Zero legacy implementations are removable without a gate answer or a nonexistent backfill (doc 03). **No PR.** Revisit after LDG-22's backfill decision.

**PR 4 — Consolidate duplicate utilities** *(P2)*
M1 `formatRelativeTime` → `shared/utils/` (+ CommentItem adoption — fixes no-tick regression) · M2 `formatAdminDate` in `admin/utils/` (5 call sites) · M3 replace inline copy with `toActionResult` import · M4 two spinners → shared primitives.
*Tests:* unit + browser; M1 adds a test for the moved util. **Risk: low.** *(M3 note: unifies the `"invalid-input"` string to canonical `"Invalid input"` — grep consumers of that literal first.)*

**PR 4b — `subscribeLessonProgress`** *(P2, N2 — separate because it touches live listeners)*
Add the subscription to `progress.service.ts`; `useCardsWithProgress` + `useDeckProgressStatus` consume it; direct `onSnapshot` imports leave the hooks.
*Tests:* existing hook/browser tests + emu suite. **Risk: medium-low; highest value.**

**PR 5 — Move feature-specific code out of shared** *(P3, Group A — split in three to stay reviewable)*
- **5a components:** A1 SettingsMenu · A2 ModeSelectionCard · A3 DatePicker (+tests, screenshot re-baseline)
- **5b utils/schemas:** A4 romaji · A5 shareToken · **A6 reorder (byte-identical — reviewer diff-checks)** · **A7 lesson.schema (+ LDG-04/05 path updates in `docs/migrations-ledger.md`, same commit)** · A8/A9 time/colors splits · A10 comment.schema · A11 ai-generate-input · A12 ai-output (rename)
- **5c hooks:** A13 useNow (**pairs with PR 4's M1 if not yet landed — must not straddle**) · A14 usePrefersReducedMotion
*Tests:* full suite + browser per batch. **Risk: low; A6/A7 medium (cargo rules, doc 09).**

**PR 6 — Standardize feature structure (route-layer extractions)** *(P3, Group B)*
- **6a:** B1 `NotificationsInbox` extraction (largest single diff; pure relocation)
- **6b:** B2 login-flow logic → `features/user` (E2E `auth.spec.ts` is the net)
- **6c:** B3 profile level-math → user domain helper (+ its first unit test)
- **6d (optional, N1):** `duplicateLesson` service — *emu test written first, then the move*
*Tests:* browser + E2E. **Risk: low-medium; 6d gated on its test.**

**PR 7 — Remove empty folders and compatibility leftovers → In-feature tidy** *(P3, Group C; the literal "empty folders/compat" content was already exhausted by PR 1/PR 3-empty)*
C1 kanaDistractors → utils · C2 matchGrid · C3 withFreshToken → services · C4 notifications schema → domain · C5 admin table engine → `components/table/`.
*Tests:* full suite. **Risk: low.**

**PR 8 — Final dependency and import cleanup** *(P2 D7 + P4 tail)*
D7 barrel trims (after P5 policy nod) · dead type exports (~14) · `prettier` → devDependencies · DialogChrome into ui barrel · command-palette barrel doc header · optional: P1 `@vitest/coverage-v8` removal and P6 `makeCard` un-export if the owner answered.
*Tests:* lint + build catch any import that relied on a trimmed line. **Risk: none-to-low.**

---

## Sequencing constraints (from doc 11)

`PR 1 → PR 4/4b → PR 5 → PR 6 → PR 7 → PR 8`, with PR 2 (docs) landable any time. 4b lands before 5b (both touch `progress.service.ts`'s neighborhood). A13/M1 never straddle PRs. N3/N4 (survival results screen, SharePrivacyPicker) are **deliberately not scheduled** — UI-behavior changes for the owner to green-light individually.

## Not in any PR

E1 gated clusters (ledger-tracked, owner decisions) · E2 code changes (await backfill decision; only its documentation rides in PR 2) · declined moves and KEEP items (doc 10) — recorded precisely so future audits don't re-open them.
