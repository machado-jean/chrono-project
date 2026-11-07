# Development environment

Bootstrap and inspection were performed on 26 August 2026 on Windows 11 Pro x64
25H2, build `26200.9168`. The legacy Registry `ProductName` field still reports
“Windows 10 Pro”; architecture and build confirm the Windows 11 x64 environment
specified for this project.

## Version criterion

Selection follows `AGENTS.md` order: compatibility, stability, maintenance,
then recency.

- Tauri requires Microsoft C++ Build Tools, WebView2, Rust MSVC, and Node LTS
  on Windows ([official prerequisites](https://v2.tauri.app/start/prerequisites/)).
- Scaffold used official `create-tauri-app`
  ([official guide](https://v2.tauri.app/start/create-project/)).
- Node 26.13.0 is the selected LTS, validated on Windows x64 and reproduced by
  CI ([Node releases](https://nodejs.org/en/about/previous-releases),
  [26.13.0](https://nodejs.org/en/blog/release/v26.13.0/)).
- Rust 1.98.0 is stable and installed by official Rustup with MSVC x64 host
  ([announcement](https://blog.rust-lang.org/2026/08/20/Rust-1.98.0/),
  [installation](https://www.rust-lang.org/tools/install)).
- Vite 8.3 supports Node `^20.19 || >=22.12`
  ([release policy](https://vite.dev/releases)).
- React 19.3 is stable line resolved by candidate.
- TypeScript 6.0.3 remains compatible with `typescript-eslint` 8.72.0.

## Base tools

| Tool | Validated version | Scope | Status/source | Check |
| --- | --- | --- | --- | --- |
| Windows | 11 Pro x64 25H2, build 26200.9168 | system | existing | `CurrentVersion` Registry |
| Git for Windows | 2.55.0.windows.3 | machine | existing; not reinstalled | `git --version` |
| Node.js | 26.13.0 LTS x64 | machine | official MSI | `node --version` |
| npm | 11.20.0 | machine, supplied by Node | installed with Node | `npm --version` |
| Rustup | 1.29.0 | user | official x64 installer | `rustup --version` |
| Rust/Cargo | 1.98.0 stable MSVC | user | exact MSVC toolchain selected by `rust-toolchain.toml` | `rustc --version`, `cargo --version` |
| VS Build Tools | 2026 Stable 18.9.2 | machine | official stable channel | `vswhere` |
| MSVC x64/x86 | toolset 14.51.36231; `cl` 19.51.36256.0 | machine | C++ workload | `vswhere`, `cl.exe` |
| Windows 11 SDK | 10.0.26100.0 | machine | recommended C++ workload component | `vswhere` |
| WebView2 Runtime | 151.0.4129.107 | machine | existing; not reinstalled | `EdgeUpdate` Registry |

Build Tools uses the official Stable channel with **Desktop development with
C++** and recommended components. Existing WebView2 was sufficient and was
preserved. VBSCRIPT is needed only for MSI; V1 uses NSIS, so it was not enabled.

## Main local dependencies

| Package/component | Resolved version | Licence | Use |
| --- | --- | --- | --- |
| create-tauri-app | 4.6.2 | MIT/Apache-2.0 | temporary npm scaffold |
| @tauri-apps/cli | 2.11.4 | MIT/Apache-2.0 | local CLI |
| Tauri crate | 2.11.5 | MIT/Apache-2.0 | desktop shell |
| tauri-build | 2.6.3 | MIT/Apache-2.0 | native build |
| React / React DOM | 19.3.1 | MIT | presentation |
| TypeScript | 6.0.3 | Apache-2.0 | language/typecheck |
| Vite | 8.3.5 | MIT | dev server/frontend build |
| ESLint / typescript-eslint | 10.14.0 / 8.72.1 | MIT | strict type-aware lint |
| Vitest | 4.1.12 | MIT | TypeScript tests |
| Tauri SQL plugin / SQLx | 2.4.0 / 0.8.6 | MIT/Apache-2.0 | SQLite/migration tests |
| SQLite runtime | 3.46.0 | public domain | bundled persistence |
| Tauri Log plugin | 2.9.0 | MIT/Apache-2.0 | local logs |
| SVAR React Gantt | 2.8.2 | MIT | locally loaded Gantt renderer |
| Internal Brazilian catalogue | — | authored code | local national/state/movable holidays |
| Tauri Dialog / Opener | 2.7.2 / 2.5.4 | MIT | native pickers / restricted installer links |
| Playwright Core | 1.64.1 | Apache-2.0 | local Tauri CDP diagnosis only |
| pdfmake / types | 0.3.13 / 0.3.3 | MIT | lazy local PDF reports |
| zip / sha2 / uuid / chrono | 9.1.0 / 0.11.0 / 1.28.0 / 0.4.45 | MIT-family | package integrity and timestamps |

PDF renderer and Roboto fonts load only when generating a report. JavaScript
versions are locked in `package.json`/`package-lock.json`; Rust versions in
`Cargo.toml`/`Cargo.lock`; `rust-toolchain.toml` pins Rust 1.98.0. Tauri CLI,
React, TypeScript, Vite, and test libraries are not globally installed.

## Installer integrity

- Node MSI SHA-256: `28b69132c35ccc033bf8f2a67cd10c9d75ef5822593363309da448f2afff2d8a`;
- Rustup SHA-256: `86478e53f769379d7f0ebfa7c9aa97cb76ca92233f79aa2cc0dbee2efaac73c7`;
- Build Tools bootstrapper: valid Microsoft Corporation Authenticode signature,
  file version 18.9.12120.119.

## Commands used

Inspection:

```powershell
git --version
node --version
npm --version
rustc --version
cargo --version
rustup --version
```

Scaffold and local dependencies:

```powershell
npm create tauri-app@latest . -- --manager npm --template react-ts --identifier io.github.machadojean.chronoproject --tauri-version 2 --force --yes
npm install
npm run tauri add sql
cargo add tauri-plugin-sql --features sqlite
npm run tauri add log
npm install @svar-ui/react-gantt@2.8.1 --save-exact
npm install --save-dev --save-exact playwright-core@1.64.1
npm install --save-exact pdfmake@0.3.12
npm install --save-dev --save-exact @types/pdfmake@0.3.3
```

Gantt was installed locally after reviewing licence, maintenance, TypeScript,
React, hierarchy, dependencies, accessibility, and bundle; see
[ADR 013](decisions/013-svar-react-gantt.en.md). Current identifier is
`chronoproject`; the former `io.github.machadojean.chronoproject` remains only
in history through 0.2.2.

## Operating notes and reproducible validation

- Codex was opened before installation and some subprocesses retained old
  `PATH`; a new terminal receives persistent `C:\Users\jeanm\.cargo\bin`.
- SQLite runtime is bundled; no global SQLite CLI is installed.
- `.gitattributes` forces LF for migrations because SQLx checksum is byte-based;
  CRLF conversion would invalidate canonical migration without semantic change.
- `npm run tauri:build:test` enables `shared-dev-data`, incorporates frontend,
  and shares `.local/data/chronoproject.sqlite` with `tauri dev`; production
  distribution uses Tauri `AppConfig` user data instead.
- `npm run audit:build` always rebuilds this inspection executable into the
  stable `.local/inspection/Chrono-Project-Inspection.exe` path.
- `npm run dev:seed-schedule` restores deterministic schedules for the 205-task
  local dataset, transactionally and only with `--apply`; keep application
  closed. `npm run dev:seed-advanced-audit` recreates the separate advanced
  audit project with five levels, multiple predecessors, lags, criticality,
  manual task, and assignee coverage.

## Historical build record

This source record retains release-candidate evidence from v0.1.4 through
v0.2.7: toolchain, automated checks, observed wall times, installer sizes,
SHA-256 values, signature results, offline cache behaviour, and manual
installation/update observations. These are historical evidence, not current
release artefacts. Refer to the PT-BR record for every original timestamp,
hash, command duration, and release-specific table; do not modify those values
when auditing history.

Key recurring conclusions preserved by that evidence:

- no global tool or dependency was installed for candidate validations;
- all quality gates were repeated with the candidate lockfiles;
- standard and offline installers are NSIS packages signed for the Tauri updater,
  not Authenticode;
- offline builds may exceed two minutes because NSIS/WebView2 cache resolution
  and the interactive updater-key prompt are not CPU compilation;
- the local updater key has no passphrase, so `Password:` is answered with
  Enter only after process monitoring confirms build work has stopped;
- distribution candidates preserve the latest three local published versions;
- clean-VM validation remains separate from host evidence.

For the exact current release procedure, durations, staging artefacts, and
publication checks, use [release runbook](release-runbook.md) and
[next release draft](releases/next.md). For desktop/WebView2 evidence and
remaining VM criteria, use [WebView2 testing](webview2-testing.md).
