# Sound Architecture Discovery — Kana & Nihongo Master

> **Historical document.** This describes the audio system *before* the 2026-07-10 rebuild. The
> `shared/utils/{audio,sfx,speechPolicy}.ts` files this report traces no longer exist — see
> `shared/audio/README.md` and `docs/adr/001-audio-architecture.md` for the current architecture.
> Kept for its evidence trail (file:line citations) and as the origin record for the debt items
> (D1–D22) resolved by later work. The one finding that is **still current**: the Google Translate
> TTS transport this report flags as unreliable has not yet been replaced — see
> `AUDIO_POST_MIGRATION_CLEANUP_REPORT.md` §14 for the up-to-date remaining-debt list.

**Status**: Read-only reverse-engineering. No source code was modified.
**Date**: 2026-07-10
**Scope**: Every audio-producing, audio-gating, and audio-adjacent code path in the repository.
**Method**: Full-text search across all non-`node_modules`/`.next` source, followed by import-chain tracing from `src/shared/utils/{audio,sfx,speechPolicy}.ts` to every call site, and from every call site back up to the originating user interaction.

**Evidence convention**: `path/to/file.ts:LINE`. Claims are labelled:

- **[V]** — Verified by reading source.
- **[D]** — Derived by arithmetic/logic from verified constants (deterministic, but not observed at runtime).
- **[A]** — Assumption or unverified hypothesis. Requires runtime confirmation.

---

## 1. Executive Summary

The app has **no audio assets and no audio libraries**. Every sound is generated at runtime from one of three browser primitives:

| Layer | Primitive | File |
|---|---|---|
| UI/game feedback ("SFX") | Web Audio API — synthesized oscillators | `src/shared/utils/sfx.ts` |
| Japanese pronunciation | `HTMLAudioElement` pointed at an **undocumented Google Translate TTS endpoint** | `src/shared/utils/audio.ts` |
| Pronunciation fallback | Web Speech API (`SpeechSynthesis`) | `src/shared/utils/audio.ts` |

**[V]** `find . -iname "*.mp3" -o -iname "*.wav" …` (excluding `node_modules`/`.next`) returns zero results. `src/public/` contains only five SVGs.
**[V]** `src/package.json` contains no audio dependency (no `howler`, `tone`, `use-sound`, etc.).

The system is **two independent, uncoordinated module singletons** with no shared manager, no mute, no volume control, and no lifecycle management. Three findings dominate everything else:

1. **The central audio-gating policy is a tautology.** `allowAudio(type, stage)` in `src/shared/utils/speechPolicy.ts:13` ignores its first parameter entirely and returns `true` for every one of its four call sites (all pass `"feedback"`). The four guards that read as "should this mode play audio?" are dead branches. The function's own docblock describes a listening-quiz exception that does not exist in the code.

2. **The user's "Auto-Play Audio" setting is honoured in 4 of 10 autoplay sites.** `globalAutoPlay` (`src/lib/app-store.ts:13`) gates pronunciation in the three flashcard players and Kana Learn. Speed mode, Match mode, Kana Quiz, Kana Survival (all three challenge modes), and Kana Practice mode 3 all autoplay pronunciation **without reading the setting at all**. No setting gates SFX anywhere.

3. **Nothing ever stops audio.** `stopActivePronunciation()` (`src/shared/utils/audio.ts:60`) exists but is not exported. No component, hook, or router event cancels in-flight speech, pending `setTimeout`s, or the `AudioContext`. There is no `visibilitychange`, `pagehide`, or `beforeunload` handler anywhere in the repository **[V]**. Pronunciation started in a study session continues playing after the user navigates away, and continues while the tab is hidden.

**Overall architectural verdict**: the two utility modules are individually well-written (deterministic presets, token-based cancellation, graceful TTS→speech fallback, throttling) but they sit at the wrong altitude. They are *stateless-looking function exports backed by hidden module singletons*, imported directly by leaf components and gameplay hooks. There is no seam at which mute, volume, ducking, tab-suspension, or theming could be introduced without touching all 14 call sites.

**Confidence**: High on structure and call graph (fully traced). Medium on runtime browser behaviour (no runtime instrumentation was performed; see §16 and §22).

---

## 2. High-Level Architecture

```
                        ┌──────────────────────────────────────────┐
                        │  src/shared/utils/index.ts   (barrel)    │
                        │  export * from "./audio"                 │
                        │  export * from "./sfx"                   │
                        │  export * from "./speechPolicy"          │
                        └────────────────┬─────────────────────────┘
                                         │  (34 files import this barrel)
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
┌───────▼────────┐            ┌──────────▼─────────┐          ┌───────────▼──────────┐
│    sfx.ts      │            │     audio.ts       │          │  speechPolicy.ts     │
│  "use client"  │            │   "use client"     │          │  (no directive)      │
│                │            │                    │          │                      │
│ MODULE STATE:  │            │  MODULE STATE:     │          │  PURE (but the       │
│  audioCtx      │            │   currentAudio     │          │  `type` arg is       │
│  masterGain    │            │   pronunciationTimer│         │  ignored — §7.3)     │
│  compressor    │            │   playbackToken    │          │                      │
│  lastPlayedAt  │            │   mediaUnlocked    │          └──────────────────────┘
│                │            │   selectedVoiceURI │
│ SIDE EFFECT ON │            │                    │
│ IMPORT (L170)  │            │  SIDE EFFECT ON    │
│ 5 window       │            │  IMPORT (L208)     │
│ listeners,     │            │  5 window          │
│ NOT `once`     │            │  listeners, `once` │
└───────┬────────┘            └──────────┬─────────┘
        │                                │
   playSFX(type)              playAudio(text)
                              playPronunciationFeedback(text, delayMs)
        │                                │
┌───────▼────────┐            ┌──────────▼─────────────────────────────┐
│ Web Audio API  │            │ new Audio(translate.google.com/…)      │
│ Oscillator ×N  │            │        │ .play() rejects / onerror     │
│  → Gain(env)   │            │        ▼                               │
│  → Gain(route) │            │ SpeechSynthesisUtterance(ja-JP, 0.82)  │
│  → masterGain  │            └────────────────────────────────────────┘
│  → compressor  │
│  → destination │
└────────────────┘
```

### 2.1 The two channels never meet

**[V]** `sfx.ts` routes everything through a single `masterGain` (gain `0.66`, `sfx.ts:30`) into a `DynamicsCompressorNode` (`sfx.ts:83-91`). `audio.ts` uses `HTMLAudioElement.volume = 1` (`audio.ts:148`) and `SpeechSynthesisUtterance.volume = 1` (`audio.ts:121`).

There is no shared bus. The compressor in `sfx.ts` cannot see or duck pronunciation audio, and `masterGain` cannot attenuate it. A global mute would have to be implemented three times.

### 2.2 Barrel-induced global side effects

**[V]** `src/shared/utils/index.ts` re-exports `./audio` and `./sfx`. Both modules execute `window.addEventListener(...)` at module scope (`audio.ts:208-223`, `sfx.ts:170-182`).

**[V]** 34 files import from `"@/shared/utils"`. Among them is `src/shared/components/ui/Button.tsx:6` (`import { cn } from "@/shared/utils"`) — the most widely used primitive in the app.

**[D]** Consequence: importing `cn` anywhere pulls the whole barrel's module graph. Every page that renders a `Button` — including `/login`, which has no audio — registers 10 global window listeners and arms the `AudioContext` bootstrap. On the first click anywhere in the app, `unlockAudio()` (`sfx.ts:164`) runs and constructs a real `AudioContext`.

---

## 3. Complete Sound Execution Flow

### 3.1 SFX pipeline (`playSFX`)

```
User interaction (tap / keypress / grade)
  ↓
React component or gameplay hook calls playSFX("correct" | "wrong" | "click")
  ↓  sfx.ts:192
getContext()                                        sfx.ts:73
  ├─ first call: new AudioContext()                 sfx.ts:78
  │  createGain() → gain.value = 0.66               sfx.ts:80-81
  │  createDynamicsCompressor()
  │    threshold -18, knee 10, ratio 2.5,
  │    attack 0.004, release 0.12                   sfx.ts:83-88
  │  masterGain → compressor → destination          sfx.ts:90-91
  └─ subsequent: returns the singleton
  ↓
shouldThrottle(type)                                sfx.ts:184
  performance.now() - lastPlayedAt[type] < SFX_THROTTLE_MS[type] → bail
  click 24ms | correct 90ms | wrong 110ms           sfx.ts:31-35
  ↓
void resumeContext(ctx)   // if state === "suspended"   sfx.ts:158
  ↓
switch(type) → playCorrect / playWrong / playClick   sfx.ts:198-208
  ↓
scheduleTone(ctx, step, volume) per ToneStep         sfx.ts:117
  osc = createOscillator(); gain = createGain()
  osc.frequency.setValueAtTime(step.frequency, start)
  [if endFrequency] osc.frequency.exponentialRampToValueAtTime(...)
  applyEnvelope(gain, start, peak, duration)         sfx.ts:109
    attack = min(0.006, duration*0.25)
    setValueAtTime(0.0001) → linearRamp(peak) → exponentialRamp(0.0001)
  osc → gain → routeToMaster(gain, volume)           sfx.ts:101
    creates ANOTHER GainNode, connects to masterGain
  osc.start(start); osc.stop(start + duration + 0.03)
  ↓
Speakers
```

**Autoplay unlock**: `sfx.ts:170-182` registers `unlockAudio` on `click`, `keydown`, `mousedown`, `pointerup`, `touchend` — **`{ passive: true }` only, no `once: true`** **[V]**. These five listeners persist for the document's lifetime and re-run `getContext()` + `resumeContext()` on every one of those events, forever.

### 3.2 Pronunciation pipeline (`playAudio`)

