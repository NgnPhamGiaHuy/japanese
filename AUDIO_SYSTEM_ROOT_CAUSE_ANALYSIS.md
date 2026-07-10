# Audio System Root-Cause Analysis & Target Architecture

> **Historical document.** The target architecture proposed here (§14) has been substantially built
> — see `docs/adr/001-audio-architecture.md` for what was actually decided and
> `AUDIO_POST_MIGRATION_CLEANUP_REPORT.md` for current status. **RC-1/RC-2 (the Google Translate TTS
> transport) remain unresolved** — that is Epic 3 in `AUDIO_IMPLEMENTATION_MASTER_PLAN.md`, blocked
> on provisioning a cloud-TTS credential and a voice bake-off, neither done yet. Everything else this
> report attributes to RC-3 through RC-8 (activation timing, cancellation races, silent failures,
> voice-list races) has been addressed by the audio manager and sequencer.

**Mission**: Determine why Japanese pronunciation is intermittently unreliable, benchmark modern alternatives, and specify an implementation-ready target architecture.
**Status**: Investigation only. **No source code was modified.**
**Date**: 2026-07-10
**Companion document**: `SOUND_ARCHITECTURE_DISCOVERY.md` (full structural inventory of the sound system, same evidence conventions). This report does not repeat that inventory; it references it and goes deeper on *reliability*, *browser platform behaviour*, and *the target design*.

**Evidence convention**:
- **[V]** — Verified by reading this repository's source (file:line cited).
- **[D]** — Derived arithmetically/logically from verified facts.
- **[H]** — Hypothesis grounded in documented platform behaviour; needs runtime reproduction.
- **[R]** — Research finding from external sources (cited in §12/§17).

---

## 1. Executive Summary

### The headline answer

Japanese pronunciation is unreliable because **the primary playback path was switched, seven days ago, from the local `speechSynthesis` API to an unofficial, unauthenticated, rate-limited Google endpoint — and every failure in the new pipeline is silently swallowed.**

**[V]** Git history: the original `playAudio` (`git show a4e3ff8:src/shared/utils/audio.ts`) was speechSynthesis-only — no network dependency; reliability was a pure function of locally installed voices. Commit `d9afd3a` (**2026-07-03**, *"refactor(audio): improve TTS pipeline"*) rewrote the module so that every pronunciation now:

1. Issues an uncached HTTPS request to `https://translate.google.com/translate_tts?client=tw-ob&tl=ja&q=…` (`src/shared/utils/audio.ts:14,66-75,141`) — an endpoint with no SLA, known community-documented throttling, and no retry;
2. Falls back to `speechSynthesis` on failure — a fallback that is itself unavailable or degraded on a large class of devices (no Japanese voice installed; user-activation requirements; known Chrome/Safari bugs);
3. Reports **nothing** when both tiers fail: every error path is `catch {}` / `catch(() => undefined)` / a silent `return false` (`audio.ts:128-131,161-164,202-205`). There is no telemetry, no console output, no UI state. **The system is architecturally incapable of telling anyone why a given playback failed** — which is precisely why failures appear to have "no obvious reason."

On top of the two-tier transport fragility, three interaction-level mechanisms *eat* pronunciations that would otherwise have succeeded (§8): last-wins cancellation, last-wins debounce, and pronunciation calls made from timer context (outside user activation) where autoplay policy can reject them.

### Ranked root causes (full analysis in §7)

| # | Root cause | Confidence | Est. share of failures |
|---|---|---|---|
| RC-0 | Total unobservability — all failures silent by design | **Certain [V]** | (multiplier on all below) |
| RC-1 | Unofficial Google TTS endpoint: throttling/blocking/latency | **High [V+R]** | Large, network/IP-dependent |
| RC-2 | Fallback tier silently unavailable (no ja voice / empty voice list / platform quirks) | **High [V+R]** | Large on Linux/Android/fresh installs |
| RC-3 | Playback initiated from timer/effect context → activation rejection (**iOS-dominant**; desktop largely cleared by sticky-activation rules) | **High [V+R]** | Large on iOS; small on desktop |
| RC-4 | Last-wins cancellation + debounce swallow rapid-fire pronunciations | **Certain [V]** | Moderate; pace-dependent |
| RC-5 | `cancel()→speak()` same-tick race (documented in both Chromium & Firefox; app uses zero delay) | **High [V+R]** | Small–moderate on fallback path |
| RC-6 | Mid-stream media error → full re-speak (double audio) or clipped word | Medium **[H]** | Small |
| RC-7 | Unmount/navigation orphans and misfires | **Certain [V]** | Small but very visible |
| RC-8 | Voice-selection race on first fallback playback | **High [V]** | Small; first-play heavy |

### What to build (full design in §14)

A single **AudioManager** owning four category channels (Voice/SFX/Music/Ambient), a priority queue with an explicit interruption policy, and — for Japanese pronunciation — a **provider chain that puts cached, pre-generated audio first** and live browser TTS last, matching what every successful competitor in this space does (§12). The finite kana set (~200 characters) should be pre-generated once and shipped as static assets; user-deck vocabulary should be generated on demand through a real TTS API and cached permanently. `speechSynthesis` becomes the emergency fallback, not a load-bearing tier. Migration is incremental and starts with observability (§15).

---

## 2. Current Audio Architecture

Summarized from the companion discovery report (`SOUND_ARCHITECTURE_DISCOVERY.md` §2–§11), which contains the exhaustive version. Facts needed for this report:

- **No audio assets exist** (zero sound files in the repo **[V]**); **no audio libraries** (`package.json` has no howler/tone/use-sound **[V]**).
- Two stateless-looking modules with hidden singleton state:
  - `src/shared/utils/sfx.ts` — synthesized Web Audio tones (`correct`/`wrong`/`click`), one `AudioContext`, master gain 0.66 → compressor. Per-type throttling (24/90/110 ms).
  - `src/shared/utils/audio.ts` — pronunciation: `new Audio(googleTtsUrl)` primary, `SpeechSynthesisUtterance` fallback. Module-level `currentAudio`, `pronunciationTimer`, `playbackToken`, `selectedJapaneseVoiceURI`, `mediaUnlocked`.
- **Public pronunciation API is two `void` functions**: `playAudio(text)` (`audio.ts:226`) and `playPronunciationFeedback(text, delayMs = 220)` (`audio.ts:230`). No promise, no error, no completion signal, no cancellation handle.
- `stopActivePronunciation()` (`audio.ts:60`) exists but is **not exported** — nothing outside the module can stop audio.
- The gating helper `allowAudio(type, stage)` (`src/shared/utils/speechPolicy.ts:13`) ignores `type` and returns `true` at all four call sites — every guard is a tautology **[V]**.
- The user preference `globalAutoPlay` (`src/lib/app-store.ts:13`, persisted to localStorage) gates pronunciation in only 4 of 10 autoplay sites **[V]**.
- **No lifecycle handling of any kind**: zero `visibilitychange`/`pagehide`/`beforeunload` handlers in the repo; no route-change cleanup; no unmount cleanup for scheduled pronunciation **[V]**.
- 14 modules call the audio utilities directly, including leaf presentational components; there is no service/provider seam **[V]**.

### 2.1 Version history of the pronunciation pipeline **[V]**

| Commit | Date | Pipeline |
|---|---|---|
| `4ac8805` → `a4e3ff8` | (initial) | `speechSynthesis` only: `cancel()` → build utterance (rate 0.75, ja-JP, priority-picked voice) → `speak()`. ~40 lines. No network. |
| `19f73b9` | — | SFX added for game modes (separate module). |
| `603c905`, `ef3035d`, `1b46271` | — | `speechPolicy.ts` added and reshaped alongside game-mode refactors. |
| **`d9afd3a`** | **2026-07-03** | **Full rewrite**: Google Translate TTS becomes the primary path; speechSynthesis demoted to fallback; adds debounce (`playPronunciationFeedback`), token cancellation, silent-WAV unlock, voice caching, tests. |

**[D]** Any reliability regression report dated after 2026-07-03 points first at `d9afd3a`: it added a network dependency, an unofficial endpoint, and four new asynchronous coordination mechanisms (token, debounce timer, unlock flag, fallback chain) to a path that previously had zero.

---

## 3. Audio Dependency Graph

Full graph: discovery report §4–§5. Condensed call-site map (all **[V]**):

```
                                   gesture context?          gate?
CHART       ChartCell.tsx:38          onClick ✔              none
KANA LEARN  useKanaPlayDeck.ts:64     onClick(Next/Prev) ✔   globalAutoPlay (via prop)
KANA PRACT. useKanaPlayDeck.ts:64,75  onClick ✔              practiceMode===3 (NOT the user setting)
KANA QUIZ   useKanaQuizSession.ts:232 ✘ setTimeout(220ms)    allowAudio()≡true
SURVIVAL ∞/⏱ (same engine path)       ✘ setTimeout(220ms)    allowAudio()≡true
SURVIVAL ⬇  useSurvivalGame.ts:425,453 keydown handler ✔     none
MATCH       useMatchModeSession.ts:281 ✘ setTimeout(300ms)   allowAudio()≡true
SPEED       useGameEngine.ts:146      ✘ effect + 250ms timer allowAudio()≡true
FLASH LEARN FlashcardLearn.tsx:62     ✘ useEffect post-click globalAutoPlay ✔
FLASH PRACT FlashcardPractice.tsx:103 ✘ useEffect post-click globalAutoPlay ✔
FLASH MIST. FlashcardMistakeReview:90 ✘ useEffect post-click globalAutoPlay ✔
REPLAY BTNS FlashcardAudioButton, KanaAudioButton, AnswerFeedback  onClick ✔  none
```

The **gesture context** column is the load-bearing one for §7 RC-3: six pronunciation triggers execute *outside* any user-gesture call stack (React effects and `setTimeout` callbacks). Replay buttons and kana navigation execute *inside* one. This split predicts the observed failure pattern "the speaker button always works, the automatic pronunciation sometimes doesn't."

