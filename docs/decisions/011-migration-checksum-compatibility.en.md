# ADR 011 — Controlled compatibility for migration 3 checksum

- Status: accepted
- Date: 2026-08-28

## Context

Migration 3 existed in local builds with two byte representations. The known
difference is limited to Portuguese translations of internal messages in four
triggers; tables, columns, indexes, constraints, and trigger behaviour are
equivalent. An earlier release included the translated variant and refused to
open an existing canonical database.

SQLx records a SHA-384 checksum of each complete migration text. A database
initially created by either representation can therefore carry the alternate
hash. Deleting or recreating a database to resolve that divergence could erase
projects and tasks used in auditing.

## Decision

`0003_scheduling.sql` remains immutable in its canonical representation, whose
checksum is:

```text
1617ADF38E69528743AE170C2D96C1544E5FE4E1C43784C104DAA8F1089FAB098DFF734928DBD6A76663CCB5D3926AA2
```

The native layer runs a compatibility check before SQL plugin initialisation. It
recognises only the known legacy variant:

```text
B0235D131954F693E45862FBDCFE8CB773D61E059058DB8CC3D8985D0786F8BB53C9B2EBB1A5E8162B1D95ED0553EA35
```

Only when that checksum is present, the process:

1. runs `PRAGMA quick_check`;
2. validates the three applied migrations and their expected checksums;
3. compares the complete schema with a reference created by canonical
   migrations, normalising only the two known messages in the four triggers;
4. validates the logical version and structural data seeded by migration 3;
5. creates a consistent SQLite backup with `VACUUM INTO` under
   `%APPDATA%\io.github.machadojean.chronoproject\backups\`;
6. opens a transaction and updates only checksum row 3 in `_sqlx_migrations`,
   conditional on the legacy value still being present;
7. confirms the new checksum and runs `PRAGMA quick_check` again.

Projects, tasks, dependencies, calendars, and all other business data are not
changed. An unknown checksum, history, or schema stops initialisation without
writing to the database.

## Rejected alternatives

- Delete or recreate the database: this would lose real test data.
- Keep the translated variant as the official migration: this would only invert
  which databases fail to open.
- Update any checksum found: this would hide schema changes and violate
  migration integrity.
- Edit the database manually: this would not be reproducible, testable, or safe
  for other profiles.

## Consequences

- The repair is automatic and idempotent for the one known divergence.
- The copy made before repair remains available for recovery.
- `0003_scheduling.sql` cannot receive further edits; future changes require a
  newly numbered migration.
- Rust tests cover canonical databases, the known variant with preserved data
  and backup, unknown checksums, and divergent schema.
