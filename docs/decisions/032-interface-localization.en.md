# ADR 032 — Interface localisation

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Chrono Project began with its entire interface in Brazilian Portuguese. The
application is also distributed to users who work in English; mixing fixed text
inside components made this evolution inconsistent and difficult to test.

## Decision

The interface uses a local message catalog, initially for `pt-BR` and `en`.
Brazilian Portuguese is the default. Selection exists only in local browser
storage (`chrono-project.language`), applies immediately, and updates the
document `lang` attribute. No project data is translated: titles, descriptions,
assignees, tags, and other data entered by users remain unchanged.

On first opening, with no persisted preference, the application uses the system
language exposed by WebView2 when it is Portuguese or English; unsupported
languages use `pt-BR` as fallback. After the first manual choice, the local
preference always wins.

There is no remote service, telemetry, or translation download. New UI text
must enter the typed catalog; statuses, priorities, project states, and view
names use the same mappers in every view.

PDF is an extension of the exported interface: when generated, it receives the
selected language and translates its headings, metrics, statuses, priorities,
Gantt legend, metadata, and pagination. User-written data remains intact.

## Consequences

- The interface remains fully offline.
- Preference is specific to the machine/profile and does not alter SQLite.
- Tests must preserve the `pt-BR` default and cover language switching and
  restoration.
- ADR 007 no longer represents language exclusivity and remains historical
  context for the initial choice.

## Validation

- Selecting English from the **Language** menu updates menus and labels without
  restart.
- Closing and opening the application retains the choice.
- Switching back to Portuguese (Brazil) restores PT-BR text.
- Generating PDF in English produces English headings, legend, and pagination.
- `npm run typecheck` and language-component tests pass.
