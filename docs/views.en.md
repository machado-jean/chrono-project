# Views and filters

Table, Kanban, and Gantt are projections of the same `Task` array maintained by
`useWorkspace`. Changing view neither loads another project copy nor creates
view-specific persistent entities.

## Shared filters

Filters are controlled by main composition and remain active while switching
among all three views. The same state lets PDF export respect exactly visible
tasks. Minimum set covers:

- title, code, description, assignee, tags, and notes text;
- status and priority;
- one or more assignees, including unassigned tasks;
- critical-path or near-critical tasks with up to two working days total float;
- overlap with a date range;
- tag.

When a child matches, its ancestors appear as context in Table and Gantt.
Counter reports actual matches, excluding context-only ancestors.

## Hierarchical numbering

Table, Kanban, and Gantt derive numbering from tree position:

```text
1. Parent task
1.1. Child task
1.1.1. Third level
1.1.1.1. Fourth level
1.1.1.1.1. Fifth level
2. Next parent task
```

It is not stored in title, visual code, or SQLite. It recalculates after
reordering or hierarchy movement. If old title begins with same number, UI
displays it only once without silently changing persisted content.

V1 permits five levels including root. UI stops offering a fifth-level task as
parent and domain/templates/import repeat validation. When a task participating
in FS receives its first subtask, UI requires a choice: retain outgoing links on
new summary, transfer them to new leaf, or remove them. Retain is possible only
when task is not a dependency receiver, because summaries cannot be successors.
The decision preserves UUIDs/lag in one transaction. Further children preserve
existing summary outgoing links.

## Table

Compact `+` opens a searchable selector by number or title in hierarchy order,
identifies summaries, and supports multi-selection. Existing relations are
separate and invalid candidates are omitted. One synchronised horizontal bar
remains visible at the Table panel base; native competing container bar is
hidden while touchpad horizontal gestures and Shift+wheel keep working.

Expanding a task only reveals rows; it does not write or reschedule. In large
projects, full predecessor-candidate validation and impact preview are prepared
only after **Add…** opens. Row details build hierarchy options only when asked.

Right click anywhere in a row exposes details, subtask, predecessor, date lock,
duplicate, template, and delete. Text fields use Chrono light context menu with
Cut/Copy/Paste/Select all first. The **More actions** button is keyboard
equivalent. Clipboard failure becomes a textual alert and Escape restores focus.

Row lock represents date policy: open is `AUTO`, closed is `MANUAL`. Same action
exists in details/context menu. Lock prevents scheduler/Gantt gesture movement,
not exact date-field editing. Summaries show derived mode/dates and do not expose
the toggle. Multi-selected leaves can lock/unlock in one transaction;
`Ctrl+Shift+L` does the same outside editable fields.

Adding/removing predecessors first previews changed dates then confirms a batch;
relationships and scheduler cascade persist in one transaction. **Manage** on
two or more predecessors selects multiple relationships, applies common lag, or
removes them transactionally, yielding one undo history entry.

### Table autosave

Selectors and complete dates persist as confirmed. Text/numeric fields debounce
700 ms and save on blur. View switch captures the last valid draft before row
unmount; navigation is not blocked by write.

Each task has its own save queue. A later edit queues behind in-flight save and
only latest revision clears local state. Row reports changed, saving, saved, or
save error; content remains visible on failure and **Save** retries manually.
Invalid drafts are never silently autosaved.

## Kanban

Five initial columns represent domain statuses. A card changes status by Pointer
Events drag or **Status** selector. Both call Table’s `onSave`, so change is
validated, persisted, and immediately reflected everywhere.

Cards show hierarchy path, priority, dates, progress, predecessors, assignee,
and tags when available. Summary remains the same derived `Task`. Right click
or **More actions** exposes status, duplicate, and delete; menu shares Table
pattern, closes with Escape, and the selector remains permanent alternative.

## Gantt

Gantt uses SVAR React Gantt 2.7.1 under [ADR 013](decisions/013-svar-react-gantt.en.md).
Wheel over any graph area scrolls activities vertically. A native persistent
horizontal timeline bar stays visible at its base, synchronised with graph and
equivalent to Table, without moving inspector.

Graph height measures real space below Gantt: it uses free area in tall windows
and shrinks with project header/smaller windows without hiding horizontal bar.
Internal visual updates are grouped per animation frame, avoiding repeated
measurement and colour application for intermediate mutations. Predecessor menu
builds candidates only on request.

