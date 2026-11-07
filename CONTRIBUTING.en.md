# Contributing to Chrono Project

Thank you for your interest in improving Chrono Project. The project accepts
reports, proposals, documentation, tests, and code under the MIT licence.

## Before starting

- Search existing Issues and Pull Requests.
- For bugs and improvements, use **Issues > New issue** forms.
- Do not publish databases, backups, real projects, personal data, secrets, or
  unsanitised logs.
- Structural changes must follow `AGENTS.md` and ADRs in `docs/decisions/`.
- [`docs/README.md`](docs/README.md) catalogs the purpose and review trigger of
  every versioned document.
- Agree major architecture, schema, export-format, or visual-identity changes
  in advance.

## Environment

Windows 11 x64 is the primary target. See `docs/environment.md` for versions
and prerequisites. After cloning:

```powershell
npm ci
npm run check
```

To start the desktop application:

```powershell
npm run tauri:dev
```

## Branches and commits

Use a short, thematic branch, for example:

```text
feat/task-milestones
fix/gantt-spacing
docs/security-policy
```

Prefer small conventional commits:

```text
feat: add task milestones
fix: preserve dependency lag when editing
docs: clarify Windows installation
test: cover scheduling across holidays
```

Do not force-push shared branches or move published tags. `main` is protected:
every change enters through Pull Request with linear history, resolved
conversations, and an updated passing **Windows quality gate**. Direct push and
force-push to `main` are outside the contribution flow.

## Required integration flow

Every change, including documentation and small fixes, follows this cycle:

1. start from a clean, updated `main`;
2. create a thematic branch (`feat/...`, `fix/...`, `docs/...`, `test/...`, or
   `release/vX.Y.Z`);
3. implement, test, and update affected documentation;
4. review the diff and create coherent commits;
5. push only the thematic branch;
6. open a Pull Request to `main` and complete its template;
7. wait for the updated **Windows quality gate** and resolve conversations;
8. squash merge, preserving a linear commit on `main`;
9. delete the local and remote thematic branch;
10. fast-forward local `main` and confirm a clean tree synchronised with
    `origin/main`.

Recommended terminal flow after local validation:

```powershell
git switch -c docs/example
git add --all
git commit -m "docs: describe the change"
git push -u origin docs/example
gh pr create --base main --head docs/example
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main
git fetch --prune origin
git pull --ff-only origin main
git status --short --branch
```

The last command must show only `## main...origin/main`. Any divergence,
modified file, or untracked file must be understood before starting new work.
Remote operations remain subject to `AGENTS.md` authorisation rules.

## Implementation rules

- Domain and scheduling rules live in pure TypeScript, outside React.
- SQLite remains the local source of truth.
- Every schema change receives a new migration; published migrations are not
  edited.
- Schedule dates remain `date-only` in `YYYY-MM-DD` form.
- Table, Kanban, and Gantt project the same persisted entity.
- Primary features work offline.
- Preserve import, update, and user-database compatibility.
- Do not introduce telemetry, remote services, or new dependencies without an
  explicit decision and proportionate documentation.

## Checks

Before opening a Pull Request, run:

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:performance
npm run test:e2e:application
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --all -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo test --manifest-path src-tauri/Cargo.toml --locked --all-targets
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings
npm run tauri:build:installer:ci
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/Test-DocumentationIndex.ps1
```

Run E2E, performance, or packaging tests when the change affects those flows.
Record everything run and every non-applicable gate in the Pull Request.

## Pull Requests

A Pull Request must:

- explain the problem, solution, and impact;
- point to a related Issue when one exists;
- include tests and visual evidence when applicable;
- update documentation, migrations, and release notes in the same delivery;
- remain focused, without unrelated changes;
- pass `main` CI before merge.

By submitting a contribution, you agree that it is distributed under the
project’s [MIT licence](LICENSE).