```
User taps a speaker button / a card is revealed / an answer is graded
  ↓
playAudio(text)                                     audio.ts:226  (thin alias)
  └─ playPronunciation(text)                        audio.ts:169
       ↓
     normalizePronunciationText(text)               audio.ts:31
       trim → collapse whitespace → slice(0, 180)
       (empty ⇒ bail)
       ↓
     clearPronunciationTimer()                      audio.ts:35
       cancels any pending playPronunciationFeedback
       ↓
     stopActivePronunciation()                      audio.ts:60
       playbackToken += 1          ← invalidates all in-flight callbacks
       stopBrowserSpeech()  → synth.cancel()
       stopCurrentMedia()   → pause(); removeAttribute("src"); load()
       ↓
     warmSpeechVoices()                             audio.ts:100
       synth.getVoices()
       synth.addEventListener("voiceschanged", () => synth.getVoices(), {once:true})
       ⚠ a NEW arrow function every call — see §13.2
       ↓
     playMediaPronunciation(text, playbackToken)    audio.ts:134
       │
       ├─ typeof Audio === "undefined" ⇒ playBrowserSpeech(text, token)
       │
       ├─ audio = new Audio(buildTtsUrl(text))      audio.ts:141
       │    https://translate.google.com/translate_tts
       │      ?ie=UTF-8&client=tw-ob&tl=ja&q=<text>  audio.ts:66-75
       │  currentAudio = audio; preload="auto"; volume=1
       │  audio.onerror = fallbackToSpeech
       │  audio.onended = () => currentAudio = null
       │  audio.play().catch(fallbackToSpeech)      audio.ts:161-164
       │
       └─ fallbackToSpeech()                        audio.ts:150
            if (playbackToken !== token) return     ← stale-callback guard
            playBrowserSpeech(text, token)          audio.ts:110
              utterance = new SpeechSynthesisUtterance(text)
              lang = "ja-JP"; rate = 0.82; pitch = 1; volume = 1
              voice = getJapaneseVoice(synth)       audio.ts:77
                filter lang startsWith "ja-"
                priority: Google 日本語, Google Japanese, Microsoft Nanami,
                          Microsoft Haruka, Kyoko, Otoya, Ayumi, Haruka
                cache selection in selectedJapaneseVoiceURI
              synth.cancel(); synth.resume(); synth.speak(utterance)
```

**Delayed variant**:

```
playPronunciationFeedback(text, delayMs = 220)      audio.ts:230
  clearPronunciationTimer()
  pronunciationTimer = window.setTimeout(() => playPronunciation(text), delayMs)
```

A single module-level `pronunciationTimer` means consecutive calls **debounce — last one wins**. This is asserted by `src/shared/utils/audio.test.ts:168-184`.

**Autoplay unlock**: `audio.ts:208-223` registers `unlockPronunciationAudio` on the same five events, with `{ once: true, passive: true }` **[V]**. It plays a 4-byte silent WAV data URI (`audio.ts:18-19`) at `volume = 0` and sets `mediaUnlocked = true` on resolve.

**[D]** Because five separate `once` listeners are registered, a single physical tap fires `mousedown` → `pointerup` → `click` → (on touch) `touchend`. `mediaUnlocked` is only set inside the async `.then()` (`audio.ts:196`), so the `if (mediaUnlocked) return` guard at `audio.ts:182` has not yet flipped. Up to **four silent `Audio` elements are constructed and played on the first tap**. They are `once` listeners, so this happens exactly once per page load. Harmless but wasteful.

**[V]** `mediaUnlocked` is written but never read for any purpose other than that dedupe guard. It does **not** gate `playMediaPronunciation`.

---

## 4. Dependency Graph

```
app/(main)/settings/page.tsx ──────────┐
features/kana/hub/components/KanaHub ──┤
                                       ├──▶ lib/app-store.ts  (globalAutoPlay)
features/flashcard/components/          │
  FlashcardLearn ───────────────────────┤
  FlashcardPractice ────────────────────┤
  FlashcardMistakeReview ───────────────┤
features/kana/learn/components/KanaLearn┘
      │
      │  (the ONLY four consumers that read globalAutoPlay)
      ▼
─────────────────────────────────────────────────────────────────────────────
                           shared/utils (barrel)
─────────────────────────────────────────────────────────────────────────────
      ▲                    ▲                     ▲                    ▲
      │ playAudio          │ playSFX             │ playPronunciation  │ allowAudio
      │                    │                     │   Feedback         │
      │                    │                     │                    │
┌─────┴──────────┬─────────┴──────────┬──────────┴─────────┬──────────┴────────┐
│                │                    │                    │                   │
FlashcardLearn   FlashcardLearn       useGameEngine        useMatchModeSession
FlashcardPractice FlashcardPractice   useKanaQuizSession   useGameEngine
FlashcardMistake FlashcardMistake                          useKanaQuizSession
useMatchModeSess useMatchModeSession                       AnswerFeedback
useKanaPlayDeck  useGameEngine (via
useSurvivalGame    onSFXPlay callback)
ChartCell        useKanaQuizSession
QuizPlaying      useSurvivalGame
AnswerFeedback
```

### 4.1 Layering violations

**[V]** The documented architecture (`CODEBASE_CONTEXT.md` §4) is **UI → Hook → Service → API**. Audio has no service layer. Leaf presentational components call the browser-audio utility directly:

- `src/features/kana/chart/components/ChartCell.tsx:38` — `onClick={() => playAudio(item.char)}`
- `src/features/kana/components/AnswerFeedback.tsx:48,71` — `onClick={onReplayAudio ?? (() => playAudio(question.char))}`
- `src/features/kana/quiz/components/QuizPlaying.tsx:102,165`
- `src/features/flashcard/components/FlashcardLearn.tsx:193` (and Practice `:395`, MistakeReview `:320`)

`ChartCell` is otherwise a pure props-driven cell; it reaches through three layers to touch `window.speechSynthesis`.

### 4.2 The one indirection that exists (and is dead)

**[V]** `src/features/flashcard/games/speed/engine/types.ts:119` declares:

```ts
onAudioPlay?: (text: string) => void;
```

**[V]** Grep across the whole repo finds exactly one occurrence — the declaration. It is never passed by `useGameEngine` (`src/features/flashcard/games/speed/hooks/useGameEngine.ts:81-103` passes only `onScoreSync`, `onSessionEnd`, `onSFXPlay`) and never invoked by `GameEngine`. This is the vestige of an inversion-of-control design that was abandoned; `onSFXPlay` survived, `onAudioPlay` did not. Pronunciation for Speed mode was instead moved into a React effect (§8.2).

---

## 5. Folder & File Inventory

### 5.1 Sound-producing / sound-gating source (10 files)

| File | Role | LOC |
|---|---|---|
| `src/shared/utils/audio.ts` | Pronunciation: Google TTS + SpeechSynthesis fallback | 239 |
| `src/shared/utils/sfx.ts` | Synthesized Web Audio SFX | 209 |
| `src/shared/utils/speechPolicy.ts` | Gating policy (`allowAudio`) | 20 |
| `src/shared/utils/index.ts` | Barrel (re-exports all three) | 11 |
| `src/shared/utils/audio.test.ts` | The only audio test | 185 |
| `src/features/flashcard/components/FlashcardAudioButton.tsx` | Shared replay button | 47 |
| `src/features/kana/components/KanaAudioButton.tsx` | Shared replay button (parallel impl.) | 49 |
| `src/features/flashcard/utils/displayEngine.ts` | `getAudioText(card)` → `card.primary` | (L13-15) |
| `src/lib/app-store.ts` | `globalAutoPlay` persisted preference | 44 |
| `src/shared/components/ui/SettingsMenu.tsx` | Renders the `audioToggle` prop | — |

### 5.2 Call sites (14 modules)

| Module | `playAudio` | `playSFX` | `playPronunciationFeedback` | `allowAudio` | reads `globalAutoPlay` |
|---|:--:|:--:|:--:|:--:|:--:|
| `flashcard/components/FlashcardLearn.tsx` | ✔ `:62,:193` | ✔ `:97,:109` | | | ✔ `:60` |
| `flashcard/components/FlashcardPractice.tsx` | ✔ `:103,:395` | ✔ `:169,:272,:326,:366` | | | ✔ `:101` |
| `flashcard/components/FlashcardMistakeReview.tsx` | ✔ `:90,:320` | ✔ `:150,:291` | | | ✔ `:89` |
| `flashcard/games/match/hooks/useMatchModeSession.ts` | ✔ `:281` | ✔ `:241,:291,:342,:353` | | ✔ `:279` | ✘ |
| `flashcard/games/speed/hooks/useGameEngine.ts` | | ✔ `:102` | ✔ `:146` | ✔ `:145` | ✘ |
| `flashcard/games/speed/engine/core/GameEngine.ts` | | ✔ via `onSFXPlay` `:91,:201` | | | ✘ |
| `kana/hooks/useKanaQuizSession.ts` | | ✔ `:216,:219` | ✔ `:232` | ✔ `:231` | ✘ |
| `kana/hooks/useSurvivalGame.ts` | ✔ `:425,:453` | ✔ `:418,:424,:446,:452,:464` | | | ✘ |
| `kana/hooks/useKanaPlayDeck.ts` | ✔ `:64,:75` | | | | (via prop) |
| `kana/components/AnswerFeedback.tsx` | ✔ `:48,:71` | | | ✔ `:28` | ✘ |
| `kana/chart/components/ChartCell.tsx` | ✔ `:38` | | | | ✘ |
| `kana/quiz/components/QuizPlaying.tsx` | ✔ `:102,:165` | | | | ✘ |
| `kana/learn/components/KanaLearn.tsx` | (via deck) | | | | ✔ `:33` |
| `kana/practice/components/KanaPractice.tsx` | (via deck `:28,:34`) | | | | ✘ |

### 5.3 Modules that produce **no** sound (verified negatives)

**[V]** Zero audio references in: `src/features/game/**` (`GameResultsScreen`, `StreakHud`, `MiniLeaderboard`, `LivesDisplay`, `TierBadge`, `StatGrid`), `src/features/flashcard/games/study/**` (`StudySession`, `useStudySession`), `src/features/flashcard/components/GradeButtons.tsx`, `src/features/flashcard/components/McChoiceGrid.tsx`, `src/features/notifications/**`, `src/features/admin/**`.

**[V]** No `navigator.vibrate`, no `<audio>`/`<video>` JSX elements, no service worker, no manifest.

---

## 6. Sound Asset Inventory

**There are none.** Everything is synthesized or fetched on demand.

### 6.1 Synthesized presets (`src/shared/utils/sfx.ts`)

| Event | Oscillators | Spec | Total tail **[D]** |
|---|---|---|---|
| `correct` `:37-41` | 3 × sine | 523.25→516 Hz, delay 0, dur 0.34, peak 0.34<br>659.25→652 Hz, delay 0.09, dur 0.42, peak 0.31<br>1046.5 Hz (no ramp), delay 0.09, dur 0.16, peak 0.07 | **≈ 0.54 s** (0.09 + 0.42 + 0.03 stop pad) |
| `wrong` `:43-60` | 2 × sine | 293.66→230 Hz, delay 0, dur 0.36, peak 0.34<br>246.94→196 Hz, delay 0.02, dur 0.32, peak 0.22 | **≈ 0.39 s** |
| `click` `:143-156` | 1 × sine | 980→720 Hz, delay 0, dur 0.035, peak 0.16 | **≈ 0.065 s** |

`correct` is a major-third rising arpeggio (C5 → E5) with a C6 sparkle. `wrong` is a descending minor-ish pair (D4→~Bb3, B3→G3). Musically coherent, deterministic (`sfx.ts:6-8` explicitly documents "presets do not use randomness").

