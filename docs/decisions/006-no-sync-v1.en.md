# ADR 006 — No synchronisation in V1

- Status: accepted
- Date: 2026-08-26

## Context

Synchronisation would add accounts, authentication, conflict resolution, a
remote backend, and integrity risks before the local domain is stable.

## Decision

Do not implement sync, online collaboration, accounts, or a remote backend in
V1.

## Consequences

Migration between computers uses export/import. Any future synchronisation
requires a new explicit architecture decision.
