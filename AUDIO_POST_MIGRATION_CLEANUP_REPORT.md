# Audio Post-Migration Cleanup Report

**Date**: 2026-07-10
**Scope**: Technical-debt elimination across `src/shared/audio/**` and its consumers. No new features.
**Preceding work**: `AUDIO_IMPLEMENTATION_MASTER_PLAN.md` Epics 1, 2, 4 (partial), 6–9, 11.
**Next**: Epic 3 — Japanese Audio Provider.

**Evidence convention**: every removal below was verified by whole-tree reference search before
deletion. Where something *looks* dead but was kept, the reason is stated. Nothing was guessed.

---

## 1. Executive Summary

The audio subsystem was already single-owner after the migration, but it carried the seams of that
migration: **two ways to delay a sound, two gesture-unlock rituals, a file named after the migration
rather than its contents, and a public API exporting twenty-five symbols of which nine had a real
consumer.**

Twenty-two items were removed or consolidated. Two findings were substantive rather than cosmetic:

1. **A real, shipped audio bug.** Multiple-choice flashcard grading started the pronunciation at
   ~250 ms and then fired the correct/wrong cue at 750 ms — *on top of the voice*. This is the exact
   defect the sequencer exists to prevent, and it slipped in because the MC path was the one place
   still scheduling audio with a bare `setTimeout` + `speakFeedback`. Fixed by routing MC through
   the sequencer and suppressing the duplicate cue at grade time. (§4, §6)

2. **Two delay mechanisms, two cancellation mechanisms.** `speak(text, { delayMs })` reached a
   debounce timer inside the transport that duplicated the sequencer's `waitMs` + `replace` policy.
   Deleting it removed a whole class of state (`pendingTimer`, `pendingSettle`, `clearPending`) and
   the `debounce_replaced` telemetry event. There is now exactly one way to delay a sound and
   exactly one way to cancel one. (§4)

**Net effect** (measured, not estimated):

- **Public API: 43 exported symbols → 14.** 17 value exports and 12 type exports removed from
  `shared/audio/index.ts`; every one had zero consumers outside the module.
- **7 symbols deleted outright** as dead code, plus 1 dead prop threaded through 3 layers.
- **2 duplicate mechanisms collapsed to 1 each** (delay, gesture-unlock).
- **1 module renamed** off its migration name; **1 module added** (`unlock.ts`, 70 lines) replacing
  ~90 lines of duplicated listener code across two files.
- `shared/audio` source is now 1,281 lines across 11 modules, with 848 lines of tests.
- **50 tests pass** (52 before: 3 obsolete removed, 1 added). Typecheck, production build, and
  browser verification all green.
- **Lint: 117 problems, unchanged.** All are pre-existing (`no-explicit-any`, `no-img-element`) in
  files this pass did not touch; `shared/audio/**` has zero. Verified by stashing and re-running.

**Verdict on readiness**: the success criteria are met. `voice/googleTranslateTts.ts` is now a
~300-line module whose entire contract is *start a pronunciation, stop a pronunciation, report what
happened*. Epic 3 replaces it by adding siblings and a chain; it touches zero call sites. (§15)

---

## 2. Removed Dead Code

