# AGENTS.md — Chrono Project

This is the English operational version of the primary specification. The PT-BR `AGENTS.md` is canonical if translation ambiguity exists. Update both together.

## Context and mission

Windows 11 x64 is the primary development environment and V1 target. Workspace root is `C:\Users\jeanm\Github\chrono-project`. Do not spend development, CI, or packaging effort on Linux/macOS without explicit decision.

Chrono Project is local-first offline desktop software for project planning: hierarchy, priorities, statuses, date/duration/progress, predecessors/successors, automatic scheduling, working days, holidays, lag, Table/Kanban/Gantt, duplication, templates, local storage, and export/import. It must be maintainable, testable, and professional desktop UX.

## Technology and setup

V1 uses Tauri 2, React, TypeScript, Vite, SQLite, Rust only for necessary native work, npm, and Git. TypeScript strict owns domain, scheduler, calendar, duplication, templates, state, UI, and tests; avoid `any`. React is presentation only. Rust is native integration/filesystem/SQLite/import-export only; do not move domain rules without concrete need.

SQLite is local source of truth. Development data may be `.local/data`; installed app uses Windows user data. Python, remote backend, cloud database, synchronisation, realtime collaboration, and API server are outside V1 unless approved.

Use global tools only when unavoidable: Git, compatible Node LTS, Rust/Rustup, VS Build Tools/SDK, WebView2. Keep all JS dependencies local in `package.json`, `package-lock.json`, and unversioned `node_modules`. Version source, tests, docs, Cargo files, lockfiles, and migrations. Before initial install consult official current documentation and choose compatible stable versions by priority: compatibility, stability, maintenance, recency. Record versions/scope/source/check in `docs/environment.md`.

Work only in repository root. Before global change establish need, existing version, compatibility, and official source. Inspect git/node/npm/rustc/cargo/rustup and Windows Tauri prerequisites; validate after changes. Use official Tauri React TypeScript Vite npm bootstrap, not JavaScript/Yarn/pnpm without decision.

Keep separated app/components/features/domain/repositories/state/types, `src-tauri`, unit/integration/e2e/fixture tests, docs/ADRs, and ignored `.local`/generated data/temp. Never broadly ignore automated tests or fixtures.

## Git, GitHub, and release authority

`main` is stable and recoverable. Before significant change inspect status, branch, and recent log; preserve unrelated work. Without explicit user authorisation do not push, force-push, merge main, create/move/delete tag, publish release, delete remote branch, create/change remote repository, make it public, or alter GitHub settings.

Every main-bound change uses clean synchronised main, thematic branch, implementation/tests/docs, coherent commits, authorised branch push, PR to main, current Windows quality gate and review resolution, squash merge, branch cleanup, fetch/prune, fast-forward main, and clean status. No direct push/local merge/force-push to main.

After authorised release publication, resolve tag commit; verify successful `main` CI on exact commit; confirm tag did not duplicate CI; verify Release tag/commit; record CI and public Release URLs. Tags never rerun full quality gate. Maintain MIT licence, bilingual public docs, structured issues, private vulnerability reporting, PR template, labels, code ownership, and grouped Dependabot. Never version real data, builds, logs, backups, exports, secrets, or `.local`.

## Documentation and distribution

Maintain environment, architecture, data model, scheduling, import/export, installation, troubleshooting, user guide, UX/accessibility, views, release process/runbook, roadmap, and ADRs. Important decisions need ADRs. Maintain documentation index. Every applicable PT-BR document needs `.en.md`; historical release notes stay immutable PT-BR unless factual repair. Before release run standard index, `-RequireEnglishPairs`, and `git diff --check`.

End users need no Node/npm/React/TypeScript/Vite/Rust/Cargo/Git/Build Tools/Codex/SQLite. Ship installable Windows application. WebView2 renders local Tauri/React assets and does not make product web-hosted. Provide standard and suitable offline installation strategies; updating/reinstalling never silently erases user database.

## Product and domain

Projects have immutable UUID, name, optional description, timestamps, status, calendar, ordering, archive state; support create/rename/duplicate/archive/delete/export. Tasks have immutable UUID, optional code, project/parent, title/description, status/priority/progress, dates/duration, scheduling mode, position, optional assignee, tags/notes/timestamps. Prevent hierarchy cycles. Tasks with children are summaries with derived min-start/max-finish and no direct date editing. Statuses: Not started, In progress, Blocked, Completed, Cancelled. Priorities: Low, Normal, High, Critical.

