# ADR 005 — Local-first, offline architecture

- Status: accepted
- Date: 2026-08-26

## Context

The product must work without internet, keep private data on the machine, and
remain useful without external services.

## Decision

Run the interface, domain, persistence, and logs locally. Data leaves the
machine only through an explicit future export action.

## Consequences

There is no remote telemetry by default and no API dependency for primary
screens. Backup, import, and export are explicit local operations.
