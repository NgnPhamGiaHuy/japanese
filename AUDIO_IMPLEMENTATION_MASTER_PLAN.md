# Audio Implementation Master Plan

> **Execution status (as of this commit)**: Epics 1, 2, 6, 7, 8, 9, and 11 are implemented and
> verified (tests, typecheck, production build, and manual browser checks — see
> `AUDIO_POST_MIGRATION_CLEANUP_REPORT.md`). Epic 4 is partial (tab-visibility lifecycle shipped;
> iOS gesture/activation behaviour is unverified on a real device). **Epics 3 and 5 have not
> started** — both are blocked on provisioning a Google Cloud TTS credential and running the T5.2
> voice bake-off, which requires access this environment doesn't have. Epic 10 is partial: unit and
> integration tests exist; the Playwright/device-matrix work described below was never built. This
> banner is the authoritative status; treat epic bodies below as the plan-as-authored, not a
> completion record.

**Mission**: Convert the verified findings of `SOUND_ARCHITECTURE_DISCOVERY.md` (structural inventory; debt register D1–D22) and `AUDIO_SYSTEM_ROOT_CAUSE_ANALYSIS.md` (root causes RC-0…RC-8; target architecture §14; source strategy §13) into an incrementally executable implementation plan.
**Status**: Planning only. No code in this document. No rediscovery performed — every code reference below reuses evidence already verified in the two source documents.
**Date**: 2026-07-10

**Cross-reference convention**: `RC-n` = root cause (RCA §7). `Dn` = technical-debt item (Discovery §15). `DEC-n` = product decision gate (§1.4 below, from RCA §16). File paths cited were verified in the source documents.

---

## 1. Executive Summary

### 1.1 What we are building

One **AudioManager** — a framework-free core owned by a React `AudioProvider` — that becomes the single owner of all audio state, replacing the two hidden module singletons (`src/shared/utils/audio.ts`, `src/shared/utils/sfx.ts`). On top of it: a **tiered Japanese pronunciation pipeline** (static kana assets → server-cached cloud TTS → hardened `speechSynthesis`), a **deterministic gameplay sequencer**, real user controls (SFX/voice mute + volume), lifecycle handling (route change, hidden tab, iOS), accessibility affordances, and full observability. The unofficial `translate.google.com/translate_tts` dependency is retired.

### 1.2 Shape of the migration

11 epics, ~50 tasks, ~11 weeks single-engineer pace (§18). Three structural rules govern everything:

1. **Observability before surgery** — Epic 1 instruments the *existing* pipeline first, so real-world failure telemetry validates the RC-1/2/3 ranking before transport work begins, and every later phase has a before/after metric.
2. **Facade-preserving strangler migration** — `playAudio`/`playSFX`/`playPronunciationFeedback` keep their exact signatures as thin delegates to the manager until Epic 11. At no point do the 14 call sites and the new core have to change in the same deploy.
3. **Every phase leaves trunk shippable** — feature flags gate the two behaviour-visible switches (provider seam on/off; TTS transport tiers), and each epic ends with the app in a strictly-better working state.

### 1.3 What "done" fixes

| Verified problem | Fixed by |
|---|---|
| RC-0 silent failures | Epic 1 (telemetry), Epic 2 (promise-returning API), T7.4 (user-visible state) |
| RC-1 unofficial endpoint | Epic 3 + Epic 5 (tiers 1–2), T11.1 (removal) |
| RC-2 fallback unavailability | T3.6 (hardened wrapper, local-voice preference), Tier 1/2 removing dependence |
| RC-3 iOS activation | T4.1/T4.4 (unlock + activation-aware queue) |
| RC-4 last-wins swallowing | Epic 6 (sequencer queue/interrupt policies) |
| RC-5 cancel→speak race | T3.6 (250–500 ms gap) |
| RC-6 mid-stream double-speak | T3.3/T3.6 (single-shot error semantics) |
| RC-7 navigation orphans | T1.3 (stopAll on route change), T4.2 (visibility) |
| RC-8 voice-list race | T3.6 (readiness promise) |
| D1 tautological policy | T2.8 |
| D2 setting ignored in 6 sites | T2.6 (centralized enforcement) |
| D4/D5 listener leaks | T1.4/T1.5 |
| D6 no mute/volume | T2.5 + T7.1 |
| D13 dead "listen" type | T7.3 (DEC-5) |
| D19 untestable audio | Epic 10 |
| D21 no reduced-motion/aria-live | Epic 8 |

### 1.4 Decision gates (product must confirm; plan proceeds on stated defaults)

These are RCA §16's open questions converted to gates with **working defaults** so no task is blocked. Each gate is referenced by the tasks it affects; changing a decision changes only those tasks.

| Gate | Question | Default assumed by this plan | Affects |
|---|---|---|---|
| **DEC-1** | `globalAutoPlay` semantics | Gates **all automatic pronunciation** in every mode (unifying the current 4-of-10 behaviour); never gates SFX; a **separate SFX toggle** is added | T2.5, T2.6, T7.1 |
| **DEC-2** | Pronounce after MC-choice grading? | **Yes** — feedback-stage pronunciation added to MC cards | T7.2 |
| **DEC-3** | Real speech policy or delete? | **Implement real policy** (prompt-stage blocking with listen-type exception hook) | T2.8 |
| **DEC-4** | Non-Japanese decks? | **Add `language` field** to `FlashCardContent`, default `"ja"` | T3.8 |
| **DEC-5** | Listening-question modality? | **Excise** the dead `"listen"`/`"reverse"` generator values now; the policy hook (DEC-3) keeps the door open | T7.3 |
| **DEC-6** | TTS budget | Google Cloud TTS Neural2, expected **$0/mo** inside perpetual free tier (RCA §12.4) | T3.1, T5.2 |
| **DEC-7** | Offline scope | **Kana-only offline** via HTTP/Cache-API caching of static assets; no service worker in v1 | T3.4, §20 |
| **DEC-8** | Drop-mode pronunciation | **Keep**, but policy-limited (no per-word interruption storm; see §10.5) | T6.6 |

---

## 2. Migration Philosophy

1. **Strangler fig, not rewrite.** The legacy modules remain the implementation behind their own facades until the new core proves itself in telemetry. Deleting code is the *last* epic, not a side effect of earlier ones.
2. **One behaviour change per deploy.** Structural refactors (Epic 2) ship behaviour-neutral; behaviour changes (delays, gating, tiers) ship individually flagged so regressions bisect trivially.
3. **Evidence-driven ordering.** Epic 1's telemetry both de-risks and re-prioritizes: if RC-1 turns out to dominate at 90%, Epic 3/5 can be pulled earlier; if iOS (RC-3) dominates, Epic 4 moves up. The plan's ordering is a default, not dogma.
4. **The riskiest dependency is removed, not patched.** No effort is spent making `translate_tts` "more reliable" beyond the transitional circuit breaker — the industry evidence (RCA §12) is unambiguous that the endpoint class is unsalvageable.
5. **Respect the repo's own conventions.** UI → Hook → Service layering (Discovery §4.1's violation is *the* structural fix); feature folders; Zustand-persisted settings; zod-validated server payloads; the existing `lib/logging` pipeline for telemetry (RCA RC-0 notes audio uses none of it).
6. **Testability is a deliverable, not a hope.** The manager is constructor-injected (RCA §14.8) precisely so Epic 10's tests don't need `vi.stubGlobal`/`vi.resetModules` (Discovery §14 "Testability").

---

## 3. High-Level Roadmap

```
Week →   1    2    3    4    5    6    7    8    9    10   11
E1  Foundation/Observability ████
E2  AudioManager seam             ████████
E5  Kana assets (parallel)             ████
E3  Pronunciation pipeline                  ████████
E4  Browser compat/lifecycle                     ████████
E6  Sequencing                                        ████████
E7  Audio UX                                               ████
E8  Accessibility                                          ████
E9  Performance                                                 ████
E10 Testing infra   ────────────── continuous ──────────────────
E11 Cleanup                                                     ████
GATE A (after E1): telemetry validates RC ranking → confirm epic order
GATE B (after E2): flag flip AUDIO_V2 → 100% traffic on manager (legacy transports)
GATE C (after E3+E5): flag flip TTS tiers → translate_tts demoted to breaker-guarded tier
GATE D (after E6): per-mode sequencer flags → all modes deterministic
GATE E (E11): legacy deletion → done
```

Workstream → epic mapping (Phase-1 requirement):

| Workstream | Objective | Business value | Technical value | Depends on | Primary risk | Rollout | Epic |
|---|---|---|---|---|---|---|---|
| Telemetry | Make every audio failure observable | Support/debug cost ↓; validates all later spend | Baseline metrics; RC ranking confirmation | — | Log volume | Always-on, sampled | E1 |
| Audio lifecycle | Stop audio on navigate/hide; fix leaks | Removes most user-visible jank class (RC-7) | Deletes leak classes D4/D5 | — | Over-eager stopping | Direct (small diffs) | E1, E4 |
| Audio architecture | Single owner, channels, promise API | Enables every user-facing control | Kills singleton/testability debt | E1 | Facade drift | Flag `AUDIO_V2` | E2 |
| Audio source strategy | Tiered pronunciation, own transport | Reliability = core product quality | Cacheable, retryable, offline-capable | E2 | Vendor voice quality | Flag `AUDIO_TTS_TIERS` + breaker | E3 |
| Audio assets | Pre-generated kana corpus | Zero-variance audio for core content | 3 MB static, CDN-cacheable | DEC-6 | Licensing/pronunciation QA | Ships inert; consumed by E3 | E5 |
| Browser compatibility | iOS/activation/visibility correctness | Mobile users = growth surface | Confines platform quirks to one module | E2 | Untestable-in-CI behaviours | Device QA gates | E4 |
| Game sequencing | Deterministic cue ordering | Consistent game feel; ends clipped audio (RC-4) | One clock instead of three (RCA §8.1) | E2 | Feel changes | Per-mode flags | E6 |
| SFX improvements | Presets owned, tails as metadata | Polish | Enables voice-after-SFX timing | E2 | Low | With E6 | E2/E6 |
| Audio UX | Mute/volume/MC-pronunciation/affordances | User control; classroom usability | Consumes channel architecture | E2 | Low | Direct | E7 |
| Accessibility | aria-live, reduced-motion, channel independence | Compliance + inclusivity | Decouples feedback channels | E2 | Low | Direct | E8 |
| Performance | Node lifecycle, polling, idle suspend | Battery/memory on long sessions | Removes D17, Speed 100 ms poll | E2, E6 | Speed-mode regression | Benchmarked | E9 |
| Offline | Kana assets cached offline (DEC-7) | Study on the train | Cache API layer reused | E3, E5 | Quota | With E3 | E3 |
| Testing | jsdom+fakes infra; browser/device matrices | Regression safety for all epics | Ends mock-the-whole-barrel testing (D19) | E2 API | Flaky browser tests | Continuous | E10 |

---

## 4. Dependency Graph

```
                                ┌──────────────────────┐
                                │ E1 Foundation        │  (no dependencies)
                                │ T1.1–T1.7            │
                                └──────┬───────────────┘
                       GATE A          │
              ┌────────────────────────┼─────────────────────────┐
              ▼                        ▼                          ▼
   ┌────────────────────┐   ┌────────────────────┐    ┌────────────────────┐
   │ E2 AudioManager    │   │ E5 Kana assets     │    │ E10 Test infra     │
   │ T2.1→T2.2→{T2.3,   │   │ T5.2→T5.1→T5.3→T5.4│    │ T10.1 (needs T2.1  │
   │ T2.4}→T2.5→T2.6→   │   │ (needs only DEC-6; │    │ API shape only)    │
   │ T2.7→T2.8          │   │ parallel to E2)    │    │ then continuous    │
   └─────────┬──────────┘   └─────────┬──────────┘    └────────────────────┘
     GATE B  │                        │
             ├────────────────────────┘
             ▼
   ┌────────────────────┐        ┌────────────────────┐
   │ E3 Pronunciation   │        │ E4 Browser compat  │
   │ T3.1→T3.2→T3.3     │        │ T4.1→T4.4, T4.2,   │
   │ T3.4,T3.5,T3.6 ∥   │        │ T4.3 (needs T2.x   │
   │ →T3.7→T3.9,T3.10   │        │ manager seam)      │
   │ T3.8 independent   │        └─────────┬──────────┘
   └─────────┬──────────┘                  │
     GATE C  │                             │
             ▼                             ▼
   ┌─────────────────────────────────────────────────┐
   │ E6 Sequencing  T6.1→T6.2→{T6.3,T6.4,T6.5,T6.6,  │
   │ T6.7 per-mode, parallel}                        │
   └─────────┬───────────────────────────────────────┘
     GATE D  │
     ┌───────┼────────────┬───────────────┐
     ▼       ▼            ▼               ▼
  ┌──────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐
  │E7 UX │ │E8 A11y   │ │E9 Perf     │ │E10 browser/  │
  │      │ │          │ │(T9.2 needs │ │device tests  │
  └───┬──┘ └────┬─────┘ │ E6 Speed)  │ └──────┬───────┘
      │         │       └─────┬──────┘        │
      └─────────┴─────────────┴───────────────┘
                              ▼
                   ┌────────────────────┐
                   │ E11 Cleanup        │  GATE E
                   │ T11.1→T11.2→…      │
                   └────────────────────┘
```