**[D]** Peak amplitudes sum to `0.34 + 0.31 + 0.07 = 0.72` for `correct` before `masterGain` (0.66) and the compressor. A single `correct` cannot clip. **Overlapping** SFX can (§13.4).

### 6.2 Remote asset: Google Translate TTS

**[V]** `src/shared/utils/audio.ts:14` — `https://translate.google.com/translate_tts`
**[V]** `audio.ts:66-75` — query: `ie=UTF-8`, `client=tw-ob`, `tl=ja`, `q=<text>`.

This is an **unofficial, undocumented, unauthenticated endpoint**. `client=tw-ob` is the "translate web — one box" client identifier, not a supported public API. Implications:

- **[A]** Subject to silent rate-limiting (HTTP 429) and IP-based blocking. No retry/backoff exists.
- **[V]** No caching layer of any kind. `new Audio(url)` is constructed fresh on every playback (`audio.ts:141`). Repeated plays of `あ` re-request unless the browser's HTTP cache happens to serve it.
- **[A]** Every Japanese character/word the user studies is transmitted to Google, on every playback, without consent disclosure. There is no privacy notice in `src/app/(main)/settings/page.tsx`.
- **[V]** No fallback for HTTP-level failure other than `audio.onerror` → `playBrowserSpeech` (`audio.ts:156`). This does cover offline and 4xx cases, since a non-media response body triggers `MEDIA_ERR_SRC_NOT_SUPPORTED`. **[A]** Not runtime-verified.

### 6.3 Embedded asset: the unlock primer

**[V]** `audio.ts:18-19` — a base64 WAV data URI, 4 bytes of PCM data, played at `volume = 0` to satisfy autoplay policy.

### 6.4 Unused / dead surface

| Symbol | File | Status |
|---|---|---|
| `onAudioPlay` | `speed/engine/types.ts:119` | **[V]** Declared, never passed, never called |
| `volume` param of `playSFX` | `sfx.ts:192` | **[V]** No call site ever passes it (all 16 calls use one argument) |
| `clampVolume` allowance to `1.25` | `sfx.ts:98` | **[D]** Unreachable — `volume` is always `1` |
| `AudioStage` type | `speechPolicy.ts:1` | **[V]** Exported, imported by nobody |
| `ImmersiveQuestionType` type | `speechPolicy.ts:2` | **[V]** Exported, imported by nobody |
| `type` param of `allowAudio` | `speechPolicy.ts:14` | **[V]** Accepted, never read in the body |
| `mediaUnlocked` | `audio.ts:24` | **[V]** Written; only read as a dedupe guard, never gates playback |
| `"listen"` / `"reverse"` question types | `useKanaQuizSession.ts:153` | **[V]** Generated in Survival only; no UI branches on them (§12.5) |
| `isSmartMode` param | `useKanaQuizSession.ts:138` | **[V]** No caller ever passes it |

---

## 7. Audio Utility Analysis

### 7.1 `src/shared/utils/sfx.ts`

**Strengths [V]**

- True singleton `AudioContext` (`:73-95`) — exactly one is ever constructed.
- Master compressor prevents the additive clipping that naive per-tone code produces.
- Per-type throttling (`:184-190`) is the only rapid-fire protection in the codebase.
- `applyEnvelope` (`:109-115`) does `cancelScheduledValues` → `setValueAtTime(0.0001)` → `linearRamp` → `exponentialRamp`, correctly avoiding the `exponentialRampToValueAtTime(0)` exception.
- `getAudioContextConstructor` (`:67-71`) handles `webkitAudioContext` for older Safari.

**Defects**

1. **[V] Unlock listeners lack `once`.** `sfx.ts:179-181`:
   ```ts
   events.forEach((eventName) => {
       window.addEventListener(eventName, unlockAudio, { passive: true });
   });
   ```
   Compare `audio.ts:218-221`, which passes `{ once: true, passive: true }`. Five permanent listeners run `getContext()` + `resumeContext()` on every click, keydown, mousedown, pointerup, and touchend for the document's entire lifetime. They are never removed.

2. **[V] Per-tone `GainNode`s are never disconnected.** `routeToMaster` (`:101-107`) creates a second `GainNode` per tone and connects it to `masterGain`. Neither it nor the envelope gain is ever `disconnect()`ed, and no `osc.onended` handler exists. **[A]** Per the Web Audio spec, nodes downstream of a stopped source with no other retention become eligible for collection, so this is *probably* fine — but it is unverified, and `correct` allocates 3 oscillators + 6 gain nodes per invocation. This is the single most likely source of a slow leak under sustained play (Survival Drop mode fires `correct` on every completed word).

3. **[V] `lastPlayedAt` is reassigned, not mutated** (`:188`): `lastPlayedAt = { ...lastPlayedAt, [type]: now }`. One object allocation per non-throttled SFX. Trivial, but gratuitous for a 3-key record.

4. **[V] No `close()`, no `suspend()`.** The `AudioContext` enters `running` on first click and stays there. **[A]** On mobile Safari this keeps the audio session active, which can duck background media and surface OS media controls.

5. **[V] Zero test coverage.** `sfx.ts` is not exercised by any test.

### 7.2 `src/shared/utils/audio.ts`

**Strengths [V]**

- **Token-based cancellation** (`playbackToken`, `:25`) is correct. `stopActivePronunciation` (`:60-64`) increments the token *before* calling `stopCurrentMedia()`. This ordering matters: `stopCurrentMedia` does `removeAttribute("src"); load()`, which on several browsers synchronously fires an `error` event on the element → `audio.onerror` → `fallbackToSpeech` → `if (playbackToken !== token) return`. The guard catches it. This is subtle and correct.
- Voice selection caches by `voiceURI` (`:85-97`) and handles the `ja_JP` / `ja-JP` normalization (`:79`).
- `synth.cancel(); synth.resume(); synth.speak(...)` (`:125-127`) is the well-known Chrome workaround for a paused/stuck synthesis queue.
- Graceful three-tier fallback: media → speech → nothing, with `try/catch` at each construction site.

**Defects**

1. **[V] `warmSpeechVoices` leaks listeners.** `audio.ts:100-108`:
   ```ts
   function warmSpeechVoices(): void {
       const synth = getSpeechSynthesis();
       if (!synth) return;
       synth.getVoices();
       if (typeof synth.addEventListener === "function") {
           synth.addEventListener("voiceschanged", () => synth.getVoices(), { once: true });
       }
   }
   ```
   It is called from `playPronunciation` (`:177`) — i.e. **on every single pronunciation**. The handler is a fresh arrow function each time, so `addEventListener` cannot dedupe it. `{ once: true }` only removes it *if the event fires*. On any browser where voices are already loaded (the normal steady state), `voiceschanged` never fires again, and one listener accumulates on `window.speechSynthesis` **per pronunciation, unbounded, for the session's lifetime**. A 20-question Kana quiz adds 20; a Survival Drop run adds one per completed word.

2. **[V] `stopActivePronunciation` is not exported.** Neither is `playPronunciation`. The module's public surface is exactly `playAudio` and `playPronunciationFeedback` (`:226`, `:230`). There is **no way for any consumer to stop audio**, and none tries.

3. **[V] `pronunciationTimer` is module-global and never cleared on unmount.** A `playPronunciationFeedback(text, 250)` scheduled at the moment the user hits Back will still fire 250 ms later, on a route that no longer exists.

4. **[V] `playAudio` is a zero-value alias.**
   ```ts
   export function playAudio(text: string): void { playPronunciation(text); }
   ```

5. **[V] Text is truncated blindly.** `normalizePronunciationText` (`:31-33`) does `.slice(0, 180)` with no word-boundary awareness.

6. **[V] `tl=ja` is hardcoded.** `getAudioText(card)` (`displayEngine.ts:13-15`) returns `card.primary` — whatever the deck author typed. A deck of English vocabulary sends English text to a Japanese TTS voice. There is no language field on `FlashCardContent` and no detection.

7. **[V] Test coverage is 4 cases** (`audio.test.ts`): happy-path media, fallback-on-`play()`-rejection, fallback-on-no-`Audio`, and feedback debounce. Not covered: `onerror` fallback, token invalidation, voice-priority selection, `unlockPronunciationAudio`.

### 7.3 `src/shared/utils/speechPolicy.ts` — the tautology

**[V]** The entire file:

```ts
export type AudioStage = "prompt" | "feedback";
export type ImmersiveQuestionType = "read" | "reverse" | "listen" | "type" | "speed" | "match";

/**
 * Rules:
 *  - prompt   stage: NEVER auto-play audio when a question appears unless it's a listening quiz. …
 *  - feedback stage: ALL question types play audio after submission …
 */
export function allowAudio(
    type: ImmersiveQuestionType | string | undefined,
    stage: AudioStage,
): boolean {
    if (stage === "prompt") return false;
    if (stage === "feedback") return true;
    return false;
}
```

**[V]** `type` is never referenced in the body.
**[V]** All four call sites pass `"feedback"`:

| Call site | Expression | Evaluates to |
|---|---|---|
| `useMatchModeSession.ts:279` | `allowAudio("match", "feedback")` | `true` |
| `useGameEngine.ts:145` | `allowAudio("speed", "feedback")` | `true` |
| `useKanaQuizSession.ts:231` | `allowAudio(questionType, "feedback")` | `true` |
| `AnswerFeedback.tsx:28` | `allowAudio(questionType, "feedback")` | `true` |

**[V]** No call site anywhere passes `"prompt"`. The `prompt` branch is unreachable.

Consequences:

- The four `if (allowAudio(...))` guards are `if (true)`. They read like policy enforcement and enforce nothing.
- The docblock's headline rule — *"NEVER auto-play audio when a question appears **unless it's a listening quiz**"* — has **no implementation**. There is no listening-quiz exception, because there is no `prompt` call site to except.
- `AnswerFeedback.tsx:27` carries the comment `// Show a "play again" button only for listen-type questions in the feedback stage`. **[V]** The button renders for *every* question type, because `canReplayAudio` reduces to `question && questionType`.

This is the most dangerous artefact in the system: it is *documentation that claims a safety property the code does not have*. Any future engineer adding a `prompt`-stage autoplay will read the docblock, call `allowAudio(type, "prompt")`, get `false`, and conclude the guard works — never noticing that the "listening quiz" carve-out they were told exists does not.

---

## 8. Hook Analysis

### 8.1 `useKanaPlayDeck` (`src/features/kana/hooks/useKanaPlayDeck.ts`)

**[V]** The one hook that accepts audio behaviour as a parameter:

```ts
speakOnNavigate = true          // :20  ← default ON
...
if (speakOnNavigate && nextChar) playAudio(nextChar.char);   // :64
const playCurrent = () => { if (char) playAudio(char.char); }; // :75
```

