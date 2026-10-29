import { useMemo, useState } from "react";

import { ModalDialog } from "../../components/ModalDialog";
import type { Project } from "../../domain/projects/project";
import type { Calendar } from "../../domain/calendars/calendar";
import type { BaselineTask } from "../../domain/planning/baseline";
import {
  buildProjectReport,
  type ProjectPdfFormat,
  type ProjectPdfPageSize,
  type ProjectPdfScope,
} from "../../domain/reporting/project-report";
import { generateProjectPdf } from "../../domain/reporting/project-report-pdf";
import type { TaskDependency } from "../../domain/scheduling/dependency";
import type { CriticalPathAnalysis } from "../../domain/scheduling/critical-path";
import type { Task } from "../../domain/tasks/task";
import { useLanguage } from "../../i18n/language";

interface ProjectPdfExportProps {
  readonly project: Project;
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly calendars: readonly Calendar[];
  readonly baselineTasks: readonly BaselineTask[];
  readonly criticalPath: CriticalPathAnalysis;
  readonly visibleTaskIds: ReadonlySet<string>;
  readonly filtersActive: boolean;
  readonly disabled: boolean;
  readonly onSave: (suggestedName: string, bytes: readonly number[]) => Promise<string | null>;
}

const FORMAT_FILE_SUFFIX: Readonly<Record<ProjectPdfFormat, string>> = {
  REPORT: "relatorio",
  TASKS: "atividades",
  GANTT: "gantt",
};

function safeFilename(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "projeto";
}

function filenameFromPath(path: string): string {
  return path.split(/[\\/]/).at(-1) || path;
}

function scheduleBoundary(tasks: readonly Task[], boundary: "startDate" | "endDate"): string {
  const dates = tasks.flatMap((task) => task[boundary] === null ? [] : [task[boundary]]).sort();
  return boundary === "startDate" ? dates[0] ?? "" : dates.at(-1) ?? "";
}

