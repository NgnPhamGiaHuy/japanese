# `shared/audio`

Everything that makes noise goes through here. Feature code never touches `AudioContext`,
`HTMLAudioElement`, or `speechSynthesis` directly.

## Using it

```ts
import { playSfx, sequence, speak } from "@/shared/audio";

// A UI cue. Fire-and-forget, throttled, never queues, never blocks gameplay.
playSfx("click");

// Pronunciation. `trigger` decides whether the user's auto-play setting applies.
speak("あ", { trigger: "user", source: "kana-chart" }); // a tap on a speaker button — always plays
speak("あ", { trigger: "auto", source: "kana-quiz" }); // the app decided — obeys auto-play

// A cue followed by pronunciation, with the voice starting only once the cue has rung out.
sequence(
    "kana-quiz-feedback",
    [
        { waitForTail: "correct" },
        { speak: { text: "あ", options: { trigger: "auto", source: "kana-quiz" } } },
    ],
    { policy: "replace" },
);
```

`speak` returns a `PlaybackHandle` whose `done` promise resolves with what actually happened:
`completed`, `cancelled`, `failed`, or `suppressed`. It never throws and never rejects.

## The three rules

**1. Every request declares who asked for it.** `trigger: "user"` means the learner tapped
something and it always plays. `trigger: "auto"` means the app decided, and the manager suppresses
it when "Auto-Play Pronunciation" is off. This is enforced in exactly one place — `manager.ts` — so
a new call site cannot forget to check the setting.

**2. Cues and voice live on separate channels.** Muting sound effects never silences pronunciation,
and vice versa. Screen-reader users routinely want exactly that combination.

**3. Nothing is scheduled with a bare `setTimeout`.** Use `sequence()`. It knows how long each cue
rings (`SFX_TAIL_MS`), it has one interruption policy per key, and it aborts on navigation and tab
hide. Ad-hoc timers are how the old code ended up with three uncoordinated clocks, none of which
knew how long a sound lasted.

## Interruption policies

| Policy           | Use when                                       | Used by                       |
| ---------------- | ---------------------------------------------- | ----------------------------- |
| `replace`        | The newest event is the only one that matters. | Speed, Kana Quiz, card reveal |
| `queue`          | Each event deserves to be heard in full.       | Match (depth 2)               |
| `ignore-if-busy` | The cue is the reward; the voice is a bonus.   | Survival Drop                 |

## Layout

| File                          | Owns                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `manager.ts`                  | The public API. Settings gating, speech policy, SFX throttling, stop hooks.           |
| `channels.ts`                 | The single `AudioContext`, the channel gains, idle suspension.                        |
| `unlock.ts`                   | The one gesture-unlock listener set (context + media element).                        |
| `sequencer.ts`                | Ordered cues, interruption policies, abort-on-stop.                                   |
| `policy.ts`                   | Whether a given stage/trigger/question-type may speak.                                |
| `sfx.presets.ts`              | Tone data, throttle intervals, and each cue's tail duration.                          |
| `voice/googleTranslateTts.ts` | Google Translate TTS → `speechSynthesis` fallback. Starts and stops; never schedules. |
| `telemetry.ts` / `status.ts`  | Every failure branch is named, counted, and surfaced.                                 |

## Known limitation

`voice/googleTranslateTts.ts` still calls an undocumented Google Translate endpoint with a browser
`speechSynthesis` fallback. Both tiers are unreliable, uncacheable and offline-hostile. It is
isolated behind the manager precisely so it can be replaced by a tiered provider chain without
touching a single call site.
