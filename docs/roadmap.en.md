# Roadmap and evolution record

## How to maintain this document

This is the living planning record. Update it when scope, phase status,
delivery, deferral, milestone, or next work changes. Preserve dated historical
entries as factual records; do not rewrite them just to modernise terminology.
Release-scoped work belongs first in `docs/releases/next.md`, then moves to a
dated history entry when delivered.

## Current state

Chrono Project is a Windows local-first application with SQLite, task hierarchy,
FS scheduling, calendars, Table/Kanban/Gantt projections, duplication/templates,
selective portability/backup, signed updater flow, PDF reports, baseline/deadline
controls, critical-path analysis, bilingual interface, and internal Brazilian
holiday catalogue. Current release preparation is v0.3.0; see its PT-BR/English
release notes and next-release draft for the authoritative candidate checklist.

## Phase overview

| Phase | Area | Status |
| --- | --- | --- |
| 0 | Environment | Complete |
| 1 | Foundation | Complete |
| 2 | Core | Complete |
| 3 | Scheduling | Complete |
| 4 | Views | Complete |
| 5 | Reuse | Complete |
| 6 | Portability | Complete |
| 7 | Windows hardening/distribution | Complete, with clean-VM evidence pending |
| 8 | Plan control | Complete |
| 9 | Visual identity/application icon | Complete initial system; iterative review continues |
| 10 | Schedule analysis/explanation | Complete |
| 11 | Hierarchical progress and milestones | Planned |
| 12 | Productivity, view configuration, reversibility | Planned/partly delivered by history increment |
| 13 | Tabular interoperability | Planned |

## Completed phases

### Phase 0 — Environment

Validated Windows toolchain, documented global/local boundaries and exact
versions, created reproducible npm/Rust setup, and established `.local` for
development-only data.

### Phase 1 — Foundation

Created Tauri 2 + React + TypeScript + Vite structure, strict TypeScript,
quality scripts, testing foundation, SQLite migration mechanism, application
shell, and initial documentation/ADRs.

### Phase 2 — Core

Delivered projects, tasks, hierarchy, status/priority/progress, shared workspace
state, SQLite persistence, transaction boundaries, validation, task table, and
project operations.

### Phase 3 — Scheduling

Delivered date-only calendars, working days/exceptions, FS dependencies/lag,
cycle prevention, AUTO/MANUAL policy, cascade propagation, derived summaries,
transactional persistence, and automated/manual audit coverage.

### Phase 4 — Views

Delivered shared filters, hierarchy numbering through five levels, accessible
Table/Kanban/Gantt, SVAR temporal projection, dependency focus, scrolling,
context menus, and common state rather than view copies.

### Phase 5 — Reuse

Delivered task/tree/project duplication and workspace templates with independent
UUIDs, internal-link remapping, transactional integrity, and manual audit.

### Phase 6 — Portability

Delivered `.chronoproject` package inspection/export/import, selective import,
backup/restore, ZIP/hash/schema safety, and user-facing recovery paths.

### Phase 7 — Windows hardening and distribution

Delivered NSIS standard/offline installers, updater signatures, local release
scripts, `main` CI, public governance, Windows integration, versioned artefacts,
and WinGet preparation. Clean Windows VM acceptance and two remote desktop-E2E
runs remain evidence work, not a reason to lower release quality gate.

### Phase 8 — Plan control

Delivered named immutable baselines, planned/current/deviation comparison,
deadline health, history, PDF integration, and persistence without changing the
schedule as a side effect.

### Phase 9 — visual identity

Delivered official mechanical-clock mark, integrated title bar, compact desktop
navigation, Chrono visual tokens, unified Table/Kanban/Gantt surfaces, and
accessibility review. Future visual review is incremental: inventory, pilot with
dense data, shared components, then keyboard/contrast/scale/min-width checks.

## Cross-cutting post-0.2.1 stability and productivity increment

