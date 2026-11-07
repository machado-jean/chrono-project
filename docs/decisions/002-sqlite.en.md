# ADR 002 — SQLite as the local source of truth

- Status: accepted
- Date: 2026-08-26

## Context

V1 is offline and requires transactions, relational integrity, migrations, and
portability between computers.

## Decision

Use embedded SQLite through Tauri’s official SQL plugin. Every schema evolution
receives a versioned migration and new-database/preservation tests.

## Consequences

There is no database server. Data lives in the user profile, separate from the
executable and source code. Future export packages a consistent copy, never the
active file without coordination.