Each verified by whole-tree search (`grep -rl` across `features/ app/ lib/ shared/`, excluding the
symbol's own definition file).

| Item | File | Why it was unused | Verified by |
|---|---|---|---|
| `Channel` type | `types.ts` | Exported; never imported. Channels are addressed by function (`setSfxGain`), not by a union. | Zero references outside `types.ts` |
| `resetAudioStatus()` | `status.ts` | Test seam written for `status.test.ts`, which instead uses `vi.resetModules()`. Never called anywhere. | Zero references outside its definition |
| `AudioEventType` | `telemetry.ts` | Derived helper type; nothing consumed it. | Zero references outside its definition |
| `attempt.delayedMs` field | `telemetry.ts` | Only `speakDelayed` ever set it (§3). Dead the moment that was removed. | Only the type declaration matched |
| `resetSequencer` alias | `sequencer.ts` | `export const resetSequencer = abortAllSequences` — a rename with no added meaning. Tests now call `abortAllSequences`. | — |
| `bestScore` prop chain | `useGameEngine.ts`, `useSpeedModeSession.ts`, `SpeedGame.tsx` | Threaded through three layers into `bestScoreRef`, which was **written twice and never read**. `SpeedGame` already holds its own `bestScore` for the tier badge and results screen. | `grep -n bestScore` showed assignment only |
| `noteAudioActivity` export | `channels.ts` | Only `scheduleWhenRunning` (same file) calls it. Demoted to module-private. | Single-file reference |

**Kept despite appearing unused — with reasons:**

- **`getAudioCounters()` + the counter map.** Referenced only by `telemetry.test.ts` (and by name in
  an `AudioProvider` comment, which is *not* a reference). It is the documented read path for the
  failure-reason ranking that `AUDIO_SYSTEM_ROOT_CAUSE_ANALYSIS.md` designates as the pre-Epic-3
  baseline (Gate A). Deleting it would also make `bumpCounter` dead and remove the diagnostic
  capability Epic 3's before/after comparison depends on. This is a deliberate retention, not an
  oversight.
- **`allowSpeech`'s prompt-stage listening-question exception.** No caller passes `stage: "prompt"`
  today, so the branch is unreachable in production. It is the seam a real listening exercise
  attaches to, it is tested, and the ADR records that decision explicitly. Removing it would
  reintroduce the "documentation asserting a property the code lacks" problem the migration fixed.

**Searched and found clean (no action needed):** unused CSS (`@keyframes slide` drives the auth
splash; `.animate-shake` has three consumers), audio assets (there are none — everything is
synthesized or TTS), feature flags (none exist; `AUDIO_V2` was never merged), compatibility layers
(none survive §3), unused contexts/providers (`AudioProvider` is mounted once in `providers.tsx`).

---

## 3. Removed Legacy Logic

| Item | Nature | Action |
|---|---|---|
| `voice/legacyTransport.ts` | Named after the migration, not its contents — implying a non-legacy sibling that never existed. | Renamed `voice/googleTranslateTts.ts`. It now names what it is; Epic 3 slots siblings beside it. |
| `speakDelayed()` | Transport-level debounce, added before the sequencer existed. | **Deleted.** |
| `speakFeedback()` | Convenience wrapper over `speak(..., { delayMs: 250 })`. | **Deleted** — its two callers now sequence. |
| `PRONUNCIATION_FEEDBACK_DELAY_MS` | The last hard-coded delay constant. Superseded by `SFX_TAIL_MS`, which is *measured* rather than guessed. | **Deleted.** |
| `SpeakOptions.delayMs` | The API that let callers bypass the sequencer. | **Deleted.** |
| `VoicePlaybackOptions.reportAttempt` | Existed only so `speakDelayed` could suppress a duplicate `attempt` event. | **Deleted.** |
| Header comment: *"Extracted verbatim from `shared/utils/audio.ts`"* | Migration narrative; those files no longer exist. | Rewritten to describe the module's contract. |
| `channels.ts` header referencing `sfx.ts` / `audio.ts` | Same. | Rewritten. |
| ADR: *"A lint rule **should** enforce this"* | Stale recommendation — the rule now exists. | Updated to describe the shipped rule. |
| `CODEBASE_CONTEXT.md` listing `audio.test.ts` | File deleted two epics ago. | Updated. |

---

## 4. Removed Duplicate Logic

### 4.1 Two delay mechanisms → one

`speak(text, { delayMs })` scheduled through `speakDelayed`, which owned `pendingTimer` and
`pendingSettle` and implemented last-wins-replaces-pending. The sequencer independently owns
`{ waitMs }` + the `replace` policy. Same semantics, two implementations, two places to look when a
pronunciation goes missing.

**Canonical version: the sequencer.** It knows cue tails, it has per-key policies, and it aborts on
navigation and tab-hide. The transport now only starts and stops.

Deleted with it: `clearPending()`, `pendingTimer`, `pendingSettle`, `debounce_replaced` (telemetry),
and the `AudioCancelReason | "replaced"` union widening that existed solely for that path.

Callers migrated:

| Caller | Before | After |
|---|---|---|
| `useRevealPronunciation` | `speak(text, { delayMs: 250 })` | `sequence("flashcard-reveal", [{ waitMs: 250 }, { speak }], { policy: "replace" })` |
| Flashcard MC (Practice, MistakeReview) | `speakFeedback(...)` + `setTimeout` cue | `sequence("flashcard-mc", [{ sfx }, { waitForTail }, { speak }])` |

### 4.2 Two gesture-unlock rituals → one

`channels.ts` registered five gesture listeners to resume the `AudioContext`. `legacyTransport.ts`
registered five *more* (`{ once: true }`) to prime a media element. Each kept its own idea of whether
audio was unlocked.

The `once` variant had a latent flaw: `mediaUnlocked` was set inside an async `.then()`, so a single
physical tap (`mousedown` → `pointerup` → `click` → `touchend`) could construct **up to four** silent
`Audio` elements before the flag flipped.

**Canonical version: new `unlock.ts`.** One listener set; primes the media element synchronously
inside the gesture (iOS blesses the element, not the page); resumes the context; removes the
listeners only once a resume actually succeeds.

Browser-verified after the change: one gesture → **1 AudioContext, exactly 1 silent primer element,
5 listeners removed**; twenty subsequent gestures → nothing. (§13)

### 4.3 Two cancellation mechanisms → one per layer

Cancellation now has exactly two non-overlapping responsibilities:

- **Transport**: last-wins. A new `speakNow` cancels the audible one. (`stopVoice` for lifecycle.)
- **Sequencer**: aborts pending steps and queued items on `stopAllAudio`.

`stopVoice` previously *also* cleared the transport's pending timer and emitted its own `cancelled`
event, double-reporting with the sequencer's abort. That branch is gone.

### 4.4 Duplicate audio-status import paths

`FlashcardAudioButton` and `KanaAudioButton` imported `useAudioStatus` from
`@/shared/audio/useAudioStatus` while everything else used the barrel. Normalized to `@/shared/audio`.

---

## 5. Simplified State

| Removed | Location | Note |
|---|---|---|
| `pendingTimer`, `pendingSettle` | transport | Module-level timer state; superseded by the sequencer. |
| `mediaUnlocked` duplicate ownership | transport ↔ channels | Two `unlocked` booleans; now one, in `unlock.ts`. |
| `bestScoreRef` | `useGameEngine` | Ref written twice, never read. |
| `audioUnlocked` | `channels.ts` | Merged into `unlock.ts`. |

**Checked and left alone (they earn their keep):** `prevRevealedRef` inside `useRevealPronunciation`
(edge detection — without it any card-identity change re-speaks a card the learner is still looking
at); the stable-ref block in `useGameEngine`/`useMatchModeSession` (prevents engine rebuilds); the
`useMemo` on `mcChoices` (its `eslint-disable` is a pre-existing, deliberate `currentIndex`-only
dependency, out of scope for an audio cleanup).

---

## 6. Simplified Sequencing

**Audit result: one execution path per mode, all originating from the sequencer.**

| Mode | Path | Policy |
|---|---|---|
| Speed | engine `onSFXPlay` cue → `sequence("speed-feedback", [waitForTail, speak])` | `replace` |
| Match | `playSfx("correct")` → `sequence("match-feedback", [waitForTail, speak])` | `queue`, depth 2 |
| Kana Quiz / Survival ∞ & Time | `playSfx` → `sequence("kana-quiz-feedback", [waitForTail, speak])` | `replace` |
| Survival Drop | `playSfx("correct")` → `sequence("survival-drop-feedback", [waitForTail, speak])` | `ignore-if-busy` |
| Flashcard reveal | `sequence("flashcard-reveal", [waitMs 250, speak])` | `replace` |
| **Flashcard MC** *(fixed this pass)* | `sequence("flashcard-mc", [sfx, waitForTail, speak])` | `replace` |
| Kana Learn / Practice / Chart / replay buttons | direct `speak({ trigger: "user" })` — gesture-driven, nothing to sequence | — |

### The MC bug, in detail

Before:

```
select → speakFeedback(...)            voice starts at ~250 ms
       → setTimeout(handleGrade, 750)  cue fires at 750 ms, ON TOP of the voice
```

The `correct` cue rings for ~540 ms, so it covered the pronunciation almost entirely. Cues are
fire-and-forget and never queue, so nothing corrected it.

After: the cue fires on selection (immediate feedback, which is also better UX), the sequencer waits
out its tail, then speaks. `handleGrade` gained a `playCue = true` parameter so the deferred
750 ms/900 ms advance does not sound a second cue. The flip path, which reaches `handleGrade` through
`GradeButtons`, is unchanged and still cues.

**Verified absent across the audio-adjacent modules**: parallel timers, duplicate pronunciation
scheduling, manual delays outside the sequencer, duplicate queue logic, duplicate cancellation,
hidden async chains. Every remaining `setTimeout` in those files drives gameplay or a visual flash
(`errorFlash`, tile shake, processing unlock, combo popup, grade advance) — none schedules audio.
Enumerated and inspected individually.

---

## 7. Folder Changes

```
shared/audio/
  channels.ts              (−58 lines: unlock block extracted)
  unlock.ts                NEW  — the single gesture-unlock ritual
  index.ts                 (rewritten: 25 exports → 9 + 5 types)
  manager.ts               (−14 lines: speakFeedback, delay constant)
  sequencer.ts             (−3: alias)
  status.ts                (−7: dead test seam)
  telemetry.ts             (−4: dead event + type)
  types.ts                 (−5: Channel, delayMs)
  voice/
    googleTranslateTts.ts        RENAMED from legacyTransport.ts (−62 lines)
    googleTranslateTts.test.ts   RENAMED (−45 lines)
```

No empty folders resulted. `voice/` retains its own directory because Epic 3 adds siblings
(`providers/`, `cache.ts`) beside it. No file grew large enough to warrant splitting; `unlock.ts`
(70 lines) was extracted because it is a distinct responsibility, not because `channels.ts` was long.

**Naming normalized**: no module is named after the migration that produced it.

---

## 8. Documentation Updates

| File | Change |
|---|---|
| `shared/audio/README.md` | `legacyTransport` → `googleTranslateTts`; added `unlock.ts` row; clarified that the transport "starts and stops; never schedules". |
| `docs/adr/001-audio-architecture.md` | Transport filename; replaced *"a lint rule should enforce this"* with the rule that now exists; added the one-delay/one-cancellation consequence. |
| `CODEBASE_CONTEXT.md` | Corrected the public-API list (still advertised `speakFeedback`); noted `unlock.ts`; recorded that the no-direct-browser-audio rule is lint-enforced; removed the reference to the long-deleted `audio.test.ts`. |
| `useGameEngine` docblock | Still said "state polling" — polling was removed in Epic 9. |
| `channels.ts` / transport headers | Removed migration narrative referencing deleted files. |

Every doc claim in `README.md` and the ADR was re-checked against source. No doc now names an API
that does not exist.

---

## 9. Test Cleanup

| Test | Action | Reason |
|---|---|---|
| `"debounces delayed pronunciation feedback…"` | **Removed** | Tested `speakDelayed`, which no longer exists. The behaviour it protected is now covered by `sequencer.test.ts` → `"drops the oldest waiter…"` and `"replace policy"`. |
| `"discards a scheduled pronunciation so it never fires on the next route"` | **Removed** | Same; superseded by `sequencer.test.ts` → `"aborts every sequence when audio is stopped"`. |
| `"reports when a pending feedback pronunciation is discarded"` | **Removed** | Asserted the deleted `debounce_replaced` event. |
| `"cancels the previous pronunciation when a new one starts"` | **Added** | The transport's last-wins guarantee was previously only tested *through* the debounce path. It now has a direct test. |
| `resetSequencer()` → `abortAllSequences()` | Updated | Alias removed. |
| `legacyTransport.test.ts` | Renamed | Follows its subject. |

**Coverage preserved, not merely maintained**: the removed tests all covered a mechanism that was
deleted. The guarantee they protected (a superseded pronunciation must not play) is now asserted at
the sequencer, which is where the mechanism lives. Net 52 → 50 tests.

No duplicate fixtures, redundant mocks, or snapshots were found. The transport test's browser-global
mocks are the only mocks in the audio suite and have a single consumer.

---

## 10. Performance Improvements

Measured or structurally guaranteed; nothing speculative.

| Before | After | Basis |
|---|---|---|
| 10 window gesture listeners (5 context + 5 media) | **5** | §4.2 |
| Up to **4** silent `Audio` elements per first tap | **1** | Browser-verified (§13) |
| 2 module-level timers for pronunciation delay | 1 (sequencer) | §4.1 |
| `bestScoreRef` write on every render (`useLayoutEffect`) | removed | §2 |
| `delayedMs` object property on every `attempt` event | removed | §2 |
| 3 layers passing an unused `bestScore` prop | removed | §2 |

These are structural reductions (fewer listeners, fewer timers, fewer allocations per event), not
benchmarked wins. The only figure measured at runtime is the silent-primer count (4 → 1). No
profiling was performed this pass, and none of the changes were motivated by a profile.

**Verified no regressions**: one `AudioContext` (still), one `voiceschanged` listener regardless of
playback count (test still green), listeners still self-remove after the first successful unlock,
context still suspends on tab-hide and after 30 s idle.

**Not changed**: `scheduleWhenRunning`'s resume-then-schedule path, the `onended` node disconnection,
and the SFX throttle table — all landed in Epic 9 and were re-verified, not touched.

---

## 11. Files Modified

**New (1)** — `src/shared/audio/unlock.ts`

**Renamed (2)** — `voice/legacyTransport.ts` → `voice/googleTranslateTts.ts` (+ its test)

**Modified (15)**

```
src/shared/audio/{index,manager,channels,sequencer,status,telemetry,types}.ts
src/shared/audio/voice/googleTranslateTts.{ts,test.ts}
src/shared/audio/sequencer.test.ts
src/features/flashcard/hooks/useRevealPronunciation.ts
src/features/flashcard/components/{FlashcardPractice,FlashcardMistakeReview,FlashcardAudioButton}.tsx
src/features/flashcard/games/speed/hooks/{useGameEngine,useSpeedModeSession}.ts
src/features/flashcard/games/speed/components/SpeedGame.tsx
src/features/kana/components/KanaAudioButton.tsx
src/shared/audio/README.md
docs/adr/001-audio-architecture.md
CODEBASE_CONTEXT.md
```

---

## 12. Regression Risk Assessment

| Change | Risk | Mitigation / evidence |
|---|---|---|
| Unlock consolidation | **Medium** — touches the autoplay-policy path, which is platform-sensitive | Browser-verified: 1 context, 1 primer, 5 removals, idempotent across 20 further gestures. `primeMediaPlayback()` still runs *synchronously* inside the gesture handler, which is the property iOS requires. **Not verified on a real iOS device.** |
| `delayMs` / `speakDelayed` removal | **Medium** — changes when two pronunciations land | Semantics are equivalent (`waitMs` + `replace` = pending-slot last-wins), and the sequencer additionally aborts on navigation, which the transport timer never did. Sequencer policy matrix is unit-tested. |
| MC sequencing fix | **Low-Medium** — user-perceptible timing change (cue now at selection, not +750 ms) | Strictly better ordering; the previous behaviour was a bug. Grade advance timings (750/900 ms) unchanged. Needs a human ear before release. |
| `bestScore` prop removal | **Low** | Dead ref; `SpeedGame` retains its own `bestScore` for the tier badge and results screen. Typecheck confirms no other reader. |
| Barrel narrowing (43 → 14 symbols) | **Low** | Typecheck + build confirm every remaining consumer resolves. Internal modules already imported each other directly, so nothing lost a path to what it needs. |
| Transport rename | **Low** | Two importers + one test; typecheck is exhaustive here. |

**Highest residual risk**: iOS. The unlock consolidation is the one change whose correctness depends
on browser behaviour I cannot exercise here. The invariant it must preserve — *prime the media
element synchronously inside the gesture* — is preserved by construction and commented as such.

---

## 13. Verification Checklist

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ clean |
| `npx vitest run` | ✅ 50 passed / 8 files |
| `npm run build` (production) | ✅ green |
| ESLint, `shared/audio/**` | ✅ **0** problems |
| ESLint, repo-wide (`shared lib features`) | ✅ 117 problems — **identical to the clean-tree baseline**, confirmed by `git stash` + re-run. All pre-existing (`no-explicit-any`, `no-img-element`) in untouched files. No regression, and none of the removals happened to be lint-visible. |
| Direct browser-audio APIs outside `shared/audio` | ✅ **none** (`grep` + `no-restricted-globals` rule) |
| Pronunciation scheduled outside the sequencer | ✅ **none** — every remaining `setTimeout` in audio-adjacent files drives gameplay/visuals, enumerated individually |
| App boots, no console errors | ✅ verified in browser |
| First gesture → 1 `AudioContext`, 1 silent primer, 5 listeners removed | ✅ verified in browser |
| 20 subsequent gestures → no further work | ✅ verified in browser |
| Docs name no deleted API | ✅ `grep` clean for `legacyTransport`, `speakFeedback`, `PRONUNCIATION_FEEDBACK_DELAY_MS` |

**Not verified** (unchanged from before this pass): iOS device behaviour; screen-reader announcement
of the `aria-live` regions; any sequenced game mode end-to-end, since all of them sit behind Google
auth and only `/login` is reachable from this environment.

---

## 14. Remaining Technical Debt

Ordered by what would bite first.

1. **The transport itself.** `voice/googleTranslateTts.ts` calls an undocumented, rate-limited,
   uncacheable endpoint with a fallback that has no Japanese voice on many devices. This is the
   original defect (RC-1/RC-2) and remains **entirely open**. Epic 3.
2. **iOS is unverified.** Per-element gesture blessing, first-`speak()`-needs-a-gesture, and the
   ringer switch splitting Web Audio from media elements. The consolidation in §4.2 preserves the
   required invariant by construction but has never met an iPhone.
3. **`voice` is a channel in name only.** `channels.ts` routes SFX through a gain node; pronunciation
   plays through an `HTMLAudioElement` whose volume the manager sets directly. Voice mute/volume work,
   but ducking and a true master bus need Epic 3's decoded-buffer path.
4. **No volume slider.** The store and manager honour `sfxVolume`/`voiceVolume`; the UI exposes only
   mute toggles, because the repo has no `Slider` primitive.
5. **`getAudioCounters` has no production reader.** Deliberate (§2), but if Gate A never runs, this
   and the counter map become genuinely dead and should go.
6. **The lint rule guards globals, not imports.** A feature could still `import` from
   `@/shared/audio/voice/googleTranslateTts` and bypass the manager. A `no-restricted-imports` rule
   on `@/shared/audio/*` (allowing only the barrel) would close that.

---

## 15. Readiness for Epic 3

| Success criterion | Status |
|---|---|
| One authoritative AudioManager | ✅ `manager.ts`; every sound flows through `playSfx`/`speak` |
| One Sequencer for all gameplay sequencing | ✅ verified per-mode (§6); zero pronunciation timers outside it |
| No duplicated playback logic | ✅ one delay mechanism, one cancellation mechanism per layer, one unlock ritual |
| No direct browser audio APIs outside approved modules | ✅ grep-clean **and** lint-enforced |
| No obsolete migration code | ✅ §3 |
| No dead utilities, hooks, or assets | ✅ §2, with two documented retentions |
| Consistent naming, folders, documentation | ✅ §7, §8 |
| Minimal, maintainable, ready for a new provider | ✅ see below |

### What Epic 3 now has to do

The transport's entire contract is three functions:

```ts
speakNow(text, { volume, source }): Promise<PlaybackResult>
stopVoice(reason): void
primeMediaPlayback(): void        // called by unlock.ts, inside the gesture
```

A provider chain implements the same shape. Concretely, Epic 3 becomes:

1. Add `voice/providers/{staticAsset,cloudTts,speechSynthesis}.ts`, each exposing `speak(req, signal)`.
2. Add `voice/voiceService.ts` — the ordered chain plus per-tier circuit breakers.
3. Point `manager.speak()` at `voiceService` instead of `googleTranslateTts`.
4. Delete `googleTranslateTts.ts`.

**Zero call sites change.** Fourteen consumer modules import `speak`/`sequence`/`playSfx` from the
barrel and know nothing about transports. The sequencer already awaits `PlaybackHandle.done`, so a
tier that takes 800 ms to fetch and one that resolves instantly are indistinguishable to gameplay.
Telemetry already names every failure branch, so the chain's tier-promotion behaviour is observable
from day one.

The one piece of preparatory work Epic 3 should do *before* writing a provider: add the
`no-restricted-imports` rule from §14.6, so the new `voice/providers/*` cannot be imported by feature
code the way `googleTranslateTts` currently could be.
