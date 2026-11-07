# ADR 007 — Portuguese interface

## Status

Accepted on 2026-08-27.

## Context

The interface language had to be defined before expanding components, messages,
and flows. Persisted codes also need to remain stable so that data is not
coupled to presentation.

## Decision

The V1 interface will be entirely in Portuguese. User-facing labels, actions,
empty states, confirmations, and errors must be written in Portuguese.

Stable internal codes such as `ACTIVE`, `NOT_STARTED`, and `AUTO` remain
language-independent. The presentation layer converts them using typed label
maps. API names and technical identifiers do not need translation.

## Consequences

- new screens and messages keep Portuguese as their default;
- persisted values do not change when a label is refined;
- a future localisation effort can reuse the separation of code and label, but
  internationalisation was outside V1 scope at this decision point;
- interface tests must verify user-facing text.
