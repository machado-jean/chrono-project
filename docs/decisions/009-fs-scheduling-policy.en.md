# ADR 009 — FS scheduler policy

## Status

Accepted on 2026-08-27; revised on 2026-08-28 after manual review of backward
propagation, on 2026-09-13 to permit same-day transition, and supplemented by
ADR 025 on 2026-10-02 to permit summary tasks as predecessors.

## Context

Phase 3 must make task propagation predictable without prematurely implementing
SS, FF, and SF. It must also distinguish a real conflict from coincidence:
unrelated tasks may occur on the same day.

## Decision

Implement only Finish-to-Start (`FS`), shown in Portuguese as Término para
Início (`TI`). Lag is a non-negative integer counted in the successor’s
effective calendar. Zero lag permits the successor to start on the predecessor
finish date; lag `1` selects the next working day and subsequent values add
working days.

Dependencies are accepted between tasks in the same project. The successor
must be a leaf task; the predecessor can be a leaf or summary task under ADR
025. The domain rejects self-dependency, duplication, and cycles before
persistence. The database repeats structural invariants expressible in
constraints and triggers.

`AUTO` tasks with predecessors align to the latest FS constraint and preserve
duration. A later predecessor delays the successor; an earlier predecessor
brings it forward. The same calculation cascades in topological order.

Intentional slack uses lag. Directly controlled dates use `MANUAL`, which is
preserved and only receives an informative conflict when a declared predecessor
requires a later start. Unrelated date coincidence is not a conflict.

Removing a relation leaves remaining predecessors in control. Removing the last
predecessor keeps the current date: without a baseline, constraint, or anchor,
the domain cannot infer a correct earlier date.

## Consequences

- the result is deterministic and explainable;
- multiple predecessors use the latest constraint;
- cross-project relations and other dependency types remain future work;
- summary tasks derive dates from descendants and can feed successors, but
  never receive an incoming relation;
- propagation is persisted in a single transaction;
- automatic related tasks do not preserve implicit slack: use lag or manual
  mode;
- an unscheduled automatic successor assumes an initial one-day duration and is
  populated from its FS constraint.

## Decision history

The initial version used conservative forward-only propagation. User audit
showed that finishing a predecessor earlier than planned must release and bring
automatic successors forward. The policy was explicitly revised with unit,
chain, multiple-predecessor, interface, and transactional-persistence tests.