Two consumers, two different policies **[V]**:

- `KanaLearn.tsx:33` — `speakOnNavigate: globalAutoPlay` ✔ honours the user setting.
- `KanaPractice.tsx:28` — `speakOnNavigate: practiceMode === 3` ✘ ignores it. And `KanaPractice.tsx:34` fires `playCurrent()` on entering mode 3, also ungated.

### 8.2 `useGameEngine` (Speed) — polling-driven audio

**[V]** `useGameEngine.ts:122-129` polls `engine.getState()` every 100 ms into React state. `GameEngine.getState()` (`GameEngine.ts:115-117`) returns `{ ...this.state }` — a fresh object each poll, but `currentQuestion` is a stable reference (shallow copy).

**[V]** `useGameEngine.ts:138-148`:

```ts
useEffect(() => {
    const question = state?.currentQuestion;
    if (!question || state.feedbackStatus === "idle") return;
    const card = config.cards.find((c) => c.id === question.cardId);
    if (!card) return;
    if (allowAudio("speed", "feedback")) {
        playPronunciationFeedback(getAudioText(card), 250);
    }
}, [state?.feedbackStatus, state?.currentQuestion, config.cards]);
```

Observations:

- SFX is synchronous (engine → `onSFXPlay` → `playSFX`, `GameEngine.ts:91`). Pronunciation is asynchronous and **arrives up to 100 ms late** because it waits for the next poll tick before the effect's dependency changes. **[D]** Real pronunciation offset is therefore `250 – 350 ms`, not the `250 ms` the comment implies.
- The effect has **no cleanup**. Nothing cancels the scheduled `pronunciationTimer` if the component unmounts, or if `completeFeedback()` advances the question.
- `config.cards.find(...)` is a linear scan on every feedback transition. Negligible at deck sizes, but it means the effect closes over the whole card array.

### 8.3 `useKanaQuizSession` — shared engine, mixed responsibilities

**[V]** `useKanaQuizSession.ts:198-241` (`processAnswer`) does five things: set status, record a Firestore char-stat, mutate score/streak, **play SFX**, **schedule pronunciation**, and schedule the advance callback. Sound is welded into the scoring function.

**[V]** `useKanaQuizSession.ts:147-155` — the random question-type picker:

```ts
const types: QuestionType[] = ["read", "reverse", "listen", "type"];
selectedType = types[Math.floor(Math.random() * types.length)];
```

This branch is reached only when `forceType` is falsy. **[V]** Call sites:

| Caller | Call | `forceType`? |
|---|---|---|
| `useQuizState.ts:35` | `generateQuestion(mode === "type" ? "type" : "read")` | always |
| `useQuizState.ts:59` | `generateQuestion(quizMode === "type" ? "type" : "read")` | always |
| `useQuizState.ts:84` | `generateQuestion("type")` | always |
| `useSurvivalGame.ts:215` | `generateQuestion()` | **never** |
| `useSurvivalGame.ts:253` | `generateQuestion()` | **never** |

**[D]** Therefore: the Kana **Quiz** never produces `listen` or `reverse` questions. Kana **Survival** (infinity/time) does — and `SurvivalQuizScreen.tsx` renders identical multiple-choice romaji options regardless (`:105-118`), so a `listen` question shows the character and a `reverse` question is indistinguishable from a `read` one. The entire listening modality is **generated but never realized**.

**[V]** `isSmartMode` (`useKanaQuizSession.ts:138`) is never passed by any caller — `useQuizState.ts:34` calls `session.buildSmartDeck(...)` separately and then `generateQuestion("read")`.

### 8.4 `useMatchModeSession` — the only raw `setTimeout` pronunciation

**[V]** `useMatchModeSession.ts:279-283`:

```ts
if (allowAudio("match", "feedback")) {
    // Delay so the "ting" SFX is heard before pronunciation.
    setTimeout(() => playAudio(getAudioText(card)), 300);
}
```

This is a **third, hand-rolled delay mechanism** that bypasses `playPronunciationFeedback`'s debounce entirely. Multiple pending timers can stack; each fires `playAudio`, which calls `stopActivePronunciation()` and kills its predecessor mid-word. **[D]** Matching two pairs within 300 ms produces one clipped syllable followed by one full word.

**[D]** The comment's premise is arithmetically wrong: `correct` SFX rings until **≈ 540 ms** (§6.1), so pronunciation starting at 300 ms overlaps it for ~240 ms.

### 8.5 `useSurvivalGame` — Drop mode duplicates the sound layer

**[V]** Infinity and Time Attack route through `engine.processAnswer` (`useSurvivalGame.ts:252`), inheriting `useKanaQuizSession`'s sound.

**[V]** Drop mode does **not**. `handleDropTyping` (`:404-472`) hand-rolls its own sound, twice (once per branch):

```ts
playSFX("click");                       // :418  — every matching keystroke
...
    playSFX("correct");                 // :424
    playAudio(target.char);             // :425  — immediate, no delay, no debounce
    engine.setStatus("correct");        // :430  — bypasses processAnswer entirely
...
playSFX("click");                       // :446  (duplicate branch)
    playSFX("correct");                 // :452
    playAudio(target.char);             // :453
...
if (!hit) { playSFX("wrong"); }         // :464  — every non-matching keypress
```

**[D]** Consequences:
- `playSFX("click")` and `playSFX("correct")` fire in the **same synchronous tick** on the final keystroke of a word. They are different `SFXType`s, so `shouldThrottle` (per-type) does not suppress either. Both play simultaneously.
- `playAudio(target.char)` fires with **zero delay**, directly on top of the `correct` tone.
- A network request to Google TTS is issued **inside a `requestAnimationFrame`-driven game loop**, once per completed word.
- A fast typist completing words <500 ms apart triggers `stopActivePronunciation()` on each, so pronunciation is perpetually cut off mid-utterance.
- **[V]** Drop mode never calls `recordCharStat` — an unrelated but adjacent divergence from the shared engine.

### 8.6 The three flashcard players — near-identical, separately implemented

**[V]** `FlashcardLearn.tsx:58-65`, `FlashcardPractice.tsx:99-106`, `FlashcardMistakeReview.tsx:87-93` are three copies of the same "play on reveal, once" effect, each with its own `prevRevealedRef` / `prevFlippedRef` edge-detector:

```ts
const justFlipped = isFlipped && !prevFlippedRef.current;
if (justFlipped && globalAutoPlay) { ... playAudio(getAudioText(card)); }
prevFlippedRef.current = isFlipped;
```

The edge-detection is correct (guards against re-fire when `queue`/`card` identity changes). But it is duplicated three times and not extracted, despite `FlashcardAudioButton` having been extracted from these same three files (`FlashcardAudioButton.tsx:4-7` documents exactly that dedup).

**[V]** In all three, the **multiple-choice path plays no `click` SFX** on selection (`McChoiceGrid.tsx` has no audio; `handleMCSelect` at `FlashcardPractice.tsx:187` goes straight to a delayed `handleGrade`), while the **flip path does** (`FlashcardPractice.tsx:326`). Selecting an answer is silent; flipping a card clicks.

---

## 9. Service Analysis

**There is no audio service.** This is the central structural finding.

The codebase's own convention (`CODEBASE_CONTEXT.md` §4) is that *"services are the only code that touches Firestore/Admin SDK directly."* By analogy, a `services/audio.service.ts` would be the only code that touches `AudioContext` / `HTMLAudioElement` / `speechSynthesis`. Instead:

- `src/shared/utils/` holds two **stateful module singletons** disguised as pure utilities. `sfx.ts` owns an `AudioContext`; `audio.ts` owns an `HTMLAudioElement`, a timer handle, a cancellation token, and a voice cache. Per the repo's own `.rules/ai-rules/util.rule.md` convention, utilities are expected to be stateless.
- Because the state is module-scoped and the API is `void`-returning free functions, there is no object to configure, no instance to mute, and no handle to stop.

The nearest thing to a service boundary — `GameEngineConfig.onSFXPlay` / `onAudioPlay` (`speed/engine/types.ts:117-120`) — is a partial, unused inversion of control (§4.2).

---

## 10. Browser API Analysis

### 10.1 Web Audio API (`AudioContext`)

| Concern | Finding |
|---|---|
| Instantiation | **[V]** Lazy singleton, `sfx.ts:77-92`. Exactly one per document. |
| Prefixed fallback | **[V]** `webkitAudioContext` handled, `sfx.ts:70`. |
| Autoplay unlock | **[V]** `resumeContext()` on `state === "suspended"`, `sfx.ts:158-162`, driven by 5 permanent gesture listeners. |
| Suspension on hidden tab | **[V]** **Absent.** No `visibilitychange` handler exists anywhere in the repo. |
| `close()` | **[V]** **Never called.** |
| Node disconnection | **[V]** **Never called.** `routeToMaster` connects and forgets (`sfx.ts:101-107`). |
| `onended` cleanup | **[V]** **Absent.** |
| Sample-accurate scheduling | **[V]** Correct — `ctx.currentTime + delay`, `sfx.ts:118`. |

**[A]** Chrome suspends `AudioContext` automatically for backgrounded tabs; Safari does not always. Since the context is never explicitly suspended, `sfx.ts` relies entirely on browser policy.

### 10.2 `HTMLAudioElement` (Google TTS)

| Concern | Finding |
|---|---|
| Element lifecycle | **[V]** One `new Audio(url)` per playback, `audio.ts:141`. Never pooled or reused. |
| Detach | **[V]** `pause(); removeAttribute("src"); load()` in `stopCurrentMedia`, `audio.ts:52-58`. Correct teardown. |
| CORS | **[A]** Media elements are not CORS-gated for playback (no `crossOrigin` set), so this works. Would break if the code ever needed `AudioContext.createMediaElementSource`. |
| Autoplay policy | **[V]** Primed by a silent WAV on first gesture, `audio.ts:186-202`. |
| `play()` promise | **[V]** Guarded — `if (playResult) playResult.catch(fallbackToSpeech)`, `audio.ts:161-164`. Handles the older void-returning `play()`. |
| Caching | **[V]** None. |
| Concurrency | **[V]** Strictly serial — each `playPronunciation` cancels the previous. |

### 10.3 Web Speech API (`SpeechSynthesis`)

