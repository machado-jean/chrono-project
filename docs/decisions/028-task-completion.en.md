# ADR 028 — Factual task completion

## Status

Accepted and implemented since version 0.2.3.

## Context

`COMPLETED` status raised progress to 100% but did not record when a task was
actually completed. Health also treated every completed task as **On track**,
even when completion occurred after its deadline. Reopening a task could leave
status, progress, and completion in contradictory states.

## Decision

- `tasks.completed_date` stores the actual completion date as `YYYY-MM-DD`.
- Changing to `COMPLETED` requires a shared confirmation in Table, Kanban, and
  Gantt, 100% progress, and a completion date between task start and today.
- A task completed after `deadline_date` receives `COMPLETED_LATE` health; a
  cancelled task receives neutral `CANCELLED` classification.
- Reopening removes `completed_date` and requests progress coherent with the
  new status. `NOT_STARTED` suggests 0%, open states suggest 99%, and
  `CANCELLED` retains the possibility of 100%.
- A summary task cannot be completed while any descendant is open. Completed or
  cancelled descendants are considered closed.
- The domain rejects `COMPLETED` without 100% or a date, and rejects a
  completion date in every other status.

## Migration and compatibility

Migration `0008_task_completion.sql` moves schema to 8. Earlier completions
receive 100% and use recorded finish; without finish they use `updated_at`.
Transient Gantt undo/redo history is cleared because earlier JSON entries lack
the new factual field. Schema-4 through schema-7 packages are upgraded only in
a temporary copy during inspection, import, or restoration.

## Consequences

- Historical health no longer depends on the current date after completion.
- Updating or reinstalling preserves the information in SQLite and packages.
- 100% does not automatically complete a task, preventing a status change
  without explicit confirmation.
- Completed-task progress is locked until it is reopened.
