# Release operational runbook

This is the authoritative procedure for preparing Chrono Project release artefacts. Follow it with [release process](release-process.en.md) and the current `docs/releases/next.md` checklist.

## 1. Authorisation boundaries

The agent may inspect, implement, test, build local candidates, stage, and verify them. Without explicit user authorisation it must not push, force-push, merge, tag, publish a release, delete remote branches, alter GitHub settings, or reveal/copy/commit/publish updater private keys, databases, backups, logs, installers, `.local`, or real exports. Never replace published assets or move published tags. Candidate artefacts are not public releases until rebuilt and verified from exact merged `main` commit.

## 2. Long-running-step protocol

Observe processes until terminal state; normal-duration expectations are not timeouts. Do not leave the user without an update longer than two minutes. Before calling a build stalled, inspect process tree, command line, and newest output. `Password:` for local updater key is interactive: only after Cargo, rustc, and makensis work has ended may Enter be sent, because documented local release key has no passphrase. Never guess or enter a secret.

Ordinary JS/Rust gates usually take less than two minutes; standard installer often nears a minute; offline installer can exceed two minutes due to NSIS/WebView2 cache and interactive signing. These are references, not stop conditions.

## 3. Required artefacts

For `vX.Y.Z`, staging contains `chrono-project.exe`, standard/offline x64 NSIS installers, both updater signatures, `latest.json`, `SHA256SUMS.txt`, `BUILD_RECORD.json`, and version-aligned PT-BR/English release notes. Standard installer uses existing/bootstrapped WebView2; offline installer supports disconnected official-runtime installation. Neither contains production data.

## 4. Preparation and quality gates

On a clean thematic release branch:

```powershell
git status --short --branch
git branch --show-current
git log --oneline -n 10
npm ci
npm run check
npm run test:e2e
npm run test:performance
npm audit --audit-level=low
```

Then run Cargo fmt/check/test/Clippy with locked targets and, from repository root:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\Test-DocumentationIndex.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts\Test-DocumentationIndex.ps1 -RequireEnglishPairs
git diff --check
```

Confirm package/Cargo/Tauri versions agree, `.local` is ignored, and no real database/export/key is staged. Do not blind-edit lockfiles, migrations, or checksums to mask failure; preserve evidence, fix narrowly, then rerun gates.

## 5. Build and local finalisation

Build production executable without `shared-dev-data`; `npm run tauri:build:test` and `npm run audit:build` are local audit only and must not be published. Build standard NSIS bundle, preserve native Tauri cache, and confirm executable, installer, updater signature, and SHA-256. Build offline bundle only with official cached/downloaded WebView2 payload; if unavailable, report exact error and request authority before an official download—never substitute third-party payload.

Use project scripts to assemble versioned staging and generate hashes, signatures, manifest, and build record. Verify:

```powershell
.\.local\distribution\vX.Y.Z-staging\PUBLISH_RELEASE.ps1 -VerifyOnly
```

It must approve version, manifest, both signatures, hashes, and required files. Report staging path/sizes/SHA-256. Retain prior local releases under documented policy; never delete workspace, source, profiles, real data, secrets, or broad computed paths. Keep latest three local published releases, current candidate, needed caches, and backups whenever possible.

## 6. Documentation before publication

Read [documentation index](README.en.md) and audit every entry as Updated, Reviewed unchanged, or Not applicable. Record counts and named updates. Current release notes must be complete before commit in PT-BR and English: scope, compatibility, installation, limitations, sizes/hashes, and equivalent links. GitHub body presents PT-BR first then English. Historical notes remain immutable unless correcting a specific fact. English-pair command must pass.

## 7. Remote publication

After local approval, user creates coherent commit on `release/vX.Y.Z`, pushes, opens PR to `main`, waits for updated **Windows quality gate**, resolves reviews, and squash-merges. Delete branch only after merge. Then:

```powershell
git fetch --prune
git switch main
git pull --ff-only origin main
git status --short --branch
```

Proceed only with clean `## main...origin/main`. Rebuild and VerifyOnly exact main commit, then user runs versioned publication script. Tag is immutable and points to CI-approved main commit.

## 8. Final report

After authorised publication:

```powershell
.\scripts\Check-ReleaseCi.ps1 -Tag vX.Y.Z
```

Report tag, exact commit, reused successful main-CI URL, absence of duplicate tag CI, Release URL, installer names/sizes/hashes, signature verification, update-test result, and remaining clean-VM evidence. A release is not complete if post-publication verification fails.
