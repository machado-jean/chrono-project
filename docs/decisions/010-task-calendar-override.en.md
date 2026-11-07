# ADR 010 — Effective calendar per task

## Status

Accepted on 2026-08-27.

## Context

The Monday-to-Friday default calendar serves most planning, but a specific
activity may take place on a weekend. Entering a Saturday date manually must be
allowed, while an automatic chain uses Saturday and Sunday only when declared.

## Decision

Each task inherits the project calendar when `calendar_id` is null and can
select another calendar as an override. The Phase 3 migration creates the built-
in **All days** calendar, Monday through Sunday.

The scheduler calculates FS constraint and duration using the successor’s
effective calendar. Therefore, a predecessor ending Friday with zero lag sends
a regular successor to Monday, but sends an **All days** successor to Saturday.

Explicitly entered non-working dates on `MANUAL` tasks are preserved and warned
about. Calendar changes recalculate affected `AUTO` tasks and successors in one
transaction that also includes the calendar configuration itself.

## Consequences

- weekend work is opt-in and visible per task;
- the project retains a simple default without preventing operating exceptions;
- calendars are shareable and the UI must state that a change affects all users;
- holidays and positive exceptions can alter individual dates;
- the selected calendar must exist and cannot be removed while in use;
- future UI can permit additional calendars without changing the task model.
