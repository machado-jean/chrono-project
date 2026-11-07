# ADR 025 — Summary task as an FS predecessor

## Status

Accepted on 2026-10-02.

## Context

A relation attached to the last subtask in a group stops representing that group
when a new sibling is added. Users need to declare that an activity depends on
the finish of the entire summary task without losing the more specific option of
depending directly on a leaf.

Summary dates remain derived from descendants. Allowing a summary on both sides
of a relation would create two sources of truth and allow invisible cycles when
dependencies and hierarchy were analysed separately.

## Decision

Allow summary tasks only as **predecessors** in FS relations. A summary task
can never be a successor because its start and finish remain calculated solely
from subtasks.

The scheduling graph combines:

- FS edges from predecessor to successor;
- structural edges from every direct descendant to its parent task.

Cycle validation, topological ordering, and affected-subgraph discovery use
this combined graph. When a descendant changes, summaries recalculate before
external successors that depend on them.

When turning a leaf with relations into a summary, the interface offers:

- **keep on the new summary**, only when every leaf relation is outgoing;
- **transfer to the new subtask**;
- **remove dependencies**.

A task already acting as a summary automatically retains outgoing relations when
it receives another subtask. Direct leaf relations to external tasks are not
relocated when siblings are added.

Migration `0006_summary_predecessors.sql` replaces earlier triggers and repeats
in SQLite the rule “summary may be predecessor, never successor”. The same
policy applies to templates.

## Consequences

- Depending on a summary follows future subtasks and the new aggregate finish.
- Depending directly on a leaf remains isolated from new siblings.
- Cycles combining hierarchy and dependencies are rejected before writing.
- Duplication, templates, and portable packages preserve the relation by UUID.
- Schema-4 and schema-5 packages are upgraded in a temporary copy during import.
- SQLite schema advances to version 6 without changing `.chronoproject` format.

## Rejected alternatives

- Automatically move every last-leaf relation to the summary: this would change
  existing specific-relation intent.
- Allow summary as successor: this would conflict with derived dates.
- Expand a summary relation into several leaf relations: this would create
  unstable links and require rewrites whenever the tree changed.
