# Data model

## Current version

The current schema is version **9**.

| Migration | Contents |
| --- | --- |
| `0001_initial.sql` | `app_metadata` and `schema_version = 1` |
| `0002_core.sql` | calendars, projects, tasks and tags; version 2 |
| `0003_scheduling.sql` | exceptions, per-task calendar and FS dependencies; version 3 |
| `0004_reuse.sql` | templates, items, tags and internal dependencies; version 4 |
| `0005_plan_control.sql` | deadline, baselines and task snapshots; version 5 |
| `0006_summary_predecessors.sql` | summary as predecessor and new integrity triggers; version 6 |
| `0007_persistent_gantt_history.sql` | persisted Gantt undo/redo stacks per project; version 7 |
| `0008_task_completion.sql` | factual completion date, normalisation and task-completion index; version 8 |
| `0009_project_critical_path.sql` | persisted critical-path preference; version 9 |

Tables use `STRICT` mode and foreign keys are enabled on every connection.
Migrations are incremental and must not be modified after publication.

## Project target

`projects.critical_path_enabled` controls whether analysis is displayed. The
target is derived in memory as the greatest `deadline_date` among non-cancelled
tasks; there is no competing second manual date. Existing projects migrate with
analysis disabled. The preference follows project duplication, export, import,
and backup. The target does not determine criticality: it is compared with the
forecast finish only to produce the project's overall margin.

There is no manual project-target column, avoiding two competing sources of
truth.

## Calendar

`calendars` stores identity, name, default flag, and timestamps.
`calendar_working_days` normalises working days as numbers 1–7, Monday through
Sunday. `calendar_exceptions` adds UUID, calendar, one `YYYY-MM-DD` date per
calendar, working/non-working flag, optional name, and timestamps.

The default calendar contains Monday through Friday. Migration 3 seeds the
built-in **Every day** calendar with all seven working days.

## Project

`projects` has an immutable UUID, name, optional description, status, calendar,
position, archive flag, and timestamps.

| Stored code | Interface label |
| --- | --- |
| `ACTIVE` | Active |
| `ON_HOLD` | On hold |
| `COMPLETED` | Completed |
| `CANCELLED` | Cancelled |

## Task

`tasks` has immutable UUID, optional code, project, parent task, optional
calendar, title, description, status, priority, progress, dates, duration,
optional deadline, factual completion date, scheduling mode, position,
assignee, notes, and timestamps.

`deadline_date` is a `YYYY-MM-DD` date independent of computed finish. It
classifies task health but neither moves the schedule nor participates in FS
constraints. `completed_date` records when the activity was actually completed;
it is required only for `COMPLETED`, determines timely completion, and is
removed when the task is reopened. A null `calendar_id` inherits
`projects.calendar_id`; a UUID selects a task-specific calendar.

Main invariants:

- integer progress from 0 to 100;
- `COMPLETED` requires progress 100 and `completed_date`; other statuses cannot
  retain completion date;
- completion cannot precede recorded start;
- scheduling mode is `AUTO` or `MANUAL`;
- schedule is completely empty or has start, finish, and duration together;
- dates use `YYYY-MM-DD`, duration is integer at least 1, and finish is not
  before start;
- parent and child belong to the same project, with no self-parenting or
  hierarchy cycles;
- hierarchy has at most five levels including root; deleting a task removes its
  whole tree transactionally.

Tags remain normalised in `tags` and `task_tags`, rather than duplicated JSON
inside `tasks`. Displayed hierarchy numbering (`1.`, `1.1.`, etc.) is derived
from `parent_id` and `position`; it is not stored and is recalculated when the
tree changes. Selection, zoom, filters, and focused dependency are ephemeral
view state, not persisted business data.

## Dependency

`task_dependencies` is an independent entity with UUID, `project_id`,
`predecessor_id`, `successor_id`, `dependency_type` (restricted to `FS`),
non-negative integer `lag_days`, and timestamps.

Integrity in depth:

- composite foreign keys `(project_id, task_id)` prevent cross-project links;
- a `CHECK` prevents self-dependency and a unique index prevents duplicate
  links;
- triggers permit a summary as predecessor but prohibit it as successor and
  prevent converting a dependency receiver into a summary;
- TypeScript domain rejects missing, duplicate, and cyclic links before writes;
- task/project deletion clears links by cascade.

## Templates

Templates belong to the workspace and remain in the same SQLite database; they
are not hidden projects. `task_templates` stores identity, name, description,
and timestamps; `task_template_items` stores tree, duration, priority, initial
status, and position; `task_template_tags` normalises tag association; and
`task_template_dependencies` stores FS/lag links, with a leaf successor and
leaf or summary predecessor.

The database enforces independent UUIDs, parent within template, no
self-dependency, and unique relations. The TypeScript domain additionally
validates a single root, acyclic hierarchy, leaves with duration, acyclic FS
graph, and strictly internal dependencies.

## Baselines

`project_baselines` stores named project snapshots. Only one baseline can be
active per project; creating another sets `replaced_at` on the previous one,
which remains available in history. `baseline_tasks` immutably preserves task
identity, title, hierarchy number, start, finish, duration, and progress at
snapshot time. It deliberately does not cascade from current task so history
remains readable after deletion. Ordinary edits never alter a snapshot.

Deleting a project's baseline removes every revision and snapshot by cascade in
one operation, without changing projects, tasks, or current schedule.

## Gantt edit history

`gantt_history_state` keeps, per project, JSON undo/redo stacks for temporal
Gantt edits. Its foreign key cascades on project deletion. Each stack is
validated at the native boundary, capped at 50 latest revisions and 1 MiB total
payload. It assists local editing; it does not replace tasks, dependencies, or
baselines as business data and is not a multi-user audit trail.

## Integrity and evolution

- `projects.calendar_id` and `tasks.calendar_id` use `ON DELETE RESTRICT`;
- calendar and exceptions use controlled cascade;
- indexes support calendar, hierarchy, ordering, filters, and predecessor /
  successor traversal;
- fresh databases, the migration sequence, and upgrades preserving data through
  version 9 are tested;
- the only known migration-3 checksum variant receives conservative repair
  before opening: schema and integrity are checked, a SQLite copy is created,
  and only `_sqlx_migrations.checksum` is updated;
- unknown checksum or schema stops repair without touching business data;
- persistence of calendars, exceptions, overrides, dependencies, recalculation,
  templates, atomic duplication, and rollback are tested;
- any `ScheduleChangeSet` failure rolls back the whole transaction;
- import/export was delivered in Phase 6 with validation and transactions.

When changing schema, update `schemaVersion`, create a new migration, test a
fresh database and upgrade, and review impact on `.chronoproject` packages.
Checksum repair does not modify schema or replace a migration. Its restricted
contract and backup location are documented by
[ADR 011](decisions/011-migration-checksum-compatibility.en.md).