Delivered safe date editing, quick contextual view actions, autosave, explicit
date lock, summaries as predecessors, impact preview, bulk predecessor editing,
unified undo/redo, responsive scrolling, and performance work that defers costly
candidate building until user opens it.

## Phase 10 — schedule analysis and explanation

Delivered optional project critical path, total float/near-critical classification,
final-target margin derived from greatest non-cancelled deadline, table/Gantt
markers and filters, accessible explanation dialog, exact unavailable reasons,
and seeded audit data. Criticality is based on network forecast, not deadline;
deadline defines independent final-target margin.

## Phase 11 — hierarchical progress and milestones

Planned scope: derived parent progress policy, explicitly modelled milestones,
clear calendar/duration behaviour, reporting/Gantt presentation, import/export,
and tests. Before implementation decide weighting policy, whether manual parent
override exists, milestone dependencies/calendar, and completion interaction.

## Phase 12 — productivity, configuration, reversibility

Planned: saved configurable columns/density/sorting, more reversible operations,
bulk editing, view-specific preferences, and keyboard efficiency. Limits: retain
one source of truth, do not turn views into separate task models, maintain
accessibility and performance. Exit requires persisted preferences, undo-safe
changes, validation, and cross-view consistency.

## Phase 13 — tabular interoperability

Planned: safe CSV/XLSX-oriented import/export decision, explicit field mapping,
preview/error reporting, calendar/dependency policy, transactional rollback,
privacy, and tests. Do not introduce spreadsheet semantics as a second source
of truth.

## Explicitly excluded from this roadmap

- remote backend, cloud sync, account, collaboration/realtime;
- cross-project dependency scheduling;
- SS/FF/SF until FS remains stable and a domain ADR approves scope;
- resource levelling without a separate product decision;
- mobile/Linux/macOS packaging without explicit decision;
- automatic web data dependency for core planning/calendar operation.

## Post-MVP phase order and dependencies

1. Preserve current reliability/documentation/release discipline.
2. Complete clean-VM distribution evidence and diagnostic desktop-E2E promotion
   criteria before making it a blocking CI gate.
3. Choose/implement Phase 11 only after explicit progress/milestone decisions.
4. Evolve productivity/view configuration without duplicating state.
5. Consider tabular interoperability only after mapping and transaction design.

## Product references for future phases

Use external products only to understand established planning concepts, not to
copy UI/composition: task outline, baselines, critical path, float, calendars,
and schedule constraints. Chrono design remains own desktop language focused on
precision, time, and readable dense work.

## Git checkpoints

Keep `main` stable and recoverable. Checkpoints: environment/scaffold/quality,
SQLite persistence, core hierarchy, stable FS scheduler, views, reuse,
portability/backup, Windows packaging. Every change for `main` uses thematic
branch, validation, documentation, PR, updated Windows quality gate, squash
merge, branch cleanup, fetch/prune, and fast-forward `main` confirmation.

## Planned decisions

New ADRs are required for important product/architecture decisions, including
progress aggregation/milestones, data interoperability, new dependency types,
remote capability, or changed distribution/security policy.

## Evolution history

The PT-BR source contains the complete dated event log from 26 August through
11 October 2026, including environment/bootstrap, Core, scheduling, view,
reuse, portability, distribution, PDF, baseline, visual-system, predecessor,
critical-path, governance, and WinGet milestones. Each historical entry records
then-current scope, test evidence, residual risks, and release candidate status.
These facts remain immutable; use the PT-BR record for exact dated narrative and
the current release notes/runbook for live operational instructions.

## Permanent tracking rules

- update current-state and phase table whenever delivery materially changes;
- keep candidate release work in `docs/releases/next.md` until publication;
- preserve historical dates/evidence without backfilling assumptions;
- update impacted ADRs, user documentation, runbook, and tests in the same
  change;
- do not call planned work complete merely because code exists: verify tests,
  manual acceptance, documentation, and release-gate evidence.
