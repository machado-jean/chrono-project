# Documentation index

This is the English entry point to the versioned Chrono Project documentation.
It catalogues each permanent document, explains its role, and identifies the
review trigger. When creating, moving, renaming, or deleting a document, update
this index in the same change. Historical records are not rewritten merely to
adopt a newer format.

## Release documentation gate

Before a release-final commit, read every row of the PT-BR catalogue and record
one result in the branch audit: **Updated**, **Reviewed unchanged**, or **Not
applicable** (historical/unaffected). The handoff reports the indexed total and
each category total; their sum must match the script total. Name every updated
file. Gate ends only when every entry was read.

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1 -RequireEnglishPairs
git diff --check
```

The first command validates all versioned `.md`, `.txt`, and `LICENSE` are
catalogued, internal links, ADR catalogue, version alignment between application,
READMEs, and current release notes. It is part of **Windows quality gate**. The
second requires English pairs for all applicable PT-BR documents. See
[language policy](documentation-language-policy.en.md).

## Core and public documents

| Document | Purpose | Review trigger |
| --- | --- | --- |
| [Agent specification](../AGENTS.md) | Product, architecture, and agent-operation specification. | Requirement, process, security, or release change. |
| [PT-BR README](../README.md) / [English README](../README.en.md) | Public presentation, installation, and product state. | Public feature, compatibility, distribution, or release change. |
| [PT-BR changelog](../CHANGELOG.md) / [English changelog](../CHANGELOG.en.md) | Compact public version history. | Every public release. |
| [Language policy](documentation-language-policy.md) / [English](documentation-language-policy.en.md) | Required PT-BR/English pair convention and gate. | Any documentation creation/update. |
| [Contribution guide](../CONTRIBUTING.md) / [English](../CONTRIBUTING.en.md) | Contribution, branch, verification, and PR flow. | CI, protection, tooling, or contribution-process change. |
| [Code of conduct](../CODE_OF_CONDUCT.md) / [English](../CODE_OF_CONDUCT.en.md) | Community conduct and moderation. | Governance/contact change. |
| [Security](../SECURITY.md) / [English](../SECURITY.en.md) | Supported versions and private vulnerability reporting. | Support, risk, updater, import, or security-channel change. |
| [Support](../SUPPORT.md) / [English](../SUPPORT.en.md) | Community support channels and limits. | Issues, Discussions, or support-policy change. |
| [Privacy](../PRIVACY.md) / [English](../PRIVACY.en.md) | Local storage, network access, and privacy policy. | Telemetry, local data, network, updater, or uninstallation change. |
| [MIT licence](../LICENSE) | Canonical authored-code terms. | Explicit maintainer decision plus ADR only. |
| [Third-party notices](../THIRD_PARTY_NOTICES.md) / [English](../THIRD_PARTY_NOTICES.en.md) | Distributed dependency attribution and licence notices. | Dependency or redistributed asset change. |
| [GitHub governance](github-governance.md) / [English](github-governance.en.md) | Public organisation, `main` protection, labels, and Dependabot. | GitHub configuration/policy change. |

## Product and architecture

| Document | Purpose | Review trigger |
| --- | --- | --- |
| [Architecture](architecture.md) / [English](architecture.en.md) | Layer boundaries, persistence, scheduler, and presentation. | Structural subsystem/boundary change. |
| [User guide](user-guide.md) / [English](user-guide.en.md) | Main user workflows. | Public interaction, behaviour, or shortcut change. |
| [Data model](data-model.md) / [English](data-model.en.md) | SQLite schema, entities, invariants, migrations. | Migration/integrity/persistence change. |
| [Scheduling](scheduling.md) / English counterpart | Calendars, FS, propagation, transactions, critical path. | Scheduler, dependency, calendar, or fixture change. |
| [Views](views.md) / English counterpart | Shared Table, Kanban, Gantt, and filter behaviour. | View visual/functional change. |
| [Reuse](reuse.md) / [English](reuse.en.md) | Task/project duplication and templates. | Copy, UUID, relation, or template change. |
| [Import/export](import-export.md) / [English](import-export.en.md) | `.chronoproject`, import, backup, security. | Accepted schema, format, limit, portability change. |
| [PDF reports](pdf-reports.md) / [English](pdf-reports.en.md) | PDF types, options, limits, privacy. | PDF content/generation change. |
| [UX and accessibility](ux-accessibility.md) / English counterpart | Keyboard, focus, contrast, accessible validation. | Interaction/menu/dialog/shortcut/identity change. |
| [Branding](branding.md) / [English](branding.en.md) | Mark, assets, symbol composition, interface use. | Logo, icon, colour, visual-integration change. |
| [Environment](environment.md) / [English](environment.en.md) | Reproducible toolchain and technical record. | Node/npm/Rust/Tauri/main dependency update. |
| [Roadmap](roadmap.md) / English counterpart | Current state, phases, chronological evolution. | Delivery, deferral, milestone, pending work. |

## Operation, distribution, and release

| Document | Purpose | Review trigger |
| --- | --- | --- |
| [Windows installation](installation-windows.md) / [English](installation-windows.en.md) | Installation, update, data, uninstallation, validation. | Installer/updater/data directory/end-user requirement change. |
| [Troubleshooting](troubleshooting.md) / [English](troubleshooting.en.md) | Safe startup, WebView2, data, migrations, scheduling diagnosis. | New recurring error/recovery/support channel. |
| [WebView2 testing](webview2-testing.md) / English counterpart | Isolation, diagnosis, desktop E2E/WebView2 criteria. | Harness/runtime/workflow/VM-CI evidence change. |
| [Windows 11 acceptance](vm-validation-record.md) / [English](vm-validation-record.en.md) | Clean-machine acceptance plan/evidence. | Clean VM/machine execution or target-version change. |
| [WinGet](winget.md) / [English](winget.en.md) | Identity, manifests, testing, catalogue status. | Submission, approval, version, installer change. |
| [Release process](release-process.md) / [English](release-process.en.md) | Concise pre/post-tag checklist. | CI, main protection, tag, publication change. |
| [Release runbook](release-runbook.md) / English counterpart | Full build, signing, and publication procedure. | Script, artifact, signature, responsibility change. |
| [Next release](releases/next.md) / [English](releases/next.en.md) | Living draft of upcoming release. | Throughout post-release development. |

## Architecture decisions

ADRs preserve the context and decision of their time. Review their impact for
each release; create a new ADR when superseding a decision rather than erasing
history. The full bilingual numbered catalogue is in
[ADR index](decisions/README.md) and [English ADR index](decisions/README.en.md).
Its template is [PT-BR](decisions/template.md) and [English](decisions/template.en.md).

## Historical release notes

Release notes `docs/releases/v0.1.5.md` through `v0.2.9.md` are immutable PT-BR
historical records. Check coherence and links during release audit but do not
modernise their text or fill gaps without an explicit factual correction.
Current `v0.3.0` has [PT-BR](releases/v0.3.0.md) and
[English](releases/v0.3.0.en.md) notes.

## Tests, fixtures, and related public configuration

- [E2E README](../tests/e2e/README.md): layered E2E gate and desktop diagnosis.
- [Integration README](../tests/integration/README.md): integration-test scope.
- [Fixtures README](../tests/fixtures/README.md): versionable fixture and safe-data rules.
- `.github/ISSUE_TEMPLATE/`, `.github/CODEOWNERS`, `.github/dependabot.yml`,
  `.github/workflows/ci.yml`, and `.github/workflows/desktop-e2e.yml` normally
  require reviewing their corresponding catalogue sections.
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and
  `packaging/winget/` govern versions, commands, identity, dependencies, and
  public WinGet manifests.
