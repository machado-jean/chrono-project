# Import, export, and backup

Phase 6 implements local offline portability through two separate layers:

- `.chronoproject` packages transport a project or workspace and allow content
  selection during import;
- `.sqlite` backups are complete snapshots for recovering the same workspace.

No operation sends data to the network. File pickers are native Windows
pickers; all reading, validation, and writing happens in the Tauri process.

## `.chronoproject` package version 1

The file is an uncompressed ZIP containing exactly `manifest.json`,
`data.sqlite`, and `README.txt`. Additional, duplicate, compressed, symbolic,
or unconfined-path entries are rejected. `attachments/` is reserved for future
work and is not accepted in version 1.

The manifest records `format`, `formatVersion`, `schemaVersion`, `appVersion`,
`exportType`, an RFC 3339 instant, database size and SHA-256, plus project and
template catalogs. Catalogs include UUID, name, update time, and item count and
are checked against actual `data.sqlite` content before preview.

Limits are 512 MiB for a package, 500 MiB for `data.sqlite`, 256 KiB for
`manifest.json`, and 64 KiB for `README.txt`. Format 1 accepts SQLite schemas
4–9. Schemas 4–8 are read from a temporary copy migrated to schema 9; the
selected file remains intact.

## Export

**Export project** creates a consistent snapshot of only the selected project,
its tasks, tags, dependencies, baselines, and referenced calendars. Global
templates and other projects are excluded. The **File** menu and sidebar
right-click entry run the same flow.

**Export workspace** includes all projects, calendars, baselines, and templates.
SQLite is copied with `VACUUM INTO`; the package is built in staging and
published to the chosen path only after completion.

## Selective import

Audit timestamps accept RFC 3339 UTC `Z` and `+00:00`; the latter normalises to
`Z` when entering the domain. Schedule dates remain `YYYY-MM-DD`.

The package is validated before selection. Per project, the user may:

- **Import** a new UUID while preserving identities;
- **Update project** for an existing UUID, fully replacing only it while
  retaining its local position;
- **Import as copy**, remapping project, task, dependency, and baseline UUIDs,
  rebuilding parents and internal relations, and appending `— imported`;
- choose **Do not import**.

Templates are individually selectable; an existing UUID is fully replaced and
a new UUID is inserted. There is no task-by-task merge: this avoids inferring
whether a missing task was deleted, hidden, or excluded and keeps hierarchy and
dependencies coherent.

Required calendars import automatically. Absent UUIDs are preserved;
semantically identical content reuses local calendars; equal UUID with different
content creates a copy and remaps only imported projects and tasks. Other local
projects are unchanged.

Before any import write, a verified backup is created. Selected projects and
templates write in one transaction; an error rolls back the entire set.

## Backup and restoration

**Create backup** uses the native Windows picker. The `.sqlite` file is built
at a temporary destination, validated by `quick_check`, foreign keys, and schema
version, then published to the selected path.

**Restore backup** is separate from selective import. After validation and a
content preview, it replaces the complete workspace in a transaction and first
creates another safety backup.

Development backups live in `.local/backups/`; distributed builds store them in
`backups/` under application configuration. **Data → More options → Open
automatic backups folder** opens this internal location in File Explorer.

## Security, integrity, and audit

Before writing, Chrono Project checks package size and entries, confined paths,
exact file set, strict manifest, date, SHA-256, `PRAGMA quick_check`,
`PRAGMA foreign_key_check`, schema, catalog, hierarchy, references, cycles,
selection, and UUID collisions. Imported content is never executed and
extraction uses bounded reading.

Manual audit: export a project then **Update project** after changing a task;
import it as an independent copy; import only one of two changed workspace
projects; and restore a backup after a change. Rust tests cover the full
workspace round-trip, deadlines, factual completion, baselines, critical-path
preference, summary predecessors, replacement, copying, unsafe ZIP rejection,
schema-4–9 compatibility, and restoration.
