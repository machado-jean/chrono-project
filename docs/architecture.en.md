# Initial architecture

## Goal

Architecture separates presentation, domain, and infrastructure so central rules
remain testable without React, DOM, or Tauri.

```text
React/views
    ↓
TypeScript state and use cases
    ↓
pure TypeScript domain
    ↓
repository interfaces
    ↓
Tauri/SQLite/filesystem adapters
```

Dependencies must not point backwards. React is not the source of truth, and
Rust receives no scheduling rules without a concrete native need.

## Responsibilities

- `src/app/`: application composition and navigation;
- `src/components/`: reusable presentation components;
- `src/features/`: Table, Kanban, Gantt, and feature-oriented flows;
- `src/domain/`: calendar, scheduling, planning, duplication, and validation in
  pure TypeScript;
- `src/repositories/`: persistence contracts and adapters;
- `src/state/`: application state without duplicating entities per view;
- `src-tauri/`: shell, SQLite, migrations, logs, and native integrations.

Models, calendar, graph, and scheduler live in `src/domain/`; `useWorkspace`
coordinates use cases, validation, and persistence; `WorkspaceRepository`
defines the boundary; and Tauri adapter calls explicit native commands. UI never
executes SQL or owns core scheduling rules.

Table, Kanban, and Gantt receive the same workspace entities. `TaskKanban`
saves status through the shared `onSave`; `TaskGantt` creates a temporary
projection for SVAR. There are no view-specific tables, repositories, or
persisted copies. Duplication/template domain maps `old_id -> new_id`, rebuilds
tree and internal relationships, validates before writes, and persists each
bundle atomically. Hierarchy numbers are a domain projection, not part of title,
visual code, or schema.

## Persistence

Official Tauri SQL plugin opens SQLite and applies registered migrations. Schema
is version 9: core metadata; calendars/projects/tasks/tags; calendar exceptions
and FS dependencies; templates; baseline/deadline; summary predecessors;
persisted Gantt undo/redo; factual task completion; and critical-path
preference. Migrations are incremental, native-registered, transactional, and
must not be modified after publication.

Debug and `npm run tauri:build:test` share
`chrono-project\.local\data\chronoproject.sqlite`. Distribution without
`shared-dev-data` uses Tauri-resolved `AppConfig`. On the shared-mode first
opening, existing AppConfig database is preserved using `VACUUM INTO`, checked,
and copied to `.local` without overwriting an existing destination. See
[ADR 012](decisions/012-shared-development-database.en.md).

Before SQL plugin, native startup handles only the known migration-3 checksum
variant: it validates integrity/history/schema/structural data, creates a
consistent SQLite backup, and changes only the recorded checksum. Unknown
values fail without writes; see [ADR 011](decisions/011-migration-checksum-compatibility.en.md).

Simple CRUD remains available. `save_calendar` and `apply_schedule_changes`
persist validated domain results, calendars, tasks, dependencies, and deletions
in one transaction. SQLite remains source of truth; React state is in-memory
projection. Controller keeps current snapshots synchronised before accepting a
new interaction, avoiding fast changes calculated from stale graph revisions.

On load, state reconciles automatic chains and summaries once, persists only
real differences transactionally, leaves manual tasks unchanged, and rebuilds
their conflicts for UI. `save_duplication_bundle` atomically saves copied
project/tasks/dependencies; `save_template_bundle` does the same for templates.
Template deletion never alters already applied independent tasks.

Planning functions in `src/domain/planning` compare working days and task health
without altering scheduler. `useWorkspace` creates a snapshot and `save_baseline`
replaces active baseline while preserving history atomically. Table, Gantt, and
PDF consume the same snapshot projection.

`src-tauri/src/portability.rs` owns export, package inspection, selective import,
backup, and restore because they need filesystem, ZIP, hashes, and SQLite
snapshots. UI receives validated catalogues and explicit choices only. Imports
and restores reuse transactional persistence helpers and preserve constraints /
normalised tags. The holiday catalogue is TypeScript domain loaded on demand;
it proposes exceptions while SQLite remains source of truth.

## Scheduler flow

