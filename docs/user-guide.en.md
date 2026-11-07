# User guide

This guide presents Chrono Project’s primary flow. The application works
locally on Windows and requires neither an account nor a remote server.

## 1. Install and locate data

Download standard setup from Releases; use offline setup without internet.
Executable and data are separate, so update or reinstallation must not erase
the user database. Paths, silent mode, and earlier-version precautions are in
[Windows installation and maintenance](installation-windows.en.md).

## 2. Understand the workspace

The window has an integrated title bar and **File**, **Edit**, **View**,
**Calendar**, **Templates**, and **Help** menus; compact view selector;
collapsible project bar; project header with status, baseline, critical path,
and PDF; shared filters; and **Table**, **Kanban**, or **Gantt** main area.
All three views use the same tasks: a saved change in one appears in the others.

## 3. Create the first project

1. In the project bar, choose **New project**.
2. Enter a name and optional description.
3. Configure working days, holidays, and exceptions in **Calendar**.
4. Use quick creation above Table for the first task.

Right-clicking a project offers archive, deletion, and export. Deletion is
destructive; create a backup first.

## 4. Organise tasks and subtasks

Tasks can record title, description, status, priority, progress, assignee,
tags, dates, duration, deadline, and notes. Use **+ Subtask** or context menu
to build hierarchy. The current limit is five levels including root. Tasks with
descendants become summaries: start and finish derive from subtasks and are not
directly editable.

Valid Table fields save automatically. **Save** appears only for a pending
draft, required validation, or retry after error.

## 5. Plan dates

Fill any two of start, finish, and duration for the third to calculate.
Duration is inclusive working days: a one-day task starts and finishes on the
same working day. The lock selects `AUTO`, movable by scheduler, or `MANUAL`,
whose dates are not moved automatically. Summary dates reflect descendants.
Deadline is a health reference and does not move schedule.

## 6. Add predecessors

In **Predecessors**, use `+` to search number or title and select many tasks in
one operation. Invalid, duplicate, or cyclic relations are not offered. Current
relations are Finish-to-Start (`FS`); working-day interval is lag. Before batch
confirmation, the app shows dates that will change. Undo the whole operation
with `Ctrl+Z` and redo it with `Ctrl+Shift+Z`.

A summary task can be predecessor but never successor. Descendant changes
recalculate summary finish and can propagate to automatic successors.

## 7. Use views

### Table

Primary editing surface: inline editing, hierarchy, multiple selection,
filters, predecessors, and resizing **Task** and **Predecessors** columns.

### Kanban

Groups tasks by status. Drag a card or use its status selector. Context menu
offers key actions without returning to Table.

### Gantt

Shows bars, summaries, progress, calendars, and relations. Its compact legend
stays in the header. **Options** opens scroll help and dependency selector.
**Inspect task** is the accessible alternative to gestures. Manual tasks and
summaries block movements incompatible with their rules. The horizontal bar is
always visible at the timeline base.

## 8. Filters and analysis

Filters cover text, status, priority, criticality, assignee, dates, and tags;
they remain active across views and can limit PDF. On small screens, project
header scrolls away while filter bar stays fixed below application menu.

Critical path is optional per project. When enabled it shows the completion-
controlling task sequence, working-day float, and near-critical tasks. Final
target is the greatest deadline among non-cancelled tasks; its margin is
informative and does not determine criticality.

## 9. Baseline and health

**Create baseline** snapshots approved planning. Table and Gantt can then
compare it to current dates and display variance. Health uses deadline, current
state, and factual completion date to distinguish no deadline, on track, at
risk, late, completed late, and cancelled. Review data in the shared completion
dialog when completing a task.

## 10. Reuse and transport

- **Duplicate task/tree/project** creates UUIDs and preserves only valid
  internal relations.
- **Templates** reuse trees, durations, priorities, tags, and relations.
- **Export project/workspace** creates a `.chronoproject` package.
- **Create backup** creates a complete recovery SQLite copy.
- **Generate PDF** creates a local, non-importable report.

Restoration replaces the whole workspace; import allows project selection and
copying.

## 11. Essential shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Z` | Undo last compatible operation |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+Shift+L` | Lock/unlock selected task dates |
| `Ctrl+/` | Open shortcut list |
| `Esc` | Close allowed menu/modal or collapse details |

Text fields retain editor-specific undo.

## 12. Safe practices

- retain old and current backups before major upgrades;
- never edit SQLite or migration files manually;
- test restoration before relying on one backup;
- do not share real projects, databases, or logs without sanitising them;
- read [Troubleshooting](troubleshooting.en.md) before removing data.

## Interface language

In the menu bar, open **Language** and choose **Português (Brasil)** or
**English**. Change is immediate and saved only on this computer. It translates
controls, menus, windows, messages, and labels; data you entered, such as task
names and tags, remains unchanged. On first opening without an earlier choice,
Chrono Project uses Portuguese (Brazil) or English according to Windows/WebView2
language; other languages fall back to Portuguese (Brazil) until manual choice.
PDF reports follow the selected language at generation without translating
project-entered data.
