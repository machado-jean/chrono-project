# Scheduling

This document describes Phase 3 behaviour. Rules live in pure TypeScript under
`src/domain/calendars/` and `src/domain/scheduling/`, without React, DOM, Tauri,
or SQLite.

## Dates, duration, and editing

- schedule dates are `date-only` `YYYY-MM-DD` strings;
- calculations use UTC only internally to avoid timezone shifts;
- duration is inclusive: duration `1` means same start and finish date;
- entering start and duration calculates finish; entering start and finish
  calculates duration;
- changing start of an already scheduled task preserves duration and recalculates
  finish; changing finish recalculates duration;
- a non-working date entered on `MANUAL` task is preserved with informational
  warning.

Unscheduled tasks retain null start, finish, and duration. Persistence requires
all three fields filled or all empty.

## Working calendar

Every calendar defines working weekdays Monday (`1`) through Sunday (`7`),
holidays/blocked dates, and positive exceptions that permit normally inactive
dates. Default is Monday–Friday. Migration `0003_scheduling.sql` also creates
the **Every day** built-in calendar, Monday–Sunday, for work that must proceed
over weekends.

A task inherits project calendar unless it selects another `calendar_id`. UI
edits project week/exceptions and selects **Every day** in task details.
Calendars are shared: changing working days or exceptions affects every project
and task that references one, and UI reports that scope before editing.

Pure functions:

```text
isWorkingDay()
onOrNextWorkingDay()
nextWorkingDay()
addWorkingDays()
workingDaysBetween()
endDateForDuration()
```

Saving calendar change recalculates directly affected `AUTO` tasks, propagates
successors, and persists calendar/tasks in the same transaction. `MANUAL` tasks
do not move.

## Finish-to-Start dependency

Current V1 accepts only Finish-to-Start (`FS`), displayed as **Finish to Start
(FS)**. For each predecessor:

```text
successor minimum start =
  add_working_days(successor effective calendar, predecessor finish, lag)
```

- predecessor ends Friday, lag `0`: successor can start Friday;
- predecessor ends Friday, Monday–Friday calendar, lag `1`: successor starts
  Monday;
- predecessor ends Friday, **Every day**, lag `1`: successor starts Saturday;
- with multiple predecessors, latest minimum date wins;
- lag is non-negative integer: `0` permits same finish day; `1` uses next
  working day.

Dependencies require same project, leaf successor, leaf or summary predecessor,
no self-link, duplicate link, or cycle. On first child, a leaf becomes summary:
outgoing relations may stay on new summary, transfer to child, or be removed;
incoming links cannot remain because a summary cannot be successor. Domain and
SQLite enforce the same policy. Cross-project dependencies are out of scope.

## Propagation and modes

Calculation validates graph, topologically orders it, and works only affected
successor subgraph.

For `AUTO` task:

1. calculate latest constraint;
2. align start, forward or backward as necessary;
3. preserve duration;
4. calculate finish using successor effective calendar;
5. propagate in cascade.

An `AUTO` task with predecessor is graph-controlled. Represent intentional gaps
as lag; choose `MANUAL` to preserve a directly chosen date. Removing a relation
recalculates from remaining predecessors. Removing last relation retains current
date because no temporal anchor indicates how far to bring it earlier.

For `MANUAL` task, scheduler never moves dates; its closed lock blocks Gantt
drag/resize but exact Table/inspector fields remain editable. If a predecessor
requires a later start, UI shows informational conflict and minimum date.
Overlapping unrelated tasks create no conflict. An unscheduled `AUTO` task with
predecessor receives constraint start/finish and one-day initial duration;
existing scheduled task retains duration.

## Summary tasks

A task with descendants has derived schedule:

```text
start = earliest scheduled descendant start
finish = latest scheduled descendant finish
```

Duration is inclusive working-day count under summary calendar. Summary start,
finish, duration, mode, calendar, and incoming links are locked. A summary may
be predecessor of leaf. Ordering combines hierarchy and FS edges so summary
recalculates before propagating its finish.

## Transaction

Domain calculates a complete valid result before the use case sends
`ScheduleChangeSet` to native `apply_schedule_changes`. One SQLite transaction
writes calendar changes, deleted trees/dependencies, created/edited dependencies,
all recalculated tasks including summaries, and affected tags.

Table task fields and lag changes are drafts of one row. Autosave combines them
in same change set: selectors/completed dates confirm immediately; text, numbers,
and lag debounce 700 ms and save on blur. Pending draft/failure exposes **Save**
for confirmation/retry. Any failure cancels whole set; Rust test proves earlier
valid change rolls back when second is invalid. Workspace opening applies same
reconciliation to pre-Phase-3 automatic chains/summaries, persists differences
only, and rebuilds `MANUAL` warnings.

## Automated audit matrix

