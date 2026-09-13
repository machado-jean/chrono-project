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
import type { Task } from "../../domain/tasks/task";

interface ProjectPdfExportProps {
  readonly project: Project;
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly calendars: readonly Calendar[];
  readonly baselineTasks: readonly BaselineTask[];
  readonly visibleTaskIds: ReadonlySet<string>;
  readonly filtersActive: boolean;
  readonly disabled: boolean;
  readonly onSave: (suggestedName: string, bytes: readonly number[]) => Promise<string | null>;
}

const FORMAT_DESCRIPTIONS: Readonly<Record<ProjectPdfFormat, { readonly title: string; readonly description: string }>> = {
  REPORT: { title: "Relatório completo", description: "Resumo, gráficos, atividades e cronograma Gantt." },
  TASKS: { title: "Lista de atividades", description: "Tabela hierárquica com datas, progresso e predecessoras." },
  GANTT: { title: "Cronograma Gantt", description: "Linha do tempo visual para compartilhar ou imprimir." },
};

function safeFilename(name: string): string {
  return name.trim().replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, "-") || "projeto";
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
  visibleTaskIds,
  filtersActive,
  disabled,
  onSave,
}: ProjectPdfExportProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<ProjectPdfFormat>("REPORT");
  const [scope, setScope] = useState<ProjectPdfScope>("ALL");
  const [pageSize, setPageSize] = useState<ProjectPdfPageSize>("A4");
  const [includeDetails, setIncludeDetails] = useState(false);
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [timelineStart, setTimelineStart] = useState("");
  const [timelineEnd, setTimelineEnd] = useState("");
  const [message, setMessage] = useState<string | null>(null);
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
        `${safeFilename(project.name)}-${format.toLocaleLowerCase()}-projectflow`,
        Array.from(bytes),
      );
      if (path === null) return;
      setOpen(false);
      setMessage(`PDF salvo em ${path}`);
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : String(operationError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="pdf-export-trigger" type="button" disabled={disabled} onClick={showDialog}>
        Gerar PDF
      </button>
      {message !== null ? <span className="pdf-export-message" role="status">{message}</span> : null}
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
              <h2 id="pdf-export-title">Gerar PDF do projeto</h2>
              <p id="pdf-export-description">Configure uma saída pronta para compartilhar ou imprimir.</p>
            </div>
            <button type="button" aria-label="Fechar exportação PDF" disabled={busy} onClick={() => { setOpen(false); }}>×</button>
          </header>

          <fieldset className="pdf-format-options">
            <legend>Conteúdo</legend>
            {(Object.keys(FORMAT_DESCRIPTIONS) as ProjectPdfFormat[]).map((candidate) => (
              <label className={format === candidate ? "selected" : ""} key={candidate}>
                <input type="radio" name="pdf-format" value={candidate} checked={format === candidate} onChange={() => { setFormat(candidate); }} />
                <span><strong>{FORMAT_DESCRIPTIONS[candidate].title}</strong><small>{FORMAT_DESCRIPTIONS[candidate].description}</small></span>
              </label>
            ))}
          </fieldset>

          <div className="pdf-export-grid">
            <label>
              Atividades
              <select value={scope} onChange={(event) => { setScope(event.target.value as ProjectPdfScope); }}>
                <option value="ALL">Todas ({tasks.length})</option>
                <option value="VISIBLE" disabled={!filtersActive}>Visíveis pelos filtros ({visibleCount})</option>
              </select>
            </label>
            <label>
              Papel
              <select value={pageSize} onChange={(event) => { setPageSize(event.target.value as ProjectPdfPageSize); }}>
                <option value="A4">A4 paisagem</option>
                <option value="A3">A3 paisagem</option>
              </select>
            </label>
            <label>
              Cronograma de
              <input type="date" value={timelineStart} onChange={(event) => { setTimelineStart(event.target.value); }} />
            </label>
            <label>
              Cronograma até
              <input type="date" value={timelineEnd} onChange={(event) => { setTimelineEnd(event.target.value); }} />
            </label>
          </div>

          {(format === "REPORT" || format === "TASKS") ? (
            <label className="pdf-detail-option">
              <input type="checkbox" checked={includeDetails} onChange={(event) => { setIncludeDetails(event.target.checked); }} />
              Incluir descrições, responsáveis, tags e observações
            </label>
          ) : null}
          {baselineTasks.length > 0 ? (
            <label className="pdf-detail-option">
              <input type="checkbox" checked={includeBaseline} onChange={(event) => { setIncludeBaseline(event.target.checked); }} />
              Incluir plano de referência e desvios
            </label>
          ) : null}
          <p className="pdf-export-note">O PDF é gerado localmente. Nenhum dado é enviado para a internet.</p>
          {error !== null ? <p className="portability-error" role="alert">{error}</p> : null}
          <footer>
            <button type="button" className="secondary-button" data-dialog-initial-focus disabled={busy} onClick={() => { setOpen(false); }}>Cancelar</button>
            <button type="button" className="primary-button" disabled={busy || tasks.length === 0} onClick={() => { void generate(); }}>
              {busy ? "Gerando PDF…" : "Escolher local e salvar"}
            </button>
          </footer>
        </ModalDialog>
      ) : null}
    </>
  );
}
