# ADR 029 — Critical path and project-target margin

## Status

Accepted on 2026-10-07.

## Decision

Critical path is calculated in pure TypeScript from scheduled leaf tasks, FS
dependencies, and local calendars. The calculation is a projection: it does
not persist float, alter the scheduler, or create another source of truth.

A backward pass starts from the latest predicted network finish and accumulates
float between each FS constraint and the successor’s actual start. Zero total
float identifies the critical path; one or two working days identify near-
critical tasks. Changing only a deadline therefore does not change which tasks
control completion.

The final target is derived separately as the greatest deadline among
non-cancelled tasks. The working-day difference between predicted network finish
and that target is the global project margin: positive with reserve, zero when
they coincide, and negative when the prediction already exceeds the target.

Analysis is a persisted preference and is disabled by default. When enabled
without any deadline, critical path remains available and only target margin has
no value. A dialog presents a network with parallel paths, explains both
indicators, and makes explicit that analysis does not move tasks.

Cancelled tasks and tasks without a complete schedule are ignored. Summaries
receive the smallest float among descendants only for display. If no valid FS
relation exists between scheduled tasks, analysis is declared unavailable.

## Consequences

- Table, Gantt, and filters consume the same deterministic result.
- Highlighting combines text, shape, and outline rather than depending only on
  colour.
- Changes to dates, calendars, or dependencies recalculate the in-memory
  projection.
- PDF reports consume the same projection: they show schedule indicators, mark
  critical and near-critical bars, and retain a Gantt-matching vector legend.
- A detailed explanation of the controlling predecessor can be added later
  without a migration.
- The dedicated performance audit was deferred until feature completion.
