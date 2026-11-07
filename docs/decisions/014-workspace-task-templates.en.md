# ADR 014 — Workspace-wide task-tree templates

- Status: accepted
- Date: 2026-08-29

## Context

Phase 5 must reuse trees without turning templates into hidden projects or
sharing identities with real tasks. The specification requires hierarchy,
duration, priority, initial status, dependencies, lag, and tags, but does not
define library scope or how durations become dates when a structure is applied.

## Decision

Templates belong to the workspace and live in dedicated tables in the same
SQLite database. They do not belong to a project and can be applied to any
project.

A template is created from a task and all its descendants. It preserves:

- template name and description;
- task title and description;
- hierarchy and relative position;
- leaf-task duration;
- priority and initial status;
- tags;
- internal FS dependencies and their lags.

Visual code, assignee, notes, progress, dates, and per-task calendar are
execution data and do not enter the template. Applied tasks use `AUTO` mode,
zero progress, and the destination project calendar.

When applying, the user chooses the destination project and an initial date.
Every predecessor-free leaf starts on that anchor, adjusted to the next working
day. The scheduler calculates successors, summaries, finishes, and lags. Each
project, task, relation, and template item receives its own UUID; no identity is
shared.

Templates load with the workspace and are included in any complete SQLite
backup. In Phase 6, workspace export will include the library; an isolated
project export will not silently include global templates.

## Rejected alternatives

- **Project-scoped template:** reduces reuse and conflicts with future workspace
  export in the specification.
- **Hidden project as a template:** mixes entities, affects counts and filters,
  and weakens domain foreign keys.
- **Copy absolute source dates:** makes a structure less reusable and creates
  stale results when applied months later.
- **Persist templates as opaque JSON:** reduces relational validation and makes
  migrations, integrity, and semantic export harder.

## Consequences

- Phase 5 requires its own migration and new-database and upgrade tests.
- Template tags participate in orphan-tag cleanup.
- Template dependencies have constraints equivalent to real-task FS relations.
- Creating, deleting, and applying a structure must be transactional.
- Detailed template editing can be added later without converting template items
  into persisted `Task` entities.