---

## 4. Audio Asset Inventory

**[V]** There are no audio assets. Complete inventory of what produces sound:

| Sound | Source | Generated where | Cached? |
|---|---|---|---|
| `correct` (C5→E5+C6 arpeggio, ~540 ms tail) | Oscillators, `sfx.ts:37-41` | Runtime, per play | n/a (synthesized) |
| `wrong` (descending pair, ~390 ms) | Oscillators, `sfx.ts:43-60` | Runtime | n/a |
| `click` (980→720 Hz blip, ~65 ms) | Oscillator, `sfx.ts:143-156` | Runtime | n/a |
| Japanese pronunciation | `translate.google.com/translate_tts` MP3 stream | Google's servers, per play | **No** — fresh `new Audio(url)` every playback (`audio.ts:141`); only incidental browser HTTP cache **[H]** |
| Pronunciation fallback | OS voice via `speechSynthesis` | Device, per play | n/a |
| Unlock primer | 4-byte silent WAV data URI (`audio.ts:18-19`) | Inline | n/a |

**[V]** No service worker, no `manifest.json`, no PWA tooling (`next.config.ts` contains only `images.remotePatterns`) — nothing can serve pronunciation offline today.

---

## 5. Japanese Pronunciation Pipeline (with failure annotations)

The complete pipeline, annotated with every point where playback can fail or be lost. Line references: `src/shared/utils/audio.ts`.

```
CALLER  playAudio(text) / playPronunciationFeedback(text, delay)
  │
  │  ⓕ0  playPronunciationFeedback: single module-level timer, LAST-WINS
  │      (audio.ts:230-238). A second call within `delay` silently discards
  │      the first text. A playAudio() call also clears it (:175).
  │      → pronunciation "never happened" for the earlier card.
  ▼
playPronunciation(text)                                    :169
  normalizePronunciationText → trim, collapse, slice(0,180)  :31
  │  ⓕ1  >180 chars truncated mid-sentence (long example sentences).
  ▼
stopActivePronunciation()                                  :60
  playbackToken += 1  → invalidates ALL in-flight callbacks
  synth.cancel(); stop + detach currentAudio
  │  ⓕ2  LAST-WINS: any currently-audible pronunciation is cut mid-word.
  │      Under rapid play (Match pairs <300ms apart, Drop-mode typing)
  │      users hear clipped syllables or nothing.
  ▼
warmSpeechVoices()                                         :100
  │  ⓕ3  registers a fresh voiceschanged listener EVERY call (leak),
  │      and warming happens in the SAME tick as playback — it cannot
  │      help the current utterance's voice lookup (RC-8).
  ▼
playMediaPronunciation(text, token)                        :134
  audio = new Audio("https://translate.google.com/translate_tts
                     ?ie=UTF-8&client=tw-ob&tl=ja&q=" + text)   :141,66-75
  │  ⓕ4  UNOFFICIAL ENDPOINT (RC-1): throttling → HTTP 429/403 →
  │      error event; slow TTFB → pronunciation lands seconds late;
  │      regional blocking; no retry, no timeout, no backoff.
  │  ⓕ5  NO CACHE: every playback of the same「あ」re-requests.
  │      Each play is a fresh chance to hit ⓕ4.
  audio.volume = 1
  │  ⓕ6  iOS ignores the volume property on media elements [R].
  audio.onerror = fallbackToSpeech                          :156
  │  ⓕ7  onerror persists for the WHOLE playback: a mid-stream stall
  │      after audio has started fires fallback → speechSynthesis
  │      re-speaks the FULL text → "half word + whole word" artifact.
  audio.play().catch(fallbackToSpeech)                      :161-164
  │  ⓕ8  NotAllowedError when called outside user activation and the
  │      browser's autoplay policy isn't satisfied (RC-3). Falls back.
  ▼
fallbackToSpeech → playBrowserSpeech(text, token)          :150,110
  if (playbackToken !== token) return    ← stale-callback guard (correct)
  utterance: lang=ja-JP, rate=0.82, pitch=1, volume=1
  voice = getJapaneseVoice(synth)                           :77
  │  ⓕ9  synth.getVoices() may be EMPTY on first call (async voice
  │      loading, RC-8) → voice undefined.
  │  ⓕ10 NO JAPANESE VOICE INSTALLED (RC-2): voice undefined; utterance
  │      still spoken with lang=ja-JP → platform-dependent: silence,
  │      an error event (which nothing listens to — no utterance.onerror
  │      handler exists [V]), or an English default voice mangling kana.
  synth.cancel(); synth.resume(); synth.speak(utterance)    :125-127
  │  ⓕ11 cancel()→speak() same-tick: documented in BOTH engines
  │      (Chromium 41084789; Firefox bug 1522074) — utterance dropped;
  │      community workaround is a 250–500ms gap, app uses 0ms (RC-5).
  │      resume() mitigates only the separate "stuck paused queue" bug [R].
  │  ⓕ12 speak() outside user activation: Chrome ≥71 needs STICKY
  │      activation (any click ever — usually satisfied); iOS Safari
  │      drops the FIRST speak() not made synchronously in a gesture
  │      → silent (RC-3) [R].
  │  ⓕ13 Return value `true` means "attempted", not "audible". Silent
  │      failure indistinguishable from success (RC-0).
  ▼
SPEAKERS  … maybe.
```

**[V]** Not one of ⓕ0–ⓕ13 produces a log line, a UI signal, or a metric. `playAudio` returns `void`; the deepest failure surfaces are `catch {}` (`audio.ts:128-131,143,203-205`) and `.catch(() => undefined)` (`audio.ts:202`).

### 5.1 The unlock mechanism and its blind spot

**[V]** `unlockPronunciationAudio` (`audio.ts:181-206`) plays a silent WAV on the first gesture (five `once` listeners, `:208-223`) and sets `mediaUnlocked = true`. But `mediaUnlocked` is **only read to dedupe the unlock itself** (`:182`); it never gates or informs playback. Unlocking a *different, discarded* `Audio` element also does not transfer "unlocked" status to future elements on iOS-style per-element models **[H — §6 matrix]**. The unlock is therefore best-effort ritual, not a guarantee, and its failure (`catch { mediaUnlocked = false; }`) is — again — silent.

---

## 6. Browser Compatibility Matrix

All rows **[R]** (sources: §17.3, retrieved 2026-07), cross-referenced to this app's code paths **[V]**. UNVERIFIED flags preserved from the research.

### 6.1 The matrix