**Critical path**: E1 → E2 (T2.1→T2.4→T2.7) → E3 (T3.1→T3.3→T3.7) → E6 (T6.1→per-mode) → E11. Everything else hangs off it in parallel.

**Parallelism opportunities**: E5 needs only DEC-6 and can start day 1. E10.1 needs only the *API shape* from T2.1 (types file), not the implementation. T3.8 (language field) is a data-model change independent of the audio core. E4's device-QA checklist (T4.5) can be *written* any time; *executed* after Gate C.

**Module impact map** (which existing files each epic touches — from the discovery inventory):

| Epic | Existing files modified | New files |
|---|---|---|
| E1 | `shared/utils/audio.ts`, `shared/utils/sfx.ts`, `lib/logging/actions.enum.ts`, `app/(immersive)/layout.tsx`, `app/(main)/layout.tsx`, `useMatchModeSession.ts` | `shared/audio/telemetry.ts` |
| E2 | `lib/providers.tsx`, `lib/app-store.ts`, all 14 call-site modules (mechanical), `shared/utils/{audio,sfx,speechPolicy}.ts` (become facades) | `shared/audio/*` (§7) |
| E3 | `features/flashcard/domain/types.ts`, `LessonBuilder` (language field), `firestore.rules` (tts cache paths if client-read) | `app/api/tts/route.ts`, `shared/audio/voice/*` |
| E4 | — (all inside `shared/audio/`) | `shared/audio/unlock.ts`, `session.ts` |
| E5 | — | `scripts/generate-kana-audio.ts`, `public/audio/kana/v1/*`, `public/audio/kana/manifest.json` |
| E6 | `games/speed/hooks/useGameEngine.ts`, `games/speed/engine/core/GameEngine.ts` (emit events), `useMatchModeSession.ts`, `useKanaQuizSession.ts`, `useSurvivalGame.ts`, 3 flashcard players | `shared/audio/sequencer.ts` |
| E7 | `app/(main)/settings/page.tsx`, `KanaHub.tsx`, `SettingsMenu.tsx`, `FlashcardPractice.tsx`, `FlashcardMistakeReview.tsx` | — |
| E8 | `AnswerFeedback.tsx`, `globals.css`, game feedback components | — |
| E9 | `shared/audio/channels.ts`, `useGameEngine.ts` | — |
| E10 | `vitest.config.ts`, `package.json` | `shared/audio/__tests__/*`, `e2e/*`, `docs/device-qa.md` |
| E11 | Deletes `shared/utils/{audio,sfx,speechPolicy}.ts`; `shared/utils/index.ts`; `CODEBASE_CONTEXT.md`; dead types in `speed/engine/types.ts` | `docs/adr/audio-architecture.md` |

---

## 5. Epic Breakdown

| # | Epic | Purpose | Risk | Complexity | Regression impact | Success criteria |
|---|---|---|---|---|---|---|
| E1 | **Audio Foundation & Observability** | Instrument existing pipeline; fix pure-win leaks; stop-on-navigate | **Low** (additive; tiny diffs) | S | Minimal — no playback-path logic changed except delay unification (T1.6, flagged) | Telemetry dashboard shows tier/failure distribution; zero listener growth in soak test; audio stops on route change |
| E2 | **AudioManager & Provider Seam** | Single owner; channels; promise API; settings; centralized gating; call-site migration | **Medium** (touches 14 modules mechanically) | L | Behaviour-neutral by design; flag-revertible | With `AUDIO_V2` on: byte-identical UX (verified by E10 integration suite); all call sites through facade/hook; policy real or gone |
| E3 | **Japanese Pronunciation Pipeline** | Tiered providers, own transport, caching, retry, breaker | **Medium-High** (new server surface) | L | Pronunciation *sound* changes (vendor voice); reliability strictly ↑ | <1% failed pronunciations in telemetry (vs baseline); p50 start latency <150 ms cached / <800 ms uncached; zero translate_tts calls when tiers healthy |
| E4 | **Browser Compatibility & Lifecycle** | iOS unlock/activation, visibility, audio session | **Medium** (device-verifiable only) | M | Mobile-only behaviour changes | Device QA matrix passes; iOS auto-pronunciation success ≥95% after first gesture |
| E5 | **Audio Assets (kana corpus)** | Pre-generate ~200 kana clips; versioned manifest | **Low** (inert until consumed) | S | None until E3 consumes | All kana have reviewed clips ≤20 KB each; manifest hash-stable; native-speaker spot-check sign-off |
| E6 | **Game Audio Sequencing** | Deterministic cues; one clock; per-mode adoption | **Medium-High** (game feel) | L | Per-mode, flag-gated; feel changes need product sign-off | §10 sequence specs hold under rapid-input stress tests; zero clipped pronunciations in normal pacing |
| E7 | **Audio UX** | Settings UI, MC pronunciation, affordances, Drop polish | Low | M | Small, isolated | Toggles work & persist; "audio unavailable" state visible when chain exhausted |
| E8 | **Accessibility** | aria-live, reduced-motion, channel independence | Low | S | Minimal | axe/manual audit passes; feedback perceivable with sound off AND motion off |
| E9 | **Performance** | Node lifecycle, kill 100 ms poll, idle suspend | Medium (T9.2 touches Speed rendering) | M | Speed-mode UI timing | Benchmarks: stable node count under 10-min Drop soak; Speed renders event-driven; context suspended when idle >30 s |
| E10 | **Testing Infrastructure** | jsdom+fakes, unit/integration/browser/device | Low | M | None (additive) | CI runs full audio suite <2 min; coverage of chain/breaker/sequencer branches ≥90% |
| E11 | **Migration Cleanup** | Delete legacy, translate_tts, dead surface, docs | Low (mechanical, gated on D telemetry) | S | Low — deletes only proven-dead paths | Zero references to legacy modules; bundle drop measured; docs/ADR merged |

## 6. Jira Task Breakdown

### 6.0 Global Task Contract (inherited by every task unless overridden)

- **Regression checklist R-STD**: ① `npm run build --prefix src` green (pre-commit hook already enforces); ② full unit suite green; ③ manual smoke of the touched mode(s) on Chrome desktop; ④ verify audio still plays in ChartCell + one flashcard reveal (canary paths); ⑤ no new console errors on `/login → home → kana → flashcard` walk.
- **Rollback R-STD**: single-commit revert; tasks behind a flag additionally roll back by flipping `AUDIO_V2` / `AUDIO_TTS_TIERS` / per-mode sequencer flags off (flags read at module init from `NEXT_PUBLIC_*` env + a localStorage dev override).
- **Testing T-STD**: unit tests for new logic; integration test if the task crosses a module boundary; manual device pass only where the task is platform-behavioural (flagged per task).
- **Definition of Done D-STD**: AC met; R-STD clean; tests merged with the change (not "later"); telemetry events added for any new failure path; short usage note in `shared/audio/README.md`; reviewed by a second engineer.
- **Story points**: Fibonacci; 1 ≈ half-day incl. tests.
- **Priorities**: P0 = blocks the critical path or fixes an RC-class user-facing failure; P1 = core roadmap; P2 = quality/polish.

---

### EPIC 1 — Audio Foundation & Observability

**T1.1 — Audio telemetry module + instrument legacy pronunciation path** `P0 · 5 SP`
- **Background**: RC-0 — every failure branch in `audio.ts` is `catch {}`; the repo's `lib/logging` pipeline is never used by audio (RCA §7 RC-0).
- **Objective (tech)**: A `shared/audio/telemetry.ts` diagnostics bus (typed events: `attempt`, `tier_result`, `failure{reason}`, `cancelled{by}`) with dev-console sink + sampled production sink through `lib/logging/browser.ts`. Instrument every ⓕ0–ⓕ13 branch from RCA §5.
- **Objective (biz)**: One week of production data replaces guesswork on where pronunciation dies; all later epics get before/after metrics.
- **Scope**: New module; edits inside `audio.ts` failure branches only (no control-flow changes); new action enums in `lib/logging/actions.enum.ts`; sampling rate env-configurable (default 5%).
- **Files**: `shared/audio/telemetry.ts` (new), `shared/utils/audio.ts`, `lib/logging/actions.enum.ts`, `lib/logging/schema.ts`.
- **Deps**: none. **AC**: every RCA-§5 failure point emits exactly one event with tier + reason; sampling verified; zero playback behaviour change (integration snapshot test). **Testing**: unit (event emission per branch, via T10.1 fakes when landed; interim: module-level vitest with stubs).
- **Rollback note**: telemetry is fire-and-forget behind try/catch — a logging outage must never break playback (explicit AC).

**T1.2 — Attach utterance-level handlers; report speechSynthesis outcomes** `P0 · 2 SP`
- **Background**: `playBrowserSpeech` returns `true` meaning "attempted" (RCA ⓕ13); no `utterance.onerror`/`onend` exists (RC-2).
- **Objective**: Attach `onend`/`onerror`; emit `voice_result{ok|error-code}`; detect the no-ja-voice case (`getJapaneseVoice() === undefined`) and emit `no_ja_voice{platform}`.
- **Files**: `shared/utils/audio.ts`. **Deps**: T1.1. **AC**: fallback outcomes distinguishable in telemetry; `language-unavailable` captured where browsers fire it (known-inconsistent, RCA §6 — absence tolerated).

**T1.3 — Export `stopAllAudio()`; stop on route change and pagehide** `P0 · 3 SP`
- **Background**: RC-7/D3 — `stopActivePronunciation` unexported; audio and timers survive navigation; no `pagehide` handler exists repo-wide.
- **Objective**: Export `stopAllAudio()` (wraps stop + `clearPronunciationTimer`); invoke from a small client component mounted in both layout groups on `usePathname()` change and `pagehide`.
- **Scope note**: **Stop, don't suspend** — SFX context untouched (clicks during navigation are fine).
- **Files**: `shared/utils/audio.ts`, `app/(immersive)/layout.tsx`, `app/(main)/layout.tsx` (or a shared `AudioLifecycle` client component imported by both).
- **Deps**: none. **AC**: pronunciation + pending debounce killed on navigation (Playwright test in T10.4 backfills); telemetry `cancelled{by:"navigation"}` emitted. **Regression risk**: over-stopping — verify replay buttons on the *destination* page still work (add to R-STD for this task).

**T1.4 — Fix `sfx.ts` unlock listeners (`once` + removal)** `P0 · 1 SP`
- **Background**: D5 — five permanent listeners re-run `getContext()`/`resumeContext()` on every input forever (`sfx.ts:170-182`).
- **Objective**: Single named handler, all five events `{once:true, passive:true}`, plus self-removal of sibling listeners after first successful resume.
- **Files**: `shared/utils/sfx.ts`. **AC**: after first gesture, zero audio listeners remain on window (assert via `getEventListeners` in dev test); SFX still unlocked on cold load.

**T1.5 — Fix `warmSpeechVoices` leak; voice-readiness promise** `P0 · 2 SP`
- **Background**: D4/RC-8 — a fresh `voiceschanged` listener per pronunciation, unbounded; warming same-tick as playback can't help the current utterance.
- **Objective**: Hoist to module scope: one `voicesReady: Promise<SpeechSynthesisVoice[]>` resolved by first non-empty `getVoices()` or `voiceschanged`, with 250 ms-interval poll fallback (easy-speech pattern, RCA §17.3). Legacy playback consults the resolved cache only (no await added yet — behaviour-neutral; the await lands in T3.6).
- **Files**: `shared/utils/audio.ts`. **AC**: listener count constant across 100 sequential `playAudio` calls; first-fallback voice selection unchanged or better.

**T1.6 — Unify pronunciation delays; remove Match's raw `setTimeout`** `P1 · 2 SP`
- **Background**: D8/D9 — three delays (220/250/300 ms) all inside the 540 ms `correct` tail; Match bypasses the debounce entirely (`useMatchModeSession.ts:281`).
- **Objective**: One exported `PRONUNCIATION_FEEDBACK_DELAY_MS` constant; Match switched to `playPronunciationFeedback`. **Do not** change the constant's value yet (that's a feel change owned by E6/T6.2) — just converge call sites on 250 ms.
- **Files**: `shared/utils/audio.ts`, `useMatchModeSession.ts`, `useGameEngine.ts`, `useKanaQuizSession.ts`. **AC**: single constant; Match rapid-pair test shows ≤1 active pronunciation (debounce semantics now apply). **Flag**: none (30 ms deltas are sub-perceptual; RCA §12.1 table updated).