Dependencies are independent entities with predecessor/successor/type/lag/timestamps. Multiple links are allowed; self/cycles are not. MVP is FS only; SS/FF/SF deferred. AUTO may move through scheduler; MANUAL is user-controlled and never moves automatically without explicit policy.

Scheduler is pure TypeScript, independent of React/DOM/Tauri. It validates graph, detects cycles, topologically sorts, computes constraints, and reschedules affected subgraph. FS uses successor effective calendar and latest predecessor constraint. AUTO propagation preserves duration/calendar/lag, updates summaries, and persists transactionally; MANUAL remains fixed with informative conflict. Removing last predecessor retains current date. Calendars support weekdays, holidays/exceptions, Monday–Friday default, working-day functions, and date-only `YYYY-MM-DD`. Duration 1 is same start/finish working date.

## Views, reuse, and portability

Table is primary editable hierarchy with inline edits, filters, selection, quick creation, duplication, predecessor management, autosave, and accessible horizontal scroll. Kanban projects same tasks by status with keyboard-equivalent changes. Gantt projects same tasks with timeline, bars, dependencies, hierarchy, calendar, inspector, safe temporal commands, and never a separate persistent model.

Duplication maps old UUID to new UUID, reconstructs hierarchy/internal FS links, excludes external relations by default, validates and persists atomically. Templates always produce independent tasks. Filters cover text, status, priority, dates, assignee including none, criticality, and tags.

Export project/workspace uses `.chronoproject` ZIP with manifest, SQLite, optional attachments/readme. Validate package/schema/version/integrity/size/entries before writing; prevent traversal; import through transaction/staging; never silently overwrite. Support local backup, not cloud dependence.

## UX, security, performance, tests

Create recognisable professional desktop UX based on time/precision without generic SaaS or AI-template appearance. Avoid excessive cards/pills/gradients/shadows/empty space and copied layouts. Preserve keyboard navigation, visible focus, labels, contrast, non-colour-only meaning, drag alternatives, accessible Table equivalents, and reduced motion.

No telemetry by default. Use parameterised SQL; validate imports/path traversal/size/integrity/corruption; log locally without sensitive excess. Performance target is 1,000 tasks/project and 10,000/workspace without serious degradation; virtualise Table when needed and calculate affected scheduler subgraph.

Version all tests. Prioritise scheduler/calendar/cycles/duration/duplication/migrations/import-export units; SQLite/repository/transaction integration; UI and layered E2E. Required cases cover FS/lag/multiple predecessors/calendar exceptions/cycles/AUTO/MANUAL/summaries/rollback/persistence/portability/cross-view consistency. Done requires accepted scope, strict gates, relevant manual acceptance, migration fresh+upgrade+import coverage, accessibility/security/performance review, updated docs/ADRs, and reproducible release procedure.

## Operational rules and checkpoints

Completed phases cover environment, foundation, core, scheduling, views, reuse, portability, Windows distribution, baseline control, visual identity, and critical-path explanation. Future work covers hierarchical progress/milestones, productivity/preferences/reversibility, and tabular interoperability. Exclude remote backend/sync, unapproved platforms/dependency types, and resource levelling.

When changing scheduler/database/import-export/dependencies, read related docs/ADRs, make scoped safe changes, update tests/docs/release notes, and run full relevant gates. Never edit published migrations; create new migration and test fresh/upgrade paths. Checkpoints are environment, scaffold, quality, persistence, distribution.

Follow `docs/release-runbook.md`: audit full documentation index, complete bilingual notes before commit, thematic PR/CI/squash, rebuild exact main commit, verify signatures/hashes, publish only with user authority, and post-release verify CI/tag. For long process keep observing; never stop solely because expected time elapsed; report progress at most every two minutes. For documented key prompt, send empty-passphrase Enter only after monitoring proves compilation ended.

Final philosophy: local-first, trustworthy, testable, maintainable, productive planning software: plan → relate → recalculate → visualise → reuse → transport.
