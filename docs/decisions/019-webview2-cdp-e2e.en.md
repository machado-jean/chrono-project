# ADR 019 — Layered E2E and Tauri-window diagnostics

## Status

Reassessed on 2026-09-08: isolation was implemented and the desktop journey
passed locally outside the sandbox. The layered-gate decision remains until VM
and CI validation. The historical diagnostic below does not establish a final
cause. Evidence is in [webview2-testing.md](../webview2-testing.md).

Accepted on 2026-09-01 for Phase 7.

## Context

The MVP requires a minimum automated journey and real persistence validation.
Tauri’s current official Windows-driving recommendation is WebdriverIO with
`@wdio/tauri-service`; the evaluated resolution brought 15 high npm alerts.
The external driver and embedded provider were also tested directly.

On this host’s WebView2 151, creating a window with automation enabled fails
with `HRESULT 0x800700AA`. The regression reproduces since WebView2 150 and is
recorded in `webdriverio/desktop-mobile#542`. The same block occurs with
`--remote-debugging-port` for CDP connection through `playwright-core`.

A global WebView2 downgrade, vulnerable dependencies, or an unpublished
Tauri/Wry patch would increase risk for the release and the user machine.

## Decision

The required `npm run test:e2e` gate contains:

1. an application journey in Vitest + Testing Library over real React, state,
   and domain logic using a test-specific in-memory repository;
2. the real Rust suite, covering SQLite, migrations, transactions, backups,
   and `.chronoproject` export/import.

The journey covers project, task, and subtask creation; A → B → C; propagation;
Table/Kanban/Gantt; duplication; export; empty workspace; import; and semantic
comparison. Both layers are required in Windows CI.

The CDP harness remains versioned as `npm run test:e2e:desktop`, but is
diagnostic and non-blocking until the upstream fix. Its Cargo `e2e` feature uses
database, backups, and logs under `.local/e2e/`; receives import/export targets
only in the test process; opens CDP only in generated `.local/e2e/` config; and
is never enabled in production executables or installers.

The harness uses an exclusive User Data Folder and CDP port per run and waits
for WebView2 processes to exit. Five launches and the desktop journey passed
locally outside the sandbox. Promotion to the gate remains dependent on a clean
VM and two consecutive manual-workflow runs, under the matrix in
[WebView2 testing guidance](../webview2-testing.md).

## Rejected alternatives

- **Use the vulnerable runner:** violates dependency policy and retains the
  runtime regression.
- **Pin old WebView2 or change global policies:** changes the user environment
  and does not represent updated Windows machines.
- **Apply an unreleased Tauri/Wry patch:** introduces unstable code before
  release.
- **Ignore native persistence:** leaves migrations and portability unvalidated.
- **Coordinate automation:** is fragile and unsuitable for CI.

## Consequences

- The release has a reproducible automated gate without access to user data.
- No isolated test claims to cross UI, IPC, and SQLite alone; coverage is
  deliberately composed and documented.
- VM installation, opening, updating, and data-preservation checks remain
  manual Phase 7 criteria.
- The desktop harness can return to the gate without rewriting its scenario
  when a stable fix arrives.

## Sources

- [Tauri — WebDriver](https://v2.tauri.app/develop/tests/webdriver/)
- [WebView2 150+ regression](https://github.com/webdriverio/desktop-mobile/issues/542)
- [Microsoft — WebView2 flags](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/webview-features-flags)
- [Microsoft — WebView2 distribution](https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution)
- [Microsoft — User Data Folder](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/user-data-folder)
- [Microsoft — Evergreen versus Fixed Version](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/evergreen-vs-fixed-version)
- [Playwright — connectOverCDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)
