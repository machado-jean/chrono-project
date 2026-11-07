# ADR 026 — Persistent Gantt editing history

## Status

Accepted on 2026-10-03.

## Context

Gantt already offered undo and redo, but the stacks existed only in the mounted
component instance. Switching views or reopening the application erased an
important protection against accidental temporal gestures. A baseline is not a
replacement: it records an approved plan, while undo/redo records a short
sequence of local edits.

## Decision

Persist one `undo` stack and one `redo` stack per project in SQLite table
`gantt_history_state`. Each entry contains only the prior and subsequent state
needed to reverse a temporal edit made in Gantt.

The stacks retain at most 50 revisions each, are validated at the TypeScript
boundary and again in the native layer, have a combined 1 MiB limit, are
cascade-deleted with the project, load when Gantt mounts, save after edit, undo,
or redo, and clear `redo` when a new edit follows an undo.

Scope includes dates, duration, progress, and lag changed by Gantt gestures.
Structural operations, import, task deletion, and changes outside the view do
not enter these stacks. History is not exported as business intent and is not a
multi-user audit trail.

Migration `0007_persistent_gantt_history.sql` moves schema to 7. Schema-4,
schema-5, and schema-6 packages are migrated only in a temporary copy during
inspection/import.

## Consequences

- Undo/redo survives view changes and reopening the application.
- Growth is bounded and predictable.
- Tasks and dependencies remain the schedule source of truth.
- Invalid or oversized revisions are rejected before writing.
- The feature does not promise to reverse mutations made outside Gantt.

## Rejected alternatives

- Keep history only in memory: it loses protection precisely on navigation or
  reopening.
- Store complete workspace snapshots: this increases cost, risk, and reversal
  scope unnecessarily.
- Reuse baselines: this mixes approved plans with transient history.
- Create a global audit at this stage: it needs semantics for every operation
  and belongs to a future increment.