| Concern | Finding |
|---|---|
| Voice loading race | **[V]** `warmSpeechVoices` (`audio.ts:100`) calls `getVoices()` eagerly and listens for `voiceschanged`. |
| Voice caching | **[V]** `selectedJapaneseVoiceURI`, `audio.ts:23`, `:85-97`. |
| Chrome stuck-queue workaround | **[V]** `cancel(); resume(); speak()`, `audio.ts:125-127`. |
| Chrome ~15 s utterance cutoff | **[A]** Not handled. Mitigated in practice by `MAX_TTS_TEXT_LENGTH = 180` and by `speechSynthesis` being the *fallback* path only. |
| Listener accumulation | **[V]** **Leaks** — see §7.2 defect 1. |
| Cancellation on unmount | **[V]** **Absent.** `synth.cancel()` is reachable only from `stopActivePronunciation`, which is unexported. |

### 10.4 Mobile Safari specifics

**[A]** All of the following are inferred from known iOS behaviour and the absence of countermeasures in source; none were verified on device.

- iOS requires the gesture-driven unlock that `audio.ts:186` performs. `sfx.ts`'s `resume()` on gesture covers the `AudioContext` side. Both are present.
- iOS restricts `speechSynthesis.speak()` to run only after a user gesture in some versions. The Speed/Quiz fallback path calls `speak()` from a `setTimeout` callback (`audio.ts:234-237`), which is **not** in a gesture context. **[A]** The fallback may silently fail on iOS when the Google TTS request errors mid-quiz.
- iOS ignores `HTMLMediaElement.volume` assignment. `audio.ts:148` sets `volume = 1` (a no-op there) and `audio.ts:188` sets `volume = 0` on the unlock primer — **[A]** meaning the "silent" primer may be audible on iOS. It is 4 bytes of PCM, so likely inaudible in practice.
- A permanently `running` `AudioContext` claims the iOS audio session. **[A]** May duck the user's background music for the whole session.

### 10.5 Chrome autoplay policy

**[V]** Both modules bootstrap from the same five gesture events. `sfx.ts` re-arms on every gesture (no `once`); `audio.ts` arms once. Neither module can play before a gesture, which is correct — but also means **the very first sound in a session is at risk**: if a user's first interaction *is* the sound-producing one (e.g. tapping a `ChartCell`), the `click` listener and the `onClick` handler race. **[A]** Listener order: the `window`-level listener is registered at module-eval time (before React mounts), and `click` bubbles to `window` *after* the React handler runs. So the React `onClick` → `playAudio` fires **before** `unlockPronunciationAudio`. For `sfx.ts`, `playSFX` calls `getContext()` itself and then `resumeContext()`, so it self-heals. For `audio.ts`, `new Audio().play()` is called directly inside the gesture handler, which satisfies the policy anyway. **Probably safe by accident.** Worth a runtime check.

---

## 11. State Management Analysis

### 11.1 Who owns what

| State | Owner | Persistence | Scope |
|---|---|---|---|
| `globalAutoPlay` | Zustand `useAppStore` (`src/lib/app-store.ts:13`) | `localStorage` key `"app-settings"` via `persist` + `partialize` (`:34-41`) | Global, default `true` (`:28`) |
| `AudioContext`, `masterGain`, `compressor` | **Module singleton** (`sfx.ts:62-64`) | none | Document lifetime |
| `lastPlayedAt` (throttle) | **Module singleton** (`sfx.ts:65`) | none | Document lifetime |
| `currentAudio` | **Module singleton** (`audio.ts:22`) | none | Document lifetime |
| `pronunciationTimer` | **Module singleton** (`audio.ts:21`) | none | Document lifetime |
| `playbackToken` | **Module singleton** (`audio.ts:25`) | none | Document lifetime |
| `selectedJapaneseVoiceURI` | **Module singleton** (`audio.ts:23`) | none | Document lifetime |
| `mediaUnlocked` | **Module singleton** (`audio.ts:24`) | none | Document lifetime |
| `speakOnNavigate` | Prop into `useKanaPlayDeck` (`:20`) | none | Per-hook |

**No React Context, no Zustand slice, and no service instance owns any audio state.** The only audio-related state React knows about is one boolean.

### 11.2 How the preference propagates

```
localStorage["app-settings"].globalAutoPlay
  ↓ zustand/persist
useAppStore()
  ├─▶ app/(main)/settings/page.tsx:17,55   toggle "Auto-Play Audio"
  ├─▶ features/kana/hub/hooks/useKanaHubState.ts:18 ─▶ KanaHub.tsx:74  toggle "Autoplay Audio"
  ├─▶ FlashcardLearn.tsx:42  ────────▶ :60   gate
  ├─▶ FlashcardPractice.tsx:66 ──────▶ :101  gate
  ├─▶ FlashcardMistakeReview.tsx:67 ─▶ :89   gate
  └─▶ KanaLearn.tsx:26 ──────────────▶ :33   prop into useKanaPlayDeck
```

Everything else calls `playAudio` / `playSFX` unconditionally.

### 11.3 What does not exist

**[V]** No mute. No volume slider. No SFX toggle. No per-category (pronunciation / feedback / UI) control. `MASTER_VOLUME = 0.66` is a compile-time constant (`sfx.ts:30`).

**[V]** `src/shared/components/ui/SettingsMenu.tsx:13` — the component's usage docblock reads:
```
audioToggle={{ label: "Sound Effects", icon: Volume2, value: true, onChange: handleToggle }}
```
The prop is named `audioToggle` and the example says "Sound Effects", but its only consumer (`KanaHub.tsx:71-79`) wires it to `globalAutoPlay` with the label `"Autoplay Audio"`. **A sound-effects toggle does not exist.** The docblock advertises an API that was never built.

---

## 12. UX Behaviour Analysis

### 12.1 Master timing table **[D]** (derived from verified constants)

| Mode | Trigger | SFX at | Pronunciation at | SFX tail ends | Next-step at | Overlap |
|---|---|---|---|---|---|---|
| Flashcard Learn | Show Answer | `click` @0 | — | 65 ms | — | — |
| Flashcard Learn | reveal | — | @0 (`playAudio`) | — | — | — |
| Flashcard Learn | grade | `correct`/`wrong` @0 | — | 540/390 ms | immediate | — |
| Flashcard Practice | flip | `click` @0 | @0 | 65 ms | — | **click over pronunciation** |
| Flashcard Practice | MC select | *(silent)* | — | — | grade @750 ms | — |
| Flashcard MistakeReview | MC select | *(silent)* | — | — | grade @900 ms | — |
| Match | tile tap | `click` @0 | — | 65 ms | resolve @120 ms | — |
| Match | correct pair | `correct` @0 | @300 ms | 540 ms | unlock @400 ms | **240 ms** |
| Match | wrong pair | `wrong` @0 | — | 390 ms | shake clear @720 ms | — |
| Speed | answer | `correct`/`wrong` @0 | @250–350 ms | 540/390 ms | next Q @1100 ms | **190–290 ms** |
| Speed | timeout | `wrong` @0 | @250–350 ms | 390 ms | next Q @1100 ms | **40–140 ms** |
| Kana Quiz | correct | `correct` @0 | @220 ms | 540 ms | next Q @1250 ms | **320 ms** |
| Kana Quiz | wrong | `wrong` @0 | @220 ms | 390 ms | next Q @1550 ms | **170 ms** |
| Survival Drop | keystroke | `click` @0 | — | 65 ms | — | — |
| Survival Drop | word complete | `click` **+** `correct` @0 | @0 | 540 ms | — | **total collision** |
| Survival Drop | bad keystroke | `wrong` @0 | — | 390 ms | — | — |

Sources: `sfx.ts:37-60,143-156` (durations); `audio.ts:16` (220 ms); `useGameEngine.ts:146` (250 ms) + `:126` (100 ms poll); `useMatchModeSession.ts:281` (300 ms), `:286` (400 ms), `:309` (720 ms); `GameEngine.ts:93,203` (1100 ms); `useKanaQuizSession.ts:33-34` (1250/1550 ms); `FlashcardPractice.tsx:193` (750 ms); `FlashcardMistakeReview.tsx:177` (900 ms).

**The "SFX first, then pronunciation" intent stated at `useMatchModeSession.ts:280` and `useGameEngine.ts:136-137` is not achieved in any mode.** The `correct` SFX rings for 540 ms; every pronunciation delay is shorter than that.

### 12.2 Animation synchronisation

**[V]** `src/app/globals.css` contains exactly two `@keyframes`: `slide` (`:100-110`, a loading shimmer, not audio-related) and `shake` (`:112-123`). There is **no keyframe whose duration matches any audio delay** (220/250/300/720/1100/1250/1550 ms).

**[V]** `globals.css:125-127`:
```css
.animate-shake { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
```
**[D]** `wrong` SFX ≈ 0.39 s vs. shake 0.40 s — these align almost exactly. Likely coincidence, but it works.

**[V]** `animate-shake` consumers: `flashcard/games/match/components/MatchCard.tsx:45` (driven by `MatchGrid.tsx:28`, `if (ctx.shake.has(cell.id)) return "error"`), `app/(immersive)/kana/survival/_components/SurvivalQuizScreen.tsx:80`, `kana/quiz/components/QuizPlaying.tsx:98`.

**[V]** `useMatchModeSession.ts:304-309` sets shake, then clears it 720 ms later. **[D]** The CSS animation has already ended at 400 ms; the tiles sit in the "shaken" state for a further 320 ms with no sound and no motion.

**[V]** Card flip has **no keyframes at all** — `globals.css:129-146` defines only the static transform utilities (`.perspective-1000`, `.preserve-3d`, `.backface-hidden`, `.rotate-y-180`). The motion comes from an inline `transition-all duration-500` (`FlashcardPractice.tsx:324`). The reveal-pronunciation effect fires on the `isFlipped` state change, i.e. at **t=0**, while the card is still edge-on and the back face is invisible. **The word is spoken before its text is legible.**

### 12.2b Motion & audio accessibility

**[V]** There is **no `prefers-reduced-motion`, `motion-safe`, or `motion-reduce`** anywhere in any `.ts`/`.tsx`/`.css` file. Shake, flip, `animate-pulse`, `animate-in zoom-in`, and the framer-motion combo popup all run unconditionally.

**[V]** There is **no `aria-live`, `role="status"`, `role="alert"`, `aria-atomic`, or `aria-busy`** anywhere in the codebase. The only audio-related ARIA is `aria-label="Replay audio"` on the two buttons in `AnswerFeedback.tsx:50,73`.

**[D]** Combined with §11.3 (no mute, no volume): correct/wrong feedback is conveyed by colour, motion, and sound — and **none of the three has a reduction or alternative path**. A user who cannot hear the `wrong` tone and cannot perceive the 400 ms shake has only the colour change.

### 12.3 Per-sound intent audit

