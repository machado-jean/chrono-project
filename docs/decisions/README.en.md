# Architecture decision index

Architecture Decision Records (ADRs) preserve relevant context, decisions, and
consequences. They are not disposable documentation: when a decision changes,
record its replacement or create a new ADR without erasing history.

## How to create one

1. Copy [`template.en.md`](template.en.md).
2. Use the next three-digit number and a short kebab-case name.
3. Complete status, context, decision, consequences, and validation.
4. Record impacts on data, compatibility, and migration.
5. Add the ADR to this index and [`docs/README.md`](../README.md).

## Catalogue

| ADR | Topic | Current status |
| --- | --- | --- |
| [001](001-tauri.en.md) | Tauri 2 | Accepted |
| [002](002-sqlite.en.md) | Local SQLite | Accepted |
| [003](003-typescript-domain.en.md) | TypeScript domain | Accepted |
| [004](004-date-only.en.md) | Date-only dates | Accepted |
| [005](005-local-first.en.md) | Local-first architecture | Accepted |
| [006](006-no-sync-v1.en.md) | No sync in V1 | Accepted |
| [007](007-portuguese-interface.en.md) | Portuguese interface | Partially superseded by ADR 032 |
| [008](008-configurable-working-week.en.md) | Configurable working week | Accepted |
| [009](009-fs-scheduling-policy.en.md) | Reactive FS policy | Accepted/revised |
| [010](010-task-calendar-override.en.md) | Per-task calendar | Accepted |
| [011](011-migration-checksum-compatibility.en.md) | Checksum compatibility | Accepted |
| [012](012-shared-development-database.en.md) | Shared development database | Accepted |
| [013](013-svar-react-gantt.en.md) | Gantt renderer | Accepted |
| [014](014-workspace-task-templates.en.md) | Workspace templates | Accepted |
| [015](015-selective-portability.en.md) | Selective portability | Accepted |
| [016](016-offline-holiday-catalog.en.md) | Offline holidays | Superseded by ADR 033 |
| [017](017-windows-distribution.en.md) | Windows distribution | Accepted |
| [018](018-manual-update-check.en.md) | Manual update check | Partially superseded by ADR 020 |
| [019](019-webview2-cdp-e2e.en.md) | E2E and WebView2 diagnostics | Reassessed; diagnostic non-blocking |
| [020](020-signed-passive-updater.en.md) | Signed updater | Implemented |
| [021](021-local-pdf-reports.en.md) | Local PDF reports | Accepted |
| [022](022-baselines-deadlines.en.md) | Baseline, deadline, and health | Accepted |
| [023](023-chrono-project-name.en.md) | Chrono Project name | Accepted |
| [024](024-mechanical-clock-icon.en.md) | Mechanical-clock symbol | Accepted |
| [025](025-summary-predecessors.en.md) | Summary as predecessor | Accepted |
| [026](026-persistent-gantt-history.en.md) | Gantt history | Accepted |
| [027](027-simplified-application-identifier.en.md) | Simplified identifier | Implemented since 0.2.3 |
| [028](028-task-completion.en.md) | Factual completion | Implemented since 0.2.3 |
| [029](029-critical-path.en.md) | Critical path and margin | Accepted |
| [030](030-mit-license.en.md) | MIT licence | Implemented |
| [031](031-winget-distribution.en.md) | WinGet distribution | Implemented; submission under review |
| [032](032-interface-localization.en.md) | Interface localisation | Accepted |
| [033](033-internal-brazilian-holiday-catalog.en.md) | Internal Brazilian holiday catalog | Accepted |

The next available number is **034**.
