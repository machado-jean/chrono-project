# ADR 033 — Internal Brazilian holiday catalog

## Status

Accepted on 2026-11-04.

## Context

The earlier offline catalog depended on `date-holidays`, whose tree contained
`deepmerge` with a security alert and no corrected version available. Chrono
Project must continue offering Brazilian national, state, and moveable holidays
without network access.

## Decision

Remove `date-holidays` and calculate in the TypeScript domain the national,
state, and moveable rules used by the interface. Gregorian Easter calculation
generates the moveable rules; selection remains limited to Brazil and one
optional state.

## Consequences

- Removes the vulnerable production chain and reduces the bundle.
- Retains local operation and current exception persistence.
- Requires explicit tests for Easter, moveable holidays, and legal effective
  dates.
- Municipal holidays remain manually registered.
