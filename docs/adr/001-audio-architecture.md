# ADR 001 — Audio architecture

**Status**: Accepted, partially implemented
**Date**: 2026-07-10
**Context documents**: `SOUND_ARCHITECTURE_DISCOVERY.md` (structural inventory),
`AUDIO_SYSTEM_ROOT_CAUSE_ANALYSIS.md` (why pronunciation was unreliable),
`AUDIO_IMPLEMENTATION_MASTER_PLAN.md` (the epic/task plan this ADR records the outcome of)

## Context

Audio lived in two module singletons disguised as pure utilities: `shared/utils/sfx.ts` owned an
`AudioContext`, `shared/utils/audio.ts` owned an `HTMLAudioElement` plus a cancellation token and a
debounce timer. Fourteen modules — including leaf presentational components — called them directly.

Three consequences drove this work:

1. **The user's "Auto-Play Audio" setting was honoured at 4 of 10 autoplay sites.** Speed, Match,
   Kana Quiz, Survival and Kana Practice ignored it entirely.
2. **`allowAudio(type, stage)` was a tautology.** It ignored its first argument and returned `true`
   at all four call sites, while its doc comment described a listening-quiz exception that had no
   implementation. Documentation asserting a safety property the code did not have.
3. **Every failure was silent.** `playAudio` returned `void`; each failure branch was `catch {}`.
   The reported symptom — "pronunciation sometimes fails for no obvious reason" — was precisely
   what the architecture was built to produce.

## Decisions

### 1. One owner: `shared/audio/manager.ts`

A framework-free module owns the context, the channels, the settings gate and the speech policy.
`lib/AudioProvider.tsx` injects the Zustand settings and installs lifecycle handlers once.

Settings are **read at call time**, not subscribed to. A toggle takes effect on the next sound with
no resubscription and no stale closure.

### 2. Requests declare intent, not permission

Every `speak()` carries `trigger: "auto" | "user"`. The manager decides. Call sites cannot forget
to check the setting because they no longer have the option to check it. This is what makes the
auto-play fix structural rather than a fix applied ten times.

`trigger: "user"` is never gated by auto-play — a learner asking to hear something cannot surprise
themselves with an answer.

### 3. `speak()` returns an outcome

A `PlaybackHandle` whose promise resolves `completed | cancelled | failed | suppressed`. This is
what makes sequencing, telemetry and the "audio unavailable" affordance possible at all.

### 4. Cues and voice are independent channels

`sfxMuted` / `voiceMuted` / `sfxVolume` / `voiceVolume`, persisted separately. Muting one never
silences the other. Tested, because screen-reader users depend on exactly that combination.

### 5. Sound is sequenced, not timed

`sequence(key, steps, { policy })` replaces ad-hoc `setTimeout`s. Steps can wait for a named cue's
**measured tail** rather than a guessed constant. The old code used three different delays
(220/250/300 ms), every one of them shorter than the ~540 ms `correct` cue they claimed to follow.

Per-key interruption policies (`replace` / `queue` / `ignore-if-busy`) replace the single global
last-wins timer slot that used to cut every rapid pronunciation off mid-word.

### 6. The speech policy is real, or it is deleted

`allowSpeech({ stage, trigger, questionType })` blocks prompt-stage auto playback except for
listening questions. It has tests. The dead `"listen"` / `"reverse"` question types were removed
from the generator rather than left as decoration — but the policy's prompt-stage exception stays,
because that is the seam a real listening exercise will attach to.

### 7. Failures are observable

A telemetry bus names every failure branch; a status store derives `ok | degraded | unavailable`;
audio buttons render the unavailable state and stay tappable (the next tap is the retry). Failures
are sampled to the existing audit-log pipeline, capped per session, and always fire-and-forget —
telemetry may never break playback.

## What was explicitly not done

**The transport was not replaced.** `voice/googleTranslateTts.ts` still calls
`translate.google.com/translate_tts` with a `speechSynthesis` fallback. This is the root cause of
the original unreliability (RC-1/RC-2) and it remains open, blocked on a cloud-TTS credential and a
voice bake-off. The extraction was done so that replacing it touches one file and zero call sites.

**No volume slider.** The store holds `sfxVolume`/`voiceVolume` and the manager honours them, but
the app has no `Slider` primitive and the design system forbids working around a gap locally. Mute
toggles cover the real need today.

**iOS was not verified on a device.** The known iOS hazards — per-element gesture blessing, the
first `speak()` needing a gesture call stack, the ringer switch splitting Web Audio from media
elements — are documented in the root-cause analysis and remain untested here.

## Consequences

- Adding a sound means adding a preset and a call; adding a *category* (music, ambience) means
  adding a channel. Neither requires touching feature code.
- A global mute, per-category volume, ducking, and offline caching all now have exactly one place
  to attach.
- The cost is one indirection: feature code cannot reach the browser audio APIs, by design. A
  `no-restricted-globals` rule in `eslint.config.mjs` enforces this, so the next contributor is
  told to use `speak()` rather than rediscovering `new Audio()`.
- Scheduling is likewise centralised: features declare cues, they do not set timers. There is one
  delay mechanism (the sequencer) and one cancellation mechanism (last-wins in the transport,
  abort-on-stop in the sequencer).
