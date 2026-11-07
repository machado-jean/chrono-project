# ADR 031 — Public distribution through WinGet

## Status

Accepted on 2026-10-11.

## Context

Chrono Project already publishes x64 NSIS installers in stable, versioned
GitHub releases. The Windows Package Manager community catalog can provide a
verifiable command-line installation without hosting the binary again.

The WinGet package identifier is public and permanent. It differs from the
internal Tauri identifier used for local data and configuration.

## Decision

Use WinGet identifier:

```text
ChronoProject.ChronoProject
```

Keep `chronoproject` as the internal Tauri identifier and `Jean Machado` as the
explicit Windows bundle publisher. The first submission uses the online x64
NSIS installer from a new stable release, never an asset replaced under an
already published version.

The manifest is multi-file, with `pt-BR` as default locale and `en-US` as an
additional locale. The installer is declared as `nullsoft`, user scope,
`install` upgrade behaviour, and a version-specific HTTPS URL.

## Consequences

- Users can install with
  `winget install --id ChronoProject.ChronoProject --exact`.
- Each future release requires a new manifest version, URL, and SHA-256.
- The Tauri updater `.sig` package does not replace an Authenticode signature.
- Absence of Authenticode does not by itself block a community submission, but
  may reduce SmartScreen reputation and must remain explicit.
- Silent installation, upgrade, and uninstallation must be tested before every
  Pull Request to `microsoft/winget-pkgs`.

## Implementation

The first submission uses version 0.2.7 and was opened on 2026-10-11 as
[microsoft/winget-pkgs#450697](https://github.com/microsoft/winget-pkgs/pull/450697).
The CLA and ten technical catalog steps were approved. The PR remains open,
awaiting only the mandatory review by a volunteer moderator.
