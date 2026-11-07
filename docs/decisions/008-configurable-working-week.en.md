# ADR 008 — Configurable working week

## Status

Accepted on 2026-08-27.

## Context

The initial calendar runs Monday to Friday, but some projects can have Saturday
or Sunday activities. Fixing the weekend as an always-inactive period would
create a domain limitation and require a future migration.

## Decision

Each calendar has a normalised set of working days, represented from 1 to 7,
Monday through Sunday. The default calendar is created with days 1 to 5.
Saturday and Sunday can be included in the same model.

Phase 3 implements the settings screen, holidays, exceptions, and calculation
functions. The scheduler does not assume Saturday and Sunday are always
non-working days; it queries the task’s effective calendar as detailed in ADR
010.

## Consequences

- weekend activities will not require a schema change;
- the initial behaviour remains simple and predictable, Monday to Friday;
- scheduler tests must cover calendars with Saturday and/or Sunday as working
  days;
- calendars must contain at least one valid working day.
