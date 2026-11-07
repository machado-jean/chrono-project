# Security policy

Questions about data handling and storage are also covered by
[`PRIVACY.md`](PRIVACY.en.md).

## Supported versions

Security fixes target the latest stable version available in
[Releases](https://github.com/machado-jean/chrono-project/releases/latest).
Earlier versions may not receive backported fixes.

| Version | Support |
| --- | --- |
| Latest stable release | Yes |
| Earlier releases | Not guaranteed |
| Development builds | Reproduction only |

## Reporting a vulnerability

Do not open a public Issue for vulnerabilities, corruption, or data exposure.
Use **Report a vulnerability** in the repository’s Security tab:

<https://github.com/machado-jean/chrono-project/security/advisories/new>

Where possible, include:

- Chrono Project and Windows versions;
- impact and threat scenario;
- minimum reproduction steps;
- whether import, backup, SQLite, updater, or installer is involved;
- sanitised evidence.

Do not send databases, backups, or `.chronoproject` packages containing real
data. Create a minimal artificial reproduction and remove names, personal
paths, addresses, credentials, and keys.

Receipt will be acknowledged as soon as possible. Validation, severity, fix,
and coordinated disclosure depend on complexity and impact. Do not publish
details before an agreed fix or guidance exists.

## Relevant scope

Reports are especially important when they concern:

- reading or writing outside expected directories;
- path traversal or malformed import packages;
- silent SQLite corruption or data loss;
- signature bypass or an improper update;
- unwanted disclosure of local data;
- execution of imported content;
- excessive native permissions.
