# PDF reports

Chrono Project creates PDF documents entirely on the user’s computer. Open a
project and select **Generate PDF** in its header.

## Formats

- **Full report:** count and completion indicators, status/priority
  distribution, task list, and Gantt schedule.
- **Task list:** hierarchy, status, priority, dates, duration, progress, and
  predecessors. Description, assignee, tags, and notes can be included.
- **Gantt schedule:** vector bars for tasks and summaries with overlaid
  progress. The heading shows weekday on the first line and day number below
  (`MON` / `10`). Vertical lines mark dates, alternating columns aid tracking
  many rows, and weekends have a distinct background. FS dependencies use
  elbows and arrows; a dashed line entering the edge indicates an origin outside
  page or selected period. Legend uses vector samples for task, summary,
  criticality, near-critical status, weekend, dependency, and baseline when
  present.

When critical-path analysis is available, the report includes critical and
near-critical task counts and final-target margin. In Gantt, critical tasks use
a solid red outline and near-critical tasks a dashed purple outline. With more
than 18 activities, each Gantt page repeats the task header and date scale.

## Options

- all tasks or only those visible under current filters;
- A4 or A3 paper, always landscape;
- schedule-window start and end;
- optional text details;
- optional comparison with the active baseline, showing planned/current dates
  and working-day variance; deadline and health also appear in the list.

When comparison is selected, Gantt draws a thin grey approved-plan bar behind
the current bar. The option appears only for projects with an active baseline.

The time range frames the chart but does not remove tasks. Unscheduled or
out-of-window items receive a textual indication. The native picker chooses
name and folder before saving. After saving, a floating confirmation shows the
file name; full path is available as a hint and does not move header controls.

## Content and privacy

The report uses a snapshot of current project state. It is not a backup, cannot
be reimported, and does not change data. Generation is offline and uses neither
telemetry nor remote services.

## Delivery limits

- FS dependencies also appear by name in the table; cross-page relations are
  indicated at the edge, without a continuous line over the physical break;
- hierarchy is always expanded in the document;
- there is no custom header or logo;
- PDFs over 50 MB are rejected before saving.

Architecture and product references are in
[ADR 021](decisions/021-local-pdf-reports.en.md).
