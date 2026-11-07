# ADR 017 — Windows distribution with NSIS and two WebView2 strategies

## Status

Accepted on 2026-08-30 for Phase 7.

## Context

Chrono Project must be installable on Windows 11 x64, work without Node, Rust,
Git, or Build Tools, and offer an installation alternative without internet.
The application and its data remain local; WebView2 is only the rendering
runtime supplied and updated by Windows.

Tauri 2 can produce MSI (WiX) and NSIS installers. It also offers
`downloadBootstrapper`, `embedBootstrapper`, `offlineInstaller`, `fixedRuntime`,
and `skip` WebView2 modes.

## Decision

Use NSIS as the primary V1 format, with `currentUser` installation and
`PortugueseBR` and `English` languages. Per-user installation avoids elevation
and uses the Windows profile, consistent with Chrono Project local storage.

Maintain two build commands:

- `npm run tauri:build:installer`: compact installer, using
  `downloadBootstrapper` as a contingency when WebView2 is absent;
- `npm run tauri:build:installer:offline`: larger installer with
  `offlineInstaller` embedded, capable of preparing a machine without internet.

Block downgrade (`allowDowngrades: false`) to reduce the risk of accidentally
installing an older schema or binary over newer data.

Do not use `fixedRuntime`: besides its larger size, it would make the project
responsible for continuously distributing runtime security fixes. Do not use
`skip`, because a machine without WebView2 would have an installation that does
not open.

Do not produce MSI by default. It can be added if a corporate deployment need
arises through domain policy. For the initial public, the NSIS executable offers
the simplest flow.

## Security and publication

Installers published through v0.1.4 do not have Authenticode and may display an
unknown-publisher warning. Since v0.1.3 they carry the Tauri updater signature,
independent of Authenticode and mandatory for in-app installation. A future code
signing certificate requires its own decision and must not be confused with the
permanent updater key. See ADR 020.

## Consequences

- The standard installer is small but may require internet when WebView2 is
  absent or unsuitable.
- The offline installer grows significantly because it includes the runtime.
- Both install the same application and preserve the database in the user
  profile.
- Both builds use the same output name; if both are retained, copy the first
  artifact elsewhere before producing the second.

## Official sources

- [Tauri — Windows Installer](https://v2.tauri.app/distribute/windows-installer/)
- [Tauri — Webview Versions](https://v2.tauri.app/reference/webview-versions/)
- [Tauri — Distribute](https://v2.tauri.app/distribute/)
