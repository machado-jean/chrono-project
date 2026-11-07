# ADR 004 — Schedule dates without time

- Status: accepted
- Date: 2026-08-26

## Context

Tasks are planned in working days. Timestamps and timezone conversion introduce
day changes that do not represent the domain.

## Decision

Persist schedule dates as `YYYY-MM-DD` text. A duration of `1` is the same
working start and finish day.

## Consequences

Calendar operations use dedicated date-only functions. ISO timestamps remain
permitted for technical audit, not for schedule dates.
