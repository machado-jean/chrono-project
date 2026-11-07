# ADR 018 — Manual update check through GitHub Releases

## Status

Partially superseded by [ADR 020](020-signed-passive-updater.md) since v0.1.3,
and again regarding startup checks on 2026-09-14. The remainder preserves the
initial decision. Accepted on 2026-08-30 for Phase 7.

## Context

Chrono Project must indicate when a newer Windows version exists, but the first
distribution policy would not use the Tauri automatic updater or its signing
keys. The application must remain fully functional offline and must not make
silent remote queries.

The public repository publishes SemVer releases with fixed-name installers.
GitHub provides an API for the latest stable release and permanent
`/releases/latest/download/<asset>` links.

## Decision

Add **Help > Check for updates** as a manual-only action. When triggered, the
frontend queries only:

```text
https://api.github.com/repos/machado-jean/chrono-project/releases/latest
```

The response must represent a published, non-prerelease SemVer release with
the `Chrono-Project-Windows-x64-Setup.exe` asset. Its version is compared with
`package.json`. If a newer version exists, the user can open either permanent
link in the default browser:

```text
https://github.com/machado-jean/chrono-project/releases/latest/download/Chrono-Project-Windows-x64-Setup.exe
https://github.com/machado-jean/chrono-project/releases/latest/download/Chrono-Project-Windows-x64-Offline-Setup.exe
```

Chrono Project does not download, execute, or install the file. The user keeps
control of manual download and installation. Use the official Tauri Opener
plugin with a capability limited to those two addresses. CSP permits connections
only to `api.github.com`, in addition to existing local channels.

## Privacy and offline operation

No query occurs at startup. The only traffic is the GitHub request made by the
user; Chrono Project sends no project, task, database, configuration, or
internal identifier. A network failure only shows an informative message and
does not affect other functions.

## Consequences

- Tauri updater keys are not required.
- There is no silent or automatic update.
- GitHub and the user connection are required only to check or download a
  version.
- The user must run the installer manually and remains responsible for
  confirming its origin and integrity.
- A future move to automatic installation requires a new decision, mandatory
  updater signature, and a secure policy for the private key.

## Official sources

- [GitHub — Linking to releases](https://docs.github.com/en/repositories/releasing-projects-on-github/linking-to-releases)
- [GitHub — REST API for releases](https://docs.github.com/en/rest/releases/releases)
- [Tauri — Opener](https://v2.tauri.app/plugin/opener/)
