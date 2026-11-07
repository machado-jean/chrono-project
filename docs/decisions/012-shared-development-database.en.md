# ADR 012 — Shared database for development and local test releases

- Status: accepted
- Date: 2026-08-28

## Context

The executable opened manually in Explorer and the executable started by Codex
could show different workspaces despite apparently using the same `%APPDATA%`
path. Codex desktop is distributed as a packaged Windows application, whose
process receives a virtualised `AppData` layer. A database created in that
physical context was stored under
`%LOCALAPPDATA%\Packages\OpenAI.Codex_2p2nqsd0c76g0\LocalCache\Roaming\...`,
while a normal double-click kept seeing the real user database.

That separation is unsuitable for audit: `tauri dev`, builds run by the agent,
and the local release opened by the user must observe exactly the same test
data. A production installer must not depend on the source checkout.

The official [SQL plugin](https://v2.tauri.app/plugin/sql/) resolves relative
SQLite paths against `AppConfig`. [Cargo features](https://doc.rust-lang.org/stable/cargo/reference/features.html)
allow explicit build behaviour through `--features`.

## Decision

There are two deliberate modes:

1. **Shared development** — debug builds and builds with `shared-dev-data` use
   the absolute `chrono-project\.local\data\chronoproject.sqlite` path.
2. **Distribution** — release builds without that feature keep using
   `sqlite:chronoproject.sqlite`, resolved by Tauri in `AppConfig`.

The fixed plugin preload was removed. The native application exposes the
calculated URL, and the Tauri adapter explicitly loads that same URL before its
first workspace command. The migration list is registered under the identical
URL, keeping one SQLite instance per process.

On first shared-mode launch, if `.local\data` is empty and `AppConfig` contains
a database, initialisation:

1. opens the source without creating it;
2. runs `PRAGMA quick_check`;
3. creates a consistent copy with `VACUUM INTO` in `.local\backups`;
4. verifies the backup;
5. prepares and verifies a temporary copy inside `.local\data`;
6. activates it by rename only if the destination still does not exist;
7. never overwrites an existing shared database.

`npm run tauri:build:test` runs Tauri with `--no-bundle --features
shared-dev-data`. Beyond enabling the feature, it runs `beforeBuildCommand` and
embeds `frontendDist`; the audit executable does not depend on Vite at
`localhost`. `npm run tauri:build` remains reserved for distribution behaviour.

## Rejected alternatives

- Keep using `%APPDATA%` in development: it retains the divergence caused by
  Windows virtualisation.
- Copy the main file manually without considering WAL: it could create an
  inconsistent copy.
- Use `.local` for every release: this would break installation on another
  machine and mix production data with source code.
- Select the database through an environment variable: double-clicking would
  not load it reproducibly.

## Consequences

- User and agent audit the same local workspace.
- The recovered database is preserved before becoming the shared database.
- Real databases and backups remain ignored by Git.
- The local test executable is deliberately bound to the checkout where it was
  compiled and must not be distributed.
- The future installable build still uses the appropriate user-profile data
  directory.