| Sound | Where | Why it exists (inferred) | Could it annoy? |
|---|---|---|---|
| `click` on card flip | `FlashcardPractice.tsx:326`, `MistakeReview:291`, `Learn:97` | Tactile confirmation | Low |
| `click` on hint toggle | `FlashcardPractice.tsx:272,366` | Same | Low |
| `click` on tile tap | `useMatchModeSession.ts:342,353` | Selection feedback | Low |
| `click` per keystroke | `useSurvivalGame.ts:418,446` | Typing feedback | **High** — 24 ms throttle means a 40 wpm typist hears ~200 clicks/min |
| `correct` | 6 sites | Reward | Medium — 540 ms is long for a 1.1 s feedback window |
| `wrong` | 7 sites | Error signal | **High in Drop mode** — `useSurvivalGame.ts:464` fires on *every* non-matching keypress, including typos mid-word |
| Pronunciation on reveal | 3 flashcard players | Bind sound to sight | Low (gated by setting) |
| Pronunciation on match | `useMatchModeSession.ts:281` | Reinforcement | Medium — clipped when matching fast |
| Pronunciation on Drop completion | `useSurvivalGame.ts:425,453` | Reinforcement | **Severe** — cancels itself continuously |
| Pronunciation replay button | 4 components | On-demand | None |

### 12.4 Rapid-clicking behaviour

**[V]** SFX is protected by `shouldThrottle` (`sfx.ts:184`), per type. **[V]** Pronunciation is protected by `stopActivePronunciation` (last-wins) and, for the *feedback* variant only, by the shared `pronunciationTimer` debounce.

**[V]** `useMatchModeSession.ts:281`'s raw `setTimeout` participates in neither. **[D]** N rapid matches → N pending timers → N `playAudio` calls → N−1 cancelled mid-word.

**[V]** `useMatchGameStore`'s `processing` flag (`useMatchModeSession.ts:327`) blocks double-resolution of tiles, which incidentally bounds the tile-tap `click` rate.

### 12.5 Silent events (sounds the design implies but does not have)

**[V]** None of the following produce any sound:

| Event | Location | Evidence |
|---|---|---|
| Confetti / victory | `features/game/components/GameResultsScreen.tsx:80` | No audio import in `features/game/**` |
| Combo / streak milestone | `useMatchModeSession.ts:255-262` → `MatchPlayingView.tsx:110-128` (framer-motion popup, `duration: 0.25`) | The only sound near a combo is the ordinary `correct` tone |
| Kana stroke "playback" | `kana/components/KanaStrokeAnimation.tsx` | **[V]** Fetches KanjiVG SVG path data and renders a **static** glyph — no audio, and no stroke motion either |
| Game over | `GameEngine.ts:213` `endGame()` | No `onSFXPlay` call |
| Timer running out | `TimerController` → `handleTimeout` `GameEngine.ts:179` | Plays `wrong`, not a distinct timeout cue |
| Countdown / last-10-seconds | `SurvivalQuizScreen.tsx:47` (turns the bar red) | Visual only |
| Life lost | `useSurvivalGame.ts:347` | Visual `errorFlash` only |
| Session complete | `FlashcardLearn.tsx:120` `setShowSummary(true)` | Silent |
| Notifications | `features/notifications/**` | No audio import |
| Hover | anywhere | No hover sound exists |
| MC option select | `McChoiceGrid.tsx` | No audio import |
| Navigation / page transition | anywhere | — |
| "Listen" question prompt | `useKanaQuizSession.ts:153` generates the type | `SurvivalQuizScreen.tsx:105-118` renders it identically to `read` |

### 12.6 What happens during navigation, transitions, restart, tab-switch

**[V]** All four answers are the same: **nothing is cleaned up.**

- **Navigation** — Next.js client routing unmounts the component. `currentAudio` (module-scoped) keeps playing. `pronunciationTimer` keeps ticking and will fire `playPronunciation` on a dead route. `synth` keeps speaking. No component has a cleanup effect for audio; `stopActivePronunciation` is unexported.
- **Page transition** — same. `useGameEngine.ts:108-111` calls `engine.destroy()`, which calls `this.timer.destroy()` (`GameEngine.ts:125-127`) — the **timer**, not audio.
- **Game restart** — `GameEngine.reset()` (`:102-106`) stops the timer and resets state. Any pronunciation scheduled by the last question's feedback effect still fires.
- **Tab inactive** — **[V]** no `visibilitychange`/`pagehide` handler exists. **[A]** Chrome throttles `setTimeout` in background tabs to ≥1 s and auto-suspends `AudioContext`; `speechSynthesis` and `HTMLAudioElement` generally **keep playing**. So backgrounding a study session most likely leaves the Japanese TTS audible.
- **Autoplay blocked** — `sfx.ts` self-heals (`playSFX` → `getContext` → `resumeContext`). `audio.ts` falls back media → speech (`audio.ts:163`). If both fail, playback silently no-ops. **[V]** There is no UI surface anywhere that tells the user audio was blocked.

---

## 13. Performance Findings

Ordered by expected impact.

### 13.1 Unbounded `voiceschanged` listener accumulation — **[V] leak**
`audio.ts:105-107`, called from `audio.ts:177` on every pronunciation. One new arrow-function listener on `window.speechSynthesis` per `playAudio`/`playPronunciationFeedback` call, removed only if `voiceschanged` fires (it usually never does after initial load).

### 13.2 Five permanent gesture listeners re-entering `getContext()` — **[V]**
`sfx.ts:179-181` omits `once: true`. Every `click`, `keydown`, `mousedown`, `pointerup`, and `touchend` in the app — forever — calls `unlockAudio()` → `getContext()` → `resumeContext()`. Cheap per call, but it is 5 listeners × every input event, and they can never be removed.

### 13.3 Unbounded network requests to Google TTS — **[V]**
No cache, no dedupe, no `Map<string, Blob>`. `new Audio(url)` per playback (`audio.ts:141`). In Survival Drop mode this fires inside a RAF game loop (`useSurvivalGame.ts:425,453`), once per completed word.

### 13.4 SFX node allocation without disconnection — **[A] probable, unverified**
`sfx.ts:117-133` + `:101-107`: `correct` allocates 3 `OscillatorNode` + 6 `GainNode` per call and never disconnects. `scheduleTone` schedules `osc.stop()`, so spec-wise the graph should be collectible. Under sustained Drop-mode play (one `correct` per word, throttle 90 ms → theoretical max ~11/s) this is up to ~99 nodes/second created.

### 13.5 `AudioContext` never suspended or closed — **[V]**
Holds a rendering thread and (on iOS) an audio session for the whole SPA lifetime, including on `/login`.

### 13.6 Barrel forces audio modules into every page's bundle — **[V]**
34 files import `"@/shared/utils"`; `Button.tsx:6` is one of them. `audio.ts` + `sfx.ts` (~450 LOC combined) and their module side effects load on every route.

### 13.7 100 ms polling loop drives Speed-mode audio — **[V]**
`useGameEngine.ts:122-129` sets React state 10×/second for the entire game, and this is the mechanism that triggers pronunciation. A `setState` with a fresh object every 100 ms re-renders the whole Speed tree.

### 13.8 `lastPlayedAt` object churn — **[V]**
`sfx.ts:188` spreads a 3-key record on every non-throttled SFX.

### 13.9 Linear card scan on every feedback — **[V]**
`useGameEngine.ts:142` `config.cards.find(...)`. Negligible for typical deck sizes.

---

## 14. Architectural Findings

| Dimension | Assessment |
|---|---|
| **Coupling** | **Poor.** 14 modules import browser-audio functions directly, including three leaf presentational components (`ChartCell`, `AnswerFeedback`, `QuizPlaying`). There is no seam. |
| **Cohesion** | **Mixed.** `sfx.ts` and `audio.ts` are each internally cohesive. But `useKanaQuizSession.processAnswer` (`:198-241`) mixes scoring, Firestore persistence, SFX, TTS scheduling, and control flow in one 40-line callback. |
| **Single Responsibility** | **Violated.** `audio.ts` owns: URL building, TTS transport, speech synthesis, voice selection, autoplay unlocking, cancellation tokens, and debounce timing. Seven responsibilities, one module, zero injectable seams. |
| **Dependency direction** | **Correct** (`shared/` never imports `features/`), but the *level* is wrong — `shared/utils` should not own singletons that a `shared/services` or provider should own. Contradicts the repo's own `.rules/ai-rules/util.rule.md`. |
| **Hook responsibilities** | **Leaky.** Gameplay hooks decide *what* sound plays, *when*, and *how long to wait* — three different hooks encode three different pronunciation delays (220 / 250 / 300 ms). |
| **Service responsibilities** | **Nonexistent.** §9. |
| **Reusability** | Two near-identical button components (`FlashcardAudioButton.tsx`, `KanaAudioButton.tsx`) — both 47/49 LOC, both wrap `Button` + `Volume2`, both documented as "dedup'd from N prior copies," and they were deduplicated into **two** components instead of one. |
| **Scalability** | **Blocked.** Adding a second sound (e.g. `combo`, `gameover`) requires editing `SFXType`, `SFX_THROTTLE_MS`, a new `TONES` const, and the `switch` in `playSFX`. Adding *categories* (music vs. SFX vs. speech) is not expressible. |
| **Testability** | **Poor.** `sfx.ts` and `speechPolicy.ts` have zero tests. `audio.test.ts` must `vi.resetModules()` + `vi.stubGlobal("window", …)` (`audio.test.ts:102-105,58-63`) precisely *because* the state is module-scoped. **[V]** `src/vitest.config.ts` sets `environment: "node"` with **no setup files and no jsdom**, so every browser API is hand-stubbed per test. The only other audio-touching test, `kana/chart/components/ChartCell.test.tsx:11-12`, sidesteps the problem entirely by `vi.mock("@/shared/utils", … playAudio: vi.fn())` — i.e. the sole way to test a component that plays sound is to mock the whole shared-utils barrel. |
| **Maintainability** | **At risk.** The `allowAudio` tautology (§7.3) means the codebase actively misinforms its next reader. |
| **Extensibility** | See §19. |
| **Consistency** | **Poor.** Three delay mechanisms, two button components, four autoplay gates that read the setting and six that don't, one game mode (Drop) that reimplements the shared engine's sound. |

### 14.1 Named architectural smells

1. **Stateful utility** — `shared/utils/{audio,sfx}.ts` are singletons masquerading as pure functions.
2. **Import-time side effect** — 10 `window.addEventListener` calls execute on module evaluation, transitively on every page (§2.2).
3. **Tautological guard** — `allowAudio` (§7.3).
4. **Speculative generality** — `onAudioPlay`, `volume` param, `clampVolume(…, 1.25)`, `AudioStage`, `ImmersiveQuestionType`, `isSmartMode`: all built, none used.
5. **Shotgun surgery** — a global mute requires touching 14 files.
6. **Duplicate abstraction** — `FlashcardAudioButton` ≈ `KanaAudioButton`.
7. **Divergent copy** — Survival Drop reimplements `processAnswer`'s sound block (§8.5).
8. **Comment/code contradiction** — `AnswerFeedback.tsx:27`, `speechPolicy.ts:8-9`, `SettingsMenu.tsx:13`, `useMatchModeSession.ts:280`.

