# WinGet publication

## Permanent identity

| Field | Value |
| --- | --- |
| PackageIdentifier | `ChronoProject.ChronoProject` |
| PackageName | `Chrono Project` |
| Publisher | `Jean Machado` |
| License | `MIT` |
| DefaultLocale | `pt-BR` |
| Additional locale | `en-US` |
| Architecture | `x64` |
| InstallerType | `nullsoft` |
| Scope | `user` |
| UpgradeBehavior | `install` |

The WinGet `PackageIdentifier` does not change the Tauri `chronoproject`
identifier, data directory, or `.chronoproject` format.

## Initial audit state

Confirmed on 11 October 2026:

- before submission, the identifier did not exist in the public catalogue or
  another `microsoft/winget-pkgs` Pull Request; the first request is
  [PR #450697](https://github.com/microsoft/winget-pkgs/pull/450697);
- GitHub Release provides an official public HTTPS URL, specific to version,
  with verifiable SHA-256;
- standard package is current-user x64 NSIS, without elevation in normal flow;
- Tauri-produced NSIS accepts `/S` for silent installation;
- licence, source, release notes, and downloads are publicly available;
- `Jean Machado` was explicitly set as publisher for the next bundle;
- a validation NSIS build confirmed `MANUFACTURER = Jean Machado`, matching
  application `CompanyName` and copyright;
- current artefacts have Tauri updater signature, but no Windows-recognised
  Authenticode signature;
- v0.2.7 was published on the CI-approved commit and its public standard
  installer digest matches local SHA-256;
- the four schema-1.12.0 manifests passed `winget validate`;
- WinGet downloaded versioned asset, verified hash, and silently installed the
  application from local manifest;
- silent uninstall and manifest reinstall preserved production and legacy
  databases byte-for-byte.

Do not use v0.2.6 for first submission: it was generated before the explicit
publisher correction. Never replace its installer; create a new version to keep
URL and hash immutable.

## Code-signing certificate

v0.2.7 does not use Authenticode. [Azure Artifact Signing](https://azure.microsoft.com/pt-br/products/artifact-signing)
does not meet the zero-cost rule: official basic plan costs USD 9.99/month. The
identified free alternative is [SignPath Foundation](https://signpath.org/),
which provides no-cost signing for eligible open-source projects. Approval is
not automatic: project must meet [Foundation terms](https://signpath.org/terms.html),
integrate its verifiable build process, and accept SignPath Foundation as
certificate publisher.

SignPath application is therefore a separate increment and does not block this
release. Do not buy a commercial certificate, and do not use self-signed
certificates as replacement because other computers would not trust them.

## Gate before first submission

- [x] generate and publish v0.2.7 with corrected publisher;
- [x] confirm `ProductName`, `ProductVersion`, `CompanyName`, and `Publisher`
  in executable, installer, and uninstall registry;
- [x] confirm local SHA-256 equals public asset digest;
- [x] install as regular user with `/S`, without dialog or elevation;
- [x] confirm existing database preservation during silent test;
- [ ] install over previous version and confirm upgrade without duplicate entry;
- [x] silently uninstall with `/S` and zero exit code;
- [x] record which user data remains after uninstall;
- [x] scan standard installer with Microsoft Defender, with no threats;
- [ ] observe SmartScreen on a clean machine;
- [x] do not acquire commercial certificate; assess only trustworthy free
  option for open-source project without blocking v0.2.7;
- [x] install official WingetCreate 1.12.13.0 on this host;
- [x] generate three current-schema manifests—version, installer, defaultLocale—
  plus `en-US` locale;
- [x] use only versioned public URL for online x64 installer;
- [x] validate manifests with `winget validate --manifest`;
- [x] test `winget install --manifest` and silent uninstallation on this host,
  with final reinstall from same manifest;
- [ ] repeat installation/uninstallation in clean machine or VM; use another
  machine/VM while Windows Sandbox is unavailable on this host;
- [ ] after catalogue entry, test
  `winget uninstall --id ChronoProject.ChronoProject --exact`;
- [ ] after catalogue entry, add WinGet availability/version badge linked to
  `ChronoProject.ChronoProject` in READMEs;
- [x] check again for duplicate package and PR immediately before sending;
- [x] submit one PR containing only one package version;
- [x] accept Microsoft CLA and follow every validation check.

Source manifests are in:

```text
packaging/winget/manifests/c/ChronoProject/ChronoProject/0.2.7/
```

This path exactly mirrors `winget-pkgs` requirements. WingetCreate sent only
0.2.7 manifests to its PR, not Chrono Project documentation or other files.

Local test evidence:

| Item | Result |
| --- | --- |
| WinGet | `1.29.380` |
| WingetCreate | `1.12.13.0` |
| validation | `Manifest validation succeeded` |
| download | v0.2.7 versioned public URL |
| verified SHA-256 | `B298C57927D63AD84CDF663DFA5DEFC487F47B3696C6DB125E591026446EC455` |
| silent installation | approved |
| silent uninstallation | approved |
| reinstalled executable | v0.2.7, Jean Machado company |
| Microsoft Defender | no threat found |
| `chronoproject` database | `FB95528E5660885AF5D306B1F4066757F9591F1BB3CE36C6A873736E398218B4` |
| legacy database | `C60AE652EDFF278D5FC40BA3765B1DC93A7F54FEE3A288B8EA2FFE90DA796491` |

First set was submitted on 11 October 2026 without exposing a token in the
command line:

```powershell
wingetcreate submit `
  --prtitle "New package: ChronoProject.ChronoProject version 0.2.7" `
  packaging\winget\manifests\c\ChronoProject\ChronoProject\0.2.7
```

Without `--token`, WingetCreate requested secure GitHub authentication and
opened [microsoft/winget-pkgs#450697](https://github.com/microsoft/winget-pkgs/pull/450697).
Local manifest validation and Microsoft CLA were approved. The ten technical
catalogue stages, including installer scan, installation, and metadata, also
passed. The PR remains open and merge-ready, awaiting mandatory review by a
volunteer maintainer before publication.

## Expected installer fields

```yaml
PackageIdentifier: ChronoProject.ChronoProject
PackageVersion: <version without v prefix>
InstallerType: nullsoft
Scope: user
UpgradeBehavior: install
InstallModes:
  - interactive
  - silent
  - silentWithProgress
Installers:
  - Architecture: x64
    InstallerUrl: https://github.com/machado-jean/chrono-project/releases/download/v<version>/Chrono-Project-Windows-x64-Setup.exe
    InstallerSha256: <SHA-256 of published asset>
```

Do not publish offline installer in initial manifest: standard package is much
smaller and WebView2 is already part of Windows 11. Offline installer remains a
manual download for isolated environments.

## Future updates

Never reuse mutable `releases/latest` URL, replace a published asset, or move a
tag. Each version has its own `winget-pkgs` directory, new hash, corresponding
release notes, and complete validation. Manifest update happens only after
`main` CI, tag, and GitHub Release are consistent.
