# ADR 021 — Local vector PDF reports

## Status

Accepted on 2026-09-08.

## Context

Chrono Project must share tasks and charts without requiring recipients to
install the application. Output must remain offline, respect hierarchy and
filters, and use the native Windows file picker.

Established tools informed the design:

- OpenProject offers table, report, and Gantt PDFs with paper and scale
  configuration;
- Smartsheet permits all rows or the visible selection, Gantt range,
  orientation, paper, and fit;
- Microsoft Project treats the timeline as an executive view suitable for
  printing.

Official references:

- [OpenProject — exporting work packages](https://www.openproject.org/docs/user-guide/work-packages/exporting/)
- [Smartsheet — PDF options](https://help.smartsheet.com/articles/2482464-pdf-print-options)
- [Microsoft Project — printing the timeline](https://support.microsoft.com/en-US/project/print-the-timeline-in-project)

## Decision

Use `pdfmake` 0.3.11 and `@types/pdfmake` 0.3.3, both MIT and local to the
project. The library creates tables and vectors in WebView2 without a server,
external executable, or connection. The frontend builds an immutable project
projection; Rust only validates the PDF envelope, limits the file to 50 MB,
opens the native picker, and writes bytes to the user-chosen location.

Three formats are offered:

1. full report: indicators, charts, table, and Gantt;
2. task list: hierarchical table and optional details;
3. Gantt schedule: static vector timeline.

Scope can use every task or the filter-visible projection. Landscape A4/A3 and
a configurable time range avoid screenshots and retain selectable text.

## Consequences

- No data is sent to external services.
- PDFs are not part of backup and do not change SQLite schema.
- The library and embedded fonts increase the bundle; the module loads only
  when the user creates a PDF.
- PDF Gantt is a static projection, not a second interactive renderer.
- FS links appear textually in the table. Drawing arrows across pages and
  exporting only an arbitrary selection remain future work.
