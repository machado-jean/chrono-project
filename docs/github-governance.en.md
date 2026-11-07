# Public GitHub governance

This document records how the repository presents, receives, and organises
public collaboration without changing the quality and release flow.

## Languages

- `README.md`: primary Brazilian Portuguese presentation;
- `README.en.md`: equivalent English presentation;
- Issues and community documents: bilingual titles, with PT-BR or English
  answers accepted;
- application interface: PT-BR until internationalisation is decided.

## Work intake

- bugs and improvements use `.github/ISSUE_TEMPLATE/` forms;
- usage questions use GitHub Discussions;
- vulnerabilities use the private `SECURITY.md` channel;
- Pull Requests follow `.github/PULL_REQUEST_TEMPLATE.md`;
- blank Issues remain disabled.

## Main branch protection

`main` is protected, including for repository administrators:

- every change enters through Pull Request;
- **Windows quality gate** must pass and be up to date with `main`;
- the same gate validates `docs/README.md`, preventing uncatalogued versioned
  documents or missing internal destinations;
- all PR conversations must be resolved;
- history remains linear;
- deletion and force-push are prohibited.

With one maintainer, there is no minimum human-approval count or mandatory
CODEOWNER review. This avoids blocking the maintainer’s own work without
waiving PR and CI. When another write-access maintainer participates regularly,
enable at least one external approval and the different-last-author rule.

## Change lifecycle

The canonical flow in [`CONTRIBUTING.md`](../CONTRIBUTING.en.md) also applies to
maintainer changes:

```text
updated main
→ thematic branch
→ validation and commit
→ branch push
→ Pull Request
→ CI and resolved conversations
→ squash merge
→ branch deletion
→ updated, clean, synchronised local main
```

Direct push, local merge, and force-push to `main` are not accepted shortcuts.
After merge, use `git fetch --prune` and confirm `HEAD`, `main`, and
`origin/main` point to the same commit.

## Labels

| Prefix | Use |
| --- | --- |
| `type:` | Work nature: bug, feature, or documentation |
| `area:` | Primary affected subsystem |
| `priority:` | Relative urgency; does not replace impact analysis |
| `status:` | Triage or blocker state |

An Issue must have at least a type and, after triage, an area and status. Do not
duplicate equivalent unprefixed labels.

## Milestones

Milestones represent intended versions, not date promises. Items without
confirmed scope remain in the roadmap or without a milestone. Close a milestone
only after publishing and verifying its release.

## Dependencies

Dependabot checks npm, Cargo, and GitHub Actions weekly. Compatible patch/minor
updates are grouped by stack; majors remain individual. Concurrent limits are
three npm PRs, three Cargo PRs, and one GitHub Actions PR. TypeScript `>= 6.1`
is blocked while `typescript-eslint` requires a lower version; `sqlx >= 0.9` is
blocked while `tauri-plugin-sql` remains on `sqlx 0.8`.

`@tauri-apps/*` packages and `tauri*` crates are not updated automatically.
Their versions must be prepared manually in the same increment, aligned across
npm/Rust, and fully validated. Security alerts follow the same coordinated
update and have correction priority.

Every Pull Request runs normal CI once. Automation creates no tags or releases
and does not replace licence, compatibility, or release-note review. Dependabot
PRs receive `type: dependencies` and `status: needs-triage`.

## Presentation

- description and topics reflect existing capabilities;
- Social Preview uses `docs/assets/github-social-preview.png`;
- `LICENSE` is the canonical MIT source;
- published releases retain installers, hashes, signatures, and complete notes;
- tags do not repeat a quality gate already approved for the same `main` commit.
