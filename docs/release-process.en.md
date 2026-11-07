# Release process

This checklist complements `AGENTS.md`. Publishing files on GitHub does not end
a release: the `main` CI associated with the exact commit pointed to by the
**tag** must also be approved, without creating a second quality gate for that
tag.

The complete operating procedure—executable, installers, signatures, staging,
scripts, and waiting protocol—is in [release runbook](release-runbook.md)
and must be followed in full. It records expected duration by gate and requires
both confirmed process exit **and** generated artefact before any step is marked
complete.

The agent prepares artefacts, internal documentation, and GitHub Release
content. The user personally performs final remote steps: commit and push on a
thematic branch, Pull Request opening/merge, and publication through
`PUBLISH_RELEASE.ps1` after updating local `main`.

Versioned release notes must be complete before that commit, with no `PENDING`
fields or post-publication placeholders. Every public release contains notes in
**Português (Brasil)** and **English**, with equivalent scope, compatibility,
installation, limitations, and links. GitHub Release body contains both
sections in the same Markdown, PT-BR first and English second. URLs and
identifiers that exist only after publication remain in the GitHub Release,
build record, and final report, not in a follow-up commit.

## Before the tag

1. Confirm `main` remains protected by Pull Request, `Windows quality gate`,
   linear history, resolved conversations, and deletion/force-push blocks.
2. Confirm consistent version in `package.json`, `Cargo.toml`, `Cargo.lock`,
   and `tauri.conf.json`.
3. Read [documentation index](README.md), review every indexed document,
   and run `scripts/Test-DocumentationIndex.ps1 -RequireEnglishPairs`. Release
   is blocked until each applicable document has its PT-BR/English pair under
   [language policy](documentation-language-policy.en.md).
4. Run every local gate described in `docs/releases/next.md`.
5. Manually validate test version using the shared development database.
6. If release changes visual identity, run [branding guide](branding.en.md) and
   inspect icon in executable, taskbar, Start menu, shortcut, application list,
   installer, and uninstaller.
7. Record sizes and SHA-256 of both installers in `docs/releases/vX.Y.Z.md`.
8. Create commit only after this audit, on a branch such as `release/vX.Y.Z`;
   never send it directly to protected `main`.
9. Push branch, open Pull Request, and wait for required `Windows quality gate`
   with branch current against `main`.
10. Resolve every conversation and squash-merge the Pull Request.
11. Delete thematic branch locally and remotely after merge.
12. Run `git fetch --prune`, switch to `main`, and use
    `git pull --ff-only origin main`.
13. Confirm `git status --short --branch` has no local changes and displays only
    `## main...origin/main`; only then run `PUBLISH_RELEASE.ps1`.

## After publication

In PowerShell:

```powershell
.\scripts\Check-ReleaseCi.ps1 -Tag vX.Y.Z
```

The script resolves the tag commit, finds the already approved `main` `CI`
workflow for that commit, and confirms that the tag did not start redundant CI.
Release may be recorded as validated only after successful completion.

On failure, inspect relevant sections with:

```powershell
gh run view <RUN_ID> --log-failed
```

Main workflow does not run on tags. A future `v*` automation belongs in a
dedicated release workflow and must not repeat quality gate.

## Minimum record evidence

- tag and commit;
- reused `main` run URL;
- confirmation that tag points to the approved commit;
- confirmation that no tag CI was duplicated;
- published installers and hashes;
- update-test result from previous version.
