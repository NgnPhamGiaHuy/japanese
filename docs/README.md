# Docs index

## Architecture Decision Records (`adr/`)

Records of decisions that shape how the codebase is built, not just what it does — read these
before touching the area they cover.

- [ADR 001 — Audio architecture](adr/001-audio-architecture.md)
- [ADR 002 — Data-layer pattern: realtime `onSnapshot` vs. the one-shot Query bridge](adr/002-data-layer-pattern.md)

## Migrations ledger

- [Migrations ledger](migrations-ledger.md) — the completion state of every staged change:
  intended end state, current stage, owner, and review-by date. Landing a staged change adds
  its row in the same change (ADR-120).

## Runbooks

- [Notification testing & migration runbook](testing-notifications.md) — the two test tiers
  (unit vs. emulator), the pending index/rules deploy, and the one-time data backfill.
