# Troubleshooting

Always preserve data first. Do not uninstall, delete folders, or replace SQLite
before copying the existing file.

## Application does not open

Confirm no `chrono-project.exe` is stuck in Task Manager, restart Windows,
confirm Windows 11 x64 and the correct installer, and repair installation by
running the same-version installer. Preserve database and logs before opening
an Issue. Data and binaries are separate; repair must not remove the database.

## White screen or incomplete interface

Update WebView2 Evergreen through Microsoft’s official mechanism. In an
isolated environment reinstall with Chrono Project offline setup. Do not
install WebView2 Fixed Version or globally downgrade it automatically; record
Windows, WebView2, and Chrono Project versions.

## Update does not appear

Use **Help > Check for updates**. Confirm GitHub access and compare Help’s
version with the [stable release](https://github.com/machado-jean/chrono-project/releases/latest).
Offline setup remains available for manual update. Never move a tag or replace
a published asset to correct an update.

## Standard installer accesses the internet

The standard package uses Windows-provided WebView2 and may download Microsoft’s
official bootstrapper when absent. For fully offline installation use
`Chrono-Project-Windows-x64-Offline-Setup.exe`.

## Where is my data?

```text
Database: %APPDATA%\chronoproject\chronoproject.sqlite
Backups:  %APPDATA%\chronoproject\backups\
Logs:     %LOCALAPPDATA%\chronoproject\logs\
```

Versions through 0.2.2 can use `%APPDATA%\io.github.machadojean.chronoproject\`.
Profiles are not silently merged: export/backup through the old version and
restore through the current one.

## Migration or database error

Do not manually edit `_sqlx_migrations`, schema, or checksum. With the app
closed, copy the database and any `-wal`/`-shm` files; retain full error and
version; restore only through **File > Backup and portability**; never publicly
attach a real database. Conservative compatibility exists for one known checksum
variant; all other cases must fail without changing business data.

## Changes or dates behaved unexpectedly

Wait for **Saving…** to disappear. Correct an error or pending value and use
**Save**; incomplete dates, cycles, duplicate relations, and hierarchy above
five levels are rejected. For moved dates, check predecessors/lag, effective
calendar/holidays, `AUTO`/`MANUAL` lock, changed summary descendants, and
**Edit** history. Deadlines and project target never move tasks.

## Import, restoration, and reports

Do not rename arbitrary ZIPs to `.chronoproject`; it needs valid manifest,
schema, hash, and structure. Rejected import must not change workspace.
Restoration requires sound SQLite backup and replaces all workspace only after
confirmation. A useful bug report includes versions, installer type, minimum
artificial-data steps, error/log excerpt, and restart result. Never publish
real databases, backups, paths, credentials, or customer data. Vulnerabilities
follow [SECURITY.md](../SECURITY.en.md).