| Platform | ja voice available? | `speechSynthesis` reliability | Audible `Audio.play()` policy | `AudioContext` | Net effect on THIS app |
|---|---|---|---|---|---|
| **Chrome desktop** | Only Chrome's remote **"Google 日本語"** network voice by default; local OS voices only if installed (Windows: requires Japanese language pack) | Remote voices: ~15 s cutoff bug (still open, Chromium 41294170/332002367); **Chrome 130 (Oct 2024) broke remote voices outright** (374263394); `speak()` gated on **sticky activation** (any click ever, Chrome ≥71) — timer-context `speak()` OK after first click | Allowed after first domain interaction (session-scoped) or high MEI; timer-delayed `play()` after a click succeeds | Starts `suspended` without activation; `resume()` in gesture (app does this) | Media tier fine after first click. Fallback tier picks the *buggiest possible voice* — the app's priority list puts "Google 日本語" first (`audio.ts:3-12` **[V]**) |
| **Edge desktop** | Cloud "Nanami/Keita Online (Natural)" exposed with no install — **Edge-only** | Similar Chromium base | Same as Chrome | Same | The app's #3 priority "Microsoft Nanami" (`audio.ts:6` **[V]**) only ever matches on Edge |
| **Firefox desktop** | Only OS voices (Windows: language pack; **Linux: commonly zero voices** even with speech-dispatcher) | `getVoices()` synchronous; **cancel()→speak() same-tick wipe documented** (Bugzilla 1522074) | Blocked until any gesture (click/keypress) since FF66 | Standard | Fallback often has no ja voice at all on Linux |
| **Safari macOS** | **Kyoko/Otoya preinstalled** ✔ | `getVoices()` sync; 15.4 returned empty (fixed 15.4.1); voice-selection quirks | Inference-engine blocked by default per-site; detect via play() rejection | **Stops when window minimized** (WebKit 231105) | Best-case fallback platform — likely the developer's machine **[D]** |
| **Safari iOS** | Kyoko preinstalled ✔ (getVoices "lies" — ~1 usable voice/locale) | **First `speak()` must run synchronously in a gesture** or it's dropped silently; backgrounding mid-utterance can wedge synthesis; **ringer silent switch mutes speechSynthesis** | Gesture required; **per-element blessing** — an element played in a gesture is unlocked, new elements are not; `volume` property **ignored (always 1)**; muted autoplay doesn't unlock audible | Backgrounding → `interrupted` state, needs resume; **silent switch mutes Web Audio but NOT `<audio>` elements** (WebKit 237322); running web audio stops background Music app | **Worst case for this app** — see 6.2 |
| **Chrome Android** | Google TTS engine has ja since 2014, but the ~20 MB voice pack may need manual "Install voice data" | `getVoices()` async; locale codes use underscores (`ja_JP` — app normalizes ✔ `audio.ts:79` **[V]**); `pause()` behaves like `cancel()`; screen-off historically stops audio | Gesture required per Chrome policy | Standard | Voice-pack-missing devices silently fall to nothing |
| **Samsung Internet** | As Android | Supported (v5+); underscore locales | Similar | — | — |
| **PWA (installed)** | — | — | Autoplay allowed without gesture (Chrome) | — | N/A today — no manifest/SW exists **[V]** |
| **Offline** | speechSynthesis works with **local** voices only (Chrome's Google voices are network!) | — | — | — | Google TTS tier dead; fallback dead on Chrome-default-voices → **total silence offline** **[D]** |
| **Background tab** | — | Chrome desktop keeps speaking (UNVERIFIED authoritative source); Chrome silences *other* tabs' speech; iOS suspends | Media keeps playing | Chrome may suspend inaudible contexts | Discovery §12.6's "keeps playing while hidden" confirmed for Chrome desktop |
| **iOS Low Power Mode** | — | — | `play()` promises rejected, `suspend` fired | Effect on running context UNVERIFIED | Another silent per-device failure class |
| **Private browsing** | — | No documented API differences (UNVERIFIED "no effect"); Chrome incognito lacks MEI history | Fresh-profile rules | — | Slightly stricter first-play |

### 6.2 The iOS composite failure — worked example **[D from R+V]**

1. User taps "Show Answer" → React `onClick` runs → state set → **effect** fires `playAudio` (`FlashcardLearn.tsx:58-65`).
2. `new Audio(ttsUrl).play()` — a **new element**, not the one blessed by the unlock primer, and (depending on WebKit's gesture-window accounting for effects flushed post-event) possibly outside the gesture → `NotAllowedError` risk is real on iOS in a way it is not on Chrome.
3. Rejection → `fallbackToSpeech` → `speechSynthesis.speak()` — which on iOS **must be in a gesture call stack the first time** → dropped silently.
4. Result: first reveal of a session is silent on iOS; tapping the speaker button (gesture) works; users report "sometimes it talks, sometimes it doesn't."
5. Bonus inconsistency: with the ringer switch on silent, iOS mutes speechSynthesis and the SFX (`AudioContext`) but **not** the Google-TTS `<audio>` playback — the app's two sound channels split across the hardware mute switch.

### 6.3 Corrections this research forces on the app's assumptions

- **[V+R]** The voice priority list (`audio.ts:3-12`) puts **"Google 日本語" first** — the remote network voice implicated in the 15 s cutoff and the Chrome 130 outage. Industry guidance is the opposite: prefer `localService: true` voices. (Short kana dodge the 15 s bug, but not outage-class breakage.)
- **[V+R]** `MAX_TTS_TEXT_LENGTH = 180` (`audio.ts:15`) sits just under the endpoint's community-documented ~200-char 404 threshold — adequate, though gTTS itself chunks at 100.
- **[R]** The `translate_tts` response has **no CORS headers**: `fetch()` is impossible except `no-cors` → opaque; and Chrome pads each cached opaque response to **~7 MB of quota** — client-side caching of this endpoint at vocabulary scale is effectively unusable. §13's transport change is not optional if caching is wanted.
- **[R]** gTTS — the endpoint's highest-profile client — **abandoned `translate_tts` in v2.2.0 (2020)** for an internal RPC because of repeated breakage. The app adopted in 2026 what the ecosystem evacuated in 2020.

---

## 7. Root Cause Analysis (ranked by confidence × impact)

### RC-0 — Unobservability: the system cannot report *why* anything failed — **Certain [V]**

Every failure branch in `audio.ts` is silent (§5). There is no `utterance.onerror` handler **[V]**, no logging (the repo has a full client→server logging pipeline in `src/lib/logging/` — audio uses none of it **[V]**), no dev-console warning, and no UI affordance ("audio unavailable"). Consequence: the *reported symptom is the architecture*. "Sometimes fails without obvious reasons" is literally what this code is designed to produce when anything goes wrong. **Any fix must start here** — without observability, no other fix can be validated (§15 Phase 0).

### RC-1 — Primary transport is an unofficial Google endpoint — **High [V + R]**

**Evidence [V]**: `audio.ts:14` (`translate.google.com/translate_tts`), `:70` (`client: "tw-ob"`), `:141` (fresh uncached request per play), no retry/timeout/backoff anywhere in the module.
**Why it fails intermittently [R]**: the endpoint is undocumented and repeatedly breaks. The gTTS project — its highest-profile client — logged a 403 wave in 2016, token-scheme breakage, documented 429 rate-limiting under batch use (datacenter/shared IPs blocked fastest), a ~200-char 404 limit, and finally **abandoned `translate_tts` entirely in v2.2.0 (2020)** for an internal RPC. There is no published quota; failures are bursty and IP/region-dependent — the signature of "works at home, fails on campus Wi-Fi", i.e. *no obvious reason*.
**Amplifier [V]**: zero caching means N plays = N requests = N chances to trip throttling; Survival Drop mode issues one request per completed word from inside a RAF loop (`useSurvivalGame.ts:425,453`). **[R]** And caching is *architecturally impossible* against this endpoint: no CORS headers → only opaque `no-cors` responses → Chrome pads each cached opaque entry to ~7 MB of quota.
**Affected**: all browsers, all devices; probability scales with usage volume and shared-IP environments (classrooms — this is an educational app).
**Reproduction**: sustained rapid playback (Drop mode, fast Match rounds) from a single IP; or any network where `translate.google.com` is filtered; or offline (total tier loss).
**Timeline correlation [V]**: this dependency did not exist before 2026-07-03 (`d9afd3a`).

### RC-2 — The fallback tier is silently unavailable on a large device class — **High [V + R]**

When RC-1 fires, everything rests on `speechSynthesis` — the pre-rewrite pipeline, now with *worse* odds because it runs as a fallback in non-gesture contexts (RC-3).
**Failure modes**:
- **No Japanese voice installed** **[V code / R platform]**: `getJapaneseVoice` returns `undefined` (`audio.ts:83`); the utterance is spoken anyway (`:115-127`) with `lang="ja-JP"` and no voice object. The spec defines a `language-unavailable` error event, but **whether browsers fire it is inconsistent [R — UNVERIFIED]**, and the app attaches no `utterance.onerror` anyway **[V]**. In practice: silence, or a default (often English) voice mangling kana. Platform reality **[R §6]**: Windows ships **no** ja voice without the Japanese language pack (Haruka/Ayumi are pack-gated; "Microsoft Nanami" — the app's #3 pick — is an **Edge-only** cloud voice); stock Android may need a manual ~20 MB voice-data download; **Linux commonly has zero voices at all**; only macOS/iOS guarantee Kyoko out of the box.
- **The one near-universal Chrome voice is the buggy one [V+R]**: on stock Chrome the only ja option is the remote "Google 日本語" network voice — first in the app's priority list (`audio.ts:3-12`) — the voice class behind the 15 s cutoff bug and the Chrome 130 outage, and **unavailable offline**.
- **`playBrowserSpeech` cannot fail visibly** **[V]**: it returns `true` after `speak()` regardless of audibility (`audio.ts:110-132`).
**Affected**: Linux desktops, Windows without the ja language pack, Android without Japanese TTS data, offline Chrome users **[R]**.
**Reproduction probability**: ~100% deterministic *on those devices* whenever RC-1/RC-3 pushes playback onto the fallback — which is exactly why the app "works on the developer's Mac (Kyoko preinstalled **[R]**) and fails for some users."

### RC-3 — Six of ten autoplay sites run outside user activation (iOS-dominant) — **High [V + R]**

**Evidence [V]**: §3 table. Kana Quiz / Survival ∞+⏱ (`setTimeout` 220 ms — `useKanaQuizSession.ts:232` → `audio.ts:234`), Match (`setTimeout` 300 ms — `useMatchModeSession.ts:281`), Speed (poll-effect + 250 ms timer — `useGameEngine.ts:146`), and the three flashcard reveal effects (React `useEffect` after a click-driven state change).
**Platform behaviour — pinned by §6 research [R]**:
- **Chrome/Edge/Firefox desktop**: largely *cleared*. Chrome's `speak()` gate is **sticky activation** (any click ever on the page, Chrome ≥71), and its media-play gate is session-scoped after first domain interaction — so timer/effect-context playback works once the user has clicked anything. The desktop risk shrinks to the genuinely-first interaction of a fresh session and incognito/fresh profiles.
- **iOS Safari**: *confirmed hot*. Audible playback is gesture-gated **per element** — and this app constructs a **new `Audio` element per playback** (`audio.ts:141` **[V]**), so the unlock primer's blessing does not transfer. And the first `speechSynthesis.speak()` must run synchronously inside a gesture or it is **dropped silently** — the app never calls `speak()` in a gesture unless the media tier failed during a button press. Full failure walk-through: §6.2.
**Predicted signature [D]**: on iOS, *reveal/feedback pronunciation intermittently silent; the speaker button always works* — exactly the class of report that motivated this investigation. On desktop, near-first-interaction failures only.
**Interaction with RC-1 [D]**: a Google-TTS rejection in a non-gesture context falls back to `speak()` in the same non-gesture context — the tier with the strictest activation rule is asked to rescue the tier that was just blocked.

### RC-4 — Last-wins cancellation and debounce eat legitimate pronunciations — **Certain [V]**

Three mechanisms, all by design, all destructive under real gameplay pacing:
1. **Global cancel on every play** (`audio.ts:60-64,176`): any new `playAudio` kills current audio mid-word. Drop mode calls `playAudio` per completed word (`useSurvivalGame.ts:425,453`) — fast typists never hear a complete word **[D]**.
2. **Single debounce slot** (`audio.ts:21,230-238`): consecutive `playPronunciationFeedback` calls within the delay discard the earlier text (asserted by the module's own test, `audio.test.ts:168-184`). Speed mode answers <250 ms apart, or Quiz feedback racing a manual replay, silently drop audio.
3. **Match's raw stacked timers** (`useMatchModeSession.ts:281`): N matches <300 ms apart → N timers → N−1 clipped playbacks **[D]**.
**Reproduction**: deterministic given input pacing; probability scales with player skill — *better players experience worse audio*.

### RC-5 — `cancel()` → `speak()` same-tick race (fallback path) — **High [V + R]** *(upgraded)*

**[V]** `playBrowserSpeech` runs `synth.cancel(); synth.resume(); synth.speak(utterance)` synchronously (`audio.ts:125-127`). **[R]** The race is documented in *both* engines: Firefox Bugzilla 1522074 ("cancel wipes out speak calls following directly after") and Chromium 41084789; community-established workaround is a **250–500 ms delay** between `cancel()` and `speak()` — the app uses zero. The included `resume()` addresses only the *separate* "queue stuck paused" Chrome bug.
**[V+R] Aggravator**: when the fallback voice is Chrome's remote "Google 日本語" (the app's *first-priority* voice, `audio.ts:3-12`), the whole voice class is the one behind the 15 s cutoff bug and the Chrome 130 outage — fallback reliability on stock Chrome rests on the least reliable voice available.
**Reproduction**: fallback path under back-to-back pronunciations — compounds with RC-1/RC-4.

### RC-6 — Mid-stream error → double pronunciation or clipped word — **Medium [H]**

**[V]** `audio.onerror = fallbackToSpeech` (`audio.ts:156`) stays attached for the whole playback and the token is still current, so a network stall *after audible start* triggers a full re-speak via `speechSynthesis`. User hears「こんに— こんにちは」. Conversely `onended` clearing (`:157-159`) is correct, so this fires only on genuine mid-stream errors — rare, network-dependent, and bizarre-looking when it happens.

### RC-7 — Unmount / navigation orphans — **Certain [V]**

No consumer cleans up (§2). Two concrete loss modes:
- **[V]** A `playPronunciationFeedback` scheduled just before route change fires on the next page (`audio.ts:234` — module timer survives unmount): audio plays out of context, or
- **[D]** the user navigates within the 220–300 ms delay and the pronunciation they expected is heard on the wrong screen or attributed to the wrong card.
Speed mode's engine `destroy()` stops only the game timer (`GameEngine.ts:125-127` **[V]**), never audio.

### RC-8 — Voice-list race on first fallback playback — **High [V]**

**[V]** `warmSpeechVoices()` is called *in the same synchronous tick* as the playback it should be warming (`audio.ts:177-178`). On Chromium, `getVoices()` returns `[]` until `voiceschanged` fires at least once; a first-ever fallback playback therefore runs `getJapaneseVoice` against an empty list → `undefined` voice → RC-2's degraded utterance — *even on a machine that has Kyoko installed*. Subsequent plays succeed → classic "failed once, then worked."

### Non-causes (ruled out) **[V]**

- **Multiple `AudioContext`s** — exactly one is ever constructed (`sfx.ts:73-95`), and it belongs to SFX, not speech.
- **React re-render storms unmounting audio elements** — pronunciation audio lives in module scope, not React; re-renders cannot detach it.
- **Overlapping pronunciations** — impossible by construction (global last-wins); the problem is the opposite (RC-4).
- **CORS** — media elements don't require CORS for playback; the TTS URL plays fine in an `Audio` element. (It *does* block `fetch()`-based caching — §13.)

---

## 8. Timing & Race Condition Analysis

### 8.1 The three clocks

The pronunciation system runs on three uncoordinated clocks **[V]**:

| Clock | Owner | Grain |
|---|---|---|
| `pronunciationTimer` debounce | `audio.ts:21` | one global slot, 220–300 ms |
| Speed engine feedback (`setTimeout` 1100 ms) + React poll (100 ms) | `GameEngine.ts:93,203`; `useGameEngine.ts:126` | question cadence |
| Ad-hoc `setTimeout`s | Match `:281,286,305`, MC-select 750/900 ms, quiz advance 1250/1550 ms | per-feature |

No clock knows about the others; none knows how long the audio it schedules will actually last (`playAudio` gives no duration or completion signal **[V]**). Deterministic sequencing is therefore *impossible in the current design*, not merely unimplemented.

### 8.2 Enumerated races (all traced in source)

| # | Scenario | Mechanism | Outcome | Prob. |
|---|---|---|---|---|
| R1 | Two Match pairs matched <300 ms apart | Stacked raw timers (`useMatchModeSession.ts:281`) both fire; second `playAudio` cancels first | First word clipped | High for fast players **[D]** |
| R2 | Speed: answer next question quickly | New feedback effect calls `playPronunciationFeedback` → debounce discards prior; prior may be mid-speech → cancelled | Previous card's audio truncated/lost | High **[D]** |
| R3 | Quiz feedback + user taps replay within 220 ms | `playAudio` (button) clears pending debounce timer (`audio.ts:175`) | Auto-pronunciation never plays; only manual one does | Certain when tapped **[V]** |
| R4 | Navigate during 220–300 ms delay | Module timer survives unmount | Audio on wrong route (or perceived "missing") | Certain given timing **[V]** |
| R5 | Drop mode: complete two words <500 ms apart | Immediate `playAudio` per word (`useSurvivalGame.ts:425`) | Perpetual mid-word cancellation | Certain at speed **[V]** |
| R6 | First fallback playback of session | Voice list empty (RC-8) | Wrong/undefined voice once | High on Chromium **[V]** |
| R7 | Fallback `speak()` right after `cancel()` | Same-tick Chromium race (RC-5) | Utterance dropped | Medium **[H]** |
| R8 | Tab hidden mid-pronunciation | No `visibilitychange` handler **[V]**; media keeps playing; timers throttled to ≥1 s in background | Audio continues unheard; on return, delayed timers fire stale pronunciations | Medium **[H]** |
| R9 | Game restart (`reset()`) during feedback | Engine resets; pending 1100 ms `completeFeedback` and 250 ms pronunciation timers keep running (`GameEngine.ts:93` has no handle cleanup on `reset()` **[V]**) | Stale pronunciation after restart; `completeFeedback` no-ops via state machine but timer fires | Medium **[V]** |
| R10 | Unlock race: first-ever gesture *is* a play request | React `onClick` runs before window-level unlock listeners (bubbling order) | Play attempt precedes unlock; in-gesture `play()` is itself allowed, so usually safe *by accident* | Low **[H]** |
| R11 | Mid-stream network stall | `onerror` fires with valid token (RC-6) | Double pronunciation | Low **[H]** |
| R12 | Rapid double-click on replay button | Second `playAudio` cancels first | Restart from beginning (acceptable UX) | — benign **[V]** |

**[V]** One race that was *correctly* defended: `stopCurrentMedia()`'s `removeAttribute("src"); load()` can fire a synchronous `error` on the detached element; the token increment *before* teardown (`audio.ts:61-63`) defuses the resulting `fallbackToSpeech`. This ordering is load-bearing and undocumented — a future reorder reintroduces phantom double-speech.

---

## 9. Gameplay Audio Sequence Analysis

For each mode: the *actual* timeline reconstructed from source, and a determinism verdict. (Constants verified in the discovery report §12.1.)

### 9.1 Flashcard (Learn / Practice / Mistake Review — flip path)

```
tap card ─► playSFX("click") @0 ─► isFlipped=true ─► [500ms CSS flip]
        └► useEffect (post-render): globalAutoPlay? ─► playAudio @≈0
                                        ⚠ speech starts while card is edge-on
grade ─► playSFX(correct|wrong) @0 ─► queue advance (immediate)
                                        ⚠ pronunciation from the flip may still
                                          be speaking into the next card; it is
                                          only killed by the NEXT playAudio
```
**Verdict**: ordering is deterministic; *durations are not respected* — no step waits for audio. MC path: selection is **silent**, grade lands at 750/900 ms, no pronunciation at all on MC cards **[V]** (`FlashcardPractice.tsx:187-194` never calls `playAudio`).

### 9.2 Match Game

```
tap A ─► click @0 ─► tap B ─► click @0 ─► [120ms] resolveTwo
  match: correct-SFX @0 ─► gradeCard (async, fire-forget)
         └► setTimeout(300): playAudio(word)   ⚠ overlaps 540ms SFX tail
         └► setTimeout(400): unlock input      ⚠ next pair can start while
                                                 word is speaking → R1 clip
  miss:  wrong-SFX @0 ─► shake 400ms ─► [720ms] clear+unlock
```
**Verdict**: non-deterministic — input unlock (400 ms) precedes pronunciation completion (~300 ms + word length), so audio order across pairs depends on player speed.

### 9.3 Speed Mode

```
answer ─► engine.submitAnswer (sync): SFX @0, feedbackStatus set
       ─► React poll notices ≤100ms later ─► effect ─► debounce(250ms) ─► playAudio
       ─► engine setTimeout(1100ms): next question
⚠ pronunciation effective start 250–350ms (poll jitter) — non-deterministic ±100ms
⚠ nothing ensures speech ends before the 1100ms advance; long words bleed into
  the next question's think-time and are killed by the next answer's audio
```
**Verdict**: non-deterministic by construction (polling) and unbounded (no duration awareness).

### 9.4 Survival — Infinity / Time Attack

Same engine as Kana Quiz: SFX @0, pronunciation debounced @220 ms, advance at 1250/1550 ms. **Verdict**: mostly deterministic cadence; pronunciation can still be lost to R2/R3; `listen`-type questions are generated but rendered identically to `read` (**[V]** `useKanaQuizSession.ts:153` reachable only from Survival; `SurvivalQuizScreen.tsx:105-118` has no listen branch) — a designed-but-absent listening exercise.

### 9.5 Survival — Drop

```
keystroke ─► click @0 (throttle 24ms)
word done ─► click @0 + correct @0 + playAudio @0   ⚠ all three same tick
stray key ─► wrong @0                                ⚠ even with no word on screen
```
**Verdict**: chaotic by design; the only mode where SFX and pronunciation are *deliberately* simultaneous — and where cancellation makes complete pronunciations nearly impossible at skill.

### 9.6 Kana Practice / Kana Learn

Gesture-driven (`useKanaPlayDeck` navigate/play, `:54-76`). **Verdict**: deterministic and reliable — this is the path that "always works", reinforcing users' perception that failures elsewhere are random.

### 9.7 Modes requested in the brief that do not exist in this codebase **[V]**

- **Listening Exercises** — no dedicated mode; the `"listen"` question type exists as dead data (§9.4).
- **AI Conversation** — no such feature exists anywhere in `src/` (grep: no conversation/dialogue audio surface). `features/ai` generates card *text* only.
- **Review Mode** — exists as Flashcard Mistake Review; timeline identical to §9.1.

---

## 10. UX Evaluation

Per-sound audit (existence rationale, overlap, interruption, skip, wait) — the full 10-row table is in the discovery report §12.3; deltas and decisions needed:

| Question | Current answer | Assessment |
|---|---|---|
| Should gameplay wait for pronunciation? | Never does (no completion signal exists) | For *feedback* pronunciation in paced modes (Quiz 1250 ms window), the window usually suffices for single kana **[D]**; for words in Speed/Match it does not. Target design must make "wait vs overlap" an explicit per-cue policy (§14). |
| Should pronunciation interrupt pronunciation? | Always (last-wins) | Correct default for *replays of the same word*; wrong for *queued distinct words*. Needs a queue with a small depth (§14). |
| Should users skip audio? | Implicitly (any action cancels) | Acceptable; keep. |
| Could repetition annoy? | Drop-mode `wrong` on every stray key (`useSurvivalGame.ts:464` **[V]**); per-keystroke `click` at 24 ms throttle | Yes — flagged for redesign; not a reliability issue. |
| Do sounds overlap SFX? | All pronunciation delays (220/250/300 ms) < `correct` tail (540 ms) **[D]** | The stated intent ("SFX first, then pronunciation" — comments at `useMatchModeSession.ts:280`, `useGameEngine.ts:136`) is unmet in every mode. Either shorten `correct` or delay voice ≥ tail. |
| Silent moments that should speak? | MC-mode cards never pronounce **[V]** (§9.1); correct-answer *word* in Speed is spoken but the *meaning* isn't reinforced | Product decision; note MC is the *primary* practice modality for AI-generated decks. |
| Accessibility | No mute, no volume, no reduced-motion, no `aria-live`, feedback = colour+motion+sound with no redundancy controls **[V]** | Must-fix list in §14.7. |

---

## 11. Performance Findings

Reliability-relevant items (full list: discovery §13):

1. **Every pronunciation = one uncached network round trip** (`audio.ts:141`) — latency variance *is* perceived unreliability: on a slow link the word arrives after the feedback window has moved on **[D]**. Also multiplies RC-1 exposure.
2. **`voiceschanged` listener leak** — one per pronunciation, unbounded (`audio.ts:100-108` called from `:177`) **[V]**. Long sessions degrade; also each leaked closure re-runs `getVoices()` when the event does fire.
3. **Five permanent gesture listeners** re-run `getContext()`/`resumeContext()` on every input event, forever (`sfx.ts:170-182`, missing `once`) **[V]**.
4. **100 ms polling** drives Speed-mode React renders 10×/s for the whole game and is the trigger mechanism for its pronunciation (`useGameEngine.ts:122-129`) **[V]**.
5. **Web Audio node churn** — `correct` = 3 oscillators + 6 gains per call, never disconnected (`sfx.ts:101-133`) **[H — GC-collectible per spec, unprofiled]**.
6. **No memory leak from audio elements** — `stopCurrentMedia` detaches correctly (`audio.ts:52-58`) **[V]**; at most one live element at a time.
7. **`AudioContext` never suspended/closed** — active session for the app's lifetime including `/login` (barrel side effect, discovery §2.2) **[V]**.

---

## 12. Industry Research & Benchmarking

All findings below are **[R]** — external research, July 2026; source URLs in §17.2. Marked *INFERRED* where evidence is community teardown rather than official documentation.

### 12.1 How the market leaders deliver Japanese audio

| Product | Audio strategy | Delivery | Key evidence |
|---|---|---|---|
| **Duolingo** | TTS, **pre-generated once per unique string** — never live in the client. Amazon Polly-era voices validated by A/B tests; since 2021, custom neural character voices via Microsoft Custom Neural Voice (incl. Japanese) | Dedicated TTS microservice: DynamoDB dedup → SQS workers → **S3 + CloudFront CDN**; clients fetch static MP3s (*teardown-INFERRED format*) | Official AWS ML engineering blog; Duolingo character-voices blog |
| **WaniKani** | **Two studio recordings per vocab word** (Kyoko female / Kenichi male, Tokyo accent); no TTS | API v2 `pronunciation_audios` serves each recording in **`audio/mpeg` + `audio/ogg` + `audio/webm`**, client picks codec | Official API reference; knowledge base. Old corpus re-recorded wholesale (voice consistency) and open-sourced CC-BY-SA-4.0 |
| **Bunpro** | Hybrid: **recorded native audio for grammar** (one consistent voice, complete through N1); **TTS as a stopgap for vocab decks**, staff-announced migration to professional recordings (Feb 2025) | — | Staff posts on community forum |
| **Memrise** | Native-speaker **video clips** for official courses; community decks = author-uploaded MP3s (multiple per item) | — | Official Zendesk docs |
| **LingoDeer** | "Every sentence recorded by native speakers" — closed curriculum, recorded up front | — | Marketing + independent reviews (engineering detail UNVERIFIED) |
| **Anki ecosystem** (AwesomeTTS/HyperTTS) | **Generate-once, store-in-media-collection** is the documented canonical mode; on-the-fly TTS exists but is desktop-only and explicitly second-class ("batch generation is the only option" for identical mobile audio). HyperTTS fronts 17+ providers; Japanese community favours **VOICEVOX** (free, deterministic pitch accent) | Files in the deck, synced to all devices | Official add-on docs |
| **Yomitan/Yomichan** | **The reference fallback chain**: ordered audio sources, "checked until the first source with audio is found"; defaults JapanesePod101 → Jisho; TTS allowed but last and explicitly warned as "potentially inaccurate" | Community "Local Audio Server": **~250k Japanese word clips**, priority `NHK16 → Shinmeikai8 → curated Forvo → JPod101` — dictionary-verified pitch accent first, crowdsourced later, TTS never | Official yomitan.wiki; local-audio-yomichan repo |
| **Forvo** | Crowdsourced recordings, paid API ($2/mo non-commercial → $28.95/mo commercial, attribution) | Quality uneven; serious consumers whitelist trusted speakers | api.forvo.com |

### 12.2 Why nobody load-bearing uses browser `speechSynthesis`

Reasons practitioners actually cite (each sourced in §17.2):

1. **Consistency & QA** — a generated file is reviewable, A/B-testable, identical for all users; a browser voice is whatever the OS has.
2. **Japanese correctness** — kanji multi-readings and pitch accent: Yomitan's own docs warn browser TTS "may be incorrect for words with multiple readings"; communities rank dictionary-verified audio above everything.
3. **Web Speech unreliability, worst on iOS/Safari** — voices depend on OS installs, `getVoices()` misses installed voices, regressions between iOS versions (Apple developer-forum threads).
4. **Cross-device parity & offline** — stored files are "the only option" for identical mobile audio (AwesomeTTS docs).
5. **Latency** — pre-stored plays instantly.
6. **Cost control** — synthesize each unique string once, CDN forever (Duolingo's DynamoDB-dedup pattern).

Items 2, 3, and 5 are *precisely* RC-2, RC-3/5/8, and §11.1 in this codebase — the industry consensus independently names this app's live-synthesis failure modes.

### 12.3 File-size reality check

The Yomitan Local Audio Server publishes the best public numbers for Japanese word audio: ~250k clips = **2.5 GB Opus @32k VBR** or **4.9 GB MP3** → **≈10–20 KB per word clip**. **[D]** Scaled to this app's core content: ~200 kana × ~15 KB ≈ **3 MB total** — smaller than a single hero image; a 10,000-word vocabulary corpus ≈ 100–200 MB in object storage, trivially CDN-able.

### 12.4 TTS provider comparison (for the generation step)

Condensed from the provider workstream (full detail + caveats in §17.2; prices checked 2026-07, re-verify before committing):

| Provider | JA quality | Price/1M chars | Free tier | Pitch-accent control | Caching allowed | Verdict for this app |
|---|---|---|---|---|---|---|
| **Google Cloud TTS** | 4–4.5 (Neural2 / Chirp3 HD) | $16 Neural2 / $30 Chirp3 HD | 1M/mo perpetual | **Best**: yomigana + downstep SSML (`^は!し`) | Yes (documented) | **Top pick** — accent control is pedagogically exact |
| **Azure Speech** | 5 (Nanami) | ~$15–16 | 500K/mo perpetual | SSML, weaker JA phoneme control | Paid tier yes; F0 ambiguous | **Co-pick** on raw naturalness |
| **Amazon Polly** | 4 (neural; no JA generative) | $16 neural | 12 months only | pron-kana apostrophe (neural-engine support UNVERIFIED) | **Clearest terms**: explicit cache-and-replay-free FAQ | Solid, a voice-generation behind |
| **OpenAI TTS** | ~2.5–3 for JA | $15–30 | none | **None** (no SSML); documented kanji misreads, JA/ZH drift on short input | Yes | **Avoid for isolated kana** |
| **ElevenLabs** | 4–5 naturalness; accent accuracy UNVERIFIED | ~$50–110 equiv. | non-commercial only | None | Paid plans yes | Overpriced per char for this workload |
| **VOICEVOX** (OSS, self-host) | 3 (character-styled) but **deterministic, mora-editable pitch accent** | $0 + compute | — | Dictionary-driven, inspectable | Credit required ("VOICEVOX:…") | Great free batch option / second voice |

**[D]** This app's entire core corpus (~200 kana + ~10k words × ~10 chars ≈ **100K characters**) fits inside Google's *monthly* free Neural2 tier. **One-time generation cost ≈ $0–3.** Incremental user-deck words are pennies.

---

## 13. Recommended Audio Source Strategy

### 13.1 Constraints fixed by the codebase **[V]**

- **Finite core content**: ~200 kana (`src/features/kana/data/hiragana.ts`/`katakana.ts`) — pre-generatable once, forever.
- **Unbounded user content**: arbitrary deck words (`card.primary` via `getAudioText`, `displayEngine.ts:13-15`) — needs on-demand generation + permanent cache.
- **CORS reality**: the current endpoint can be *played* but not `fetch()`ed cross-origin, so it can never be cached programmatically — any caching strategy forces a transport change anyway.
- **No language metadata on cards** — `tl=ja` is assumed everywhere; the strategy must add a `language` field (or detection) to `FlashCardContent`.
- **No server audio infrastructure exists** — but the app already has Next.js server routes, Firebase Storage, and an admin pipeline, so a TTS proxy route + Storage cache is incremental, not greenfield.

### 13.2 Recommended tiering (aligned with §12's industry consensus)

**Tier 1 — Static pre-generated kana assets (ships with the app).**
Generate all ~200 kana once with **Google Cloud TTS Neural2/Chirp3 HD** (using its yomigana+downstep SSML so ぎ vs ギ etc. are phonetically pinned) — or VOICEVOX if a zero-cost/verifiable-accent path is preferred — and commit them to `/public/audio/kana/` (or Firebase Hosting/CDN). ≈3 MB total (§12.3). Serve as MP3 (+ Opus variant optional; WaniKani precedent says multi-codec, but for 3 MB MP3-only is defensible). This alone removes RC-1, RC-2, RC-3-fallback, RC-5, and RC-8 for **every kana feature** (Chart, Learn, Practice, Quiz, Survival) — the majority of pronunciation traffic **[D]**.

**Tier 2 — Server-cached on-demand TTS for deck vocabulary.**
A Next.js route (`/api/tts`) checks Firebase Storage for `tts/{lang}/{voice}/{hash(text)}.mp3`; on miss, calls the vendor once, stores, returns a CDN/Storage URL. Every unique word is generated **once per app lifetime** (Duolingo's dedup pattern, §12.1). Cost model: §12.4 — effectively free at this scale. Client caches the blob locally (Cache API) after first play. Same-origin (or Storage-CORS-enabled) ⇒ fetchable ⇒ cacheable ⇒ retryable.

**Tier 3 — `speechSynthesis`, demoted to emergency fallback.**
Only when Tiers 1–2 are unreachable (offline with cold cache). Wrapped per §14.3: voice-readiness awaited, errors observed, never attempted where activation rules forbid it. Its known Japanese-correctness weaknesses (§12.2) are acceptable for an emergency tier.

**Removed — `translate.google.com/translate_tts`.**
Unofficial, throttled, uncacheable, undisclosed third-party data flow. It survives only inside the Phase-3 circuit breaker as a transitional tier and is deleted at the end of that phase (§15).

### 13.3 Vendor recommendation

**Primary: Google Cloud TTS (Neural2 now; evaluate Chirp3 HD)** — the only vendor with explicit Japanese pitch-accent SSML (`<phoneme>` yomigana with `^`/`!` downstep marks), which matters *pedagogically* for a learning app; perpetual free tier covers this app's realistic volume indefinitely. **Alternate: Azure (Nanami)** if voice naturalness A/Bs better — but weaker accent control. **Rejected: OpenAI** (no phonetic control; documented kanji misreads and JA/ZH drift on short inputs — disqualifying for isolated-kana content) and **ElevenLabs** (3–7× cost, unverified accent fidelity). **VOICEVOX** is the recommended *second voice* / zero-budget option, with the required "VOICEVOX:<character>" credit.

### 13.4 Category treatment (per the brief's asset-strategy question)

| Category | Source | Preload | Cache |
|---|---|---|---|
| UI SFX / game feedback | Keep synthesized Web Audio (current `sfx.ts` presets are good; they just need an owner) — zero assets, zero latency | n/a | n/a |
| Japanese pronunciation (kana) | Tier 1 static assets | Prefetch current deck/row on session start | HTTP immutable + Cache API |
| Japanese pronunciation (vocab) | Tier 2 server-cached TTS | Prefetch session queue (the study queue is known at `buildSession()` time **[V]** — `learningEngine.ts`) | Cache API, keyed by content hash |
| Character voices (future) | Same Tier-2 pipeline, different `voice` key | — | same |
| Background ambience / music (future) | Streaming `<audio>` via music channel | lazy | HTTP |
| Notifications | none today; if added, SFX presets | — | — |

---

## 14. Target Audio Architecture

Design only — no implementation in this phase. Every element below maps to a named deficiency (RC-x / D-x from the discovery report).

### 14.1 Overview

```
┌────────────────────────── React tree ──────────────────────────┐
│  <AudioProvider>            ← owns the ONE AudioManager        │
│     • exposes useAudio() hook: play(cue), speak(req), stop(),  │
│       setVolume(channel), mute(channel), status               │
│     • subscribes to settings store (mute/volumes/autoplay)     │
│     • installs lifecycle hooks ONCE: route-change stop,        │
│       visibilitychange suspend, gesture unlock                 │
└────────────────────────────────────────────────────────────────┘
                 │
        ┌────────▼─────────┐
        │   AudioManager   │  plain TS class, framework-free, injectable
        │  (single owner)  │  (unit-testable without vi.stubGlobal)
        └───┬────┬────┬────┘
   ┌────────┘    │    └──────────┐
┌──▼───────┐ ┌───▼──────┐ ┌──────▼─────────┐
│ Channels │ │ Sequencer│ │ VoiceService   │
│ sfx      │ │ (cues,   │ │ provider chain:│
│ voice    │ │ priority,│ │ 1 static asset │
│ music*   │ │ waits)   │ │ 2 cached blob  │
│ ambient* │ │          │ │ 3 cloud TTS    │
│ (Gain +  │ │          │ │ 4 speechSynth  │
│ mute per │ │          │ │ + AudioCache   │
│ channel) │ │          │ │ + health/CB    │
└──────────┘ └──────────┘ └────────────────┘
                                  │
                          Diagnostics bus → console (dev) /
                          lib/logging (sampled, prod) / UI status
```
\* music/ambient are empty channels initially — the seam exists, no content ships.

### 14.2 AudioManager (owner of all state)

Replaces the two module singletons. Owns: the `AudioContext`, channel `GainNode`s (routing **both** SFX **and** decoded voice audio through Web Audio, so mute/volume/ducking are single-point — resolves discovery §2.1's three-output-path problem), the unlock state, and the settings bindings. Public API is **promise-returning and cancellable**:

```ts
interface AudioManager {
  play(cue: SfxCue, opts?): void;                       // fire-and-forget lane
  speak(req: SpeakRequest): PlaybackHandle;             // { done: Promise<Result>, cancel() }
  stopAll(reason: StopReason): void;                    // exported, called by lifecycle
  setChannelVolume(ch: Channel, v: number): void;
  muteChannel(ch: Channel, muted: boolean): void;
  readonly diagnostics: DiagnosticsBus;
}
```

`PlaybackHandle.done` resolving with `{ status: "completed" | "cancelled" | "failed", tier, error? }` is what makes RC-0 and §8.1's "no clock knows audio duration" both fixable: sequences can *await* audio, and failures become data.

### 14.3 VoiceService — the pronunciation provider chain

Priority order (final vendor choice pending §13):

1. **Static pre-generated assets** — the kana set, shipped from own origin (`/audio/kana/{codepoint}.mp3`), immutable-cached. Zero network variance for the app's core content. Kills RC-1 for kana entirely.
2. **AudioCache** — Cache API/IndexedDB blobs of previously generated user-deck words, keyed by `hash(lang + text + voice + version)`. A word is fetched **once per device, ever**.
3. **Cloud TTS via own API route** — `/api/tts?text=…` (Next.js route handler) proxying a real TTS vendor, with server-side caching (Firebase Storage/CDN) so each unique word is generated **once per app, ever**. Same-origin ⇒ fetchable ⇒ cacheable (fixes the CORS-blocks-caching constraint) ⇒ retryable with backoff.
4. **speechSynthesis** — last resort only, wrapped: voice readiness awaited via a one-time `voiceschanged` promise with polling fallback (fixes RC-8), **local voices preferred over Chrome's remote "Google …" network voices** (§6.3), `utterance.onerror`/`onend` attached (fixes part of RC-0), cancel→speak separated by the community-established 250–500 ms gap when a cancel actually occurred (fixes RC-5), and a hard rule: *never attempted outside user activation on platforms that require it* (iOS) — instead the request is queued until the next gesture or dropped with a reported reason (fixes RC-3's silent variant).

A **circuit breaker** per tier (N failures in window → skip tier for T minutes, report) converts today's silent per-call degradation into an observable, self-healing mode switch.

### 14.4 Sequencer — deterministic cues

Game code stops calling audio functions directly (removes all 14 direct call sites; restores the repo's UI→Hook→Service layering). Instead it emits declarative cues:

```ts
audio.sequence("answer-feedback", [
  { sfx: correct ? "correct" : "wrong" },
  { waitMs: SFX_TAIL[type] },            // finally: voice AFTER the tail
  { speak: { text, lang: "ja", policy: "replace-same|queue-distinct" } },
]);
```

Sequences are owned by the manager: starting a new sequence with the same key applies a declared interruption policy (replace / queue / ignore); route change or unmount aborts via one `stopAll("navigation")`. The three uncoordinated clocks (§8.1) collapse into one.

### 14.5 Policy layer (real, this time)

- `speechPolicy.allowAudio` is either implemented against real inputs (question type × stage × user settings × channel mute) or deleted. The prompt-stage rule ("never leak answers") gets a test.
- `globalAutoPlay` moves *inside* the manager: `speak()` requests carry `trigger: "auto" | "user"`, and the manager enforces the setting centrally — all ten autoplay sites obey by construction (fixes discovery D2).
- New settings surface: SFX mute, voice mute, per-channel volume (persist in the existing `app-settings` Zustand store — `src/lib/app-store.ts` already has the persistence pattern **[V]**).

### 14.6 Lifecycle (fixes RC-7, discovery D3)

Installed once in `AudioProvider`:
- Next.js route change → `stopAll("navigation")` + abort pending sequences.
- `visibilitychange: hidden` → pause voice channel, suspend context after grace period; `visible` → resume context (not the interrupted utterance).
- `pagehide` → `stopAll`.
- Single gesture-unlock listener set with `once: true` (fixes discovery D5), owned here, removed after success.

### 14.7 Accessibility

- Voice/SFX mutable independently (screen-reader users routinely mute app SFX but need speech).
- `aria-live="polite"` region announcing answer feedback textually — removes the current colour+motion+sound-only feedback triple (discovery D21).
- `prefers-reduced-motion` honoured for shake/flip (motion is currently unconditional **[V]**); audio offered as the alternative channel, not casualty.
- A visible "audio unavailable" affordance when the provider chain is exhausted (RC-0's user-facing half).

### 14.8 Testability

The manager is a constructor-injected class (`new AudioManager({ context, transport, clock })`) — fake transports and virtual clocks in tests; no `vi.stubGlobal`, no `vi.resetModules` (removes the pattern forced on `audio.test.ts` today **[V]**). Sequencer policies become pure, property-testable functions (the repo already uses fast-check **[V]**).

---

## 15. Migration Roadmap

Each phase shippable alone; no big-bang.

**Phase 0 — Observe (days)**
Add diagnostics to the *existing* module: `utterance.onerror`, tier-used + failure-reason capture, sampled reporting through the existing `lib/logging` pipeline, and a dev-console warn. *No behaviour change.* Exit criterion: a week of data attributing real-world failures to RC-1/2/3 percentages — this validates (or re-ranks) §7 before further investment.

**Phase 1 — Stop the losses (days)**
- Export and wire `stopAllAudio()` on route change (one `useEffect` in the immersive layout).
- Fix `sfx.ts` `once:true`; hoist `warmSpeechVoices` registration to module scope.
- Replace Match's raw `setTimeout` with the debounced API; align the three delays to one constant ≥ SFX tail.

**Phase 2 — The seam (1–2 weeks)**
Introduce `AudioProvider`/`AudioManager` wrapping the *current* transports unchanged; migrate the 14 call sites to `useAudio()`; move `globalAutoPlay` enforcement inside. Behaviour identical, architecture inverted. Delete `speechPolicy` tautology or make it real.

**Phase 3 — The transport (1–2 weeks, needs §13 vendor decision)**
Own-origin TTS route + server cache; client AudioCache; pre-generate the kana asset set; demote `translate_tts` to a temporary tier behind the circuit breaker, then remove it. This is the phase that actually retires RC-1/RC-2 for the 99% case.

**Phase 4 — Determinism & polish**
Sequencer adoption per mode (Speed first — worst jitter), promise-awaited feedback windows, per-channel volume UI, accessibility items (§14.7), listening-question type either implemented or excised.

**Rollback**: each phase is additive behind the provider; the legacy module remains callable until Phase 3 completes.

---

## 16. Risks & Open Questions

**Risks of the migration itself**
- Cloud TTS introduces cost and a server dependency where none exists (app is currently static-hostable + Firebase). Mitigation: server cache means cost ≈ one-time per unique word; kana set is free after pre-generation.
- Voice change will be *audible* — users accustomed to the Google Translate voice will notice. Consider matching voice character in vendor selection.
- Pre-generated asset licensing must permit redistribution (§13 verifies per vendor).
- The Sequencer changes gameplay feel (waits where there were overlaps); needs product sign-off per mode.

**Open questions (product)**
1. Is ungated pronunciation in Speed/Match/Quiz/Survival intentional pedagogy or a bug? (Determines Phase 2 default.)
2. Should MC-mode flashcards pronounce the word after grading? (Currently silent **[V]**.)
3. Is a listening-question modality wanted? (Dead `"listen"` type — implement or delete.)
4. Do non-Japanese decks exist among real users? (Forces a `language` field on `FlashCardContent`.)
5. Acceptable monthly TTS budget / free-tier ceiling? (Gates §13 vendor choice.)
6. Is offline support in scope? (Adds service-worker workstream to Phase 3.)

**Open questions (technical, need runtime verification)**
7. Actual failure distribution across RC-1/2/3 — Phase 0 answers this with data.
8. iOS behaviour of the current unlock ritual and non-gesture `play()` — needs device testing (§6 pins the documented behaviour; this app's exact pattern is untested).
9. Whether Google throttling is already occurring for this app's users (Phase 0 telemetry will show `onerror` bursts).

---

## 17. Evidence Appendix

### 17.1 Repository evidence (all verified in this investigation)

| Fact | Location |
|---|---|
| TTS endpoint + params | `src/shared/utils/audio.ts:14,66-75` |
| Uncached per-play `new Audio` | `audio.ts:141` |
| Silent failure paths | `audio.ts:128-131,143,150-154,161-164,202-205` |
| No `utterance.onerror` | `audio.ts:110-132` (absent) |
| Debounce last-wins | `audio.ts:21,230-238`; test `audio.test.ts:168-184` |
| Global cancel on play | `audio.ts:60-64,175-176` |
| Token guard ordering (load-bearing) | `audio.ts:61-63` vs `:150-154` |
| Voice warm same-tick + listener leak | `audio.ts:100-108,177` |
| Unlock ritual; `mediaUnlocked` unused for gating | `audio.ts:181-223` |
| SFX singleton, gains, throttle, missing `once` | `src/shared/utils/sfx.ts:30-35,62-95,101-107,170-190` |
| Tautological policy | `src/shared/utils/speechPolicy.ts:13-20` + 4 call sites (discovery §7.3) |
| Non-gesture call sites | `useKanaQuizSession.ts:232`; `useMatchModeSession.ts:281`; `useGameEngine.ts:138-148`; `FlashcardLearn.tsx:58-65`; `FlashcardPractice.tsx:99-106`; `FlashcardMistakeReview.tsx:87-93` |
| Gesture call sites | `ChartCell.tsx:38`; `useKanaPlayDeck.ts:54-76`; `useSurvivalGame.ts:404-472`; audio buttons |
| Engine cleanup stops timer only | `speed/engine/core/GameEngine.ts:125-127`; `reset()` `:102-106` |
| No lifecycle handlers repo-wide | grep `visibilitychange|pagehide|beforeunload` → 0 hits |
| No audio assets / libs / SW | `src/public/` (5 SVGs); `package.json`; no `sw.js`/manifest |
| Pipeline rewrite commit | `d9afd3a` 2026-07-03; prior impl. `git show a4e3ff8:src/shared/utils/audio.ts` |
| Dead `"listen"` type | `useKanaQuizSession.ts:147-155`; `SurvivalQuizScreen.tsx:105-118`; `QuizPlaying.tsx` (no listen branch) |
| `globalAutoPlay` reach (4/10) | `lib/app-store.ts:13`; consumers listed in discovery §11.2 |
| Logging pipeline audio never uses | `src/lib/logging/*` |

### 17.2 External sources

Consolidated citations for §12/§13 (all retrieved 2026-07-10). §6's browser-platform citations are listed in §17.3.

**Industry architectures (§12.1–12.3)**
- Duolingo × Amazon Polly engineering post (TTS microservice: DynamoDB dedup, SQS, S3+CloudFront; studio-cost rationale; A/B validation) — aws.amazon.com/blogs/machine-learning/powering-language-learning-on-duolingo-with-amazon-polly/
- Duolingo character voices via Microsoft Custom Neural Voice (incl. Japanese) — blog.duolingo.com/character-voices/; microsoft.com/en-us/startups/blog/duolingo-makes-learning-language-fun-with-help-from-ai/
- Duolingo audio CDN teardowns (*INFERRED*, unofficial) — github.com/KartikTalwar/Duolingo issue #61; github.com/DustinAlandzes/scrape-duolingo-audio
- WaniKani audio (dual voice actors; formats `audio/mpeg|ogg|webm`) — knowledge.wanikani.com/wanikani/audio/; docs.api.wanikani.com/20170710/ (`pronunciation_audios`)
- WaniKani legacy corpus open-sourced CC-BY-SA-4.0 — github.com/tofugu/japanese-vocabulary-pronunciation-audio
- Bunpro staff on recorded grammar audio (N1 complete) and TTS→native-recording migration — community.bunpro.jp/t/bunpro-audio-n1-complete-october-10-2021/38889; community.bunpro.jp/t/what-tts-service-does-bunpro-use/78783
- Memrise community-course audio upload docs — memrise.zendesk.com/hc/en-us/articles/360015973418
- LingoDeer recorded-audio positioning (marketing + reviews; engineering UNVERIFIED) — lingodeer.com; japademy.com/japanese-course-reviews/lingodeer
- AwesomeTTS / HyperTTS generate-once-store pattern; "batch generation is the only option" for mobile parity — ankiatts.appspot.com/usage/browser; vocab.ai/tutorials/hypertts-collection-audio; faqs.ankiweb.net/text-to-speech-support.html
- VOICEVOX-for-Anki community preference — github.com/Toocanzs/anki-voicevox; community.wanikani.com/t/voicevox-tts-a-good-resource-for-pitch-accent/55673
- Yomitan ordered audio-source fallback chain; TTS warned "potentially inaccurate" — yomitan.wiki/advanced/
- Yomitan Local Audio Server (≈250k clips; `nhk16→shinmeikai8→forvo→jpod` priority; 2.5 GB Opus @32k / 4.9 GB MP3) — github.com/yomidevs/local-audio-yomichan; Cloudflare R2 variant with Polly pitch-accent fallback — github.com/friedrich-de/yomitan-ultimate-audio
- JapanesePod101 audio endpoint fragility (TLS-cert outage broke Yomichan audio) — github.com/FooSoft/yomichan issue #676
- Forvo API pricing/tiers — api.forvo.com/plans-and-pricing/

**TTS providers (§12.4, §13.3)**
- Google Cloud TTS: voices/types & Chirp3 HD ja-JP — docs.cloud.google.com/text-to-speech/docs/list-voices-and-types; /docs/release-notes; **Japanese pitch-accent SSML (yomigana `^`/`!` downstep)** — docs.cloud.google.com/text-to-speech/docs/phonemes; pricing (std/WaveNet $4, Neural2 $16, Chirp3 HD $30 per 1M chars; perpetual monthly free tiers) — cloud.google.com/text-to-speech/pricing (cross-checked costbench.com snapshot 2026-07-01); store/cache usage documented — cloud.google.com/text-to-speech/docs/basics
- Azure Speech: ja-JP neural voices (Nanami, Keita, Aoi, Daichi, Mayu, Naoki, Shiori) — learn.microsoft.com/azure/ai-services/speech-service/language-support; pricing ~$15–16/1M neural, $22 HD, F0 500K/mo — azure.microsoft.com/pricing/details/speech/ (cross-checked texttolab.com, June 2026); paid-tier output commercial-use — learn.microsoft.com transparency note; F0 commercial ambiguity — learn.microsoft.com/answers/questions/5805156
- Amazon Polly: ja voices (Mizuki, Takumi, Kazuha, Tomoko; **no ja generative engine** as of Nov 2025 expansion) — docs.aws.amazon.com/polly/latest/dg/available-voices.html; aws.amazon.com what's-new Feb 2023 / Nov 2025; Japanese `x-amazon-pron-kana` downstep SSML — aws.amazon.com/blogs/machine-learning/optimizing-japanese-text-to-speech-with-amazon-polly/ (neural-engine applicability UNVERIFIED); **explicit cache-and-replay-free FAQ** — aws.amazon.com/polly/faqs/; pricing $4 std/$16 neural, 12-month free tier — aws.amazon.com/polly/pricing/
- OpenAI TTS: model/pricing — developers.openai.com/api/docs/models (tts-1 $15, tts-1-hd $30/1M chars; gpt-4o-mini-tts ≈$0.015/min); documented Japanese failure modes: kanji misreads — community.openai.com/t/japanese-tts-sometimes-misreads-kanji…/1297418; JA/ZH drift on ambiguous short input — community.openai.com/t/…/725326
- ElevenLabs: pricing/tiers — elevenlabs.io/pricing (≈$50–110/1M-char equivalent per texttolab.com & softcery.com); output ownership survives cancellation — elevenlabs.io/terms-of-use; free tier non-commercial + attribution — help.elevenlabs.io
- VOICEVOX: engine & licensing (LGPL-3.0/commercial dual; per-character terms; "VOICEVOX:<character>" credit) — github.com/VOICEVOX/voicevox_engine; voicevox.hiroshiba.jp/term/; Docker self-host — hub.docker.com/r/voicevox/voicevox_engine; Style-Bert-VITS2 AGPL caveat — github.com/litagin02/Style-Bert-VITS2
- Latency figures (vendor-benchmark-derived, not independently measured for ja-JP) — softcery.com 2026 STT/TTS guide
- Japanese-language provider quality comparison (Google 4/5, Azure 5/5, VOICEVOX 3/5) — note.com/vitaactiva/n/n0539245a72b1

### 17.3 Browser-platform sources (§6, RC-1/2/3/5)

All retrieved 2026-07-10; browser behaviour is version-dependent — re-verify before relying on any single row.

**SpeechSynthesis bugs & policy**
- Chrome ~15 s utterance cutoff, still open — issues.chromium.org 41294170, 41346274, 332002367; practitioner confirmation Nov 2025 — caktusgroup.com/blog/2025/11/03/the-halting-problem/ (pause/resume ~14 s interval mitigation; plain resume() no longer suffices)
- Cutoff tied to Chrome's remote "Google …" network voices; local voices unaffected; Android `pause()` behaves like `cancel()` — dev.to/jankapunkt "Cross browser speech synthesis"
- **Chrome 130 (Oct 2024) remote-voice outage** — issues.chromium.org 374263394; support.google.com/chrome/a/thread/303329396
- `cancel()`→`speak()` same-tick drop — bugzilla.mozilla.org 1522074; issues.chromium.org 41084789; community workaround 250–500 ms gap (empirical, exact minimum UNVERIFIED)
- `speak()` requires **sticky** user activation since Chrome 71 — chromestatus.com/feature/5687444770914304; blink-dev intent thread; deprecation console message quoted in github.com/ONLYOFFICE/sdkjs-plugins issue 85
- `getVoices()` async on Chrome/Edge/Android, sync on Firefox/Safari desktop; `voiceschanged` unreliability — developer.mozilla.org SpeechSynthesis/getVoices; github.com/leaonline/easy-speech (250 ms-interval fallback); Safari 15.4 empty-voices bug — weboutloud.io/bulletin/speech_synthesis_in_safari/
- Locale-format variance (`ja_JP` underscores on Android; three-letter codes on Firefox Android); iOS getVoices over-reporting — talkrapp.com/speechSynthesis.html
- iOS: first `speak()` must be synchronous in a gesture — developer.apple.com/forums/thread/49875; textintoaudio.com/browser-support; ringer silent switch mutes speechSynthesis — talkrapp.com
- Background-tab behaviour; Chrome silences other tabs' speech; mobile quirks (`boundary` events, silent devices) — engineering.ibmix.de/blog/2024/08/speechless-in-the-frontend

**Japanese voice availability**
- Windows: ja voices gated behind Japanese language pack (Haruka SAPI; Ayumi/Ichiro/Sayaka OneCore) — support.microsoft.com Narrator voices appendix; windowsloop.com; vovsoft.com guides
- Edge-only cloud Nanami/Keita ("Online Natural"), absent even in WebView2 — webfrontend.ninja; github.com/MicrosoftEdge/WebView2Feedback issue 2660
- macOS/iOS Kyoko/Otoya preinstalled — manu.ninja Web Speech guide
- Android Google TTS ja since 2014; voice pack may need manual install — androidpolice.com (2014); resemble.ai guide
- Linux frequently zero voices (speech-dispatcher required, often still empty) — bugzilla.mozilla.org 1837789, 1666703; bbs.archlinux.org topic 268799
- `language-unavailable` error event defined but inconsistently fired (UNVERIFIED) — developer.mozilla.org SpeechSynthesisErrorEvent/error

**Autoplay & activation**
- Chrome autoplay policy (domain interaction, MEI, PWA exemption) — developer.chrome.com/blog/autoplay; chromium.org/audio-video/autoplay/
- Transient activation ≈5 s (gates other APIs, not repeated media) — developer.mozilla.org Glossary/Transient_activation
- Safari desktop inference engine — webkit.org/blog/7734/; iOS gesture/per-element rules, muted-autoplay-doesn't-unlock — webkit.org/blog/6784/
- iOS unlock must be synchronous in gesture; async gap breaks chain — github.com/mackron/miniaudio issue 759 (iOS 17); mattmontag.com unlock guide; rosswintle.uk UI-sounds pattern
- Firefox autoplay since 66 — hacks.mozilla.org 2019 post; wiki.mozilla.org Media/block-autoplay
- iOS ignores media-element `volume` (always 1) — developer.apple.com iOS-Specific Considerations (archive); github.com/mdn/browser-compat-data issue 13554

**AudioContext lifecycle**
- Chrome Web Audio autoplay gating (M70/71) — developer.chrome.com/blog/web-audio-autoplay
- Safari macOS context stops on minimize — bugs.webkit.org 231105; iOS `interrupted` state & stuck-interrupted reports — bugs.webkit.org 237878; github.com/WebAudio/web-audio-api issues 2585, 790
- iOS silent switch mutes Web Audio but not media elements — bugs.webkit.org 237322; Audio Session API (`navigator.audioSession`, ambient vs playback; web audio stops background music by default) — w3.org/TR/audio-session/; developer.apple.com/forums/thread/24464
- Unprefixed AudioContext since Safari 14.1/iOS 14.5 — github.com/chatwoot/chatwoot issue 4942
- iOS Low Power Mode rejects autoplay play() — foliovision.com autoplay guide (running-context effect UNVERIFIED)

**translate_tts endpoint**
- gTTS changelog: 2016 403 wave, token breakage, **v2.2.0 (2020) abandons translate_tts** for batchexecute RPC; 100-char chunking; 403 → "Bad token or upstream API changes" — gtts.readthedocs.io/en/latest/changelog.html and /\_modules/gtts/tts.html
- 429 rate-limiting reports — github.com/pndurette/gTTS discussion 325; pythonanywhere.com/forums/topic/31886/ (datacenter IPs blocked fast)
- ~200-char 404 limit — github.com/zlargon/google-tts issue 5
- No CORS headers (media plays; fetch() blocked/opaque) — github.com/zlargon/google-tts issue 10; github.com/hua1995116/google-translate-open-api issue 1

**Offline caching**
- Opaque responses cacheable but unreadable; SW can serve them to `<audio>` — mmazzarolo.com 2024-11-06 service-workers-and-cors; developer.chrome.com Workbox runtime-caching
- Chrome ~7 MB quota padding per opaque response — cloudfour.com "When 7 KB Equals 7 MB"; developer.chrome.com Workbox storage-quota (Safari/Firefox padding UNVERIFIED)
- Safari Range-request handling caveat for cached media (UNVERIFIED, flagged for implementation testing)

---

*End of report.*
