# WebView2 validation guidelines on Windows

## Execution of 8 September 2026

Implemented: `.local/e2e/runs/<UUID>/`, exclusive WebView2 profile per launch,
dynamic port, per-run database/backups/logs, normal close with fallback limited
to test process, and verification of WebView2 processes associated with profile.
Run artefacts are retained.

Five consecutive launches and the real desktop journey passed outside sandbox.
Comparison covers full workspace after import/reopen except timestamps on the
two internal calendars recreated by migrations. Lint, typecheck, 122 regular
tests, 30 Rust tests, layered journey, two performance tests, frontend/desktop
E2E build, and Clippy passed.

Sandbox had CDP timeout. Outside it, window worked; this does not retroactively
prove one cause for the previously reported HRESULT.

`desktop-e2e.yml` is manual and collects evidence. Two remote runs and VM
validation remain pending. Windows permission denied Hyper-V query even outside
sandbox. There is no claim of completed VM audit or universal WebView2 failure
fix. The rules below remain promotion criteria.

This document defines validation for WebView2 used by Chrono Project and safe
evolution of Tauri-window E2E without risking real data, user environment, or
release gate. Objective is not testing Microsoft Edge; it is proving the local
Tauri application starts, renders local UI, communicates with native layer, and
closes without blocking next run.

## Current decision

Chrono Project continues with **WebView2 Evergreen**:

- Microsoft recommends it for most applications;
- Windows 11 normally includes and maintains it;
- it receives security, compatibility, and performance fixes automatically;
- it avoids bundling/maintaining a fixed browser copy per installation.

Standard installer uses bootstrapper and offline variant embeds offline runtime
installer. Do not adopt Fixed Version as automation-failure remedy: it enlarges
package and transfers runtime-update responsibility to Chrono Project.

## Mandatory desktop-E2E principles

Before promoting `npm run test:e2e:desktop` to required gate, harness must:

1. create exclusive WebView2 data directory per run under `.local/e2e/webview/<run-id>/`;
2. use exclusive database, logs, backups, imports, exports;
3. dynamically choose a free CDP port, never assuming `9222`;
4. never open/change real installation database or WebView2 directory;
5. record PID, runtime version, isolated directory, port, and phase timing
   without personal data;
6. close Tauri and wait for child WebView2 processes;
7. remove temporary artefacts only after confirmed close;
8. preserve logs/evidence on failure;
9. run serially on same host until concurrent isolation is proven;
10. fail with explicit diagnosis, never downgrade/change WebView2 globally.

Every attempt needs unpredictable individual identifier. Reusing User Data Folder
can create contention, process interference, and previous-run-dependent output.

## Test matrix

### 1. Host preconditions

- Record Windows edition/build and installed WebView2 Runtime version.
- Confirm no test `chrono-project.exe` runs, chosen port is free, E2E paths lie
  inside `.local/e2e/`, and production database / `.local/data/chronoproject.sqlite`
  are not used by isolated scenario.

Expected: test starts only after proving isolation and does not change global
tools.

### 2. Repeated window startup

Launch and controlled-close at least five times on same host. Each time window
must be responsive, UI must come from local bundle not localhost, CDP endpoint
available before deadline, close normally, associated WebView2 processes end,
and next repetition use new ID/folder/port.

Expected: five consecutive approvals with no `0x800700AA`, locked files, or
orphan processes.

### 3. Real E2E journey

In Tauri window: create project/tasks/subtask; create FS A→B→C; change A and
confirm B/C propagation; switch Table/Kanban/Gantt; duplicate tree and inspect
new UUIDs/internal links; export workspace; start another isolated workspace;
import package; semantically compare; close/reopen to verify persistence.

Expected: UI, IPC, SQLite, filesystem participate in one journey without native
layer mocks.

### 4. Concurrency and recovery

- Second execution targeting same E2E directory must be blocked or controlled,
  never corrupt.
- Two executions with different directories/ports must not interfere when
  parallel support is enabled.
- Forced interruption means next run uses new directory and starts normally.
- Cleanup tolerates slow process exit with bounded wait/diagnosis; never force
  deletes files still in use.

### 5. Distribution/end-user operation

On clean Windows 11 VM independently validate standard install online,
offline install disconnected, already-installed runtime, update preserving
database/preferences, offline restart, and uninstall/reinstall data policy.
Record installer/runtime versions, artefact hash, result, data location; do not
include personal database in evidence.

## Failure diagnosis

On window creation failure: preserve run stdout/stderr/logs; record HRESULT and
exact phase; inspect reused folder/port/executable; inspect remaining Chrono /
WebView2 processes; retry with new directory/port without changing global
runtime; compare with layered `npm run test:e2e`; consult official/upstream
issues before dependency update; do not promote intermittent unexplained test.

`HRESULT 0x800700AA` means requested resource was in use. Alone it proves
neither Chrono functional defect nor WebView2 unsuitability; diagnosis must show
reused resource or corresponding upstream regression.

## Promotion criteria for desktop E2E CI

All are required:

- five successful consecutive local runs;
- successful clean Windows 11 VM run;
- two successful consecutive Windows GitHub Actions runs;
- full real UI/IPC/SQLite journey;
- zero user-data access;
- no orphan processes;
- useful timeout/HRESULT logs;
- no known blocking dependency vulnerability;
- gate-compatible time;
- updated document and ADR 019.

Until then, layered `npm run test:e2e` remains required and
`npm run test:e2e:desktop` remains diagnostic.

## Remaining promotion route

Run ID, User Data Folder, exclusive CDP port, controlled close, five repetitions,
and evidence retention are implemented and locally approved. Remaining: repeat
matrix on clean VM; obtain two consecutive manual `desktop-e2e.yml` approvals;
compare timing/residual processes/evidence across surfaces; update this document
and ADR 019; only then decide whether desktop E2E blocks releases.

## Official references

- [Microsoft — distribution](https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution)
- [Microsoft — Evergreen vs Fixed](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/evergreen-vs-fixed-version)
- [Microsoft — User Data Folder](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/user-data-folder)
- [Microsoft — performance practices](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/performance)
- [Tauri — Windows installer](https://v2.tauri.app/distribute/windows-installer/)
- [Tauri — WebDriver](https://v2.tauri.app/develop/tests/webdriver/)
- [Upstream WebView2 regression](https://github.com/webdriverio/desktop-mobile/issues/542)
