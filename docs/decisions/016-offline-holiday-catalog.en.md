# ADR 016 — Offline holiday catalog

## Status

Superseded by ADR 033 on 2026-11-04.

## Context

The scheduler needed to consider national, state, and moveable holidays without
requiring users to register every date or introducing a remote service in V1.
Uniform municipal coverage was unavailable from the evaluated source.

## Decision

Use `date-holidays` 3.36.0 as an on-demand local npm dependency. The interface
queries Brazil and, optionally, one state only for years used in tasks. `public`
holidays are pre-selected; `bank` and `optional` holidays require explicit
selection. Collisions with existing exceptions are blocked.

Municipal holidays remain manual exceptions. Selected dates are written to the
existing `calendar_exceptions` entity, with no migration or live link to the
library. Schedules therefore remain reproducible even after a future catalog
update.

## Consequences

- operation remains fully offline and has no API, key, or telemetry;
- the on-demand chunk adds about 1.42 MB to the build (about 237 kB compressed)
  without increasing the initial main chunk;
- library code under ISC and data under CC BY-SA 3.0 require attribution,
  maintained in the interface and `THIRD_PARTY_NOTICES.md`;
- library updates do not silently change already imported exceptions;
- municipalities require manual user maintenance in this version.

> History: this decision was superseded by the internal catalog to remove a
> dependency chain without an available security fix.
