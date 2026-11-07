# ADR 023 — Chrono Project as product identity

## Status

Accepted on 2026-09-16.

## Context

The provisional ProjectFlow name coincides with several project-management
products. A preliminary search of the INPI database found no exact applications
or registrations for `CHRONO PROJECT` or `PROJECT CHRONO`. Brands exist with the
`CHRONO` stem and an international scientific project named Project Chrono, but
in different activities. The product remains independent and has no affiliation
with that project.

The application is still pre-1.0, contains only disposable test data, and does
not need to preserve compatibility with installations, databases, or exported
packages under the earlier identity.

## Decision

The official identity becomes:

- public name: **Chrono Project**;
- short name: **Chrono**;
- slug and package: `chrono-project`;
- Tauri identifier: `io.github.machadojean.chronoproject`;
- local database: `chronoproject.sqlite`;
- portable package: `.chronoproject` extension and `chronoproject` format;
- automation variables: `CHRONO_PROJECT_` prefix;
- first version with the new identity: `0.2.0`.

ProjectFlow 0.1.x and Chrono Project 0.2.0 are treated as distinct
applications. Development, E2E, and production databases used in tests are
recreated without an identity migration.

## Consequences

- Installers, executable, updater, reports, logs, and documentation use Chrono
  Project.
- 0.1.x releases and tags remain historical evidence of the earlier identity
  and must not be rewritten on GitHub.
- The remote repository is renamed to `machado-jean/chrono-project` only after
  the 0.2.0 code passes local gates.
- Visual identity must be original and must not suggest association with the
  physical-simulation Project Chrono.
