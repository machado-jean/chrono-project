# ADR 022 — Immutable baselines and informative deadlines

## Status

Accepted on 2026-09-10.

## Context

The current schedule must be compared with the approved plan without
interfering with FS rules. It must also distinguish a calculated finish date
from an external commitment, which can indicate risk without rescheduling
tasks.

## Decision

- A baseline is a named immutable snapshot of a project’s tasks: identity,
  title, hierarchy number, start, finish, duration, and progress.
- Only one baseline is active per project. Creating another deactivates the
  current one, records its replacement, and preserves all history.
- Finish variance is calculated in working days using the task’s effective
  calendar.
- `deadline_date` is optional, uses `YYYY-MM-DD`, and does not participate in
  the scheduler.
- An open task is late after its deadline; before then it is at risk if its
  current finish exceeds the deadline. With no deadline, there is no
  classification.
- Table, Gantt, and PDF only project these data. Gantt is not a source of truth
  and a report does not alter the snapshot.

## Consequences

Migration 5 is additive. Schema-4 packages and backups remain readable through
a migrated temporary copy, without changing the selected file. Export, selective
import, project copy, backup, and restoration include baselines; templates do
not store absolute deadlines or snapshots because both depend on a concrete
project and dates.

Critical path and float remain outside this decision and belong to Phase 9.