**T1.7 — Telemetry review & Gate A report** `P0 · 2 SP`
- **Background**: §2 rule 3 — telemetry must re-rank RCs before Epic 3 spend.
- **Objective**: After ≥5 days of production data: failure distribution by tier/reason/platform; written Gate A memo confirming or re-ordering E3/E4/E5 priorities.
- **Deps**: T1.1–T1.5 deployed. **AC**: memo in `docs/audio-gate-a.md`; epic order confirmed/adjusted in this plan. **DoD note**: this is the only task whose deliverable is a document.

---

### EPIC 2 — AudioManager & Provider Seam

**T2.1 — Scaffold `shared/audio/` core: types, manager, channels** `P0 · 5 SP`
- **Background**: RCA §14.1–14.2 — single owner replacing two module singletons; channel routing so mute/volume/ducking have one point of control (Discovery §2.1: three uncoordinated output paths).
- **Objective**: `types.ts` (Channel, SpeakRequest, PlaybackHandle, SfxCue, policies — the exact API of RCA §14.2), `manager.ts` (constructor-injected `{contextFactory, transports, clock, telemetry}`), `channels.ts` (lazy `AudioContext` + per-channel `GainNode` for `sfx|voice|music|ambient` → master → compressor, porting `sfx.ts:80-91` topology).
- **Objective (biz)**: none user-visible; this is the keystone enabling every control (RCA §19.1: 7 of 11 future capabilities blocked on it).
- **Scope**: Framework-free; no React; no consumer changes; voice channel routes **decoded buffers and media-element sources** through Web Audio where possible, with a documented iOS fallback (media-element direct out — silent-switch behaviour differs, RCA §6 WebKit 237322; note in README).
- **Files**: new `shared/audio/{types,manager,channels}.ts`. **Deps**: T1.1 (telemetry consumed). **AC**: manager instantiable with fakes; channel gains independently settable; zero imports from `features/*` (repo rule). **Testing**: pure unit, no globals stubbed.

**T2.2 — `AudioProvider` + `useAudio()` React bindings** `P0 · 3 SP`
- **Background**: RCA §14.1 — provider owns the singleton, installs lifecycle once.
- **Objective**: `shared/audio/react/AudioProvider.tsx` constructs the manager (once, ref-stable), subscribes to settings store, exposes `useAudio()`. Mounted in `lib/providers.tsx` inside `AuthGate` (audio irrelevant pre-auth; keeps `/login` clean — D18).
- **Files**: new `shared/audio/react/*`; `lib/providers.tsx`. **Deps**: T2.1. **AC**: provider mounts once; HMR-safe (manager survives fast refresh via module ref); `useAudio()` throws helpfully outside provider.

**T2.3 — Migrate SFX presets into the manager; facade delegates** `P0 · 3 SP`
- **Background**: presets are good (Discovery §7.1 strengths); ownership is the problem.
- **Objective**: Port `CORRECT_TONES`/`WRONG_TONES`/click + envelope/scheduling into `shared/audio/sfx.presets.ts` on the `sfx` channel, **including per-preset `tailMs` metadata** (540/390/65 — Discovery §6.1) for T6.2. `shared/utils/sfx.ts#playSFX` becomes a two-line delegate behind `AUDIO_V2` (else legacy body).
- **Files**: new `shared/audio/sfx.presets.ts`; `shared/utils/sfx.ts`. **Deps**: T2.1/T2.2. **AC**: A/B: rendered output perceptually identical (same frequencies/envelopes — assert scheduling calls via fake context); throttle semantics preserved; flag-off path untouched.

**T2.4 — Voice API on the manager wrapping legacy transports** `P0 · 5 SP`
- **Background**: strangler step — the manager's `speak()` (promise-returning `PlaybackHandle`, RCA §14.2) initially delegates to the *existing* `audio.ts` internals.
- **Objective**: `speak(req)` with `replace-same | queue-distinct | ignore` interruption intents (implemented minimally: replace = today's last-wins; queue depth 1); `playAudio`/`playPronunciationFeedback` facades delegate under `AUDIO_V2`. `stopAll()` moves onto the manager (T1.3's export forwards).
- **Files**: `shared/audio/manager.ts`, `shared/audio/voice/legacyTransport.ts` (new, wraps current media+speech logic *by extraction, not rewrite*), `shared/utils/audio.ts` (facade).
- **Deps**: T2.1–T2.3. **AC**: flag on → behaviour identical to legacy (integration suite T10.3 asserts: same cancel semantics, same debounce, same fallback order); handles resolve with real outcomes (RC-0 API half fixed).
- **Risk note**: extraction of `audio.ts` internals must preserve the **token-increment-before-teardown ordering** (Discovery §17.13 — load-bearing); add an explicit unit test freezing it.

**T2.5 — Settings store: SFX/voice mute + volumes** `P0 · 2 SP`
- **Background**: D6 — no mute/volume anywhere; `SettingsMenu` docblock advertises an SFX toggle that doesn't exist (D16). DEC-1 default: `globalAutoPlay` = auto-pronunciation only; new independent SFX controls.
- **Objective**: Extend `lib/app-store.ts` persisted partialize: `sfxMuted`, `voiceMuted`, `sfxVolume`, `voiceVolume` (0–1, defaults 1); provider pipes to channel gains. No UI yet (T7.1).
- **Files**: `lib/app-store.ts`, `shared/audio/react/AudioProvider.tsx`. **Deps**: T2.2. **AC**: settings persist across reload (existing `app-settings` key, additive — no migration needed for existing users; absent keys default).

**T2.6 — Centralize `globalAutoPlay` enforcement in the manager** `P0 · 3 SP`
- **Background**: D2 — 6 of 10 autoplay sites ignore the setting (Discovery §11.2). DEC-1.
- **Objective**: `SpeakRequest.trigger: "auto" | "user"`; manager drops `auto` requests when `globalAutoPlay` is off (telemetry `suppressed{setting}`); all sites obey **by construction** once migrated (T2.7). Existing per-site `globalAutoPlay` reads removed in T2.7, not here.
- **Files**: `shared/audio/manager.ts`. **Deps**: T2.4/T2.5. **AC**: unit matrix trigger×setting; **flagged behaviour change** — with `AUDIO_V2` on, Speed/Match/Quiz/Survival newly respect the toggle (product sign-off attached to Gate B; this is a *bug fix* under DEC-1).

**T2.7 — Migrate all 14 call-site modules to `useAudio()` / manager** `P0 · 8 SP (3 batches)`
- **Background**: Discovery §5.2 call-site table is the checklist. Leaf components calling browser APIs directly is *the* layering violation (Discovery §4.1).
- **Objective**: Batch A kana (ChartCell, AnswerFeedback, QuizPlaying, useKanaPlayDeck, useKanaQuizSession, useSurvivalGame, KanaLearn/Practice); Batch B flashcard players + audio buttons; Batch C games (useMatchModeSession, useGameEngine — SFX-only here; sequencing waits for E6). Each call becomes `audio.speak({text, trigger, source})` / `audio.play("correct")`. Per-site `globalAutoPlay` reads deleted (now centralized).
- **Files**: the 14 modules (Discovery §5.2). **Deps**: T2.4–T2.6. **AC**: zero direct imports of `playAudio`/`playSFX` outside `shared/utils` facades (lint rule added: `no-restricted-imports`); per-batch manual smoke; each batch its own PR/deploy.
- **Regression checklist add**: replay buttons in all four components; Drop-mode keystroke sounds; Match pair flow.

**T2.8 — Real speech policy module (or deletion)** `P1 · 2 SP`
- **Background**: D1 — `allowAudio` tautology; docblock describes an unimplemented listening-quiz rule. DEC-3 default: implement.
- **Objective**: `shared/audio/policy.ts`: `allowAudio({stage, questionType, trigger})` with real prompt-stage blocking and a listen-type exception hook (dormant until DEC-5 revisited); delete `shared/utils/speechPolicy.ts` re-export after consumers move; fix the false comments (`AnswerFeedback.tsx:27`, `useMatchModeSession.ts:280`, `SettingsMenu.tsx:13` — D-register items D1/D16, Discovery §14.1 smell 8).
- **Files**: new `shared/audio/policy.ts`; 4 consumer sites; `shared/utils/speechPolicy.ts` (deprecate). **Deps**: T2.7. **AC**: property test — prompt stage never speaks for non-listen types; feedback always allowed; comments match behaviour.

---

### EPIC 3 — Japanese Pronunciation Pipeline