export function ProjectPdfExport({
  project,
  tasks,
  dependencies,
  calendars,
  baselineTasks,
  criticalPath,
  visibleTaskIds,
  filtersActive,
  disabled,
  onSave,
}: ProjectPdfExportProps) {
  const { t } = useLanguage();
  const formatDescriptions: Readonly<Record<ProjectPdfFormat, { readonly title: string; readonly description: string }>> = {
    REPORT: { title: t("pdf.format.report.title"), description: t("pdf.format.report.description") },
    TASKS: { title: t("pdf.format.tasks.title"), description: t("pdf.format.tasks.description") },
    GANTT: { title: t("pdf.format.gantt.title"), description: t("pdf.format.gantt.description") },
  };
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ProjectPdfFormat>("REPORT");
  const [scope, setScope] = useState<ProjectPdfScope>("ALL");
  const [pageSize, setPageSize] = useState<ProjectPdfPageSize>("A4");
  const [includeDetails, setIncludeDetails] = useState(false);
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [timelineStart, setTimelineStart] = useState("");
  const [timelineEnd, setTimelineEnd] = useState("");
  const [message, setMessage] = useState<{ readonly filename: string; readonly path: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visibleCount = useMemo(
    () => tasks.filter((task) => visibleTaskIds.has(task.id)).length,
    [tasks, visibleTaskIds],
  );

  const showDialog = (): void => {
    setTimelineStart(scheduleBoundary(tasks, "startDate"));
    setTimelineEnd(scheduleBoundary(tasks, "endDate"));
    setScope(filtersActive ? "VISIBLE" : "ALL");
    setError(null);
    setOpen(true);
  };

  const generate = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const report = buildProjectReport({
        project,
        tasks,
        dependencies,
        calendars,
        baselineTasks,
        criticalPath,
        visibleTaskIds,
        options: {
          format,
          scope,
          pageSize,
          includeDetails,
          includeBaseline,
          timelineStart: timelineStart.length === 0 ? null : timelineStart,
          timelineEnd: timelineEnd.length === 0 ? null : timelineEnd,
        },
      });
      const bytes = await generateProjectPdf(report);
      const path = await onSave(
        `${safeFilename(project.name)}-${FORMAT_FILE_SUFFIX[format]}`,
        Array.from(bytes),
      );
      if (path === null) return;
      setOpen(false);
      setMessage({ filename: filenameFromPath(path), path });
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : String(operationError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="secondary-button pdf-export-trigger" type="button" disabled={disabled} onClick={showDialog}>
        {t("pdf.generate")}
      </button>
      {message !== null ? (
        <span className="pdf-export-message" role="status" title={`${t("pdf.saved")} ${message.path}`}>
          {t("pdf.saved")} <span>{message.filename}</span>
        </span>
      ) : null}
      {open ? (
        <ModalDialog
          className="pdf-export-dialog"
          labelledBy="pdf-export-title"
          describedBy="pdf-export-description"
          closeDisabled={busy}
          onClose={() => { setOpen(false); }}
        >
          <header>
            <div>
              <h2 id="pdf-export-title">{t("pdf.title")}</h2>
              <p id="pdf-export-description">{t("pdf.description")}</p>
            </div>
            <button type="button" aria-label={t("pdf.close")} disabled={busy} onClick={() => { setOpen(false); }}>×</button>
          </header>

          <fieldset className="pdf-format-options">
            <legend>{t("pdf.content")}</legend>
            {(Object.keys(formatDescriptions) as ProjectPdfFormat[]).map((candidate) => (
              <label className={format === candidate ? "selected" : ""} key={candidate}>
                <input type="radio" name="pdf-format" value={candidate} checked={format === candidate} onChange={() => { setFormat(candidate); }} />
                <span><strong>{formatDescriptions[candidate].title}</strong><small>{formatDescriptions[candidate].description}</small></span>
              </label>
            ))}
          </fieldset>

          <div className="pdf-export-grid">
            <label>
              {t("pdf.tasks")}
              <select value={scope} onChange={(event) => { setScope(event.target.value as ProjectPdfScope); }}>
                <option value="ALL">{t("pdf.allTasks")} ({tasks.length})</option>
                <option value="VISIBLE" disabled={!filtersActive}>{t("pdf.visibleTasks")} ({visibleCount})</option>
              </select>
            </label>
            <label>
              {t("pdf.paper")}
              <select value={pageSize} onChange={(event) => { setPageSize(event.target.value as ProjectPdfPageSize); }}>
                <option value="A4">A4 {t("pdf.landscape")}</option>
                <option value="A3">A3 {t("pdf.landscape")}</option>
              </select>
            </label>
            <label>
              {t("pdf.scheduleFrom")}
              <input type="date" value={timelineStart} onChange={(event) => { setTimelineStart(event.target.value); }} />
            </label>
            <label>
              {t("pdf.scheduleTo")}
              <input type="date" value={timelineEnd} onChange={(event) => { setTimelineEnd(event.target.value); }} />
            </label>
          </div>

          {(format === "REPORT" || format === "TASKS") ? (
            <label className="pdf-detail-option">
              <input type="checkbox" checked={includeDetails} onChange={(event) => { setIncludeDetails(event.target.checked); }} />
              {t("pdf.includeDetails")}
            </label>
          ) : null}
          {baselineTasks.length > 0 ? (
            <label className="pdf-detail-option">
              <input type="checkbox" checked={includeBaseline} onChange={(event) => { setIncludeBaseline(event.target.checked); }} />
              {t("pdf.includeBaseline")}
            </label>
          ) : null}
          <p className="pdf-export-note">{t("pdf.localOnly")}</p>
          {error !== null ? <p className="portability-error" role="alert">{error}</p> : null}
          <footer>
            <button type="button" className="secondary-button" data-dialog-initial-focus disabled={busy} onClick={() => { setOpen(false); }}>{t("pdf.cancel")}</button>
            <button type="button" className="primary-button" disabled={busy || tasks.length === 0} onClick={() => { void generate(); }}>
              {busy ? t("pdf.generating") : t("pdf.save")}
            </button>
          </footer>
        </ModalDialog>
      ) : null}
    </>
  );
}
