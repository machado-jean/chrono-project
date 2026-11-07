# Windows installation and maintenance

Installers register `Jean Machado` as publisher in **Installed apps**. This NSIS
metadata is independent from Authenticode: published `.sig` files validate the
Tauri updater but do not replace a Windows-recognised code-signing certificate.

## Scope

V1 targets Windows 11 x64. End users do not install Node.js, npm, Rust, Cargo,
Git, Visual Studio Build Tools, or SQLite. Application and database are local
and continue working offline after installation.

## Artifacts

### Standard installer

```powershell
npm run tauri:build:installer
```

Creates an NSIS installer in `src-tauri\target\release\bundle\nsis\`. This is
the primary Windows 11 option. If necessary WebView2 is absent, it silently
downloads Microsoft’s official bootstrapper; that contingency requires internet.

### Offline installer

```powershell
npm run tauri:build:installer:offline
```

Creates NSIS in the same directory but embeds the complete WebView2 installer.
It is substantially larger and prepares a machine without internet. Both builds
have the same file name, so copy the first artifact elsewhere before generating
the second if retaining both.

## Installation

1. Close Chrono Project if open.
2. Run `Chrono-Project_*_x64-setup.exe`.
3. Complete the wizard in the Windows-suggested language.
4. Open Chrono Project through Start.

Installation is current-user only and should not require administrator
privileges. NSIS also supports automated silent installation:

```powershell
.\Chrono-Project-Windows-x64-Setup.exe /S
```

It must exit with code `0`. Obtain its effective path from the Windows
uninstall entry rather than assuming a fixed directory.

## Updating and retaining data

When graphical setup finds an earlier version, Portuguese UI explicitly marks
**Update without uninstalling (recommended)** as preserving installation. The
same version offers **Repair installation**. Downgrades remain blocked.

Use **Help > Check for updates**. The query occurs only then and compares the
installed version with latest stable `latest.json`. When newer, **Download and
install update** downloads NSIS, verifies its signature, and starts passive
installation. Chrono Project closes while binaries change and restarts after.

Offline remains manual browser download because updater uses the smaller
standard package. Normal use needs neither internet nor a development runtime.
The installer updates binaries; database, backups, and logs remain in the user
profile, separate from the executable.

Production database resolves at:

```text
%APPDATA%\chronoproject\chronoproject.sqlite
```

Before a major update, use **File > Backup and portability** to create a manual
backup. The identifier became `chronoproject` after 0.2.2, changing data
directory and installer identity. Updating from an earlier version requires
export/backup before the change, uninstalling the old entry if separately
listed, and restoring data in the new installation; profiles are not merged.

The private updater key is not included in app, installer, or Git. Only the
validation public key is distributed; retain the permanent private key outside
the repository as a release-environment secret.

## Uninstallation

Use **Settings > Apps > Installed apps > Chrono Project > Uninstall**. NSIS
removes application binaries but preserves profile data; back up before major
maintenance and manually review data directory to remove it too.

Silent uninstall uses NSIS’s registered executable:

```powershell
& '<registered path>\uninstall.exe' /S
```

In v0.2.7 validation, silent installation and removal returned `0`; application
directory was removed and legacy user database was preserved byte-for-byte.

## Clean-machine validation checklist

- Windows 11 x64 without Node, Rust, Git, or Build Tools;
- install connected standard package;
- create project, tasks, and backup; close and reopen;
- install a newer version and confirm database preservation;
- uninstall and record data behaviour;
- repeat offline with offline package;
- confirm opening, persistence, backup/restoration, and no remote calls needed
  by primary UI;
- confirm no GitHub query on startup and manual action reports current or newer
  version;
- record Windows/WebView2 versions, package sizes, and evidence.

This clean-machine proof cannot be replaced by a development-computer test.

## Post-publication gate

After tag and release, run the verifier in
[`release process`](release-process.md). It confirms the tag points to
the `main` CI-approved commit and no redundant quality-gate run was created.