**T3.1 — `/api/tts` route handler with vendor adapter** `P0 · 5 SP`
- **Background**: RCA §13.2 Tier 2; RCA §6.3 — CORS makes client-side caching of any Google-hosted audio impossible; own origin fixes fetch/cache/retry at once. DEC-6: Google Cloud TTS Neural2.
- **Objective**: Next.js route handler: zod-validated `{text ≤200 chars, lang, voice?}`; Firebase ID-token verification (reuse `lib/logging`'s token-verified server-action pattern); vendor adapter interface (`synthesize(req) → {audio: Buffer, mime}`) with Google impl (Neural2, MP3, SSML hook for kana accent pinning); per-user rate limit (e.g. 30 req/min) + global daily cap guarding the free tier.
- **Objective (biz)**: pronunciation for arbitrary user decks with SLA-backed transport; cost ceiling enforced server-side.
- **Files**: new `app/api/tts/route.ts`, `shared/audio/voice/vendor/google.ts` (server-only); env: `GOOGLE_TTS_*`. **Deps**: T2.1 types; GCP project + key (ops task). **AC**: 200/4xx/429 paths tested (route unit tests with mocked vendor); no key reaches client bundle; cold latency <800 ms p50 from local test.
- **Rollback**: route removal is safe pre-T3.7 (nothing consumes it).

**T3.2 — Server-side audio cache (Firebase Storage) + CDN headers** `P0 · 3 SP`
- **Background**: Duolingo dedup pattern (RCA §12.1): each unique string synthesized once per app lifetime.
- **Objective**: Route checks/writes `tts/{lang}/{voice}/{sha256(text)}.mp3` in Firebase Storage before calling the vendor; responds with redirect to a long-lived signed/public URL (decision in-task: public-read bucket path vs proxy streaming — default public-read, content is non-sensitive dictionary audio) + `Cache-Control: public, max-age=31536000, immutable`.
- **Files**: `app/api/tts/route.ts`, `lib/firebase-admin.ts` usage, storage rules. **Deps**: T3.1. **AC**: second request for same text = zero vendor calls (assert via vendor-mock counter); URL cacheable by browser HTTP cache.
- **Privacy note (from Discovery §16)**: user deck text now goes to Google *Cloud* under the app's DPA instead of translate.google.com anonymously — strictly better; settings-page disclosure line added (ties to T7.1).

**T3.3 — Client `CloudTtsProvider`** `P0 · 3 SP`
- **Objective**: `fetch` `/api/tts` → blob → object-URL playback through the voice channel; timeout (5 s), retry ×1 with jittered backoff on network/5xx (never on 4xx); outcome via `PlaybackHandle`. Single-shot error semantics: an error after playback start **reports, never re-speaks** (kills RC-6 for this tier).
- **Files**: new `shared/audio/voice/providers/cloudTts.ts`. **Deps**: T3.1/T3.2, T2.4. **AC**: fault-injection unit tests (timeout/5xx/4xx/mid-stream) — one audible attempt max per request.

**T3.4 — Client `AudioCache` (Cache API + memory LRU)** `P1 · 3 SP`
- **Background**: RCA §13.2; DEC-7 kana-offline. Same-origin/CORS-clean URLs ⇒ non-opaque ⇒ no 7 MB padding trap (RCA §6.3).
- **Objective**: `caches.open("tts-v1")` keyed by canonical URL; memory LRU (~20 decoded buffers) above it; graceful no-op where Cache API unavailable; version prefix in cache name for T5.4.
- **Files**: new `shared/audio/voice/cache.ts`. **Deps**: T3.3. **AC**: repeat play = zero network (Playwright offline replay of cached word passes); quota-error path degrades to network-only + telemetry.

**T3.5 — `StaticAssetProvider` for kana** `P0 · 2 SP`
- **Objective**: Resolve single-kana text via `public/audio/kana/manifest.json` (codepoint → file+hash) to `/audio/kana/v1/{cp}.mp3`; play through voice channel; miss → chain continues.
- **Files**: new `shared/audio/voice/providers/staticAsset.ts`. **Deps**: T2.4; E5 assets (can land with a 5-clip test fixture before full corpus). **AC**: kana hit = zero API/vendor involvement; non-kana text passes through instantly (<1 ms decision).

**T3.6 — Hardened `SpeechSynthesisProvider`** `P0 · 5 SP`
- **Background**: RC-2/3/5/8 cluster; RCA §14.3 tier-4 spec; §6 platform rules.
- **Objective**: Rewrite the fallback as a provider: ① await `voicesReady` (T1.5's promise); ② **prefer `localService: true` ja voices; remote "Google 日本語" demoted to last** (RCA §6.3); ③ 300 ms gap after any `cancel()` before `speak()` (RC-5 band 250–500); ④ `onend`/`onerror` → handle resolution; ⑤ **no ja voice ⇒ fail fast** (`no_ja_voice`) instead of mangled default-voice speech (behaviour change: silence+report beats English-voice kana — product sign-off at Gate C); ⑥ activation guard: on iOS-class platforms, `auto`-trigger requests without stored gesture-unlock **defer to T4.4's queue or fail reported**, never silently drop.
- **Files**: new `shared/audio/voice/providers/speechSynthesis.ts`. **Deps**: T2.4, T1.5. **AC**: fake-synth unit matrix (voices empty→ready; cancel-then-speak gap honored; error mapping); manual: Chrome/Firefox/Safari desktop + iOS device pass.

**T3.7 — Provider chain orchestrator + circuit breaker** `P0 · 5 SP`
- **Background**: RCA §14.3 — ordered tiers with per-tier health; converts silent degradation into observable mode switches.
- **Objective**: Chain `[static, cache, cloudTts, speechSynthesis(, translateTtsLegacy)]`; per-tier breaker (3 failures/60 s → open 5 min, half-open probe); first tier claiming the request wins; every transition telemetered; wired as the `AUDIO_TTS_TIERS`-flagged implementation behind `speak()`.
- **Files**: new `shared/audio/voice/voiceService.ts`; `manager.ts` wiring. **Deps**: T3.3–T3.6. **AC**: fault-injection integration tests: each tier's failure promotes the next within one request; breaker opens/half-opens per spec; flag off ⇒ legacy transport untouched. **Gate C artifact**: one-week telemetry comparison (failure rate, tier distribution) vs T1.7 baseline.

**T3.8 — `language` field on `FlashCardContent`** `P1 · 3 SP`
- **Background**: Discovery hidden-behaviour #4 / RCA §13.1 — `tl=ja` assumed for arbitrary `card.primary`. DEC-4.
- **Objective**: Add optional `language?: string` (BCP-47, default `"ja"`) to `domain/types.ts` + `types/flashcard.types.ts`; LessonBuilder field (default ja, per-deck); `SpeakRequest.lang` sourced from it; Firestore reads tolerate absence (no backfill needed).
- **Files**: `features/flashcard/domain/types.ts`, `types/flashcard.types.ts`, LessonBuilder components, `getAudioText` callers pass lang. **Deps**: none (parallel). **AC**: old cards unaffected; non-ja deck speaks with matching cloud voice or fails fast per tier rules.

**T3.9 — Session prefetch (warm the cache)** `P2 · 3 SP`
- **Background**: RCA §13.4 — study queue is known at `buildSession()`/kana-row time; prefetch converts cold-latency variance into silence-free feedback.
- **Objective**: On session start, background-fetch first N=10 queue items via cache layer (low priority, abortable on route change); kana rows prefetch on hub entry.
- **Files**: `shared/audio/voice/prefetch.ts` (new); hooks: `useStudySession`, kana session starts. **Deps**: T3.4/T3.7. **AC**: telemetry `cache_hit` ≥80% for in-session feedback pronunciations; prefetch aborts cleanly on navigation (no orphan fetches).

**T3.10 — Transitional `TranslateTtsLegacyProvider` (breaker-guarded)** `P1 · 2 SP`
- **Background**: §2 rule 4 — transitional only; keeps a safety net between Gate C and Gate E for uncached words if cloud tier misbehaves early.
- **Objective**: Wrap the extracted legacy media path as the chain's optional 5th tier, flag `AUDIO_LEGACY_TTS=on` by default at Gate C, off after 2 clean weeks; removal is T11.1.
- **Files**: `shared/audio/voice/providers/translateTts.legacy.ts`. **Deps**: T3.7. **AC**: only reachable when tiers 1–4 all fail/skip; telemetry proves usage rate (drives T11.1 timing).

---

### EPIC 4 — Browser Compatibility & Lifecycle

**T4.1 — Unified gesture unlock owned by the provider** `P0 · 3 SP`
- **Background**: RC-3 iOS per-element blessing defeats the current new-element-per-play design (RCA §6.2); two competing unlock rituals exist (Discovery §3.1/3.2).
- **Objective**: One unlock module: first gesture → resume SFX context **and** unlock voice path (iOS strategy: route voice through Web Audio (`decodeAudioData` + buffer source) where possible so *context* unlock suffices; media-element path kept for streaming with a **reused, blessed singleton element pool (2 elements)** instead of new-per-play). All legacy per-module listeners removed (supersedes/absorbs T1.4's handler).
- **Files**: new `shared/audio/unlock.ts`; `channels.ts`; legacy listener removal in facades. **Deps**: T2.1/T2.4; informs T3.3/T3.5 playback mechanism. **AC**: iOS device: auto-pronunciation succeeds ≥95% after first tap (vs §6.2 baseline failure); desktop unchanged. **Testing**: mandatory device pass (iPhone Safari, Android Chrome).

**T4.2 — Visibility & pagehide lifecycle** `P1 · 2 SP`
- **Background**: RC-7/R8 — audio continues in hidden tabs; timers fire stale on return (Discovery §12.6).
- **Objective**: Provider installs `visibilitychange`: hidden → cancel active voice + pending sequences, suspend SFX context after 5 s grace; visible → resume context only. `pagehide` → `stopAll` (absorbs T1.3's handler into the manager).
- **Files**: `shared/audio/react/AudioProvider.tsx`, `manager.ts`. **Deps**: T2.2. **AC**: Playwright: backgrounded tab emits `cancelled{by:"hidden"}`; return-to-tab plays next sounds normally; no stale pronunciation on return.

**T4.3 — iOS audio-session friendliness** `P2 · 2 SP`
- **Background**: RCA §6 — running web audio flips iOS session to Playback, stopping the user's Music app; silent switch splits channels (Web Audio muted, media elements not).
- **Objective**: Where `navigator.audioSession` exists, set `ambient` for SFX-only periods and `playback` during voice; document (README + settings hint) the silent-switch asymmetry; suspend context when idle >30 s (shared with T9.3).
- **Files**: `shared/audio/session.ts` (new). **Deps**: T4.1. **AC**: device check: background music resumes after session idles; no regression in SFX latency (context resume <50 ms budget on wake).

**T4.4 — Activation-aware speak queue** `P1 · 3 SP`
- **Background**: RC-3 — non-gesture speak on iOS drops silently today.
- **Objective**: Manager tracks activation state (from unlock module); `auto` requests arriving pre-unlock on gesture-strict platforms are queued (depth 1, newest wins) and flushed on next gesture ≤10 s later, else dropped with `failure{reason:"no-activation"}`.
- **Files**: `manager.ts`, `unlock.ts`. **Deps**: T4.1. **AC**: unit (fake platform matrix); iOS device: first reveal-pronunciation of a fresh session plays on the *next* tap rather than never.

**T4.5 — Device QA matrix execution** `P1 · 3 SP per round`
- **Objective**: Execute `docs/device-qa.md` (authored in T10.5) on: Chrome/Firefox/Edge/Safari desktop; iPhone Safari (incl. silent switch, low-power, background); Android Chrome + Samsung Internet (voice-pack-absent case); offline; incognito. Two mandatory rounds: after Gate C and before Gate E.
- **Deps**: T10.5 checklist; Gates C/E timing. **AC**: all P0 rows pass or have filed tasks; results appended to the QA doc.

---

### EPIC 5 — Audio Assets (kana corpus)

**T5.1 — `scripts/generate-kana-audio.ts` generation pipeline** `P0 · 3 SP`
- **Background**: RCA §13.2 Tier 1 — ~200 kana, ≈3 MB, generated once (RCA §12.3 sizing).
- **Objective**: Node script (repo `scripts/`, runs with service key, never in CI-per-build): reads `features/kana/data/{hiragana,katakana}.ts` datasets; synthesizes each char via vendor adapter with **SSML yomigana+accent pinning** (Google `<phoneme>` `^`/`!` — RCA §12.4); outputs `public/audio/kana/v1/{codepoint}.mp3` + `manifest.json` (char → file, sha256, voice, generator version); idempotent (skips existing hashes).
- **Files**: new script; reuses `shared/audio/voice/vendor/google.ts`. **Deps**: DEC-6 credentials; T5.2 voice choice (can run with placeholder voice for fixtures). **AC**: 100% dataset coverage incl. digraphs/extended rows (Discovery: groups `yōon`, `extended` exist in data); each clip ≤20 KB; deterministic re-run = no diff.

**T5.2 — Voice bake-off & native-speaker review** `P0 · 2 SP`
- **Objective**: Generate 15-char sample set with Neural2-B, Neural2-C, Chirp3-HD, VOICEVOX; blind listening review (native/advanced speaker) scoring clarity + accent correctness for **isolated kana**; record decision + rationale in `docs/audio-voice-decision.md`.
- **Deps**: T3.1's vendor adapter (or standalone script auth). **AC**: signed-off voice; DEC-6 cost re-confirmed. **Risk**: isolated-mora quality varies by vendor — this task exists to catch it before corpus generation.

**T5.3 — Commit corpus + serving configuration** `P1 · 1 SP`
- **Objective**: Commit `v1` corpus + manifest; verify Next static serving with immutable cache headers (`next.config.ts` headers or hosting config); bundle-budget check (assets served, not bundled).
- **Deps**: T5.1/T5.2. **AC**: cold fetch of a kana clip <50 ms TTFB from local host; headers immutable; repo size delta ≈3 MB acknowledged in PR.

**T5.4 — Asset versioning scheme** `P2 · 1 SP`
- **Objective**: Version rules doc: path (`/v1/`) + manifest `version` + cache-name suffix (T3.4) bump together; a voice change = new version dir, old retained one release for rollback.
- **AC**: written into `shared/audio/README.md`; cache invalidation on version bump covered by a unit test in T3.4.

---

### EPIC 6 — Game Audio Sequencing

**T6.1 — Sequencer core** `P0 · 5 SP`
- **Background**: RCA §8.1 — three uncoordinated clocks; deterministic sequencing impossible without a completion-aware owner. Design: RCA §14.4, spec §10 below.
- **Objective**: `sequence(key, steps[], opts)`: steps = `{sfx}|{waitMs}|{waitFor:"sfx-tail"}|{speak}|{call}`; per-key interruption policy (`replace|queue|ignore`); abort tokens integrated with `stopAll`/lifecycle; promise-returning; policies pure functions (fast-check-testable).
- **Files**: new `shared/audio/sequencer.ts`. **Deps**: T2.4 handles; T2.3 tail metadata. **AC**: unit: interleaved sequences honor policy matrix; abort mid-step leaves no timers (fake clock assertion).

**T6.2 — Feedback timing constants from SFX tails** `P1 · 1 SP`
- **Background**: D9 — every delay sits inside the 540 ms `correct` tail; stated intent unmet in all modes (Discovery §12.1).
- **Objective**: `waitFor:"sfx-tail"` resolves from preset metadata (correct 540/wrong 390); product-tunable overlap allowance (default: voice starts at tail−150 ms — full-wait feel is checked in T6.3 sign-off).
- **Deps**: T6.1. **AC**: measured voice-start ≥ tail−150 ms in integration test with fake clock.

**T6.3 — Adopt in Speed mode** `P0 · 5 SP`
- **Background**: worst jitter (poll-driven ±100 ms, RCA §9.3); pronunciation can bleed into next question.
- **Objective**: `GameEngine` gains an `onFeedback(result)` callback (existing `onSFXPlay` pattern — `engine/types.ts:117-120`); `useGameEngine` replaces the poll-watching effect with a sequence: `[sfx, waitFor tail, speak(card), call(engineAdvanceGate)]`; the 1100 ms advance becomes `max(1100ms, sequence completion)` — **flag `AUDIO_SEQ_SPEED`**.
- **Files**: `games/speed/engine/core/GameEngine.ts` (callback emit only), `useGameEngine.ts`. **Deps**: T6.1/T6.2; T2.7 batch C. **AC**: zero clipped pronunciations at fast answering (Playwright rapid-answer script); question cadence change ≤200 ms p50 vs baseline (product sign-off); flag off = current behaviour.
- **Note**: this does *not* remove the 100 ms state poll (rendering concern) — that's T9.2.

**T6.4 — Adopt in Match mode** `P1 · 3 SP`
- **Background**: R1 stacked timers; input unlock at 400 ms precedes speech (RCA §9.2).
- **Objective**: match-resolution sequence `[sfx correct, waitFor tail, speak(word)]` with `queue-distinct` (depth 2) so consecutive pairs *queue* instead of killing each other; input unlock stays at 400 ms (gameplay pace preserved — audio queues instead of gating input). Wrong-pair: `[sfx wrong]` only. Flag `AUDIO_SEQ_MATCH`.
- **Files**: `useMatchModeSession.ts`. **Deps**: T6.1/T6.2. **AC**: two rapid pairs → two complete pronunciations back-to-back; stress: 5 pairs in 3 s → queue caps at 2, oldest dropped with telemetry.

**T6.5 — Adopt in Kana Quiz / Survival ∞ & Time** `P1 · 3 SP`
- **Objective**: `processAnswer` emits one sequence `[sfx, waitFor tail, speak(char)]`; advance timers (1250/1550 ms) unchanged (they already exceed sequence length for single kana — RCA §10); replay button issues `trigger:"user"` `replace-same`. Flag `AUDIO_SEQ_QUIZ`.
- **Files**: `useKanaQuizSession.ts`. **Deps**: T6.1/T6.2; T2.7 batch A. **AC**: R3 race resolved — manual replay no longer silently kills auto-pronunciation (both play per policy: user replay replaces pending auto).

**T6.6 — Drop-mode audio redesign** `P1 · 3 SP`
- **Background**: RCA §9.5 chaotic-by-design; DEC-8. UX issues: same-tick click+correct+speak; `wrong` on every stray key (Discovery hidden-behaviour #8).
- **Objective**: word-complete = `[sfx correct, speak(char, policy:"ignore-if-busy")]` — pronunciation plays only if voice channel idle (fast typists get SFX always, speech when it fits — no interruption storm); keystroke `click` kept; stray-key `wrong` only when a word is active on screen (policy fix, T7.5 covers the no-word case). Flag `AUDIO_SEQ_DROP`.
- **Files**: `useSurvivalGame.ts`. **Deps**: T6.1. **AC**: 120 wpm simulated typing: zero mid-word speech cancellations; audio load ≤1 speak/s.

**T6.7 — Shared flashcard reveal-pronunciation hook** `P1 · 2 SP`
- **Background**: three duplicated edge-detector effects (Discovery §8.6); speech starts while card is edge-on (D15).
- **Objective**: `useRevealPronunciation(revealed, card)` in `features/flashcard/hooks/`: single implementation, `trigger:"auto"`, delay aligned to flip midpoint (250 ms of the 500 ms CSS flip — voice starts as text becomes legible); replaces the three copies.
- **Files**: new hook; `FlashcardLearn/Practice/MistakeReview.tsx`. **Deps**: T2.7 batch B. **AC**: one effect implementation; flip-timing manually verified; MC-mode untouched (T7.2 owns that).

---

### EPIC 7 — Audio UX

**T7.1 — Settings UI: SFX toggle, voice volume, disclosure** `P1 · 3 SP`
- **Background**: D6/D16; T2.5 shipped state without UI. DEC-1.
- **Objective**: Settings page: "Sound Effects" toggle + "Pronunciation" toggle/volume slider alongside existing Auto-Play (copy clarifies scopes); KanaHub `SettingsMenu.audioToggle` re-pointed at SFX mute (matching its own docblock at last); TTS privacy disclosure line (T3.2 note).
- **Files**: `app/(main)/settings/page.tsx`, `KanaHub.tsx`, `SettingsMenu.tsx`. **Deps**: T2.5. **AC**: toggles affect channels instantly (no reload); persisted; a11y-labelled (feeds T8.3).

**T7.2 — MC-mode feedback pronunciation** `P2 · 2 SP`
- **Background**: RCA §9.1 — MC cards never pronounce; MC is primary modality for AI decks. DEC-2.
- **Objective**: After MC selection grading (both Practice + MistakeReview), sequence `[sfx, waitFor tail, speak(card primary)]` within the existing 750/900 ms windows (extend window to sequence completion if needed, capped +400 ms).
- **Files**: `FlashcardPractice.tsx`, `FlashcardMistakeReview.tsx`. **Deps**: T6.1, T2.7B. **AC**: product sign-off on pacing; toggle-respecting (`trigger:"auto"`).

**T7.3 — Excise dead listen/reverse question types** `P2 · 1 SP`
- **Background**: D13 — generated only via Survival, rendered identically to `read` (RCA §9.4). DEC-5 default: excise.
- **Objective**: Remove `"listen"`/`"reverse"` from the random-type pool (`useKanaQuizSession.ts:153`); keep the type union + policy hook for future implementation; delete now-unreachable `canReplayAudio` special-casing comments.
- **Files**: `useKanaQuizSession.ts`, `AnswerFeedback.tsx`. **AC**: Survival generates only implemented types; no UI change (they were indistinguishable).

**T7.4 — "Audio unavailable" user affordance** `P2 · 2 SP`
- **Background**: RC-0's user-facing half — chain exhaustion is currently indistinguishable from success.
- **Objective**: Manager exposes `status: "ok" | "degraded" | "unavailable"` (from breaker states); audio buttons render a subtle slash/tooltip state; one non-blocking toast per session via existing `AlertProvider` on first hard failure.
- **Files**: `shared/audio/react/useAudioStatus.ts` (new), `KanaAudioButton.tsx`, `FlashcardAudioButton.tsx`. **Deps**: T3.7. **AC**: airplane-mode manual test shows state within 2 failures; no toast spam (once/session).

**T7.5 — Drop-mode annoyance fixes** `P2 · 1 SP`
- **Objective**: No `wrong` SFX when no word is on screen (Discovery hidden #8); `click` throttle for typing raised 24→45 ms (perceptual test).
- **Files**: `useSurvivalGame.ts`, preset throttle table. **Deps**: T6.6. **AC**: stray typing pre-spawn is silent; typing feel sign-off.

---

### EPIC 8 — Accessibility

**T8.1 — `aria-live` feedback announcements** `P1 · 2 SP`
- **Background**: D21 — zero live regions repo-wide; feedback = colour+motion+sound with no screen-reader channel.
- **Objective**: Polite live region in game feedback components announcing "Correct — あ, a" / "Incorrect — answer: あ, a" (mirrors `AnswerFeedback` visual copy); flashcard grading announced.
- **Files**: `AnswerFeedback.tsx`, `McChoiceGrid.tsx` or players, minimal shared `LiveAnnouncer`. **AC**: VoiceOver/NVDA manual pass; announcements ≤1 per answer (no double-fire on re-render).

**T8.2 — `prefers-reduced-motion` support** `P1 · 2 SP`
- **Background**: D21 — shake/flip/confetti/pulse unconditional (Discovery §12.2b).
- **Objective**: Gate `animate-shake`, flip transition, confetti, `animate-pulse` behind `motion-safe:`/media query; reduced-motion users keep colour + audio + live-region channels.
- **Files**: `globals.css`, `MatchCard.tsx`, `SurvivalQuizScreen.tsx`, `QuizPlaying.tsx`, flashcard players, `GameResultsScreen.tsx`. **AC**: OS reduced-motion → no shake/flip animation, instant state change; axe + manual.

**T8.3 — Audio controls audit (labels, focus, keyboard)** `P2 · 1 SP`
- **Objective**: All audio buttons labelled (several already have `aria-label="Replay audio"` — Discovery sweep); new settings toggles labelled + keyboard-operable; focus order sane in feedback bars.
- **AC**: axe clean on touched screens; keyboard-only replay possible.

**T8.4 — Channel-independence verification** `P2 · 1 SP`
- **Objective**: Test-backed guarantee: voiceMuted ⇏ SFX muted and vice versa; `globalAutoPlay` off still allows `trigger:"user"` replays (screen-reader users' primary path).
- **AC**: unit matrix in manager tests; manual spot-check.

---

### EPIC 9 — Performance

**T9.1 — SFX node lifecycle hygiene** `P2 · 2 SP`
- **Background**: D17 — per-tone gains never disconnected; up to ~99 nodes/s under Drop soak (Discovery §13.4, unprofiled).
- **Objective**: `onended` → disconnect osc+gains; before/after 10-min Drop soak heap/node profile recorded in PR.
- **Files**: `shared/audio/sfx.presets.ts`. **AC**: node count flat during soak; no audible change.

**T9.2 — Event-driven Speed-mode state (kill 100 ms poll)** `P2 · 5 SP`
- **Background**: Discovery §13.7 — 10 renders/s for the whole game; RCA §9.3 jitter source. Sequencing no longer depends on the poll after T6.3.
- **Objective**: Engine emits state-change callback (extends T6.3's `onFeedback` to `onStateChange`); `useGameEngine` subscribes (`useSyncExternalStore`); poll removed. **Highest-regression-risk perf task** — timer bar animation must stay smooth (engine ticks at 80 ms already drive it).
- **Files**: `GameEngine.ts`, `useGameEngine.ts`. **Deps**: T6.3 landed + stable. **AC**: React renders only on state change; timer bar visually smooth (recorded before/after); full Speed regression pass.

**T9.3 — Idle context suspension** `P2 · 1 SP`
- **Objective**: Suspend SFX/voice context after 30 s of no playback; resume-on-demand <50 ms budget (shared logic with T4.3).
- **AC**: context state `suspended` on idle dashboards/settings screens; first sound after idle not clipped (resume-await before schedule).

**T9.4 — Bundle & side-effect hygiene** `P2 · 2 SP`
- **Background**: D18 — barrel side effects load audio on `/login`; provider mount (T2.2) already moved construction post-auth; remaining: import-time listeners in legacy modules (deleted fully in E11).
- **Objective**: Interim: ensure facades are side-effect-free at import when `AUDIO_V2` on (listeners live in provider); verify `/login` registers zero audio listeners.
- **AC**: dev assertion + manual check; bundle analyzer delta recorded (final numbers at T11.5).

---

### EPIC 10 — Testing Infrastructure (continuous)

**T10.1 — Audio test harness (jsdom env + fakes + MSW)** `P0 · 5 SP`
- **Background**: D19 — node env, no setup file, hand-stubbed globals per test; components must mock the whole barrel (Discovery §14 Testability).
- **Objective**: Vitest `environment: "jsdom"` for `*.test.tsx` (project-split config keeps node env for pure units); shared `test/audio-fakes.ts`: FakeAudioContext (records scheduling calls), FakeSpeechSynthesis (scriptable voices/events), FakeClock, MSW handlers for `/api/tts`; injected via manager constructor — **no `vi.stubGlobal` in new tests**.
- **Files**: `vitest.config.ts`, new `src/test/*`. **Deps**: T2.1 API shape. **AC**: legacy `audio.test.ts` still green; example manager test using only fakes.

**T10.2 — Unit suites: providers, chain, breaker, cache, policy, sequencer** `P0 · 5 SP`
- **Objective**: Per-module suites incl. fast-check properties: breaker state machine (any failure sequence → eventually half-open probe); sequencer policy matrix (no step ordering violates policy under arbitrary interleavings); cache version-bump invalidation; policy prompt-stage invariant (T2.8).
- **AC**: ≥90% branch coverage on `shared/audio/`; CI <2 min for the audio project.

**T10.3 — Integration suite: manager end-to-end with fakes** `P0 · 3 SP`
- **Objective**: Scenario tests pinning Gate B "behaviour identical" claims: legacy-parity (cancel/debounce/fallback order), tier-failure promotion chains, lifecycle abort (route change mid-sequence), activation queue flush.
- **AC**: suite doubles as the Gate B/C sign-off artifact; failures block flag flips.

**T10.4 — Playwright browser suite** `P1 · 5 SP`
- **Objective**: Headed-Chromium (+WebKit where feasible) specs: autoplay-unlock (first gesture unblocks), navigation-stop (T1.3), rapid-click stress (Match 5 pairs/3 s; Speed fast answers; Drop 120 wpm scripted), background-tab cancel (page.visibility emulation), offline kana replay (T3.4). Audio asserted via injected telemetry sink (not actual sound), plus `navigator.mediaSession`-independent state checks.
- **Files**: new `e2e/audio/*.spec.ts`; CI job (non-blocking initially, blocking after 2 stable weeks). **AC**: pass/fail criteria per §14 table.

**T10.5 — Device QA checklist authoring** `P1 · 2 SP`
- **Objective**: `docs/device-qa.md`: per-platform scripted passes from RCA §6 matrix — iOS (first-gesture, silent switch, low power, background, Music-app interaction), Android (voice-pack absent), desktop trio, incognito, offline. Each row: steps, expected, RC reference.
- **AC**: executable by a non-author; used by T4.5.

**T10.6 — Performance benchmarks** `P2 · 2 SP`
- **Objective**: Scripted soak (10-min Drop, 5-min Speed) capturing: WebAudio node count, JS heap, network request count per pronunciation (target: 0 for cached), render count (Speed). Recorded pre-E2 (baseline), post-E6, post-E9.
- **AC**: numbers in `docs/audio-benchmarks.md`; regressions >10% block the causing PR.

---

### EPIC 11 — Migration Cleanup

**T11.1 — Remove translate_tts provider + flag** `P1 · 1 SP`
- **Deps**: 2 clean weeks post-Gate C with legacy-tier usage <0.5% of requests (T3.10 telemetry). **AC**: zero references to `translate.google.com` in `src/`; breaker chain 4 tiers.

**T11.2 — Delete legacy modules; retarget facades' last consumers** `P1 · 3 SP`
- **Objective**: Delete `shared/utils/audio.ts`, `sfx.ts`, `speechPolicy.ts`; barrel exports removed; lint rule made error-level; legacy `audio.test.ts` superseded by T10.2 suites (delete).
- **Deps**: T2.7 complete + Gate D stable. **AC**: build green; zero `playAudio|playSFX` imports outside `shared/audio`.

**T11.3 — Delete dead surface** `P2 · 1 SP`
- **Objective**: `onAudioPlay` (`speed/engine/types.ts:119`), `playSFX` volume param remnants, `isSmartMode`, `AudioStage`/`ImmersiveQuestionType` (if unclaimed by T2.8's policy), `mediaUnlocked` vestiges. (Debt items D11/D12.)
- **AC**: grep-clean; types compile.

**T11.4 — Documentation truth pass** `P2 · 2 SP`
- **Objective**: Update `CODEBASE_CONTEXT.md` §6.1 (audio architecture rewrite); write `docs/adr/001-audio-architecture.md` (decision record: tiers, vendor, channel design — the RCA is the "why", the ADR is the "what we chose"); `shared/audio/README.md` final; mark both discovery docs as historical (banner line).
- **AC**: no doc describes the pre-migration behaviour as current (Discovery §14.1 smell 8 class eliminated).

**T11.5 — Barrel side-effect removal verification + bundle numbers** `P2 · 1 SP`
- **Objective**: With legacy modules gone: `/login` bundle & runtime listener audit; record final bundle delta and listener count (target: zero audio listeners pre-auth).
- **AC**: numbers in benchmarks doc; D18 closed.

**T11.6 — Final regression pass + Gate E sign-off** `P1 · 2 SP`
- **Objective**: Full T4.5 device round; T10.3/T10.4 suites green; telemetry week-over-week comparison vs T1.7 baseline published as the project's closing artifact.
- **AC**: §19 Definition of Done satisfied line-by-line; sign-off memo.

**Story-point totals**: E1 17 · E2 31 · E3 34 · E4 13 · E5 7 · E6 22 · E7 9 · E8 6 · E9 10 · E10 22 · E11 10 — **181 SP ≈ 10–12 weeks** single senior engineer (§18), parallelizable to ~7 weeks with two.

## 7. Architecture Design

Elaborates RCA §14 into module-level contracts. No code — signatures are normative interfaces for the implementing engineer.

### 7.1 Module map (`src/shared/audio/`)

```
shared/audio/
├── types.ts                    # all public types; the only file T10.1 needs early
├── manager.ts                  # AudioManager class (constructor-injected)
├── channels.ts                 # ChannelRouter: AudioContext + 4 GainNodes + compressor
├── sfx.presets.ts              # tone presets + tailMs metadata + throttle table
├── sequencer.ts                # cue sequences, policies, abort tokens
├── policy.ts                   # allowAudio (real), autoplay gating rules
├── telemetry.ts                # DiagnosticsBus → console (dev) / lib/logging (sampled)
├── unlock.ts                   # gesture unlock + activation tracking
├── session.ts                  # visibility/pagehide/audioSession glue (iOS)
├── voice/
│   ├── voiceService.ts         # provider chain + circuit breakers
│   ├── cache.ts                # Cache API + memory LRU
│   ├── prefetch.ts             # session warm-up
│   └── providers/
│       ├── staticAsset.ts      # Tier 1: /audio/kana/v1
│       ├── cloudTts.ts         # Tier 2/3 client: /api/tts (+cache in front)
│       ├── speechSynthesis.ts  # Tier 4: hardened wrapper
│       └── translateTts.legacy.ts  # transitional Tier 5 (deleted in T11.1)
├── react/
│   ├── AudioProvider.tsx       # owns ONE manager; settings + lifecycle wiring
│   ├── useAudio.ts             # play / speak / sequence / stopAll
│   └── useAudioStatus.ts       # ok | degraded | unavailable
└── README.md
Server (outside this tree): app/api/tts/route.ts + shared/audio/voice/vendor/google.ts (server-only)
Assets: public/audio/kana/v1/*.mp3 + manifest.json ; scripts/generate-kana-audio.ts
```

**Dependency rules**: `shared/audio` imports from `shared/utils` (cn etc.) and `lib/logging` only; **never** from `features/*` (repo invariant). `features/*` consume exclusively via `react/useAudio.ts` or the transitional facades.

### 7.2 Class/component diagram (UML-style)

```
┌────────────────────────────────────────────────────────────────────┐
│ <<React>> AudioProvider                                            │
│ - manager: AudioManager (ref-stable)                               │
│ - subscribes: useAppStore(sfxMuted, voiceMuted, volumes, autoPlay) │
│ - installs: unlock listeners, visibilitychange, pagehide,          │
│             route-change stop (usePathname)                        │
└───────────────┬────────────────────────────────────────────────────┘
                │ owns 1
┌───────────────▼────────────────────────────────────────────────────┐
│ AudioManager                                                       │
│ + play(cue: SfxCueName, opts?): void                               │
│ + speak(req: SpeakRequest): PlaybackHandle                         │
│ + sequence(key, steps: SequenceStep[], opts?): SequenceHandle      │
│ + stopAll(reason: StopReason): void                                │
│ + setChannelVolume(ch, v) / muteChannel(ch, m)                     │
│ + status(): AudioStatus     + diagnostics: DiagnosticsBus          │
│ - ctor({contextFactory, voiceService, presets, clock, telemetry,   │
│         settingsSnapshot})            ← everything fakeable        │
└───┬──────────────┬──────────────────┬─────────────────┬────────────┘
    │ 1            │ 1                │ 1               │ 1
┌───▼──────────┐ ┌─▼─────────────┐ ┌──▼────────────┐ ┌──▼──────────┐
│ChannelRouter │ │ Sequencer     │ │ VoiceService  │ │ Unlock/     │
│ ctx, gains:  │ │ active: Map<  │ │ tiers:        │ │ Session     │
│ sfx|voice|   │ │  key,Sequence>│ │  Provider[]   │ │ activation  │
│ music|ambient│ │ policies      │ │ breakers:     │ │ state,      │
│ compressor   │ │ abortTokens   │ │  Map<tier,CB> │ │ deferred    │
└──────────────┘ └───────────────┘ └──┬────────────┘ │ speak queue │
                                      │ 1..*         └─────────────┘
                       ┌──────────────▼──────────────┐
                       │ <<interface>> VoiceProvider │
                       │ + id: TierId                │
                       │ + canHandle(req): bool      │
                       │ + speak(req, signal):       │
                       │     Promise<TierResult>     │
                       └──┬─────────┬────────┬───────┘
                 StaticAsset   CloudTts   SpeechSynth   TranslateTtsLegacy
                       (CloudTts is fronted by AudioCache)

SpeakRequest { text; lang; trigger: "auto"|"user"; source: string;
               interruption: "replace-same"|"queue-distinct"|"ignore-if-busy" }
PlaybackHandle { done: Promise<{status: "completed"|"cancelled"|"failed";
                                tier?: TierId; reason?: string}>; cancel(): void }
SequenceStep = {sfx} | {waitMs} | {waitFor:"sfx-tail"} | {speak} | {call}
```

### 7.3 State flow

```
localStorage("app-settings")            user gesture           route change /
   │ zustand persist                        │                   visibility / pagehide
   ▼                                        ▼                        │
useAppStore ──subscribe──► AudioProvider ──► unlock.activate()       │
   │                            │                 │                  ▼
   │ sfxMuted/voiceMuted/       │ construct       │ flush deferred  manager.stopAll(reason)
   │ volumes/globalAutoPlay     ▼                 ▼ auto-speaks         │
   └──────────────────► AudioManager ◄────────────┘                     │
                            │        cancels sequences, voice, timers ◄─┘
      feature code          │
useAudio().sequence(...) ──►│──► Sequencer ──► ChannelRouter(sfx) ──► speakers
useAudio().speak(...) ─────►│──► policy check (trigger×autoPlay×mute)
                            │        │ allowed
                            │        ▼
                            │    VoiceService.chain(req)
                            │        │ tier iterate + breakers
                            │        ▼
                            │    Provider.speak() ──► voice channel ──► speakers
                            │        │
                            └────────┴──► telemetry (attempt/tier/result/cancel)
```

### 7.4 Lifecycle contract

| Event | Owner | Action |
|---|---|---|
| App mount (post-auth) | AudioProvider | Construct manager; channels **lazy** (no AudioContext until first play/unlock) |
| First gesture | unlock.ts | Resume context; bless media pool; flush deferred-speak queue (≤10 s old) |
| Route change | AudioProvider | `stopAll("navigation")` — voice + sequences + pending timers; SFX context untouched |
| Tab hidden | session.ts | Cancel voice + sequences; suspend context after 5 s grace |
| Tab visible | session.ts | Resume context only (never replay cancelled speech) |
| pagehide | session.ts | `stopAll("pagehide")` |
| Idle >30 s | session.ts | Suspend context; resume-await before next schedule |
| Settings change | AudioProvider | Push to channel gains / policy snapshot synchronously |
| HMR/remount | AudioProvider | Reuse module-ref manager; never double-construct contexts |

### 7.5 Browser integration points (single-file confinement)

All platform sniffing/quirk handling lives in `unlock.ts` + `session.ts` + `providers/speechSynthesis.ts` — **no feature code ever branches on platform**. The quirks each file owns map 1:1 to RCA §6 rows (iOS per-element blessing → element pool; activation queue; audioSession; local-voice preference; cancel→speak gap; voices-ready promise).

---

## 8. Audio Source Strategy

### 8.1 Comparison (from RCA §12/§13 evidence, decision-ready)

| Option | Reliability | JA quality/accent | Latency | Cost | Offline | UGC coverage | Verdict |
|---|---|---|---|---|---|---|---|
| **Static pre-generated assets** | ★★★★★ deterministic | ★★★★★ (SSML accent-pinned, human-reviewed once) | ★★★★★ (<50 ms cached) | one-time ≈$0 (free tier) | ★★★★★ (HTTP+Cache API) | ✘ finite corpus only | **Tier 1 — kana** |
| **Cloud-generated, server-cached** | ★★★★☆ (SLA vendor + own transport) | ★★★★☆ Neural2 | ★★★☆☆ first-gen ~800 ms, then cached | ≈$0 at this scale (§6 T3.1 caps) | ★★★☆☆ after first play | ★★★★★ any text | **Tier 2/3 — vocabulary** |
| **Runtime browser TTS** | ★★☆☆☆ (RC-2/5/8 class) | ★★☆☆☆ device-dependent, no accent control | ★★★★☆ | free | ★★☆☆☆ local voices only | ★★★★★ | **Tier 4 — emergency only** |
| **Native recordings** | ★★★★★ | ★★★★★ gold standard | ★★★★★ | studio $$, weeks/batch (Duolingo's stated reason to avoid) | ★★★★★ | ✘ | Future option for kana v2 (WaniKani model); not v1 |
| **Hybrid (above tiers composed)** | — | — | — | — | — | — | **The recommendation** — identical in shape to Yomitan/Duolingo/Anki patterns (RCA §12) |
| translate_tts (status quo) | ★☆☆☆☆ (RC-1) | ★★★☆☆ | ★★☆☆☆ uncached | free until blocked | ✘ (uncacheable, CORS) | ★★★★☆ | **Retired** |

### 8.2 Why the hybrid is superior (explicit argument)

1. **Reliability follows content shape.** The core corpus is *finite and known* (~200 kana) — for finite content, static assets are strictly dominant on every axis except authoring cost, which is one-time ≈$0. The unbounded tail (user decks) *cannot* be pre-shipped — for it, generate-once-cache-forever is the proven industry pattern (Duolingo, HyperTTS; RCA §12.1/12.2).
2. **Failure modes become independent.** Today one endpoint's throttling degrades everything (RC-1 → RC-2 cascade). Tiered sources fail independently: static assets cannot rate-limit; the cloud tier is SLA-backed and retryable; browser TTS remains as the zero-infrastructure floor.
3. **Consistency is a pedagogical feature.** One reviewed voice with pinned pitch accent for every learner beats per-device voices — the exact reason WaniKani re-recorded its whole corpus rather than mix voices (RCA §12.1).
4. **It's the only cache-compatible design.** The current endpoint is architecturally uncacheable (no CORS → opaque → 7 MB quota padding; RCA §6.3). Own-origin/Storage URLs make browser HTTP cache, Cache API, and prefetch all work with zero special cases.

### 8.3 Operational design

- **Cache flow**: `speak(text)` → manifest hit? Tier 1 file → else Cache API hit? blob → else `/api/tts` (server: Storage hit? → else vendor, write-through) → client writes Cache API → play. Every layer write-through, every key content-hashed.
- **Retry**: client — 1 retry, jittered 300–800 ms, network/5xx only, per-request timeout 5 s; server — no vendor retry (client owns retry), 429-aware daily budget guard. Breakers per tier: 3 failures/60 s → open 5 min → half-open probe.
- **Failure handling**: chain exhaustion → `PlaybackHandle.done` resolves `failed{reason}` → telemetry + `useAudioStatus` degradation + (once per session) toast. Gameplay **never blocks** on failed audio: sequences treat a failed `speak` step as `waitMs(0)`.
- **Offline (DEC-7)**: kana = Tier 1 via HTTP/Cache-API cache (works offline after first visit); vocabulary = cached words play, uncached fail fast with status; no SW in v1 (future §20).
- **CDN**: Tier 1 rides Next static hosting/CDN with immutable headers; Tier 2 rides Firebase Storage public URLs (already CDN-fronted); no new infra.
- **Versioning (T5.4)**: `/audio/kana/v{n}/` + manifest `version` + cache-name suffix bump atomically; voice change ⇒ version bump; old version retained one release.

---

## 9. Japanese Audio Strategy (pronunciation-specific decisions)

- **Provider priority** (final): `staticAsset(kana) → audioCache → cloudTts → speechSynthesis [→ translateTtsLegacy until T11.1]`. Rationale per tier in §8.2; chain mechanics in T3.7.
- **Vendor**: Google Cloud TTS **Neural2** (`ja-JP-Neural2-B` default; bake-off T5.2 may select C/Chirp3-HD). Deciding factor over Azure's arguably-better raw naturalness: **only Google exposes yomigana + downstep pitch-accent SSML** (`^は!し`), which a kana-teaching app should treat as a correctness tool, not a nicety (RCA §12.4). VOICEVOX = sanctioned second voice/zero-budget alternate (credit requirement noted in ADR).
- **Accent pinning**: generation script supplies the reading explicitly for every kana clip (they *are* readings) and — future — can consume per-word accent data if pitch-accent display ever ships (§20).
- **speechSynthesis hardening spec** (T3.6) is part of this strategy, not an afterthought: local-voice-first ordering inverts the current priority list that prefers the remote "Google 日本語" voice implicated in Chrome's cutoff/outage bugs (RCA §6.3) — the single highest-leverage fallback fix.
- **Fail-fast beats fake audio**: no-ja-voice ⇒ silent-with-status rather than English-voice kana (T3.6 ⑤). An honest miss is recoverable UX; a mangled pronunciation teaches the learner something false.
- **Future expansion** hooks kept open: `voice` key in cache paths (character voices), `lang` on requests (DEC-4), listen-mode policy hook (DEC-5), per-word accent SSML (above).

---

## 10. Gameplay Sequencing Design

Global rules, then per-mode cue tables. All timings from verified constants (Discovery §12.1); "tail" = preset metadata (correct 540 ms / wrong 390 / click 65).

### 10.1 Global rules

- **Priority classes**: `user` speech (replay buttons) > `auto` speech > SFX (SFX never queues or waits — fire-and-forget with per-type throttle).
- **Interrupt matrix**: `user` speak **replaces** anything speaking (incl. user). `auto` speak follows its request's policy: `replace-same` (same text/source — e.g. re-reveal of the same card), `queue-distinct` (different card — queue, depth per mode), `ignore-if-busy` (Drop). Sequences with the same key follow the key's policy; different keys are independent.
- **Cancellation**: navigation / tab-hidden / `stopAll` aborts all sequences + speech + queued items and resolves handles `cancelled{by}`. A cancelled `speak` step never retries.
- **Timing rule**: voice never starts before `tail − 150 ms` of a preceding SFX in the same sequence (T6.2; the current 220–300 ms delays all violate this — Discovery §12.1).
- **Gameplay never waits on audio failure**: failed step ⇒ zero-duration; game pacing floors (existing advance timers) remain as minimums, extended only where specified (Speed).

### 10.2 Flashcard (Learn / Practice / MistakeReview) — flip path

```
tap card ──► click SFX (immediate) ──► flip animation (500ms CSS)
                     └─ seq "reveal:{cardId}" (policy replace-same):
                        [waitMs 250 (flip midpoint — text legible),
                         speak(card.primary, trigger:auto)]
grade tap ──► seq "grade:{cardId}" (replace: kills reveal seq if running):
                        [sfx correct|wrong] ──► queue advance (immediate, unchanged)
```
Edge cases: re-flip during speech → `replace-same` restarts cleanly; grade during reveal-speech → grade sequence replaces (SFX immediate), pronunciation of the *graded* card ends — acceptable, next card owns the channel. MC path: T7.2 adds `[sfx, waitFor tail, speak]` inside the existing 750/900 ms windows (window extends to completion, cap +400 ms).

### 10.3 Match

```
tile taps ──► click SFX each (throttled)
pair resolved:
  match ──► seq "match:{pairId}" (queue-distinct, depth 2):
             [sfx correct, waitFor tail(540−150), speak(word)]
             input unlock stays at 400ms — queue absorbs fast pairs
  miss  ──► [sfx wrong] + shake 400ms; input unlock 720ms (unchanged)
game end ──► pending queue drains (≤2 items), then results transition
```
Edge cases: 3rd pair while 2 queued → oldest dropped + telemetry; combo popup stays visual-only (silent milestone is a §20 candidate, not v1); timeout mid-queue → drain cancelled by phase transition (`stopAll` scope: sequence keys of the mode).

### 10.4 Speed

```
answer ──► engine emits onFeedback ──► seq "speed:{qIndex}" (replace):
            [sfx correct|wrong, waitFor tail, speak(card.primary)]
engine advance = max(1100ms, sequence completion)   [flag AUDIO_SEQ_SPEED]
timeout ──► same with wrong SFX
```
Edge cases: answer during previous card's speech → new sequence replaces (previous card's speech ends — correct: feedback belongs to current question); reset/restart → engine `reset()` now also aborts mode sequences (fixes R9); poll jitter irrelevant post-T6.3 (event-driven trigger), fully gone post-T9.2.

### 10.5 Survival — Quiz modes (∞/Time) and Drop

```
∞/Time answer ──► seq "surv:{char}" (replace):
                 [sfx, waitFor tail, speak(char)] ; advance timers 1250/1550ms unchanged
Drop keystroke ──► click SFX (throttle 45ms, T7.5)
Drop word done ──► [sfx correct] + speak(char, ignore-if-busy)  — speech only if channel idle
Drop stray key ──► wrong SFX only if a word is active on screen
Drop life lost ──► errorFlash visual (existing); no sound v1 (candidate §20)
game over ──► stopAll(mode) ──► results screen (confetti silent v1)
```
Edge cases: Time-attack expiry mid-speech → game-over `stopAll` cuts it (deliberate: results screen owns attention); Drop at high WPM → SFX cadence capped by throttle, speech ≤1/s by `ignore-if-busy` — no interruption storm (kills RCA §9.5 chaos).

### 10.6 Kana Learn / Practice / Chart (gesture-driven)

Unchanged flow — `speak(trigger: user-or-auto per source)` direct, no sequences needed; navigation speaks via `replace-same`. Already the reliable path (RCA §9.6); only gains: centralized gating (T2.6) + tiers.

### 10.7 Consistency guarantee

All modes emit the same canonical order **Event → SFX (immediate) → [wait tail] → Pronunciation → (score/advance per mode's own floor) → Transition**, differing only in declared policy + queue depth — enforced by construction because every mode goes through `sequence()` with mode-owned keys, and verified by T10.2's policy property tests + T10.4 stress specs.

## 11. Browser Compatibility Plan

Per-platform plan derived from RCA §6 (citations there; no new research). "Workaround" column names the owning task.

| Platform | Known limitation (RCA §6) | Required workaround | Fallback if workaround fails | Test vehicle |
|---|---|---|---|---|
| Chrome desktop | speak() sticky-activation; remote "Google 日本語" voice bug-class (15 s cutoff, v130 outage) | Local-voice-first ordering (T3.6); tiers make fallback rare | Tier chain → cloud audio unaffected | Playwright + manual |
| Edge desktop | Cloud Nanami exposed Edge-only | None needed (nice local-ish voice when present) | — | manual spot |
| Firefox desktop | cancel→speak wipe (Bugzilla 1522074); autoplay-after-gesture | 300 ms cancel gap (T3.6); standard unlock | Tier chain | Playwright (Gecko manual) |
| Safari macOS | Context stops on minimize; 15.4 getVoices bug | visibility suspend/resume (T4.2); voicesReady poll fallback (T1.5) | Media-element path | manual |
| **Safari iOS** | Per-element gesture blessing; first speak() must be in-gesture; silent switch splits Web-Audio vs media; `interrupted` context; low-power play() rejection | Element pool + context-routed playback (T4.1); activation-aware deferred queue (T4.4); audioSession ambient/playback (T4.3); resume-on-visible (T4.2) | Deferred-to-next-gesture speech; status affordance (T7.4) | **Device QA (T4.5) — mandatory gate** |
| Chrome Android | Voice-pack-absent devices; pause()≈cancel(); underscore locales | Fail-fast no-ja-voice (T3.6 ⑤ — tiers make it moot); never pause/resume utterances | Cloud tier unaffected | Device QA |
| Samsung Internet | As Android | Same | Same | Device QA (1 device) |
| PWA | N/A in v1 (no manifest/SW) | — | — | §20 |
| Offline | Chrome's remote voices dead; translate_tts dead | Tier 1 cached kana + Cache-API vocab (DEC-7) | Fail-fast + status | Playwright offline spec |
| Background tab | Speech continues (Chrome) / suspends (iOS); throttled timers fire stale | Cancel-on-hidden (T4.2) — deliberate policy: hidden = silent | — | Playwright visibility spec |
| Low-power mode (iOS) | play() rejected, `suspend` fired | Handle rejection → status degraded, no retry loop | User-gesture replay works | Device QA row |
| Incognito/private | Fresh-profile autoplay rules | Standard unlock covers | — | manual row |

**Known limitations accepted in v1** (documented, not fixed): iOS silent-switch asymmetry (Web-Audio-routed sound muted while any media-element-path audio isn't — mitigated by routing consistently through Web Audio where possible, T4.1); Chrome desktop backgrounded-tab speech before T4.2 lands; no Japanese pronunciation on truly offline first-visit for uncached vocab.

---

## 12. Performance Plan

Baselines captured by T10.6 **before Epic 2** (the poll/leak numbers are the "before" evidence); re-measured post-E6 and post-E9.

| Metric | Current (verified problem) | Target | Owner |
|---|---|---|---|
| `voiceschanged` listeners after 100 plays | ~100 (D4 unbounded) | 1 | T1.5 |
| Window gesture listeners post-first-click | 10 permanent (D5) | 0 | T1.4/T4.1 |
| Network requests per repeated pronunciation | 1 per play (uncacheable) | 0 (cache hit) | T3.4/T3.5 |
| WebAudio nodes, 10-min Drop soak | Unbounded creation (D17) | Flat steady-state | T9.1 |
| Speed-mode React renders | 10/s for whole game (D-§13.7) | On state change only | T9.2 |
| AudioContext state on idle screens | `running` forever | `suspended` >30 s idle | T9.3 |
| Audio code on `/login` | Full modules + listeners (D18) | Zero (post-auth provider) | T2.2/T11.5 |
| Pronunciation start latency p50 | Network-bound, unbounded variance | <150 ms cached / <800 ms uncached | E3 |

Regression guard: >10% degradation on any benchmarked metric blocks the causing PR (T10.6 AC).

---

## 13. Accessibility Plan

| Requirement | Current state (verified) | Plan | Task |
|---|---|---|---|
| Feedback perceivable without sound | Colour+motion only; no live region anywhere (D21) | `aria-live="polite"` announcements mirroring visual feedback | T8.1 |
| Feedback perceivable without motion | No `prefers-reduced-motion` anywhere | Gate shake/flip/confetti/pulse; colour+audio+live-region remain | T8.2 |
| User control over sound | No mute/volume (D6) | Independent SFX/voice mute + volume, persisted | T2.5/T7.1 |
| Screen-reader users keep speech with SFX off | Impossible today (no channels) | Channel independence, test-backed | T8.4 |
| Replay without pointer | Buttons exist, labelling partial | Keyboard/focus/label audit | T8.3 |
| Honest failure states | Silence indistinguishable from success (RC-0) | Status affordance + toast-once | T7.4 |
| No answer leakage via audio | Guard is a tautology (D1) | Real prompt-stage policy + property test | T2.8 |

Acceptance: axe clean on touched screens; manual VoiceOver (iOS/macOS) + NVDA pass at Gate D; WCAG 2.2 AA for the audio-adjacent criteria (1.4.2 audio control, 2.2.2 motion, 4.1.3 status messages).

---

## 14. Testing Strategy

Pass/fail criteria per category (Phase-10 requirement). Infrastructure: T10.1–T10.6.

| Category | Vehicle | Scope | Pass criteria |
|---|---|---|---|
| Unit | Vitest + fakes (no global stubs) | Providers, chain, breaker, cache, policy, sequencer, presets scheduling | ≥90% branch on `shared/audio/`; all policy/breaker property tests green; token-ordering freeze test (T2.4) green |
| Integration | Vitest, manager end-to-end with fakes + MSW | Legacy-parity, tier promotion, lifecycle aborts, activation queue | Gate B: parity suite 100%; Gate C: every injected tier failure promotes within one request |
| Browser (automated) | Playwright (Chromium + WebKit best-effort) | Unlock, navigation-stop, visibility-cancel, offline kana, rapid-input stress | 0 clipped/lost pronunciations in scripted normal pacing; stress: behaviour matches §10 policies exactly; suite stable 2 weeks → CI-blocking |
| Device (manual) | `docs/device-qa.md` matrix | iOS (gesture/silent-switch/low-power/background/Music-app), Android voice-pack-absent, desktop trio, incognito, offline | All P0 rows pass; iOS auto-pronunciation ≥95% post-first-gesture; every fail → filed task before gate sign-off |
| Audio synchronization | Fake-clock integration + recorded manual spot | §10 timing rule (voice ≥ tail−150 ms), Speed advance = max(1100, seq) | Assertions exact under fake clock; human spot-check "feels right" sign-off per mode flag flip |
| Japanese pronunciation | T5.2 bake-off + corpus review | Kana corpus correctness | Native/advanced-speaker sign-off on 100% of kana clips; accent-pinning SSML present in generator for every clip |
| Stress / rapid-click | Playwright scripts | Match 5 pairs/3 s; Speed min-interval answers; Drop 120 wpm; replay-button mashing | Queue depths honored; ≤1 active voice; no unhandled rejections; SFX throttles hold |
| Navigation | Playwright | Mid-speech route change, mid-sequence back, restart mid-feedback | `cancelled{by}` telemetry present; zero audio on destination route; no timer leaks (fake-clock assert in integration twin) |
| Background tab | Playwright visibility emulation + device | Hidden mid-speech/mid-sequence; return | Cancel-on-hidden policy holds; clean resume; no stale playback on return |
| Offline | Playwright offline mode | Cached kana replay; uncached vocab | Kana plays; vocab fails fast `failed{offline}` + status degraded; no retry storm |
| Performance | T10.6 scripted soaks | §12 metric table | Targets met; >10% regression blocks |
| Accessibility | axe + manual SR passes | §13 table | axe clean; SR scripts pass; WCAG rows verified |

---

## 15. Rollout Strategy

- **Flags** (env `NEXT_PUBLIC_*` + localStorage dev override, read once at provider init): `AUDIO_V2` (manager seam), `AUDIO_TTS_TIERS` (provider chain), `AUDIO_LEGACY_TTS` (transitional tier 5), `AUDIO_SEQ_{SPEED|MATCH|QUIZ|DROP}` (per-mode sequencing). No user-percentage infra exists in the repo — staging is **by flag scope and time**, not by cohort: dev → internal dogfood (flag on for team accounts via localStorage override) → default-on release → flag removal next release.
- **Gate discipline**: each Gate (A–E, §3) has a named artifact (telemetry memo / parity suite / tier comparison / mode sign-offs / closing report) attached to the flag-flip PR.
- **Deploy unit = one task** (or one T2.7 batch). The pre-commit full-build hook (repo convention) plus R-STD keeps each deploy self-verifying.
- **Sequencing of user-visible changes**: voice change (Gate C) and feel changes (Gate D per-mode) are announced in-app changelog-style on the settings page; DEC-1's newly-respected toggle called out explicitly ("Auto-play now applies to all games").
- **Success metrics per rollout step** (from telemetry): failure-rate delta, tier distribution, `suppressed{setting}` counts (proves DEC-1 working), cancelled-by-navigation counts (proves lifecycle working), cache-hit ratio, and support-report anecdotal count.

## 16. Rollback Strategy

| Layer | Rollback | Blast radius | Time |
|---|---|---|---|
| Any single task | Revert commit (deploy unit = task) | That task | minutes |
| Manager seam | `AUDIO_V2=off` → facades run legacy bodies (kept intact until T11.2) | Whole audio path back to pre-E2 | config redeploy |
| TTS tiers | `AUDIO_TTS_TIERS=off` → legacy transport; or `AUDIO_LEGACY_TTS=on` re-arms tier 5 | Pronunciation transport only | config redeploy |
| Per-mode sequencing | `AUDIO_SEQ_{mode}=off` → that mode's pre-E6 behaviour | One game mode | config redeploy |
| Kana asset version | Manifest/version pointer back to previous `v{n}` (retained one release, T5.4) | Kana audio only | config redeploy |
| Server route | Route returns 503 → client breaker opens → chain skips tier | Uncached vocab falls to speechSynthesis | immediate |
| Post-cleanup (after T11.2) | Legacy gone — rollback = git revert of cleanup PRs (why E11 waits for 2 clean weeks + Gate E) | — | hours |

Irreversibility ledger: the only hard-to-reverse steps are (a) legacy deletion — gated on telemetry proof, and (b) the audible voice change — mitigated by bake-off sign-off + version-pinned assets.

## 17. Risk Register

| ID | Risk | P | I | Mitigation | Trigger/Owner |
|---|---|---|---|---|---|
| R-01 | Facade extraction (T2.4) subtly changes cancel semantics | M | H | Parity integration suite as Gate B blocker; token-ordering freeze test | E2 |
| R-02 | Vendor voice rejected by users ("it sounds different") | M | M | T5.2 bake-off with native review; changelog note; version-pinned rollback | Gate C |
| R-03 | iOS behaviours resist automation; regressions ship | M | H | T4.5 mandatory device rounds at Gates C+E; T10.5 scripted checklist | E4 |
| R-04 | Free-tier assumptions break (pricing/quota change) | L | M | Server-side daily cap (T3.1) fails safe to tier 4; costs alarmed in GCP | E3 |
| R-05 | Sequencer changes game feel; players object | M | M | Per-mode flags; product sign-off per mode; pacing-delta AC (≤200 ms p50 Speed) | Gate D |
| R-06 | Firebase Storage public-read audio URLs abused (hotlink/scrape) | L | L | Non-sensitive dictionary audio; rate-limited generation; revisit if abuse observed | E3 |
| R-07 | Telemetry volume costs / noise | M | L | 5% sampling default; env-tunable; fire-and-forget guarantees | E1 |
| R-08 | T9.2 (poll removal) breaks Speed timer UI | M | M | Isolated last-in-epic; recorded before/after; flag-independent revert | E9 |
| R-09 | Two-source-of-truth drift during long strangler period | M | M | Lint rule (T2.7) forbids new legacy imports; E11 scheduled, not aspirational | E2–E11 |
| R-10 | DEC gates reversed late (e.g. product wants listen mode) | L | M | Gates documented with affected-task lists (§1.4); policy hooks keep doors open | any |
| R-11 | Cache API unavailable/quota-limited on some devices | M | L | Graceful no-op path (T3.4 AC); HTTP cache still applies | E3 |
| R-12 | Single-engineer bus factor across 11 weeks | M | M | Every task carries D-STD review requirement; README/ADR grow with the code | all |

## 18. Implementation Timeline

Single senior engineer, 181 SP (§6 totals), with review support. Two-engineer variant compresses to ~7 weeks by running E5+E10 and E4+E6 fully parallel.

| Week | Focus | Gate |
|---|---|---|
| 1 | E1 complete; T10.5 checklist authored; E5 bake-off started | — |
| 2 | E2 core (T2.1–T2.4); T10.1 harness; E5 corpus generated | Gate A memo (5-day telemetry) |
| 3 | E2 finish (T2.5–T2.8, T2.7 batches); E5 committed | **Gate B** flip `AUDIO_V2` |
| 4 | E3 server side (T3.1/T3.2/T3.8); T10.2 suites | — |
| 5 | E3 client tiers (T3.3–T3.7); E4 unlock (T4.1) | — |
| 6 | E3 prefetch/legacy-tier; E4 (T4.2–T4.4); device round 1 prep | **Gate C** flip `AUDIO_TTS_TIERS`; T4.5 round 1 |
| 7 | E6 core + Speed (T6.1–T6.3); T10.4 Playwright | — |
| 8 | E6 remaining modes (T6.4–T6.7) | **Gate D** per-mode flags |
| 9 | E7 + E8 | — |
| 10 | E9; T10.6 re-benchmarks; legacy-tier telemetry review | — |
| 11 | E11 cleanup; T4.5 round 2; closing report | **Gate E** |

Slack: ~15% buffer implicit in SP calibration; if Gate A re-ranks (e.g. iOS dominates), weeks 4–6 swap E4 ahead of E3 without dependency breakage (§4 graph permits it).

## 19. Definition of Done (project-level)

1. All RC-0…RC-8 mapped fixes (§1.3) shipped and evidenced by telemetry deltas vs the T1.7 baseline (headline: pronunciation failure rate <1%, from unmeasurable-but-large).
2. Debt items D1–D22 closed or explicitly waived with rationale in the ADR.
3. Zero references to `translate.google.com` in `src/`; zero direct browser-audio API usage outside `shared/audio/`.
4. All four DEC-visible behaviours (§1.4 defaults) confirmed by product or amended per gate lists.
5. §12 performance targets and §13 accessibility acceptance met.
6. §14 test pyramid green in CI (unit+integration blocking; Playwright blocking after stability window); both T4.5 device rounds passed.
7. Docs truthful: CODEBASE_CONTEXT.md updated, ADR merged, discovery docs banner-marked historical; every code comment that described unbuilt behaviour fixed (Discovery smell 8 class = zero).
8. Both flag families removed (flags are migration scaffolding, not permanent config) — except `AUDIO_SEQ_*` may persist one extra release as a kill-switch.

## 20. Future Expansion Roadmap (post-v1, unblocked by this architecture)

| Capability (from Discovery §19.1's 0-of-11-ready list) | Now unblocked by | Remaining work |
|---|---|---|
| User-configurable volumes / categories | Channels + settings (E2) | UI polish only — shipped in v1 (T7.1) |
| Sound themes | Preset registry (`sfx.presets.ts`) | Theme-keyed preset sets + settings entry |
| Accessibility audio cues | Sequencer + channels | Cue vocabulary (navigation, error, milestone) on `sfx` or dedicated channel |
| Character voices | `voice` key in cache/TTS paths (T3.2) | Voice picker UI + corpus per voice |
| Listening exercises (DEC-5 revisit) | Policy hook (T2.8) + prompt-stage rules | Listen-mode UI (hide glyph), prompt-stage autoplay exception |
| Background ambience / music | Empty `music|ambient` channels (T2.1) | Looping source support + ducking rule (voice ducks music via channel gains) |
| Offline-first PWA | Cache layer + versioned assets | Service worker + manifest; precache kana v-current; Safari Range-request handling (RCA §17.3 caveat) |
| Native-recorded kana v2 (WaniKani model) | Asset versioning (T5.4) | Studio recording + `/audio/kana/v2/` swap |
| Pitch-accent display + audio alignment | SSML pinning already in generator | Accent data source + UI |
| Spatial audio / game juice | Channel router extension point | PannerNode per-source; only if a game mode wants it |
| Multiplayer sync | PlaybackHandle timing surface | Out of scope until multiplayer exists |

---

*End of plan. Execution begins with T1.1; the first flag flip is Gate B; the first user-audible change is Gate C.*
