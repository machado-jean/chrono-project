<div align="center">
  <img src="src/assets/chrono-mark.png" alt="Chrono Project mark" width="150" />
  <h1>Chrono Project</h1>
  <p><strong>Local-first desktop project planning, built for Windows.</strong></p>
  <p>Task table, Kanban, Gantt, dependencies, critical path, and data under your control.</p>
  <p>
    <a href="README.md">Português (Brasil)</a> ·
    <strong>English</strong>
  </p>
  <p>
    <a href="https://github.com/machado-jean/chrono-project/releases/latest"><img src="https://img.shields.io/github/v/release/machado-jean/chrono-project?display_name=tag&sort=semver&label=release&color=087f8c" alt="Latest release" /></a>
    <a href="https://github.com/machado-jean/chrono-project/actions/workflows/ci.yml"><img src="https://github.com/machado-jean/chrono-project/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
    <img src="https://img.shields.io/badge/Windows-11%20x64-2563eb" alt="Windows 11 x64" />
    <img src="https://img.shields.io/badge/operation-offline-087a52" alt="Offline operation" />
    <img src="https://img.shields.io/badge/Tauri-2-24c8db" alt="Tauri 2" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-c79221" alt="MIT License" /></a>
  </p>
  <p>
    <a href="https://github.com/machado-jean/chrono-project/releases/latest/download/Chrono-Project-Windows-x64-Setup.exe"><strong>Download for Windows</strong></a>
    ·
    <a href="https://github.com/machado-jean/chrono-project/releases/latest/download/Chrono-Project-Windows-x64-Offline-Setup.exe">Offline installer</a>
    ·
    <a href="https://github.com/machado-jean/chrono-project/releases/latest">Release notes</a>
  </p>
</div>

> [!NOTE]
> Chrono Project is an independent project-management application and is not
> affiliated with Project Chrono, the physics-simulation platform.

## What it is

Chrono Project is a desktop application for planning projects without accounts,
remote servers, or subscriptions. Projects, tasks, calendars, and backups stay
on the user's computer. Normal operation is fully offline after installation.

It is designed to provide the density and productivity of desktop software
without becoming a generic spreadsheet or SaaS dashboard.

> The application interface is currently available in Brazilian Portuguese.
> This English README documents the product for international readers.

## Highlights

| Area | Capabilities |
| --- | --- |
| Planning | Tasks, subtasks, five hierarchy levels, priorities, assignees, tags, dates, duration, and progress |
| Scheduling | Finish-to-Start dependencies, multiple predecessors, lag, working days, holidays, and automatic propagation |
| Analysis | Baselines, variance, deadlines, health, critical path, slack, and project-target margin |
| Views | Synchronized editable Table, status Kanban, and hierarchical Gantt over one source of truth |
| Productivity | Inline editing, bulk actions, context menus, history, `Ctrl+Z`, and `Ctrl+Shift+Z` |
| Reuse | Task/project duplication, tree templates, and preservation of internal relationships |
| Portability | `.chronoproject` export, selective import, verified backup, and local PDF reports |
| Privacy | Local SQLite, no telemetry, and no automatic data upload |

## Installation

The current target is **Windows 11 x64**.

- **Standard installer — recommended:** uses the WebView2 runtime available on
  Windows and downloads Microsoft's official bootstrapper only when needed.
- **Offline installer:** embeds the WebView2 redistributable for installation
  without internet access.

The application is installed for the current Windows user under:

```text
%LOCALAPPDATA%\Chrono Project\
```

User data is stored separately from the executable:

```text
Database: %APPDATA%\chronoproject\chronoproject.sqlite
Backups:  %APPDATA%\chronoproject\backups\
Logs:     %LOCALAPPDATA%\chronoproject\logs\
```

See [Windows installation and maintenance](docs/installation-windows.md)
(Portuguese) before upgrading an old installation or testing the offline package.

## Technology

- Tauri 2 and Rust for native integration;
- React and strict TypeScript for the application;
- Vite for development and builds;
- SQLite as the local source of truth;
- npm with a versioned lockfile;
- unit, integration, E2E, and performance gates on Windows CI.

## Development

Approved prerequisites and versions are listed in
[docs/environment.md](docs/environment.md) (Portuguese).

```powershell
npm ci
npm run tauri:dev
```

Main quality gates:

```powershell
npm run check
npm run test:e2e
npm run test:performance
npm run build

cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo test --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings
```

Development data lives under the Git-ignored `.local/` directory. Audit builds
intentionally use this database; distributed builds use the normal Windows user
profile. See [ADR 012](docs/decisions/012-shared-development-database.md).

## Documentation

The detailed documentation is currently maintained in Brazilian Portuguese:

- [Roadmap and delivery history](docs/roadmap.md)
- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Scheduler, dependencies, and calendars](docs/scheduling.md)
- [Table, Kanban, and Gantt](docs/views.md)
- [Import, export, and backup](docs/import-export.md)
- [PDF reports](docs/pdf-reports.md)
- [UX and accessibility](docs/ux-accessibility.md)
- [Visual identity](docs/branding.md)
- [Public GitHub organization](docs/github-governance.md)
- [Release process](docs/release-process.md)
- [v0.2.6 release notes](docs/releases/v0.2.6.md)
- [Architecture decisions](docs/decisions/)

## Project status

The latest stable version is
[v0.2.6](https://github.com/machado-jean/chrono-project/releases/tag/v0.2.6).
The main local planning workflow is implemented. Validation on a clean, fully
offline Windows machine remains the primary distribution gate. Planned next
increments include milestones, consolidated progress, saved views, bulk editing,
and CSV/XLSX interoperability.

## Contributing and license

Bug reports and proposals are welcome through the structured
[Issue forms](https://github.com/machado-jean/chrono-project/issues/new/choose).
Before proposing a structural change, read `AGENTS.md` and the decisions in
`docs/decisions/`.

See also [contribution guidelines](CONTRIBUTING.md), the
[code of conduct](CODE_OF_CONDUCT.md), [support options](SUPPORT.md), and the
[security policy](SECURITY.md).

Chrono Project is distributed under the [MIT License](LICENSE). By contributing,
you agree that your contribution will be made available under the same license.

Third-party attributions are available in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