Table follows same structure: data strip plus horizontal-bar strip inside a
measured-height panel, retaining column titles and bar at useful-area bottom.
Height transitions are brief/discrete and disabled by reduced-motion preference.

Compact header keeps scale, history, short legend, and **Options** in one strip.
Options reveals scrolling guidance and dependency focus only when needed. Table,
Kanban, and Gantt have independent scrollable areas: Table column headers,
Kanban status headings, and Gantt headings stay visible while tasks scroll.
Project header scrolls away initially; filter bar becomes fixed below app menu,
preserving essential context on small screens.

### Scroll regression

Before release, shrink window and verify: (1) Gantt horizontal bar appears below
timeline; (2) page scrolling hides project header but leaves filters fixed below
menu; (3) with fixed filters, Table/Kanban/Gantt still scroll tasks; (4) Table
column headings stay immediately below filters. Repeat with header visible and
after initial scroll; Gantt must use available area in both. Repeat Table for
smooth transition, fixed headings, and visible horizontal bar.

A thin vertical bar has its own column between graph and inspector. Its track
does not cover tasks/dependencies, has enlarged target, starts at zero and ends
at final list row; scroll height derives from all projected tasks.

Transient projection contains open hierarchy/summaries, inclusive civil range,
working duration, progress, FS/lag links, day/week/month scales, weekend and
holiday highlighting, graph/accessible-selector selection, dependency focus,
and baseline behind current bars.

Chrono dates are inclusive; projection converts finish to next civil day because
renderer expects exclusive end. Friday-to-Monday task therefore covers those
four civil days while duration remains domain working-day count. Truncated first
column titles reveal full text on hover. Bars support five levels; critical tasks
have solid outline and near-critical tasks dashed outline, so state is not only
colour.

By default every relation appears. Selecting a line or **Focused dependency**
highlights it with predecessor/successor; others remain visible but subdued and
selectable. **All dependencies** removes emphasis.

Renderer gestures are intercepted by domain: move adjusts dates/FS lag, right
edge alters duration, marker alters completion. Context menu locks dates and
creates/deletes FS. Summary can be source, never destination. Manual task blocks
move/resize with explanation; summary retains derived dates. **Inspect task**
edits safe status/start/duration, explains summary derivation, and shares the
completion-confirmation dialog with Table/Kanban. Reopening requests progress
and clears factual completion date. Open-child summary cannot complete.

All views share one per-project session history of up to 50 edits. `Ctrl+Z` and
`Ctrl+Shift+Z`, Gantt buttons, and **Edit** menu share stack. A history item
atomically restores edited task, recalculated successors, affected summaries,
and lags. Predecessor batch changes, duplication, deletion, and reordering are
single operations; new edit after undo clears redo. Text editors retain native
undo. Simple task creation/import are not yet in history; history clears on
workspace reopen/reload.

## Baseline control

**Create baseline** records named approved-planning snapshot. It compares future
changes only and never alters current tasks. **Update baseline** requires
confirmation, retaining earlier history. History panel can delete plan/revisions
with confirmation while current tasks remain. With active baseline, Table adds
planned start/finish/deviation in effective-task working days; columns vanish
without baseline. Deadline is edited independently and health is informative;
it never moves tasks.

Manual Phase 8 audit: create baseline; alter task and inspect working-day
deviation; set deadline before current finish for **At risk**, past deadline for
open **Late**; update, inspect history, delete/recreate baseline; restart to
confirm persistence; generate PDF with baseline comparison.

## Workspace and contextual help

Project sidebar collapses with **Collapse projects** and restores via **Show
projects** without leaving project. Table editable headings have accessible info
tooltips. **Task** and **Predecessors** columns resize with persisted local
preferences; arrows adjust keyboard width and double click restores defaults.
Priority, Progress, Duration, Deadline reserve full title/info space. Project
right click archives/restores/deletes and exports `.chronoproject`; **File >
Import package** restores it. Top **Project** menu remains keyboard alternative.

## Non-blocking future improvements

- **Today** action and automatic project fitting in Gantt;
- direct navigation between focused-dependency endpoints;
- optional compact Kanban density;
- milestones need separate domain decision; critical path always uses Chrono
  calculation, never an implicit Gantt-library behaviour.
