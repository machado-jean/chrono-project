# Chrono Project — next version

This is the living draft of the next release notes. Fill it during development
and never reuse items from an already published release.

## Confirmed scope

- localisable interface in Portuguese (Brazil) and English, with preference
  persisted only on the device;
- translated menus, navigation, window controls, views, filters, project
  actions, PDF, baseline, and critical-path explanation;
- user data and database format preserved without automatic translation;
- internal Brazilian holiday catalogue, removing production chain containing
  vulnerable `deepmerge`;
- `minimatch` upgraded by override to 11.0.4, with npm audit free of known
  vulnerabilities and mandatory CI gate;
- public PT-BR and English release notes, presented bilingually in GitHub
  Release.

## Compatibility and data

- no SQLite schema change;
- unchanged `.chronoproject` format;
- unchanged `chronoproject` data directory;
- no migration or data change being prepared.

## Automated gates

- [x] `npm ci`, lint, typecheck, TypeScript/React tests (202), performance
  budget (3), and npm audit approved;
- [x] E2E journey and native Rust tests approved (39 passed, 1 historical test
  ignored);
- [x] Cargo fmt, check, and Clippy approved;
- [x] standard/offline executable and installers generated and signed;
- [x] standard documentation index validated after completion of release note;
- [x] full PT-BR/English documentation coverage validated with
  `Test-DocumentationIndex.ps1 -RequireEnglishPairs` (155 documents catalogued
  and 494 valid internal links).

## Candidate documentation audit

- [x] PT-BR/English README, changelog, roadmap, environment, process, and
  runbook reviewed;
- [x] ADRs 016, 032, 033, user guide, scheduling, and documentation index
  reviewed;
- [x] complete PT-BR and English release notes with sizes and hashes;
- [x] create and review English versions of all applicable documents, including
  guides and operations; historical release notes remain immutable PT-BR
  records.

## Public validation

- [x] system language on first opening, persisted switching, and PDF in selected
  language manually approved;
- [x] national, state, movable, and municipal holidays validated.

## Pending before publication

- create final commit, open Pull Request to `main`, and await Windows quality
  gate only after PT-BR/English coverage is approved;
- after merge, rebuild artefacts from exact `main` commit, validate signatures,
  and publish tag/release under the runbook.
