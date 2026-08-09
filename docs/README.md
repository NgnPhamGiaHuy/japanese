# Docs

Start at the [root README](../README.md) for what the app is, how to run it, and the layer
contract. This directory holds the two things that don't fit there.

## [Testing](testing.md)

The five test tiers, what each covers, how to run them, and the emulator prerequisites.

## Architecture Decision Records (`adr/`)

Why the code is shaped the way it is. All of these are in force — the code cites them by
number in ~76 comments, and `eslint.config.mjs` quotes them in the error messages it shows
when a boundary rule trips.

| ADR | Covers |
| --- | --- |
| [001 — Audio architecture](adr/001-audio-architecture.md) | The single `AudioManager`, and why every sound routes through it |
| [002 — Data-layer pattern](adr/002-data-layer-pattern.md) | Realtime `onSnapshot` vs. the one-shot Query bridge |
| [003 — Feature flags](adr/003-feature-flags.md) | Firebase Remote Config over PostHog flags |
| [101–120 — Architecture decisions](adr/1xx-refactor-decisions.md) | Feature boundaries, dependency direction, write paths, auth, RBAC, tables, pagination, observability, coverage, config, deletion policy |

Two numbering series coexist deliberately: the 1xx range was chosen so the larger decision set
could land alongside 001–003 without colliding. ADR-113 affirms ADR-002.

**This list must name every file in `adr/`.** It fell out of sync once — ADR 003 existed on
disk but was missing here, so the index quietly under-reported what the codebase had decided.
An index that is only mostly complete is worse than no index, because it is trusted.

An ADR records a decision at the moment it was made. If a decision changes, add a new ADR that
supersedes the old one rather than editing history into it.
