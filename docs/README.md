# Docs index

Everything authoritative about this codebase lives in two places: **`docs/`** (decisions and
operational runbooks) and **`../project-memory/`** (what the code is right now). If a statement
about this repository is not in one of those, treat it as unverified.

## Architecture Decision Records (`adr/`)

Records of decisions that shape how the codebase is built, not just what it does — read these
before touching the area they cover. **All of them remain in force; none is superseded.**

| ADR | Covers |
| --- | --- |
| [001 — Audio architecture](adr/001-audio-architecture.md) | The single `AudioManager`, and why every sound routes through it |
| [002 — Data-layer pattern](adr/002-data-layer-pattern.md) | Realtime `onSnapshot` vs. the one-shot Query bridge |
| [003 — Feature flags](adr/003-feature-flags.md) | Firebase Remote Config over PostHog flags |
| [101–120 — Refactor-program decisions](adr/1xx-refactor-decisions.md) | Feature boundaries, dependency direction, write paths, auth, RBAC, tables, pagination, observability, coverage, config, deletion policy, staged-change tracking |

**This list must name every file in `adr/`.** It fell out of sync once — ADR 003 existed on disk
but was missing here, so the index quietly under-reported what the codebase had decided. An index
that is only mostly complete is worse than no index, because it is trusted.

The two series coexist deliberately: the 1xx range was picked so the refactor-program decisions
could land alongside 001–003 without colliding. ADR-113 explicitly affirms ADR-002.

## Migrations ledger

- [Migrations ledger](migrations-ledger.md) — the completion state of every staged change:
  intended end state, current stage, owner, and review-by date. Landing a staged change adds
  its row in the same change (ADR-120). **This is also where the still-open questions live.**

### ADRs vs. the ledger

They answer different questions and neither substitutes for the other:

|            | Architecture Decision Record             | Migrations ledger                                           |
| ---------- | ---------------------------------------- | ----------------------------------------------------------- |
| Records    | A decision, at the moment it was made    | How far that decision has actually got                      |
| Mutability | **Immutable** — superseded, never edited | **Mutable** — the current-stage field changes as work lands |
| Answers    | _"Why is it built this way?"_            | _"Is this transitional shape still intended?"_              |
| Lives as   | One file per decision in `adr/`          | One row per staged change in the ledger                     |

Writing a decision down does not track whether it was carried out — that gap is what the ledger
exists to close.

## Runbooks

- [Notification testing & migration runbook](testing-notifications.md) — the two test tiers
  (unit vs. emulator), the index/rules deploy state (indexes deployed per `LDG-19`; rules
  still unverified), and the one-time data backfill.

## Current-state memory (`../project-memory/`)

Start there before changing code: architecture as built, the patterns to copy, verified
invariants, known debt, and the list of things already decided so they are not re-proposed.

## What used to be here

Five planning directories (`architecture-assessment/`, `project-discovery/`,
`architecture-decision/`, `implementation-planning/`, `execution-readiness/`) held ~19,000 lines
of point-in-time analysis from the 2026 refactor program. They were **deleted on 2026-08-09**:
the program had finished, and their file paths had drifted far enough from the code to mislead
anyone navigating by them. The decisions worth keeping were migrated into
[`adr/1xx-refactor-decisions.md`](adr/1xx-refactor-decisions.md); everything else is recoverable
from git history. Code comments still cite `T-1xx` task IDs from that program — read those as
provenance markers, not as links.