---

## 15. Technical Debt Register

| # | Item | Evidence | Severity |
|---|---|---|---|
| D1 | `allowAudio` ignores `type`; all guards are `if (true)`; docblock describes unimplemented behaviour | `speechPolicy.ts:13-20` | **Critical** (misleads future work) |
| D2 | `globalAutoPlay` ignored by Speed, Match, Kana Quiz, Survival ×3, Kana Practice mode 3 | §11.2 | **Critical** (user setting silently violated) |
| D3 | No way to stop audio; no unmount/navigation/visibility cleanup | `audio.ts:60` unexported; no `visibilitychange` in repo | **Critical** |
| D4 | `warmSpeechVoices` accumulates `voiceschanged` listeners without bound | `audio.ts:100-108` ← `:177` | **High** (leak) |
| D5 | `sfx.ts` gesture listeners lack `once: true` | `sfx.ts:179-181` | **High** |
| D6 | No mute, no volume, no SFX toggle | `sfx.ts:30` constant; §11.3 | **High** (accessibility) |
| D7 | Survival Drop duplicates the sound layer and collides `click`+`correct`+`playAudio` in one tick | `useSurvivalGame.ts:418-465` | **High** |
| D8 | Match uses a raw `setTimeout` that bypasses the debounce | `useMatchModeSession.ts:281` | Medium |
| D9 | Three hard-coded pronunciation delays (220/250/300 ms), none of which exceed the `correct` SFX tail (540 ms) | §12.1 | Medium |
| D10 | Google TTS: unofficial endpoint, no cache, no retry, no privacy disclosure, `tl=ja` hardcoded | `audio.ts:14,66-75,141` | Medium |
| D11 | `onAudioPlay` dead config field | `speed/engine/types.ts:119` | Low |
| D12 | `volume` param, `clampVolume` headroom, `AudioStage`, `ImmersiveQuestionType`, `isSmartMode` all unused | §6.4 | Low |
| D13 | `"listen"` and `"reverse"` question types generated but never rendered differently | `useKanaQuizSession.ts:153`; `SurvivalQuizScreen.tsx:105-118` | Medium |
| D14 | Two parallel audio-button components | `FlashcardAudioButton.tsx`, `KanaAudioButton.tsx` | Low |
| D15 | Reveal pronunciation fires at t=0 of a 500 ms flip animation | `FlashcardPractice.tsx:99-106,324` | Low |
| D16 | `SettingsMenu` docblock advertises a "Sound Effects" toggle that doesn't exist | `SettingsMenu.tsx:13` | Low |
| D17 | Per-tone `GainNode`s never disconnected; no `onended` | `sfx.ts:101-107,117-133` | Low **[A]** |
| D18 | Barrel pulls audio side effects into every route incl. `/login` | `shared/utils/index.ts`; `Button.tsx:6` | Low |
| D19 | Zero tests for `sfx.ts` and `speechPolicy.ts`; vitest has no jsdom/setup file, so component-level audio must be mocked wholesale | `vitest.config.ts`; `ChartCell.test.tsx:11-12` | Medium |
| D20 | MC selection is silent while card flip clicks | `McChoiceGrid.tsx`; `FlashcardPractice.tsx:326` | Low |
| D21 | No `prefers-reduced-motion`, no `aria-live`/`role="status"` — correct/wrong feedback has no non-audio, non-motion channel beyond colour | §12.2b | Medium (accessibility) |
| D22 | Match tiles hold the "shaken" surface for 320 ms after the 400 ms CSS animation ends | `useMatchModeSession.ts:304-309` vs `globals.css:125-127` | Low |

---

## 16. Risks

| Risk | Likelihood | Impact | Basis |
|---|---|---|---|
| Google removes/blocks `translate_tts?client=tw-ob` | Medium | **All pronunciation degrades to OS `speechSynthesis`** (quality drop, and on iOS the non-gesture `speak()` may not fire at all) | **[A]** — unofficial endpoint, no SLA |
| Rate-limiting (429) under Drop-mode request volume | Medium | Silent per-word fallback to `speechSynthesis`, or silence | **[A]** |
| `speechSynthesis` listener leak degrades long sessions | High | Growing memory + slower `getVoices()` | **[V]** code path; **[A]** magnitude |
| Audio continues after navigating away | **High** | Jarring; user cannot stop it without a page reload | **[V]** — no cleanup exists |
| Audio continues in a backgrounded tab | Medium–High | Japanese speech plays over the user's other work | **[V]** no handler; **[A]** browser behaviour |
| No mute → user cannot silence the app | Certain | Accessibility / context failure (library, meeting, classroom) | **[V]** |
| iOS `speak()` from `setTimeout` fails | Medium | Speed/Quiz fallback path is silent on iOS | **[A]** |
| A future `prompt`-stage autoplay leaks answers | Medium | Learners hear the answer before responding — the exact failure `speechPolicy.ts` claims to prevent | **[V]** the guard is a tautology |
| Deck of non-Japanese words read with a Japanese voice | Certain for such decks | Unintelligible | **[V]** `tl=ja` hardcoded, `getAudioText` = `card.primary` |
| `AudioContext` never closed → iOS ducks background music | Medium | Annoyance | **[A]** |

---

## 17. Hidden Behaviours

Behaviours that are **not discoverable** from the settings UI, the docblocks, or the function names.

1. **[V]** Toggling "Auto-Play Audio" **off** still autoplays pronunciation in Speed, Match, Kana Quiz, Survival (all modes), and Kana Practice mode 3. The setting's subtitle in `settings/page.tsx:56` is *"Read kana aloud automatically"* — which is exactly what still happens in half of the kana modes.

2. **[V]** Toggling "Auto-Play Audio" off has **no effect on SFX at all.** There is no SFX control anywhere.

3. **[V]** `KanaPractice` mode 3 autoplays on every navigation and on entering the mode, regardless of any setting (`KanaPractice.tsx:28,34`).

4. **[V]** Every Japanese string the user studies is sent to `translate.google.com` in a URL query parameter, on every playback. Nothing in the UI discloses this.

5. **[V]** The first user gesture anywhere in the app constructs an `AudioContext` and plays up to four silent audio elements (§3.2).

6. **[V]** `playAudio` **cancels** any pending `playPronunciationFeedback`. Tapping a speaker button during the feedback window silently suppresses the automatic pronunciation that was about to play (`audio.ts:175`).

7. **[V]** In Survival Drop mode, a single keystroke can fire `click` + `correct` + a Google TTS network request in the same synchronous tick (`useSurvivalGame.ts:418,424,425`).

8. **[V]** In Survival Drop mode, `playSFX("wrong")` fires on **every** keypress that doesn't advance a word — including pressing a letter while no word is on screen (`useSurvivalGame.ts:462-468`, since `hit` stays `false`).

9. **[V]** The `AnswerFeedback` "replay audio" button is coded and commented as listen-question-only, but renders for every question type (`AnswerFeedback.tsx:27-28`).

10. **[V]** Kana Survival can generate `"listen"` and `"reverse"` question types that render identically to `"read"` (`useKanaQuizSession.ts:153` reachable only from `useSurvivalGame.ts:215,253`).

11. **[V]** The pronunciation for a card is spoken at the *start* of the 500 ms flip animation, before the back face is visible (`FlashcardPractice.tsx:99-106` vs `:324`).

12. **[D]** In Speed mode, `completeFeedback()` advances to the next question at 1100 ms, but the previous card's pronunciation (started at 250–350 ms) may still be speaking. It is only silenced when the *next* answer's pronunciation calls `stopActivePronunciation()`.

13. **[V]** `stopCurrentMedia()`'s `load()` call can trigger `audio.onerror` → `fallbackToSpeech`, which is defused only by the `playbackToken` check. Reordering the two lines in `stopActivePronunciation` (`audio.ts:61-63`) would introduce a phantom speech-synthesis playback on every cancel. **This is load-bearing and undocumented.**

14. **[V]** `sfx.ts`'s `resumeContext` is fire-and-forget (`void resumeContext(ctx)` at `:196`) — a `playSFX` issued while the context is `suspended` schedules tones against a clock that isn't advancing. **[A]** In practice the resume lands within a frame and the `ctx.currentTime + delay` scheduling absorbs it.

---

## 18. Missing Documentation

- **No document describes the sound system.** `CODEBASE_CONTEXT.md` §6.1 gives it one clause: *"`audio`/`sfx` (Google Translate TTS + Web Speech fallback; synthesized Web Audio tones)"* and *"`speechPolicy` (single rule: never autoplay on 'prompt', always on 'feedback' — prevents leaking answers)."* The latter describes a rule the code does not enforce because no call site passes `"prompt"`.
- **No ADR** for choosing an unofficial Google endpoint over `speechSynthesis`-first, or over bundled assets.
- **No documented sound taxonomy** — nothing states which events *should* have sound. §12.5's silent events may be intentional or oversights; source cannot distinguish.
- **No timing contract** — the three pronunciation delays (220/250/300 ms) are unexplained magic numbers. `useMatchModeSession.ts:280`'s comment gives a rationale that is arithmetically false.
- **No accessibility statement.** No `prefers-reduced-motion` handling exists **[V]**; no equivalent audio-reduction concept exists.
- **`stopCurrentMedia` / `playbackToken` ordering invariant** (§17.13) is undocumented in code.
- **`GameEngineConfig.onAudioPlay`** is documented as an API but is dead (§4.2).

---

## 19. Improvement Opportunities

*Stated as capabilities and their blockers. No implementation is proposed — see §20 first.*

| Capability | Current blocker | Files that would need to change today |
|---|---|---|
| Global mute | Three independent output paths (`masterGain`, `HTMLAudioElement.volume`, `SpeechSynthesisUtterance.volume`) with no shared node | `sfx.ts`, `audio.ts`, + a new state owner |
| Volume control | `MASTER_VOLUME` is a const (`sfx.ts:30`); `volume` param of `playSFX` is dead | `sfx.ts` |
| Stop-on-navigate | `stopActivePronunciation` unexported; no consumer-side cleanup | `audio.ts` + every consumer, or a provider |
| Suspend-on-hidden-tab | No `visibilitychange` handler exists | new listener owner |
| Honour `globalAutoPlay` everywhere | 6 call sites don't read it | `useGameEngine`, `useMatchModeSession`, `useKanaQuizSession`, `useSurvivalGame`, `KanaPractice` |
| Real prompt-stage gating (listen quizzes) | `allowAudio` ignores `type`; no `prompt` call site | `speechPolicy.ts` + Quiz/Survival render paths |
| TTS caching | `new Audio(url)` per playback | `audio.ts` |
| Sound categories (speech / SFX / ambience) | `SFXType` is a flat union; no category concept | `sfx.ts` type + policy layer |

