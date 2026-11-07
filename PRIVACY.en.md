# Privacy

## Principle

Chrono Project is local-first. Projects, tasks, calendars, templates, history,
backups, and preferences remain on the user’s computer. The application does
not require an account and has no backend of its own.

## Stored data

The current installation keeps its workspace at:

```text
%APPDATA%\chronoproject\chronoproject.sqlite
```

Automatic backups remain under the same profile, while technical logs are at
`%LOCALAPPDATA%\chronoproject\logs\`. `.chronoproject` exports, manually
selected backups, and PDFs are written only to a location selected by the user.

These files can contain project and task names, assignees, descriptions, notes,
and other information entered by the user. The user controls access, copies,
and sharing of those files.

## Network and telemetry

Chrono Project sends no telemetry, project content, or usage metrics. Normal
use works offline after installation.

Network access is limited to explicit actions or contingencies:

- **Help > Check for updates** queries the public GitHub release;
- downloading or installing an update fetches the published installer and
  verifies its signature;
- the standard installer may download official WebView2 when it is absent;
- external links and WinGet installation use services chosen by the user.

Those operations can expose ordinary connection data, such as IP address and
user agent, to the respective providers under their own policies. Chrono
Project does not add workspace content to those requests.

## Retention and deletion

Uninstalling removes binaries but preserves profile data to avoid silent loss.
To delete data permanently, first make the desired backup, uninstall the app,
then remove the data and log directories manually.

Updates and reinstallation must not delete the database. Earlier profiles are
not merged automatically with the current profile.

## Reports and support

Do not send real databases, backups, exports, or logs in public Issues. Use
artificial data and remove names, paths, credentials, and customer information.
Report vulnerabilities or possible data exposure through the private channel
described in [SECURITY.md](SECURITY.en.md).

## Changes to this policy

Any change that introduces telemetry, accounts, synchronisation, or a remote
service requires an explicit decision, documentation, and communication before
activation.
