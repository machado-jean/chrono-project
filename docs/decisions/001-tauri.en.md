# ADR 001 — Tauri 2 as the desktop shell

- Status: accepted
- Date: 2026-08-26

## Context

Chrono Project needs an installable, offline Windows application with safe
filesystem and SQLite integration, without requiring a toolchain on an end
user’s computer.

## Decision

Use Tauri 2 as the desktop shell, React/Vite in WebView2, and Rust only in the
necessary native layer.

## Consequences

Development builds require Rust MSVC, Build Tools, Windows SDK, and WebView2.
Distribution bundles the compiled frontend and does not depend on a remote web
server.