### 19.1 Future Expansion Readiness

Scored **as-is**. "Readiness" = how much of the capability the current architecture already supports. No implementation is proposed.

| Capability | Readiness | Rationale (evidence) |
|---|---|---|
| **Sound themes** | ⛔ Not ready | Presets are module-level `const` arrays (`sfx.ts:37-60`) selected by a hard-coded `switch` (`:198-208`). No registry, no indirection. |
| **Accessibility audio cues** | ⛔ Not ready | No `aria-live`/`role="status"` anywhere; no `prefers-reduced-motion`; no mute. Audio is currently *decorative* — nothing depends on it, and nothing substitutes for it (§12.2b). |
| **Global audio manager** | ⛔ Not ready — but this is the keystone | Two competing module singletons (`sfx.ts:62-64`, `audio.ts:21-25`) with no owner and no injectable seam (§9). **Almost every row below unblocks only after this exists.** |
| **Spatial sound** | ⛔ Not ready | `routeToMaster` (`sfx.ts:101-107`) hard-wires gain → `masterGain`. No `PannerNode`, no per-source positioning, no listener concept. |
| **Sound categories** | ⛔ Not ready | `SFXType = "correct" \| "wrong" \| "click"` (`sfx.ts:13`) is flat. Pronunciation lives in a different module entirely and cannot be categorised alongside SFX. |
| **User-configurable volumes** | ⛔ Not ready | `MASTER_VOLUME` is a const (`sfx.ts:30`); `playSFX`'s `volume` param exists but is never passed (§6.4); `audio.ts` sets `volume = 1` unconditionally. Three separate output paths to plumb (§2.1). |
| **Background ambience** | ⛔ Not ready | Requires looping sources, a category bus, and duck-on-speech. None of the three primitives exist. Also: no `AudioContext` suspension, so ambience would play in hidden tabs (§12.6). |
| **Character voices** | 🟡 Partial | `getJapaneseVoice` (`audio.ts:77-98`) already has a priority list and caches a `voiceURI` — a voice *selection* mechanism exists. But it is not exposed, not persisted, and the Google TTS path (the primary) has no voice parameter at all. |
| **AI-generated speech** | 🟡 Partial | `buildTtsUrl` (`audio.ts:66-75`) is the single point where the transport is chosen, so swapping the provider is a one-function change. Blocked by: no caching, no async/await surface (`playAudio` returns `void`), no error surface to the UI. |
| **Offline audio caching** | ⛔ Not ready | **[V]** No service worker, no `manifest.json`, no `next-pwa`/`workbox` dependency. `next.config.ts` contains only `images.remotePatterns`. `new Audio(url)` per playback with no `Map`/`Cache` layer. |
| **Multiplayer synchronisation** | ⛔ Not ready | All playback is fire-and-forget `void`. No scheduling API surfaced (`ctx.currentTime` is internal to `scheduleTone`), no clock, no latency compensation. `playAudio` cannot even report *when* it will start. |

**Summary**: 0 of 11 capabilities are ready; 2 are partially ready. The single highest-leverage prerequisite is the **global audio manager** — it is a hard blocker for 7 of the 11 rows, and it is also the fix for D2, D3, and D6 (§15). Everything else in this table should wait on it.

---

## 20. Questions That Must Be Answered Before Implementation

**Product / UX**

1. Should `globalAutoPlay` gate *pronunciation only*, or *all sound*? Today it means "pronunciation, in 4 of 10 places." Is the intended semantic "auto-play pronunciation" (leaving SFX always on) or "app sounds"?
2. Is a **separate SFX toggle** wanted? `SettingsMenu.tsx:13`'s docblock implies one was planned.
3. Should Speed / Match / Quiz / Survival pronunciation be gated by `globalAutoPlay` (bug), or is it intentionally always-on as pedagogical reinforcement (D2 is then a docs bug, not a code bug)?
4. Do the silent events in §12.5 (confetti, combo, game over, life lost, countdown) *want* sound, or is the silence deliberate?
5. Should `wrong` really fire on every stray keypress in Survival Drop (`useSurvivalGame.ts:464`)?
6. Is the Survival Drop per-word Google TTS request acceptable, or should Drop mode be pronunciation-free?

**Policy / correctness**

7. Was `allowAudio`'s `type` parameter meant to do something? Specifically: does a **listening quiz** (`questionType === "listen"`) exist as a product concept? If yes, `"listen"` needs prompt-stage autoplay *and* a UI that hides the character — neither exists (`SurvivalQuizScreen.tsx` shows it, `QuizPlaying.tsx:106` shows it).
8. Should `"listen"` and `"reverse"` be removed from the generator, or implemented?
9. What is the intended SFX-then-pronunciation offset? The current delays (220/250/300 ms) all land *inside* the 540 ms `correct` tail. Should pronunciation wait for the SFX tail, or should the SFX be shortened?

**Infrastructure**

10. Is dependence on `translate.google.com/translate_tts?client=tw-ob` acceptable long-term? If not: bundled assets, a paid TTS API, or `speechSynthesis`-first?
11. Does sending user-studied text to Google require a privacy disclosure for this deployment?
12. Should audio work offline? (Today: pronunciation degrades to `speechSynthesis`; no service worker exists.)
13. `getAudioText(card)` returns `card.primary` and is spoken with `tl=ja`. Do non-Japanese decks exist? Should `FlashCardContent` carry a language field?

**Scope**

14. Is a **global audio manager** (provider or singleton service) in scope? Nearly every item in §19 requires one.
15. Should `stopActivePronunciation` become part of the public API, and who calls it — a router-level effect, a provider, or each consumer?
16. Is `AudioContext` suspension on `visibilitychange` desired, or should the browser's default policy stand?

---

## 21. Recommended Refactoring Order

Sequenced so that each step is independently shippable and each later step depends only on earlier ones. **Nothing here has been implemented.**

**Phase 0 — Truth-telling (no behaviour change)**
1. Fix the three comments that contradict the code: `speechPolicy.ts:8-9`, `AnswerFeedback.tsx:27`, `useMatchModeSession.ts:280`, `SettingsMenu.tsx:13`.
2. Delete dead surface: `onAudioPlay` (`speed/engine/types.ts:119`), `AudioStage`/`ImmersiveQuestionType` if §20 Q7 answers "no", `isSmartMode`.
3. Add characterization tests for `sfx.ts` (throttle, singleton, envelope scheduling) and `speechPolicy.ts` before touching either.

**Phase 1 — Stop the bleeding (leaks & lifecycle)**
4. `sfx.ts:179-181` — add `once: true`, or register a single named listener and remove it after the first successful resume.
5. `audio.ts:100-108` — hoist `warmSpeechVoices`'s `voiceschanged` registration to module scope so it happens once.
6. Export a `stopAllAudio()` from `audio.ts` (wrapping `stopActivePronunciation` + `clearPronunciationTimer`).

**Phase 2 — Introduce the seam**
7. Create the audio service/provider that owns the `AudioContext`, the `HTMLAudioElement`, the timer handle, and the mute/volume state. Keep `playAudio`/`playSFX` as thin façades so no call site changes yet.
8. Wire `stopAllAudio()` to route change and to a `visibilitychange` handler in that one place.

**Phase 3 — Make the policy real (requires §20 Q1, Q3, Q7)**
9. Move the `globalAutoPlay` read *into* the service (or into `allowAudio`), so all 10 autoplay sites obey it by construction rather than by remembering to check.
10. Give `allowAudio` a real body, or delete it and its four call sites.

**Phase 4 — Consolidate**
11. Collapse the three pronunciation delays into one named constant with a documented relationship to the `correct` SFX tail.
12. Replace `useMatchModeSession.ts:281`'s raw `setTimeout` with `playPronunciationFeedback`.
13. Extract the triplicated reveal-pronunciation effect from the three flashcard players into one hook.
14. Route Survival Drop's sound through `useKanaQuizSession.processAnswer` (or extract a shared `playAnswerFeedback(correct)`).
15. Merge `FlashcardAudioButton` and `KanaAudioButton`.

**Phase 5 — Capability (requires §20 Q10, Q14)**
16. TTS response caching.
17. Volume / category controls, now expressible because Phase 2 gave them an owner.

---

## 22. Confidence Level

| Area | Confidence | Why |
|---|---|---|
| Call graph & file inventory | **Very high** | Exhaustive grep on 10 keyword families across all non-vendor source; every hit traced to its caller and callee. Verified negatives (no assets, no deps, no service worker, no `visibilitychange`) were established by search, not assumed. |
| `allowAudio` tautology (D1) | **Certain** | 20-line file read in full; all four call sites read in full; all pass `"feedback"`. |
| `globalAutoPlay` bypass (D2) | **Certain** | Grep for `globalAutoPlay` returns exactly 6 consuming files; the 6 ungated hooks were each read in full. |
| No cleanup / no stop (D3) | **Certain** | `stopActivePronunciation` is not in any `export` statement; no `visibilitychange`/`pagehide`/`beforeunload` string exists in the repo. |
| `voiceschanged` leak (D4) | **High** | Code path is unambiguous. Not runtime-confirmed; magnitude depends on whether a given browser re-fires `voiceschanged`. |
| Timing table (§12.1) | **High** | Arithmetic from verified constants. Not measured. The 100 ms polling contribution to Speed's offset is derived, not observed. |
| Web Audio node GC (D17) | **Low–Medium** | Spec says collectible; not verified with a heap profile. Explicitly flagged **[A]**. |
| Mobile Safari behaviours (§10.4) | **Low** | Inferred entirely from known platform behaviour + absence of countermeasures. **No device testing was performed.** |
| Google TTS reliability (§16) | **Low–Medium** | The endpoint's unofficial status is verifiable from the URL shape (`client=tw-ob`); its failure modes are not observed here. |
| Autoplay-unlock race (§10.5) | **Medium** | Reasoned from listener registration order and event bubbling; concluded "probably safe by accident." **Should be confirmed at runtime before relying on it.** |

**Runtime verification was not performed.** Everything marked **[A]** — and the whole of §10.4 — should be checked against a real browser (and a real iPhone) before any behaviour depending on it is changed.

**This report is sufficient to begin implementation without rescanning the repository**, with one caveat: §20's sixteen questions are genuine product decisions, not gaps in the investigation. The source establishes *what the system does*; it cannot establish *what it was supposed to do*, and in at least four places (`speechPolicy.ts`, `AnswerFeedback.tsx`, `SettingsMenu.tsx`, `useMatchModeSession.ts`) the two visibly disagree.
