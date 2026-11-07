# ADR 027 — Simplified application identifier

## Status

Accepted and implemented since version 0.2.3.

## Context

Through version 0.2.2, Tauri used identifier
`io.github.machadojean.chronoproject`. On Windows, that value also appeared in
configuration, WebView data, and log directories. The identity was valid but
exposed an unnecessarily long technical name to the user.

The identifier is part of package identity. Changing it is therefore not merely
renaming a folder: Windows and the installer may recognise the next version as a
different application from the previous installation.

## Decision

Use `chronoproject` as the Tauri identifier. Production data is resolved by
Tauri at:

```text
%APPDATA%\chronoproject\chronoproject.sqlite
```

Development builds continue to use `.local/data/chronoproject.sqlite`, and E2E
continues to use disposable isolated databases in `.local/e2e`.

There is no silent migration between identifiers. Before updating, users must
create a backup or export the workspace from the earlier version and restore the
data after installing the new version. If the earlier installation remains
listed separately in Windows, it must be uninstalled after backup.

## Consequences

- The directory visible to users is short and aligned with the product name.
- A new installation does not access or overwrite the old-identifier database.
- The two profiles can coexist until the user completes restoration and manual
  cleanup.
- The release checklist must test installation and update as an identity change,
  in addition to ordinary database and updater flows.
- Artifacts published through version 0.2.2 remain unchanged.