Tests cover A→B zero lag/duration, A→B→C propagation, multiple predecessors,
positive lag, Friday/Monday, holiday/positive exception, AUTO advancement and
backward movement, remaining/last removed predecessor, MANUAL conflicts, cycles,
self/duplicates, same-project/leaves/summaries, summary derivation, multiple
result/transaction rollback, explicit non-working dates, weekend calendar, and
independent-identity copied graphs. Primary tests are
`tests/unit/domain/scheduling.test.ts`, calendar/UI tests, and SQLite
constraints.

## Manual audit scenario

With application closed, `npm run dev:seed-advanced-audit` creates/recreates
**Audit — advanced planning** in local database. Back up relevant existing data;
database is not versioned. Dataset has 21 tasks, six FS links, five hierarchy
levels, four assignees, unassigned tasks, and one successor with four
predecessors.

| Task | Main relation | Expected result |
| --- | --- | --- |
| Critical cable launch | fifth-level leaf | numbering, hierarchy, critical branch |
| Integrated release | four predecessors, one lag 1 | transactional batch inclusion/management |
| Release after summary | Electromechanical package predecessor | summary source and leaf successor |
| Released documentation | licences/authorisations, lag 1 | positive-lag propagation |
| Near-critical verification | short-float independent branch | near-critical indicator/filter |
| Task with float | independent branch | larger float/no critical highlight |
| Locked manual task | `MANUAL` | preserves dates, reports provoked conflict |

Restart preserves tasks, links, assignees, critical-path preference, and manual
mode. To audit both directions, move an **Integrated release** predecessor then
restore it: `AUTO` successors/summaries return to recalculated FS constraints,
preserving duration/lag; manual task never moves, only warns on violated test
relation.

## Direct Gantt editing

Gantt is command surface, never a second schedule source:

- timeline includes seven days before earliest start and one month after project
  latest finish;
- executable task without predecessor can move and resize both edges;
- moving preserves working duration; resizing recalculates duration from
  effective calendar; prohibited drops normalise start to next permitted day;
- predecessor task left edge remains protected; moving whole bar adjusts FS lag
  in working days;
- later AUTO movement increases only controlling relation enough; earlier move
  reduces each still-limiting lag, never below zero; a zero-lag violation stops
  at first valid FS date with explanation;
- extending finish propagates AUTO successors forward; reducing it brings them
  earlier where FS permits;
- closed-lock `MANUAL` task receives conflict and accepts neither drag nor resize;
  summary never accepts direct temporal editing;
- internal bar marker changes completion 0–100% without temporal recalculation;
- task right click adds only valid executable predecessors as zero-lag FS; row
  menu deletes relation; native WebView2 menu is suppressed;
- Table/Kanban/Gantt saved edits share `Ctrl+Z`/`Ctrl+Shift+Z` history and one
  transaction restores exact calculated cascade;
- Table batch creates many FS links for one successor; preview schedules full
  set and confirmation persists links/dates once. Undo removes whole batch and
  redo restores it. Two or more predecessors can receive common lag or be
  removed transactionally as one reversible operation.

## Critical path and total float

Critical path is pure analysis and never changes dates. When enabled, it
considers scheduled leaf tasks, FS links, and each effective calendar. Backward
pass starts at **network forecast finish** and calculates total float in working
days. Zero float is critical; one to two working days is near critical.

Disconnected networks compare to same forecast finish, so earlier chain gets
float. Separately, **project final target** is greatest deadline among
non-cancelled tasks. Forecast-minus-target is positive, zero, or negative global
margin and does not alter task criticality. Summaries display smallest leaf float
only for presentation. Cancelled/incompletely scheduled tasks are excluded. With
no FS relation among scheduled tasks, UI explains insufficient network rather
than showing misleading result.

Table shows title marker. Gantt uses reinforced solid red critical outline and
dashed mineral-violet near-critical outline, with textual legend of float bands.
Shared filter offers **Critical path** and **Near critical**. Unit coverage is
`tests/unit/domain/critical-path.test.ts`. Explanation dialog distinguishes
forecast finish, final target, global margin, and exact unavailable reason
(missing dates, scheduled dependency, or used calendar).

Every final gesture goes through validation, scheduler, and transactional
persistence. Failure rebuilds projection from persisted state; renderer-only
events such as summary-bar redraw are not user edits.

## Out of scope

- SS, FF, and SF dependencies;
- cross-project dependencies;
- inferred earlier date after removing last predecessor;
- resource levelling;
- moving complete summary-task trees.

## Official holiday import

Calendar editor previews Brazilian holidays offline for years in project dates.
Choose national scope only or a state; `public` holidays are selected, banking
holidays/optional observances require explicit selection. Existing date
exceptions are blocked and never overwritten. Municipal holidays remain manual
because national coverage is not uniform. Internal catalogue calculates national,
state, and movable rules locally with no internet or third-party runtime data.