```text
Table edit
    ↓
useWorkspace validates entity, hierarchy, and graph
    ↓
TypeScript scheduler calculates affected subgraph and summaries
    ↓
complete ScheduleChangeSet
    ↓
apply_schedule_changes / SQLite transaction
    ↓
React state receives exactly persisted result
```

Automatic tasks with predecessors anchor on latest FS constraint and may move
forward or backward. Scheduler uses successor effective calendar and keeps
manual-task conflicts informative. Details and test matrix are in
[scheduling](scheduling.md).

## Presentation

- all user interface is localisable to Portuguese (Brazil) and English;
- initial Table uses native accessible HTML controls, avoiding a structural grid
  dependency until measured need;
- projects/tasks use one shared state across Table, Kanban, and Gantt;
- dependencies edit in Table **Predecessors** column;
- start, finish, and duration provide an assisted two-of-three edit;
- calendar/exceptions are configured within project;
- summaries show derived dates and block direct editing;
- domain errors reach users before persistence;
- archived projects remain in database read-only;
- text, status, priority, criticality, assignee, range, and tag filters are
  shared and preserve ancestors as context;
- Kanban uses Pointer Events and retains keyboard-operable selector;
- Gantt lazily loads; bar/dependency gestures are intercepted and converted to
  Chrono domain commands, never renderer state source;
- Gantt converts inclusive end to renderer-exclusive boundary and can focus long
  relations; desktop starts maximised with minimum restore dimensions.

Reusable presentation primitives provide accessibility: `ModalDialog` owns
initial focus, Tab trapping, Escape closing, and focus restoration;
`WorkspaceMenuBar` applies predictable top-menu closing. Neither accesses
domain, repositories, or persistence. See [UX audit](ux-accessibility.md).

## PDF reports

`src/domain/reporting/` creates immutable testable projection from Project,
Task, and TaskDependency. `src/features/reporting/` owns options and feedback.
pdfmake is lazy-imported, builds bytes in WebView2, and repository passes them
to Rust command that validates size/envelope, opens native picker, and writes
file. Composition does not query database or create another source of truth;
see [PDF reports](pdf-reports.en.md) and [ADR 021](decisions/021-local-pdf-reports.en.md).

## Security and local operation

- CSP blocks remote origins by default; apart from local IPC/assets, only
  `https://api.github.com` is permitted for manual update checking;
- capabilities enable updater/process plugins, core defaults, standard SQL
  read/load, logging, and only the two permanent Chrono installer links;
- no remote backend, telemetry, account, or synchronisation;
- no remote query on start; **Help > Check for updates** acts only on user
  request and sends no workspace data; native plugin verifies signed `latest.json`
  and installs NSIS passively;
- logs use LocalAppData at `Info` maximum;
- development databases/backups are `.local`, outside Git; installed builds do
  not depend on it;
- external packages are constrained by size, confined paths, SHA-256, quick
  check, foreign keys, schema, catalogues, and graph validation before any
  transaction; automatic backup precedes import/restore.

## Layered E2E validation

Mandatory `npm run test:e2e` combines two boundaries: React journey covers
creation, hierarchy, A → B → C propagation, views, duplication, and semantic
round-trip over controlled in-memory repository; Rust tests exercise real
SQLite, migrations, transactions, and export/import packages. Thus CI validates
complete behaviour without global Windows automation.

An additional CDP harness drives a real Tauri window. Cargo `e2e` feature
isolates database/backups/logs under `.local/e2e/` and permits deterministic
dialog targets only in that build. Each run uses UUID directory, dynamic port,
and its own WebView2 profile. It passed locally outside sandbox on 8 September
2026 but remains diagnostic until VM/CI criteria are met; see
[ADR 019](decisions/019-webview2-cdp-e2e.en.md).

## Quality

- strict TypeScript, including optional-field/indexed-access checks;
- type-aware ESLint with React Hooks rules;
- Vitest + Testing Library for TypeScript domain/UI;
- minimum React/domain E2E plus real Rust SQLite/portability tests;
- Playwright Core/CDP only for real WebView2 window diagnosis;
- Clippy treats warnings as errors;
- CI runs only `windows-latest`, with no Linux/macOS jobs.
