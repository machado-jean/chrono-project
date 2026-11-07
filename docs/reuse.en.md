# Reuse: duplication and templates

## Delivered behaviour

- **Duplicate task** copies only the chosen task.
- **Duplicate tree** copies the task, every descendant, and only dependencies
  whose two ends belong to the copied tree.
- **Duplicate project** creates another project, copies the complete tree and
  every internal dependency, then selects the new copy.
- **Save tree as template** captures a reusable structure in the workspace-wide
  library.
- **Apply template** creates an independent tree in the selected project,
  anchored on the supplied date and recalculated by the scheduler.

Each copy receives new UUIDs. External relationships are not recreated.
Deleting a template does not delete or modify tasks that were created from it.

## Template contents

Templates retain title, description, hierarchy, leaf duration, priority,
initial status, tags, and internal FS dependencies with lag, including when the
predecessor is a summary. They do not retain visual code, assignee, notes,
progress, absolute dates, or a task-specific calendar. Applied tasks start in
`AUTO` mode with zero progress and use the destination-project calendar.

Templates live in the workspace SQLite database. A complete database copy
therefore contains them. Backup/restore and `.chronoproject` workspace export
include templates as described in [import-export.en.md](import-export.en.md).

## Phase 5 manual audit

Use the existing test project or create a small chain with subtasks.

1. In **Table**, open **Details** for a leaf task and choose **Duplicate task**.
   Check the new implicit number/UUID, copied fields, and absence of external
   relations.
2. Open the parent task and choose **Duplicate tree**. Check descendants,
   numbering, summary dates, and internal predecessors.
3. Choose **Duplicate project** in the header. Check that the copy is selected
   and editing it does not alter the original.
4. In the original tree, choose **Save tree as template**, provide a name and
   description, and check the entry in **Templates**.
5. Select another project, provide a date in the library, and choose **Apply**.
   Check hierarchy, duration, lag, and recalculation from the new date.
6. Delete the template and confirm that the applied tree remains.
7. Close and reopen the executable to confirm persistence of the duplicated
   project, the template that was not deleted, and the applied tasks.

Integrity errors must appear in the message strip and must not leave projects,
trees, or templates partially recorded.

Architectural decision: [ADR 014](decisions/014-workspace-task-templates.en.md).
