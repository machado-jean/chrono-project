# ADR 020 — Signed passive updater

## Status

Implemented since v0.1.3 and recorded retrospectively on 2026-09-08. It
replaces the external download/installation part of ADR 018.

## Current decision

At startup, Chrono Project makes one query through the native Tauri Updater
plugin. When a new version exists, the **Help** menu opens automatically with
the available version and installation options. **Help > Check for updates**
remains available to repeat the query manually. The endpoint is the `latest.json`
asset of the latest release in `machado-jean/chrono-project`. The manifest
selects Windows x64 and contains version, URL, and signature. The user confirms
**Download and install update**.

The plugin verifies the signature with the embedded public key. NSIS uses
`passive`; after successful installation, the application requests restart
through the Process plugin. Failures are reported and must not request restart.
Offline download remains an external browser alternative.

Initial-query failures are silent and do not block offline operation; a manual
query still presents its error. No workspace content is sent. The database
remains in the user profile, separate from binaries.

## Keys and publication

Keep the permanent private key in secure storage outside Git. Distribute the
public key in configuration; never generate a new key merely to publish a
version. Updater signing is not an Authenticode certificate.

Publish both installers, their `.sig` files, `latest.json`, and hashes. Confirm
that signature, URL, version, and file refer to the same build. No publication
is performed without explicit authorisation.

## Evidence and limits

UI tests mock the plugin and cover success, current version, query error,
download, and signature. They do not prove actual NSIS execution. The installed
update and data-preservation test is in
[vm-validation-record.md](../vm-validation-record.md).

References: [Tauri Updater](https://v2.tauri.app/plugin/updater/),
[local configuration](../../src-tauri/tauri.conf.json), and
[implementation](../../src/components/WorkspaceHelpMenu.tsx).
