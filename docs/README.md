# Docs index

## Architecture Decision Records (`adr/`)

Records of decisions that shape how the codebase is built, not just what it does — read these
before touching the area they cover.

- [ADR 001 — Audio architecture](adr/001-audio-architecture.md)
- [ADR 002 — Data-layer pattern: realtime `onSnapshot` vs. the one-shot Query bridge](adr/002-data-layer-pattern.md)
- [ADR 003 — Managed feature flags: Firebase Remote Config over PostHog flags](adr/003-feature-flags.md)

**This list must name every file in `adr/`.** It fell out of sync once — ADR 003 existed on disk
but was missing here, so the index quietly under-reported what the codebase had decided. An index
that is only mostly complete is worse than no index, because it is trusted.

**All three remain in force.** Nothing supersedes ADR 001 or ADR 003; ADR 002 is explicitly
affirmed by the newer decision set, which uses a `1xx` namespace precisely so it can sit
alongside this series without colliding with it.

## Migrations ledger

- [Migrations ledger](migrations-ledger.md) — the completion state of every staged change:
  intended end state, current stage, owner, and review-by date. Landing a staged change adds
  its row in the same change (ADR-120).

### ADRs vs. the ledger

They answer different questions and neither substitutes for the other:

|            | Architecture Decision Record             | Migrations ledger                                           |
| ---------- | ---------------------------------------- | ----------------------------------------------------------- |
| Records    | A decision, at the moment it was made    | How far that decision has actually got                      |
| Mutability | **Immutable** — superseded, never edited | **Mutable** — the current-stage field changes as work lands |
| Answers    | _"Why is it built this way?"_            | _"Is this transitional shape still intended?"_              |
| Lives as   | One file per decision in `adr/`          | One row per staged change in the ledger                     |

Writing a decision down does not track whether it was carried out — that gap is what the ledger
exists to close. A decision that lands in stages needs both: an ADR saying what was chosen, and a
ledger row saying which stage the code is actually in.

## Runbooks

- [Notification testing & migration runbook](testing-notifications.md) — the two test tiers
  (unit vs. emulator), the pending index/rules deploy, and the one-time data backfill.
