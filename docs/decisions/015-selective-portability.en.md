# ADR 015 — SQLite package with aggregate-based selective import

- Date: 2026-08-29
- Status: accepted

## Context

The user needs to transport multiple projects between computers, update an
already known project, and import only part of a workspace. A task-by-task
merge would have ambiguous semantics for deletions, hierarchy, calendars, and
dependencies.

## Decision

Use `.chronoproject` as a strict ZIP containing a manifest, SQLite snapshot,
and README. The validated preview lists projects and templates individually.

A selected project is treated as an aggregate:

- absent UUID: insert while preserving identities;
- existing UUID: fully replace only that project, by default;
- requested copy: remap every identity and internal relation.

Templates are also UUID-replaceable aggregates. Calendars are shared
dependencies: import when absent, reuse when equivalent, and copy/remap when
there is a semantic collision.

Create a verified backup before every import or restoration. Selective import
and full restoration remain separate flows.

The native process uses `tauri-plugin-dialog`, `zip`, `sha2`, `uuid`, and
`chrono`, all local to the project. Version 1 accepts only stored,
uncompressed entries, reducing attack surface and codec dependencies.

## Consequences

- Updates preserve deletions and relations exactly as exported.
- Unselected local projects remain intact.
- A copy is independent and shares no UUIDs with its source.
- There is no selective field merge between two versions of the same task; that
  will require an explicit comparison flow in the future.
- Future schema or format packages are rejected until a deliberate migration
  exists.
