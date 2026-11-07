# ADR 003 — Pure TypeScript domain

- Status: accepted
- Date: 2026-08-26

## Context

Scheduling, calendars, duplication, and validation require extensive tests and
do not depend on native capabilities.

## Decision

Implement business rules in strict TypeScript, in pure modules independent of
React, the DOM, and Tauri.

## Consequences

React presents and coordinates interaction; Rust provides native capabilities.
Critical rules do not live in components and are not duplicated across views.
