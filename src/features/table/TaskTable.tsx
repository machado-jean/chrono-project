import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, type SyntheticEvent, type WheelEvent } from "react";

import type { Calendar } from "../../domain/calendars/calendar";
import { isWorkingDay } from "../../domain/calendars/working-calendar";
import {
  compareTaskWithBaseline,
  type BaselineTask,
  type ScheduleHealth,
} from "../../domain/planning/baseline";
import type { TaskDependency } from "../../domain/scheduling/dependency";
import {
  previewDependencyImpact,
  type DependencyImpactPreview,
} from "../../domain/scheduling/dependency-impact";
import { applyScheduleEdit, type ScheduleEdit } from "../../domain/scheduling/schedule-edit";
import type { SchedulingConflict } from "../../domain/scheduling/scheduler";
import { requireDateOnly } from "../../domain/shared/validation";
import { ContextMenu, type ContextMenuItem } from "../../components/ContextMenu";
import {
  clipboardErrorMessage,
  copyTextSelection,
  isEditableTextControl,
  pasteTextSelection,
  selectionFromControl,
  type TextSelection,
} from "../../components/text-clipboard";
import {
  canTaskHaveChild,
  collectTaskTreeIds,
  flattenVisibleTasks,
  type VisibleTask,
} from "../../domain/tasks/hierarchy";
import {
  buildTaskOutlineNumbers,
  taskOutlineLabel,
  titleWithoutMatchingOutline,
} from "../../domain/tasks/outline-number";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type SchedulingMode,
  type TaskStatus,
  validateTask,
} from "../../domain/tasks/task";
import { taskSaveWasCancelled, type TaskSaveResult } from "../../domain/tasks/task-save";
import { ModalDialog } from "../../components/ModalDialog";

interface TaskTableProps {
  readonly tasks: readonly Task[];
  readonly visibleTaskIds?: ReadonlySet<string>;
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly dependencies: readonly TaskDependency[];
  readonly conflicts: readonly SchedulingConflict[];
  readonly baselineTasks: readonly BaselineTask[];
  readonly disabled: boolean;
  readonly onCreate: (input: { readonly title: string; readonly parentId: string | null; readonly parentDependencyPolicy?: "KEEP" | "TRANSFER" | "REMOVE" }) => Promise<Task | null>;
  readonly onSave: (
    task: Task,
    dependencyUpdates: readonly TaskDependency[],
  ) => Promise<TaskSaveResult>;
  readonly onSetSchedulingMode: (
    taskIds: readonly string[],
    schedulingMode: SchedulingMode,
  ) => Promise<boolean>;
  readonly onMove: (taskId: string, direction: "up" | "down") => Promise<boolean>;
  readonly onDelete: (taskId: string) => Promise<boolean>;
  readonly onCreateDependency: (input: { readonly predecessorId: string; readonly successorId: string; readonly lagDays: number }) => Promise<TaskDependency | null>;
  readonly onDeleteDependency: (dependencyId: string) => Promise<boolean>;
  readonly onDuplicate: (taskId: string, includeDescendants: boolean) => Promise<Task | null>;
  readonly onCreateTemplate: (input: {
    readonly rootTaskId: string;
    readonly name: string;
    readonly description: string | null;
  }) => Promise<unknown>;
}

interface TableColumnHeaderProps {
  readonly label: string;
  readonly help: string;
  readonly className?: string;
  readonly alignTooltip?: "center" | "left" | "right";
  readonly resizeHandle?: ReactNode;
}

function TableColumnHeader({ label, help, className, alignTooltip = "center", resizeHandle }: TableColumnHeaderProps) {
  const helpId = useId();
  return (
    <th className={className}>
      <span className="table-column-heading">
        <span>{label}</span>
        <span
          className="table-column-help"
          tabIndex={0}
          aria-label={`Informação sobre ${label}`}
          aria-describedby={helpId}
        >
          i
          <span
            id={helpId}
            className={`table-column-help-text tooltip-${alignTooltip}`}
            role="tooltip"
          >
            {help}
          </span>
        </span>
      </span>
      {resizeHandle}
    </th>
  );
}

const TASK_COLUMN_WIDTH_STORAGE_KEY = "chrono-project.task-table.task-column-width";
const DEFAULT_TASK_COLUMN_WIDTH = 380;
const MIN_TASK_COLUMN_WIDTH = 300;
const MAX_TASK_COLUMN_WIDTH = 760;

function clampTaskColumnWidth(width: number): number {
  return Math.min(MAX_TASK_COLUMN_WIDTH, Math.max(MIN_TASK_COLUMN_WIDTH, Math.round(width)));
}

function initialTaskColumnWidth(): number {
  try {
    const storedWidth = Number(window.localStorage.getItem(TASK_COLUMN_WIDTH_STORAGE_KEY));
    return Number.isFinite(storedWidth) && storedWidth > 0
      ? clampTaskColumnWidth(storedWidth)
      : DEFAULT_TASK_COLUMN_WIDTH;
  } catch {
    return DEFAULT_TASK_COLUMN_WIDTH;
  }
}

interface DependencyLagEditorProps {
  readonly dependency: TaskDependency;
  readonly predecessorTitle: string;
  readonly lagDays: number;
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly onChange: (lagDays: number) => void;
  readonly onDelete: (dependencyId: string) => Promise<boolean>;
}

function DependencyLagEditor({
  dependency,
  predecessorTitle,
  lagDays,
  dirty,
  disabled,
  onChange,
  onDelete,
}: DependencyLagEditorProps) {
  return (
    <li className={`dependency-item${dirty ? " dirty" : ""}`}>
      <span title={`${predecessorTitle} · Término para Início`}>{predecessorTitle}</span>
      <label>
        <span className="sr-only">Intervalo em dias úteis</span>
        <input
          type="number"
          min={0}
          value={lagDays}
          disabled={disabled}
          aria-label={`Intervalo após ${predecessorTitle}`}
          onChange={(event) => { onChange(Number(event.target.value)); }}
        />
        d
      </label>
      <button className="dependency-remove" type="button" title="Remover predecessora" aria-label={`Remover predecessora ${predecessorTitle}`} disabled={disabled} onClick={() => { void onDelete(dependency.id); }}>×</button>
    </li>
  );
}

interface PredecessorCellProps {
  readonly task: Task;
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly lagDrafts: Readonly<Record<string, number>>;
  readonly isSummary: boolean;
  readonly disabled: boolean;
  readonly selectRef: RefObject<HTMLSelectElement | null>;
  readonly onCreate: TaskTableProps["onCreateDependency"];
  readonly onLagChange: (dependencyId: string, lagDays: number) => void;
  readonly onDelete: TaskTableProps["onDeleteDependency"];
}

function PredecessorCell({
  task,
  tasks,
  dependencies,
  calendars,
  projectCalendarId,
  lagDrafts,
  isSummary,
  disabled,
  selectRef,
  onCreate,
  onLagChange,
  onDelete,
}: PredecessorCellProps) {
  const [predecessorId, setPredecessorId] = useState("");
  const [lagDays, setLagDays] = useState(0);
  const [pendingImpact, setPendingImpact] = useState<{
    readonly action: "ADD" | "REMOVE";
    readonly dependency: TaskDependency;
    readonly preview: DependencyImpactPreview;
  } | null>(null);
  const taskById = new Map(tasks.map((candidate) => [candidate.id, candidate]));
  const outlineNumbers = buildTaskOutlineNumbers(tasks);
  const existing = dependencies.filter((dependency) => dependency.successorId === task.id);
  const existingIds = new Set(existing.map((dependency) => dependency.predecessorId));
  const available = tasks.filter(
    (candidate) =>
      candidate.id !== task.id && !existingIds.has(candidate.id),
  );

  if (isSummary) return <span className="summary-dependency-label">Datas derivadas</span>;

  const commitAddDependency = async (): Promise<void> => {
    if (predecessorId.length === 0) return;
    const created = await onCreate({ predecessorId, successorId: task.id, lagDays });
    if (created !== null) {
      setPredecessorId("");
      setLagDays(0);
    }
  };

  const addDependency = async (): Promise<void> => {
    if (predecessorId.length === 0) return;
    const predecessorIsSummary = tasks.some((candidate) => candidate.parentId === predecessorId);
    if (!predecessorIsSummary) {
      await commitAddDependency();
      return;
    }
    const timestamp = new Date().toISOString();
    const dependency: TaskDependency = {
      id: crypto.randomUUID(), projectId: task.projectId, predecessorId,
      successorId: task.id, type: "FS", lagDays, createdAt: timestamp, updatedAt: timestamp,
    };
    setPendingImpact({
      action: "ADD",
      dependency,
      preview: previewDependencyImpact({
        tasks, dependencies, calendars, projectCalendarId, dependency, action: "ADD",
      }),
    });
  };

  const deleteDependency = async (dependency: TaskDependency): Promise<void> => {
    const predecessorIsSummary = tasks.some(
      (candidate) => candidate.parentId === dependency.predecessorId,
    );
    if (!predecessorIsSummary) {
      await onDelete(dependency.id);
      return;
    }
    setPendingImpact({
      action: "REMOVE",
      dependency,
      preview: previewDependencyImpact({
        tasks, dependencies, calendars, projectCalendarId, dependency, action: "REMOVE",
      }),
    });
  };

  const confirmImpact = async (): Promise<void> => {
    const pending = pendingImpact;
    if (pending === null) return;
    setPendingImpact(null);
    if (pending.action === "ADD") await commitAddDependency();
    else await onDelete(pending.dependency.id);
  };

  return (
    <div className="predecessor-cell">
      {existing.length === 0 ? <span className="muted-text">Nenhuma</span> : (
        <ul>
          {existing.map((dependency) => (
            <DependencyLagEditor
              key={`${dependency.id}-${dependency.updatedAt}`}
              dependency={dependency}
              predecessorTitle={
                taskById.has(dependency.predecessorId)
                  ? taskOutlineLabel(taskById.get(dependency.predecessorId) as Task, outlineNumbers)
                  : "Tarefa removida"
              }
              lagDays={lagDrafts[dependency.id] ?? dependency.lagDays}
              dirty={(lagDrafts[dependency.id] ?? dependency.lagDays) !== dependency.lagDays}
              disabled={disabled}
              onChange={(lagDays) => { onLagChange(dependency.id, lagDays); }}
              onDelete={async () => { await deleteDependency(dependency); return true; }}
            />
          ))}
        </ul>
      )}
      <div className="dependency-add">
        <select ref={selectRef} aria-label={`Nova predecessora de ${task.title}`} value={predecessorId} disabled={disabled || available.length === 0} onChange={(event) => { setPredecessorId(event.target.value); }}>
          <option value="">Adicionar…</option>
          {available.map((candidate) => <option key={candidate.id} value={candidate.id}>{taskOutlineLabel(candidate, outlineNumbers)}</option>)}
        </select>
        <input type="number" min={0} value={lagDays} aria-label={`Novo intervalo de ${task.title}`} title="Intervalo: 0 inicia no mesmo dia do fim; 1 no próximo dia útil" disabled={disabled || predecessorId.length === 0} onChange={(event) => { setLagDays(Number(event.target.value)); }} />
        <button className="dependency-add-button" type="button" aria-label={`Confirmar predecessora de ${task.title}`} title="Adicionar predecessora" disabled={disabled || predecessorId.length === 0} onClick={() => { void addDependency(); }}>+</button>
      </div>
      {pendingImpact === null ? null : (
        <ModalDialog
          className="template-dialog dependency-impact-dialog"
          labelledBy="dependency-impact-title"
          describedBy="dependency-impact-description"
          onClose={() => { setPendingImpact(null); }}
        >
          <div>
            <h2 id="dependency-impact-title">Prévia do impacto no cronograma</h2>
            <p id="dependency-impact-description">
              {pendingImpact.action === "ADD" ? "Adicionar" : "Remover"} a tarefa-resumo como predecessora
              {pendingImpact.preview.changes.length === 0
                ? " não altera as datas atuais."
                : ` altera ${String(pendingImpact.preview.changes.length)} tarefa${pendingImpact.preview.changes.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          {pendingImpact.preview.changes.length === 0 ? null : (
            <ul className="dependency-impact-list">
              {pendingImpact.preview.changes.map((change) => (
                <li key={change.taskId}>
                  <strong>{change.title}</strong>
                  <span>{change.beforeStartDate === null ? "Sem data" : displayDate(change.beforeStartDate)} – {change.beforeEndDate === null ? "Sem data" : displayDate(change.beforeEndDate)}</span>
                  <span aria-hidden="true">→</span>
                  <span>{change.afterStartDate === null ? "Sem data" : displayDate(change.afterStartDate)} – {change.afterEndDate === null ? "Sem data" : displayDate(change.afterEndDate)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={() => { setPendingImpact(null); }}>Cancelar</button>
            <button className="primary-button" type="button" onClick={() => { void confirmImpact(); }}>
              {pendingImpact.action === "ADD" ? "Adicionar predecessora" : "Remover predecessora"}
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

interface TaskRowProps {
  readonly row: VisibleTask;
  readonly outlineNumber: string;
  readonly outlineNumbers: ReadonlyMap<string, string>;
  readonly tasks: readonly Task[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly dependencies: readonly TaskDependency[];
  readonly conflicts: readonly SchedulingConflict[];
  readonly baselineTask: BaselineTask | null;
  readonly showBaselineColumns: boolean;
  readonly todayDate: string;
  readonly selected: boolean;
  readonly expanded: boolean;
  readonly disabled: boolean;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly onSelect: (selected: boolean) => void;
  readonly onToggleExpanded: () => void;
  readonly onPrepareSubtask: () => void;
  readonly onSave: TaskTableProps["onSave"];
  readonly onMove: (direction: "up" | "down") => void;
  readonly onDelete: () => void;
  readonly onCreateDependency: TaskTableProps["onCreateDependency"];
  readonly onDeleteDependency: TaskTableProps["onDeleteDependency"];
  readonly onDuplicate: (includeDescendants: boolean) => void;
  readonly onPrepareTemplate: () => void;
}

const HEALTH_LABELS: Readonly<Record<ScheduleHealth, string>> = {
  NO_DEADLINE: "Sem prazo",
  ON_TRACK: "No prazo",
  AT_RISK: "Em risco",
  OVERDUE: "Atrasada",
  COMPLETED_LATE: "Concluída com atraso",
  CANCELLED: "Cancelada",
};

function HealthBadge({ health }: { readonly health: ScheduleHealth }) {
  return <span className={`health-badge health-${health.toLocaleLowerCase()}`}>{HEALTH_LABELS[health]}</span>;
}

function isCompleteDateInput(value: string): boolean {
  try {
    requireDateOnly(value, "date", "A data");
    return true;
  } catch {
    return false;
  }
}

function displayDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day ?? ""}/${month ?? ""}/${year ?? ""}`;
}

function localTodayDate(): string {
  const today = new Date();
  return `${String(today.getFullYear())}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function millisecondsUntilNextLocalDay(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(1_000, tomorrow.getTime() - now.getTime() + 1_000);
}

interface SafeDateInputProps {
  readonly ariaLabel: string;
  readonly className: string;
  readonly disabled: boolean;
  readonly title?: string;
  readonly value: string | null;
  readonly onCommit: (value: string | null) => void;
}

function SafeDateInput({
  ariaLabel,
  className,
  disabled,
  title,
  value,
  onCommit,
}: SafeDateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input === null || document.activeElement === input) return;
    input.value = value ?? "";
  }, [value]);

  return (
    <input
      ref={inputRef}
      className={className}
      type="date"
      aria-label={ariaLabel}
      defaultValue={value ?? ""}
      disabled={disabled}
      title={title}
      onChange={(event) => {
        const input = event.currentTarget;
        // WebView2 reports an empty value while a localized date is still being
        // typed (for example, between 01/10 and the completed year). Committing
        // that transient empty value clears the schedule and makes the native
        // control return to dd/mm/aaaa before typing can finish.
        if (input.value === "") return;
        if (input.validity.badInput) return;
        if (!isCompleteDateInput(input.value)) return;
        onCommit(input.value);
      }}
      onBlur={(event) => {
        const input = event.currentTarget;
        if (input.validity.badInput || (input.value !== "" && !isCompleteDateInput(input.value))) {
          input.value = value ?? "";
          return;
        }
        onCommit(input.value || null);
      }}
    />
  );
}

type RowSaveState = "SAVED" | "DIRTY" | "SAVING" | "ERROR";

interface TaskSaveSnapshot {
  readonly task: Task;
  readonly dependencyUpdates: readonly TaskDependency[];
}

function autosaveSnapshotIsValid(snapshot: TaskSaveSnapshot): boolean {
  try {
    // Status transitions are finalized by the shared review dialog. Validate
    // the remaining fields with a temporary consistent completion state so
    // the request can reach that dialog instead of being rejected locally.
    validateTask(snapshot.task.status === "COMPLETED"
      ? {
          ...snapshot.task,
          progress: 100,
          completedDate: snapshot.task.completedDate ?? snapshot.task.startDate ?? "2000-01-01",
        }
      : { ...snapshot.task, completedDate: null });
    return snapshot.dependencyUpdates.every(
      (dependency) => Number.isInteger(dependency.lagDays) && dependency.lagDays >= 0,
    );
  } catch {
    return false;
  }
}

function TaskRow({
  row,
  outlineNumber,
  outlineNumbers,
  tasks,
  calendars,
  projectCalendarId,
  dependencies,
  conflicts,
  baselineTask,
  showBaselineColumns,
  todayDate,
  selected,
  expanded,
  disabled,
  canMoveUp,
  canMoveDown,
  onSelect,
  onToggleExpanded,
  onPrepareSubtask,
  onSave,
  onMove,
  onDelete,
  onCreateDependency,
  onDeleteDependency,
  onDuplicate,
  onPrepareTemplate,
}: TaskRowProps) {
  const [draft, setDraft] = useState(row.task);
  const [tagsText, setTagsText] = useState(row.task.tags.join(", "));
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<RowSaveState>("SAVED");
  const [lagDrafts, setLagDrafts] = useState<Readonly<Record<string, number>>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ readonly x: number; readonly y: number } | null>(null);
  const [textEditContext, setTextEditContext] = useState<TextSelection | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const detailsButtonRef = useRef<HTMLButtonElement>(null);
  const contextMenuButtonRef = useRef<HTMLButtonElement>(null);
  const contextMenuOriginRef = useRef<HTMLElement | null>(null);
  const predecessorSelectRef = useRef<HTMLSelectElement>(null);
  const draftRef = useRef(row.task);
  const tagsTextRef = useRef(row.task.tags.join(", "));
  const lagDraftsRef = useRef<Readonly<Record<string, number>>>({});
  const dependenciesRef = useRef(dependencies);
  const onSaveRef = useRef(onSave);
  const dirtyRef = useRef(false);
  const mountedRef = useRef(true);
  const editRevisionRef = useRef(0);
  const latestQueuedRevisionRef = useRef(0);
  const lastQueuedFingerprintRef = useRef<string | null>(null);
  const saveQueueRef = useRef<Promise<TaskSaveResult>>(Promise.resolve(true));
  const visibleDraft = dirty ? draft : row.task;
  const visibleTagsText = dirty ? tagsText : row.task.tags.join(", ");
  const detailsId = `task-details-${row.task.id}`;
  const codeHelpId = `task-code-help-${row.task.id}`;
  const invalidParentIds = useMemo(() => collectTaskTreeIds(tasks, row.task.id), [row.task.id, tasks]);
  const dependencyTaskIds = new Set(dependencies.flatMap(({ predecessorId, successorId }) => [predecessorId, successorId]));
  const parentOptions = tasks.filter(
    (task) => !invalidParentIds.has(task.id) && !dependencyTaskIds.has(task.id) && canTaskHaveChild(tasks, task.id),
  );
  const taskCalendar = calendars.find(
    (calendar) => calendar.id === (visibleDraft.calendarId ?? projectCalendarId),
  ) ?? calendars[0];
  const taskConflicts = conflicts.filter((conflict) => conflict.taskId === row.task.id);
  const comparison = taskCalendar === undefined
    ? null
    : compareTaskWithBaseline(visibleDraft, baselineTask, taskCalendar, todayDate);
  const canHaveSubtask = canTaskHaveChild(tasks, row.task.id);
  const existingPredecessorIds = new Set(
    dependencies
      .filter((dependency) => dependency.successorId === row.task.id)
      .map((dependency) => dependency.predecessorId),
  );
  const canAddPredecessor = tasks.some(
    (candidate) =>
      candidate.id !== row.task.id &&
      !existingPredecessorIds.has(candidate.id),
  );
  const subtaskTitle = canHaveSubtask
    ? "Criar subtarefa"
    : "A hierarquia já atingiu o limite de quatro níveis.";
  const dependencyUpdates = dependencies
    .filter((dependency) => dependency.successorId === row.task.id)
    .flatMap((dependency) => {
      const lagDays = lagDrafts[dependency.id];
      return lagDays === undefined || lagDays === dependency.lagDays
        ? []
        : [{ ...dependency, lagDays }];
    });
  const hasUnsavedChanges = dirty || dependencyUpdates.length > 0;
  const manualNonWorkingDate =
    visibleDraft.schedulingMode === "MANUAL" &&
    taskCalendar !== undefined &&
    [visibleDraft.startDate, visibleDraft.endDate].some(
      (date) => date !== null && !isWorkingDay(taskCalendar, date),
    );
  const datesLocked = visibleDraft.schedulingMode === "MANUAL";

  // A layout effect closes the one-frame window where a fast edit could use
  // an older dependency graph before a passive effect had run.
  useLayoutEffect(() => { dependenciesRef.current = dependencies; }, [dependencies]);
  useLayoutEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  const buildSaveSnapshot = useCallback((): TaskSaveSnapshot => {
    const task = {
      ...draftRef.current,
      tags: tagsTextRef.current.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0),
    };
    const dependencyUpdates = dependenciesRef.current
      .filter((dependency) => dependency.successorId === row.task.id)
      .flatMap((dependency) => {
        const lagDays = lagDraftsRef.current[dependency.id];
        return lagDays === undefined || lagDays === dependency.lagDays
          ? []
          : [{ ...dependency, lagDays }];
      });
    return { task, dependencyUpdates };
  }, [row.task.id]);

  const queueSave = useCallback((reportInvalid = false): Promise<TaskSaveResult> => {
    if (!dirtyRef.current) return saveQueueRef.current;
    const snapshot = buildSaveSnapshot();
    if (!reportInvalid && !autosaveSnapshotIsValid(snapshot)) return Promise.resolve(false);

    const fingerprint = JSON.stringify(snapshot);
    if (lastQueuedFingerprintRef.current === fingerprint) return saveQueueRef.current;
    lastQueuedFingerprintRef.current = fingerprint;
    const revision = editRevisionRef.current;
    latestQueuedRevisionRef.current = revision;
    if (mountedRef.current) setSaveState("SAVING");

    const operation = async (): Promise<TaskSaveResult> => {
      let saved: TaskSaveResult;
      try {
        saved = await onSaveRef.current(snapshot.task, snapshot.dependencyUpdates);
      } catch {
        saved = false;
      }
      if (saved !== true) lastQueuedFingerprintRef.current = null;
      if (!mountedRef.current || latestQueuedRevisionRef.current !== revision) return saved;
      if (saved === true && editRevisionRef.current === revision) {
        dirtyRef.current = false;
        lagDraftsRef.current = {};
        setDirty(false);
        setLagDrafts({});
        setSaveState("SAVED");
      } else if (taskSaveWasCancelled(saved)) {
        const revertedTask = { ...snapshot.task, status: row.task.status };
        draftRef.current = revertedTask;
        setDraft(revertedTask);
        editRevisionRef.current += 1;
        setSaveState("DIRTY");
      } else if (saved === false) {
        setSaveState("ERROR");
      } else {
        setSaveState("DIRTY");
      }
      return saved;
    };

    saveQueueRef.current = saveQueueRef.current.catch(() => false).then(operation);
    return saveQueueRef.current;
  }, [buildSaveSnapshot, row.task.status]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => { void queueSave(); }, 700);
    return () => { window.clearTimeout(timer); };
  }, [dirty, draft, lagDrafts, queueSave, tagsText]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (dirtyRef.current) void queueSave();
    };
  }, [queueSave]);

  const closeDetailsOnEscape = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== "Escape" || !showDetails) return;
    event.preventDefault();
    event.stopPropagation();
    setShowDetails(false);
    detailsButtonRef.current?.focus();
  };

  const markDirty = (): void => {
    dirtyRef.current = true;
    editRevisionRef.current += 1;
    setDirty(true);
    setSaveState("DIRTY");
  };

  const requestImmediateSave = (): void => {
    window.setTimeout(() => { void queueSave(); }, 0);
  };

  const update = (patch: Partial<Task>, saveImmediately = false): void => {
    const baseDraft = dirtyRef.current ? draftRef.current : row.task;
    const nextDraft = { ...baseDraft, ...patch };
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    markDirty();
    if (saveImmediately) requestImmediateSave();
  };

  const updateSchedule = (edit: ScheduleEdit): void => {
    if (taskCalendar === undefined) return;
    const baseDraft = dirtyRef.current ? draftRef.current : row.task;
    if (edit.field === "durationDays" && edit.value !== null && edit.value < 1) {
      update({ durationDays: edit.value });
      return;
    }
    if (
      edit.field === "endDate" &&
      edit.value !== null &&
      baseDraft.startDate !== null &&
      edit.value < baseDraft.startDate
    ) {
      update({ endDate: edit.value });
      return;
    }
    if (
      edit.field === "startDate" &&
      edit.value !== null &&
      baseDraft.endDate !== null &&
      baseDraft.durationDays === null &&
      edit.value > baseDraft.endDate
    ) {
      update({ startDate: edit.value });
      return;
    }
    const nextDraft = applyScheduleEdit(baseDraft, edit, taskCalendar);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    markDirty();
    if (edit.field !== "durationDays") requestImmediateSave();
  };

  const updateCalendar = (calendarId: string | null): void => {
    const calendar = calendars.find((candidate) => candidate.id === (calendarId ?? projectCalendarId));
    const baseDraft = dirtyRef.current ? draftRef.current : row.task;
    let nextDraft = { ...baseDraft, calendarId };
    if (calendar !== undefined && baseDraft.startDate !== null && baseDraft.durationDays !== null) {
      nextDraft = applyScheduleEdit(
        nextDraft,
        { field: "durationDays", value: baseDraft.durationDays },
        calendar,
      );
    }
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    markDirty();
    requestImmediateSave();
  };

  const toggleDateLock = (): void => {
    if (row.hasChildren) return;
    update({ schedulingMode: datesLocked ? "AUTO" : "MANUAL" }, true);
  };

  const save = async (): Promise<void> => {
    await queueSave(true);
  };

  const saveOnEditorBlur = (event: FocusEvent<HTMLElement>): void => {
    if (!(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)) return;
    void queueSave();
  };

  const updateLag = (dependencyId: string, lagDays: number): void => {
    const nextLagDrafts = { ...lagDraftsRef.current, [dependencyId]: lagDays };
    lagDraftsRef.current = nextLagDrafts;
    setLagDrafts(nextLagDrafts);
    markDirty();
  };

  const closeContextMenu = useCallback((): void => {
    setContextMenu(null);
    setTextEditContext(null);
  }, []);

  const openContextMenu = (event: MouseEvent<HTMLElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target;
    contextMenuOriginRef.current = target instanceof HTMLElement ? target : event.currentTarget;
    setClipboardError(null);
    const textControl = target instanceof Element ? target.closest("input, textarea") : null;
    if (isEditableTextControl(textControl)) {
      setTextEditContext(selectionFromControl(textControl));
    } else {
      setTextEditContext(null);
    }
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const runClipboardAction = (action: () => Promise<void>): void => {
    void action()
      .catch((error: unknown) => { setClipboardError(clipboardErrorMessage(error)); })
      .finally(() => { contextMenuOriginRef.current?.focus(); });
  };

  const hasSelectedText = textEditContext !== null && textEditContext.end > textEditContext.start;

  const contextMenuItems: readonly ContextMenuItem[] = [
    ...(textEditContext === null ? [] : [
      {
        id: "cut-text",
        label: "Recortar",
        disabled: !hasSelectedText || textEditContext.control.disabled || textEditContext.control.readOnly,
        onSelect: () => { runClipboardAction(() => copyTextSelection(textEditContext, true)); },
      },
      {
        id: "copy-text",
        label: "Copiar",
        disabled: !hasSelectedText,
        onSelect: () => { runClipboardAction(() => copyTextSelection(textEditContext, false)); },
      },
      {
        id: "paste-text",
        label: "Colar",
        disabled: textEditContext.control.disabled || textEditContext.control.readOnly,
        onSelect: () => { runClipboardAction(() => pasteTextSelection(textEditContext)); },
      },
      {
        id: "select-all-text",
        label: "Selecionar tudo",
        onSelect: () => {
          textEditContext.control.focus();
          textEditContext.control.select();
        },
      },
    ] satisfies readonly ContextMenuItem[]),
    {
      id: "details",
      label: showDetails ? "Ocultar detalhes" : "Abrir detalhes",
      separatorBefore: textEditContext !== null,
      onSelect: () => { setShowDetails((visible) => !visible); },
    },
    {
      id: "subtask",
      label: "Adicionar subtarefa",
      disabled: disabled || !canHaveSubtask,
      onSelect: onPrepareSubtask,
    },
    {
      id: "predecessor",
      label: "Adicionar predecessora",
      disabled: disabled || row.hasChildren || !canAddPredecessor,
      onSelect: () => { predecessorSelectRef.current?.focus(); },
    },
    {
      id: "date-lock",
      label: datesLocked ? "Destravar datas" : "Travar datas",
      disabled: disabled || row.hasChildren,
      onSelect: toggleDateLock,
    },
    {
      id: "duplicate",
      label: "Duplicar tarefa",
      separatorBefore: true,
      disabled,
      onSelect: () => { onDuplicate(false); },
    },
    ...(row.hasChildren ? [{
      id: "duplicate-tree",
      label: "Duplicar tarefa e subtarefas",
      disabled,
      onSelect: () => { onDuplicate(true); },
    } satisfies ContextMenuItem] : []),
    {
      id: "template",
      label: "Salvar como template",
      disabled,
      onSelect: onPrepareTemplate,
    },
    {
      id: "delete",
      label: "Excluir tarefa…",
      danger: true,
      separatorBefore: true,
      disabled,
      onSelect: onDelete,
    },
  ];

  return (
    <>
    <tr className={`task-row${hasUnsavedChanges ? " dirty" : ""}${taskConflicts.length > 0 ? " schedule-conflict" : ""}`} onBlur={saveOnEditorBlur} onContextMenu={openContextMenu}>
      <td className="selection-cell"><input type="checkbox" checked={selected} aria-label={`Selecionar ${row.task.title}`} onChange={(event) => { onSelect(event.target.checked); }} /></td>
      <td className="task-title-cell">
        <div className="task-title-line" style={{ paddingLeft: `${String(row.depth * 1.25)}rem` }}>
          {row.hasChildren ? <button className="tree-toggle" type="button" aria-label={expanded ? "Recolher subtarefas" : "Expandir subtarefas"} aria-expanded={expanded} onClick={onToggleExpanded}>{expanded ? "▾" : "▸"}</button> : <span className="tree-spacer" />}
          <span className="task-outline-number" aria-label={`Estrutura ${outlineNumber}`}>{outlineNumber}.</span>
          <input className="cell-input title-input" aria-label="Título da tarefa" value={titleWithoutMatchingOutline(visibleDraft.title, outlineNumber)} disabled={disabled} onChange={(event) => { update({ title: event.target.value }); }} />
          {row.hasChildren ? <span className="summary-badge">Resumo</span> : null}
          <button
            className={`schedule-lock-button${datesLocked ? " locked" : ""}`}
            type="button"
            disabled={disabled || row.hasChildren}
            aria-label={datesLocked ? `Destravar datas de ${visibleDraft.title}` : `Travar datas de ${visibleDraft.title}`}
            aria-pressed={datesLocked}
            title={row.hasChildren ? "Datas calculadas pelas subtarefas" : datesLocked ? "Datas travadas: o scheduler e o arrasto não deslocam esta tarefa" : "Datas automáticas: clique para travar"}
            onClick={toggleDateLock}
          >
            <span aria-hidden="true">{datesLocked ? "🔒" : "🔓"}</span>
          </button>
        </div>
        <div className="task-row-links" style={{ paddingLeft: `${String(row.depth * 1.25 + 1.6)}rem` }}>
          <button className="inline-link" type="button" disabled={disabled || !canHaveSubtask} title={subtaskTitle} onClick={onPrepareSubtask}>+ Subtarefa</button>
          <button ref={detailsButtonRef} className="inline-link" type="button" aria-expanded={showDetails} aria-controls={detailsId} onKeyDown={closeDetailsOnEscape} onClick={() => { setShowDetails((visible) => !visible); }}>{showDetails ? "Ocultar detalhes" : "Detalhes"}</button>
        </div>
        {taskConflicts.map((conflict) => <p className="conflict-message" key={`${conflict.kind}-${conflict.requiredStartDate}`}>{conflict.message}</p>)}
      </td>
      <td><PredecessorCell task={row.task} tasks={tasks} dependencies={dependencies} calendars={calendars} projectCalendarId={projectCalendarId} lagDrafts={lagDrafts} isSummary={row.hasChildren} disabled={disabled} selectRef={predecessorSelectRef} onCreate={onCreateDependency} onLagChange={updateLag} onDelete={onDeleteDependency} /></td>
      <td><select className="cell-select" aria-label="Status da tarefa" value={visibleDraft.status} disabled={disabled} onChange={(event) => { update({ status: event.target.value as TaskStatus }, true); }}>{TASK_STATUSES.map((status) => <option value={status} key={status}>{TASK_STATUS_LABELS[status]}</option>)}</select></td>
      <td><select className="cell-select" aria-label="Prioridade da tarefa" value={visibleDraft.priority} disabled={disabled} onChange={(event) => { update({ priority: event.target.value as TaskPriority }, true); }}>{TASK_PRIORITIES.map((priority) => <option value={priority} key={priority}>{TASK_PRIORITY_LABELS[priority]}</option>)}</select></td>
      <td><div className="progress-editor"><input className="cell-input number-input" type="number" min={0} max={100} aria-label="Progresso da tarefa" title={visibleDraft.status === "COMPLETED" ? "Reabra a atividade para alterar o progresso" : ""} value={visibleDraft.progress} disabled={disabled || visibleDraft.status === "COMPLETED"} onChange={(event) => { update({ progress: Number(event.target.value) }); }} /><span>%</span></div></td>
      <td><SafeDateInput className="cell-input date-input" ariaLabel="Início da tarefa" value={visibleDraft.startDate} disabled={disabled || row.hasChildren} title={row.hasChildren ? "Data calculada pelas subtarefas" : ""} onCommit={(value) => { updateSchedule({ field: "startDate", value }); }} /></td>
      <td><SafeDateInput className="cell-input date-input" ariaLabel="Fim da tarefa" value={visibleDraft.endDate} disabled={disabled || row.hasChildren} title={row.hasChildren ? "Data calculada pelas subtarefas" : ""} onCommit={(value) => { updateSchedule({ field: "endDate", value }); }} /></td>
      <td><input className="cell-input duration-input" type="number" min={1} aria-label="Duração da tarefa" value={visibleDraft.durationDays ?? ""} disabled={disabled || row.hasChildren} title={row.hasChildren ? "Duração calculada pelas subtarefas" : ""} onChange={(event) => { updateSchedule({ field: "durationDays", value: event.target.value === "" ? null : Number(event.target.value) }); }} /></td>
      {showBaselineColumns ? (
        <>
          <td className="baseline-date-cell">{baselineTask?.startDate ?? "—"}</td>
          <td className="baseline-date-cell">{baselineTask?.endDate ?? "—"}</td>
          <td className={`variance-cell${(comparison?.endVarianceDays ?? 0) > 0 ? " delayed" : ""}`}>
            {comparison === null || comparison.endVarianceDays === null
              ? "—"
              : `${comparison.endVarianceDays > 0 ? "+" : ""}${String(comparison.endVarianceDays)}d`}
          </td>
        </>
      ) : null}
      <td><SafeDateInput className="cell-input date-input" ariaLabel="Prazo-limite da tarefa" value={visibleDraft.deadlineDate} disabled={disabled} onCommit={(value) => { update({ deadlineDate: value }, true); }} /></td>
      <td><HealthBadge health={comparison?.health ?? "NO_DEADLINE"} /></td>
      <td><input className="cell-input" aria-label="Responsável pela tarefa" value={visibleDraft.assignee ?? ""} disabled={disabled} onChange={(event) => { update({ assignee: event.target.value || null }); }} /></td>
      <td><input className="cell-input tags-input" aria-label="Tags da tarefa" placeholder="tag, tag" value={visibleTagsText} disabled={disabled} onChange={(event) => { tagsTextRef.current = event.target.value; setTagsText(event.target.value); markDirty(); }} /></td>
      <td className="row-actions">
        <div className="row-actions-toolbar">
          <div className="order-buttons row-order-buttons" aria-label={`Ordenação de ${row.task.title}`}><button type="button" disabled={disabled || !canMoveUp} aria-label={`Mover ${row.task.title} para cima`} title="Mover para cima" onClick={() => { onMove("up"); }}>↑</button><button type="button" disabled={disabled || !canMoveDown} aria-label={`Mover ${row.task.title} para baixo`} title="Mover para baixo" onClick={() => { onMove("down"); }}>↓</button></div>
          <button ref={contextMenuButtonRef} className="task-more-button" type="button" aria-label={`Mais ações para ${row.task.title}`} aria-haspopup="menu" aria-expanded={contextMenu !== null} disabled={disabled} onClick={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); contextMenuOriginRef.current = event.currentTarget; setTextEditContext(null); setClipboardError(null); setContextMenu({ x: bounds.right, y: bounds.bottom }); }}>⋯</button>
          <span
            className={`save-state-indicator ${saveState.toLocaleLowerCase()}`}
            role="status"
            aria-label={saveState === "SAVING" ? "Salvando alteração" : saveState === "ERROR" ? "Erro ao salvar" : saveState === "DIRTY" ? "Alteração pendente" : undefined}
            title={saveState === "SAVING" ? "Salvando alteração" : saveState === "ERROR" ? "Erro ao salvar" : saveState === "DIRTY" ? "Alteração pendente" : undefined}
          >{saveState === "SAVING" ? "↻" : saveState === "ERROR" ? "!" : saveState === "DIRTY" ? "•" : ""}</span>
        </div>
        {hasUnsavedChanges
          ? <button className="save-row-button row-terminal-action" type="button" disabled={disabled} onClick={() => { void save(); }}>Salvar</button>
          : <button className="delete-row-button row-terminal-action" type="button" disabled={disabled} onClick={onDelete}>Excluir</button>}
      </td>
    </tr>
    {showDetails ? (
      <tr className="task-details-row" onBlur={saveOnEditorBlur} onContextMenu={openContextMenu}>
        <td className="selection-cell" />
        <td colSpan={16}>
          <div className="task-details" id={detailsId} style={{ marginLeft: `${String(row.depth * 1.25)}rem` }} onKeyDown={closeDetailsOnEscape}>
            <label>
              <span className="detail-label">
                Código
                <span className="field-help" tabIndex={0} aria-label="Ajuda sobre o código visual" aria-describedby={codeHelpId} title="Identificador visual opcional, como DEV-01 ou 1.2. Ele não altera o UUID interno da tarefa.">
                  i
                  <span className="field-help-text" id={codeHelpId} role="tooltip">Identificador visual opcional, como DEV-01 ou 1.2. Ele não altera o UUID interno da tarefa.</span>
                </span>
              </span>
              <input aria-label="Código visual da tarefa" disabled={disabled} value={visibleDraft.code ?? ""} onChange={(event) => { update({ code: event.target.value || null }); }} />
            </label>
            <label>Tarefa-pai<select disabled={disabled} value={visibleDraft.parentId ?? ""} onChange={(event) => { update({ parentId: event.target.value || null }, true); }}><option value="">Sem tarefa-pai</option>{parentOptions.map((task) => <option value={task.id} key={task.id}>{taskOutlineLabel(task, outlineNumbers)}</option>)}</select></label>
            <label>
              Datas
              <button className={`detail-lock-button${datesLocked ? " locked" : ""}`} type="button" disabled={disabled || row.hasChildren} aria-pressed={datesLocked} onClick={toggleDateLock}>
                <span aria-hidden="true">{datesLocked ? "🔒" : "🔓"}</span>
                {datesLocked ? "Travadas" : "Automáticas"}
              </button>
            </label>
            <label>Calendário<select disabled={disabled || row.hasChildren} value={visibleDraft.calendarId ?? ""} onChange={(event) => { updateCalendar(event.target.value || null); }}><option value="">Calendário do projeto</option>{calendars.filter((calendar) => calendar.id !== projectCalendarId).map((calendar) => <option value={calendar.id} key={calendar.id}>{calendar.name}</option>)}</select></label>
            <label className="wide-detail">Descrição<textarea disabled={disabled} rows={2} value={visibleDraft.description ?? ""} onChange={(event) => { update({ description: event.target.value || null }); }} /></label>
            <label className="wide-detail">Observações<textarea disabled={disabled} rows={2} value={visibleDraft.notes ?? ""} onChange={(event) => { update({ notes: event.target.value || null }); }} /></label>
            {manualNonWorkingDate ? <p className="calendar-warning wide-detail">A tarefa manual usa uma data não útil. A data será preservada; escolha “Todos os dias” se ela deve participar automaticamente de fins de semana.</p> : null}
            <div className="task-reuse-actions wide-detail">
              <div>
                <strong>Reutilização</strong>
                <span>As cópias recebem novas identidades; relações externas não são copiadas.</span>
              </div>
              <button type="button" disabled={disabled} onClick={() => { onDuplicate(false); }}>Duplicar tarefa</button>
              {row.hasChildren ? <button type="button" disabled={disabled} onClick={() => { onDuplicate(true); }}>Duplicar árvore</button> : null}
              <button type="button" disabled={disabled} onClick={onPrepareTemplate}>Salvar árvore como template</button>
            </div>
          </div>
        </td>
      </tr>
    ) : null}
    {contextMenu === null ? null : (
      <ContextMenu
        ariaLabel={`Ações de ${row.task.title}`}
        heading={row.task.title}
        items={contextMenuItems}
        returnFocusRef={contextMenuOriginRef}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
      />
    )}
    {clipboardError === null ? null : <div className="clipboard-error-toast" role="alert">{clipboardError}</div>}
    </>
  );
}

export function TaskTable({
  tasks,
  visibleTaskIds,
  calendars,
  projectCalendarId,
  dependencies,
  conflicts,
  baselineTasks,
  disabled,
  onCreate,
  onSave,
  onSetSchedulingMode,
  onMove,
  onDelete,
  onCreateDependency,
  onDeleteDependency,
  onDuplicate,
  onCreateTemplate,
}: TaskTableProps) {
  const showBaselineColumns = baselineTasks.length > 0;
  const [newTitle, setNewTitle] = useState("");
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<ReadonlySet<string>>(new Set());
  const [templateSource, setTemplateSource] = useState<Task | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [dependencyParentId, setDependencyParentId] = useState<string | null>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [taskColumnWidth, setTaskColumnWidth] = useState(initialTaskColumnWidth);
  const taskColumnResize = useRef<{ readonly pointerId: number; readonly startX: number; readonly startWidth: number } | null>(null);
  const [todayDate, setTodayDate] = useState(localTodayDate);
  const forcedExpandedIds = new Set(
    tasks
      .filter(
        (task) =>
          visibleTaskIds?.has(task.id) === true &&
          task.parentId !== null &&
          visibleTaskIds.has(task.parentId),
      )
      .map((task) => task.parentId as string),
  );
  const effectiveExpandedIds = new Set([...expandedTaskIds, ...forcedExpandedIds]);
  const visibleTasks = flattenVisibleTasks(tasks, effectiveExpandedIds).filter(
    ({ task }) => visibleTaskIds === undefined || visibleTaskIds.has(task.id),
  );
  const outlineNumbers = buildTaskOutlineNumbers(tasks);
  const dependencyTaskIds = new Set(dependencies.flatMap(({ predecessorId, successorId }) => [predecessorId, successorId]));
  const summaryIds = new Set(tasks.flatMap((task) => task.parentId === null ? [] : [task.parentId]));
  const selectedEditableTasks = tasks.filter(
    (task) => selectedTaskIds.has(task.id) && !summaryIds.has(task.id),
  );

  useEffect(() => {
    let timeoutId = 0;
    const scheduleNextDay = (): void => {
      timeoutId = window.setTimeout(() => {
        setTodayDate(localTodayDate());
        scheduleNextDay();
      }, millisecondsUntilNextLocalDay());
    };
    const refreshWhenVisible = (): void => {
      if (document.visibilityState === "visible") setTodayDate(localTodayDate());
    };
    scheduleNextDay();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const setSelectedSchedulingMode = useCallback(async (mode: SchedulingMode): Promise<void> => {
    if (selectedEditableTasks.length === 0) return;
    await onSetSchedulingMode(selectedEditableTasks.map(({ id }) => id), mode);
  }, [onSetSchedulingMode, selectedEditableTasks]);

  useEffect(() => {
    const toggleSelectedLocks = (event: globalThis.KeyboardEvent): void => {
      if (!event.ctrlKey || !event.shiftKey || event.key.toLocaleLowerCase() !== "l") return;
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.isContentEditable || target.matches("input, textarea, select")
      )) return;
      if (selectedEditableTasks.length === 0) return;
      event.preventDefault();
      const nextMode: SchedulingMode = selectedEditableTasks.every(
        ({ schedulingMode }) => schedulingMode === "MANUAL",
      ) ? "AUTO" : "MANUAL";
      void setSelectedSchedulingMode(nextMode);
    };
    document.addEventListener("keydown", toggleSelectedLocks);
    return () => { document.removeEventListener("keydown", toggleSelectedLocks); };
  }, [selectedEditableTasks, setSelectedSchedulingMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TASK_COLUMN_WIDTH_STORAGE_KEY, String(taskColumnWidth));
    } catch {
      // A preferência é opcional quando o armazenamento do WebView está indisponível.
    }
  }, [taskColumnWidth]);

  useEffect(() => {
    const tableScroll = tableScrollRef.current;
    if (tableScroll === null) return;
    const updateWidth = (): void => {
      setTableScrollWidth(Math.max(tableScroll.clientWidth, tableScroll.scrollWidth));
    };
    updateWidth();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateWidth);
    observer?.observe(tableScroll);
    if (tableScroll.firstElementChild instanceof Element) observer?.observe(tableScroll.firstElementChild);
    window.addEventListener("resize", updateWidth);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [showBaselineColumns, taskColumnWidth, tasks.length]);

  const handleTaskColumnResizeStart = (event: ReactPointerEvent<HTMLSpanElement>): void => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    taskColumnResize.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: taskColumnWidth,
    };
  };

  const handleTaskColumnResizeMove = (event: ReactPointerEvent<HTMLSpanElement>): void => {
    const resize = taskColumnResize.current;
    if (resize === null || resize.pointerId !== event.pointerId) return;
    setTaskColumnWidth(clampTaskColumnWidth(resize.startWidth + event.clientX - resize.startX));
  };

  const handleTaskColumnResizeEnd = (event: ReactPointerEvent<HTMLSpanElement>): void => {
    if (taskColumnResize.current?.pointerId !== event.pointerId) return;
    taskColumnResize.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleTaskColumnResizeKeyDown = (event: KeyboardEvent<HTMLSpanElement>): void => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setTaskColumnWidth((current) => clampTaskColumnWidth(current + (event.key === "ArrowRight" ? 16 : -16)));
    } else if (event.key === "Home") {
      event.preventDefault();
      setTaskColumnWidth(MIN_TASK_COLUMN_WIDTH);
    } else if (event.key === "End") {
      event.preventDefault();
      setTaskColumnWidth(MAX_TASK_COLUMN_WIDTH);
    }
  };

  const handleCreate = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const parentAlreadySummary = newParentId !== null && tasks.some((task) => task.parentId === newParentId);
    if (newParentId !== null && dependencyTaskIds.has(newParentId) && !parentAlreadySummary) {
      setDependencyParentId(newParentId);
      return;
    }
    const created = await onCreate({ title: newTitle, parentId: newParentId });
    if (created !== null) {
      setNewTitle("");
      if (newParentId !== null) setExpandedTaskIds((current) => new Set([...current, newParentId]));
      titleInput.current?.focus();
    }
  };

  const createWithDependencyPolicy = async (policy: "KEEP" | "TRANSFER" | "REMOVE"): Promise<void> => {
    if (dependencyParentId === null) return;
    const created = await onCreate({
      title: newTitle,
      parentId: dependencyParentId,
      parentDependencyPolicy: policy,
    });
    if (created !== null) {
      setNewTitle("");
      setExpandedTaskIds((current) => new Set([...current, dependencyParentId]));
      setDependencyParentId(null);
      titleInput.current?.focus();
    }
  };


  const prepareSubtask = (parentId: string): void => {
    setNewParentId(parentId);
    setExpandedTaskIds((current) => new Set([...current, parentId]));
    titleInput.current?.focus();
  };

  const prepareTemplate = (task: Task): void => {
    setTemplateSource(task);
    setTemplateName(task.title);
    setTemplateDescription(task.description ?? "");
  };

  const saveTemplate = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (templateSource === null) return;
    const created = await onCreateTemplate({
      rootTaskId: templateSource.id,
      name: templateName,
      description: templateDescription || null,
    });
    if (created !== null) setTemplateSource(null);
  };

  const handleTableWheel = (event: WheelEvent<HTMLDivElement>): void => {
    const horizontalDelta = event.deltaX !== 0 ? event.deltaX : event.shiftKey ? event.deltaY : 0;
    if (horizontalDelta === 0) return;
    event.preventDefault();
    event.currentTarget.scrollLeft += horizontalDelta;
    if (horizontalScrollRef.current !== null) {
      horizontalScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  return (
    <section className="task-section" aria-labelledby="task-table-title">
      <div className="task-toolbar">
        <div><h2 id="task-table-title">Tabela de tarefas</h2><p>{selectedTaskIds.size > 0 ? `${String(selectedTaskIds.size)} selecionada${selectedTaskIds.size === 1 ? "" : "s"}` : "Preencha duas informações de prazo; a terceira será calculada."}</p></div>
        {selectedTaskIds.size === 0 ? null : (
          <div className="bulk-task-actions" role="group" aria-label="Ações nas tarefas selecionadas">
            <span>{selectedEditableTasks.length === selectedTaskIds.size ? `${String(selectedEditableTasks.length)} editável${selectedEditableTasks.length === 1 ? "" : "is"}` : `${String(selectedEditableTasks.length)} de ${String(selectedTaskIds.size)} editáveis`}</span>
            <button type="button" disabled={disabled || selectedEditableTasks.length === 0} aria-keyshortcuts="Control+Shift+L" onClick={() => { void setSelectedSchedulingMode("MANUAL"); }}>🔒 Travar datas</button>
            <button type="button" disabled={disabled || selectedEditableTasks.length === 0} onClick={() => { void setSelectedSchedulingMode("AUTO"); }}>🔓 Destravar datas</button>
            <button type="button" onClick={() => { setSelectedTaskIds(new Set()); }}>Limpar seleção</button>
          </div>
        )}
        <form className="quick-task-form" onSubmit={(event) => { void handleCreate(event); }}>
          <label className="sr-only" htmlFor="quick-task-title">Título da nova tarefa</label><input id="quick-task-title" ref={titleInput} required placeholder={newParentId === null ? "Nova tarefa" : "Nova subtarefa"} value={newTitle} disabled={disabled} onChange={(event) => { setNewTitle(event.target.value); }} />
          <label className="sr-only" htmlFor="quick-task-parent">Tarefa-pai</label><select id="quick-task-parent" value={newParentId ?? ""} disabled={disabled} onChange={(event) => { setNewParentId(event.target.value || null); }}><option value="">Sem tarefa-pai</option>{tasks.filter((task) => canTaskHaveChild(tasks, task.id)).map((task) => <option value={task.id} key={task.id}>{taskOutlineLabel(task, outlineNumbers)}{dependencyTaskIds.has(task.id) ? " — dependências serão revisadas" : ""}</option>)}</select>
          <button className="primary-button" type="submit" disabled={disabled}>Adicionar</button>
        </form>
      </div>
      {conflicts.length > 0 ? <div className="schedule-conflict-summary" role="status"><strong>{conflicts.length} {conflicts.length === 1 ? "conflito de agendamento" : "conflitos de agendamento"}</strong><span>Tarefas manuais foram preservadas. Abra a linha correspondente para revisar a data mínima indicada.</span></div> : null}
      <div className="table-scroll-shell">
      <div ref={tableScrollRef} className="table-scroll" onScroll={(event) => { if (horizontalScrollRef.current !== null) horizontalScrollRef.current.scrollLeft = event.currentTarget.scrollLeft; }} onWheel={handleTableWheel}>
        <table
          className="task-table"
          style={{
            "--task-column-width": `${String(taskColumnWidth)}px`,
            "--task-table-min-width": `${String((showBaselineColumns ? 2120 : 1780) + taskColumnWidth - DEFAULT_TASK_COLUMN_WIDTH)}px`,
          } as CSSProperties}
        >
          <caption className="sr-only">Tarefas do projeto com cronograma, predecessoras e ações de edição</caption>
          <thead>
            <tr>
              <th className="selection-cell"><span className="sr-only">Selecionar</span></th>
              <TableColumnHeader
                className="task-column"
                label="Tarefa"
                help="Nome da atividade. A numeração mostra sua posição na hierarquia do projeto. Arraste a borda direita para ajustar a largura."
                alignTooltip="left"
                resizeHandle={(
                  <span
                    className="table-column-resize-handle"
                    role="separator"
                    aria-label="Ajustar largura da coluna Tarefa"
                    aria-orientation="vertical"
                    aria-valuemin={MIN_TASK_COLUMN_WIDTH}
                    aria-valuemax={MAX_TASK_COLUMN_WIDTH}
                    aria-valuenow={taskColumnWidth}
                    tabIndex={0}
                    title="Arraste para ajustar; duplo clique restaura a largura padrão"
                    onDoubleClick={() => { setTaskColumnWidth(DEFAULT_TASK_COLUMN_WIDTH); }}
                    onKeyDown={handleTaskColumnResizeKeyDown}
                    onPointerDown={handleTaskColumnResizeStart}
                    onPointerMove={handleTaskColumnResizeMove}
                    onPointerUp={handleTaskColumnResizeEnd}
                    onPointerCancel={handleTaskColumnResizeEnd}
                  />
                )}
              />
              <TableColumnHeader className="predecessors-column" label="Predecessoras" help="Tarefas que precisam terminar antes desta começar. O intervalo define a espera em dias úteis." />
              <TableColumnHeader className="status-column" label="Status" help="Situação atual da tarefa, como não iniciada, em andamento, bloqueada ou concluída." />
              <TableColumnHeader className="priority-column" label="Prioridade" help="Importância relativa da tarefa. Não altera automaticamente suas datas." />
              <TableColumnHeader className="progress-column" label="Progresso" help="Percentual concluído da tarefa, de 0% a 100%." />
              <TableColumnHeader className="date-column" label="Início" help="Data atual prevista para começar a tarefa." />
              <TableColumnHeader className="date-column" label="Fim" help="Data atual prevista para terminar a tarefa." />
              <TableColumnHeader className="duration-column" label="Duração" help="Quantidade de dias úteis entre o início e o fim, incluindo o primeiro dia." />
              {showBaselineColumns ? (
                <>
                  <TableColumnHeader className="baseline-column" label="Início planejado" help="Data de início guardada no plano de referência ativo." />
                  <TableColumnHeader className="baseline-column" label="Fim planejado" help="Data de término guardada no plano de referência ativo." />
                  <TableColumnHeader className="variance-column" label="Desvio" help="Diferença, em dias úteis, entre o fim planejado e o fim atual. Valor positivo indica atraso." />
                </>
              ) : null}
              <TableColumnHeader className="deadline-column" label="Prazo-limite" help="Data máxima desejada para conclusão. Ela informa risco, mas não movimenta a tarefa." />
              <TableColumnHeader className="health-column" label="Saúde" help="Compara o prazo-limite com hoje e com o fim previsto. Uma tarefa aberta fica atrasada após o prazo, mesmo sem datas; fica em risco no dia do prazo, sem fim previsto ou com fim posterior ao limite." />
              <TableColumnHeader className="assignee-column" label="Responsável" help="Pessoa ou referência responsável por acompanhar a tarefa." />
              <TableColumnHeader className="tags-column" label="Tags" help="Palavras-chave separadas por vírgulas, usadas para organizar e filtrar tarefas." />
              <TableColumnHeader className="actions-column" label="Ações" help="Reordene a tarefa ou abra o menu para detalhes, duplicação e exclusão. Alterações são salvas automaticamente." alignTooltip="right" />
            </tr>
          </thead>
          <tbody>
            {visibleTasks.length === 0 ? <tr><td className="empty-table" colSpan={showBaselineColumns ? 17 : 14}><strong>{tasks.length === 0 ? "Nenhuma tarefa ainda." : "Nenhuma tarefa corresponde aos filtros."}</strong><span>{tasks.length === 0 ? "Use o campo “Nova tarefa” para começar." : "Limpe ou ajuste os filtros para recuperar as linhas."}</span></td></tr> : visibleTasks.map((row) => {
              const siblings = tasks.filter((task) => task.projectId === row.task.projectId && task.parentId === row.task.parentId).sort((left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt));
              const siblingIndex = siblings.findIndex((task) => task.id === row.task.id);
              return <TaskRow key={row.task.id} row={row} outlineNumber={outlineNumbers.get(row.task.id) ?? ""} outlineNumbers={outlineNumbers} tasks={tasks} calendars={calendars} projectCalendarId={projectCalendarId} dependencies={dependencies} conflicts={conflicts} baselineTask={baselineTasks.find((task) => task.taskId === row.task.id) ?? null} showBaselineColumns={showBaselineColumns} todayDate={todayDate} disabled={disabled} selected={selectedTaskIds.has(row.task.id)} expanded={effectiveExpandedIds.has(row.task.id)} canMoveUp={siblingIndex > 0} canMoveDown={siblingIndex >= 0 && siblingIndex < siblings.length - 1} onSelect={(selected) => { setSelectedTaskIds((current) => { const next = new Set(current); if (selected) next.add(row.task.id); else next.delete(row.task.id); return next; }); }} onToggleExpanded={() => { setExpandedTaskIds((current) => { const next = new Set(current); if (next.has(row.task.id)) next.delete(row.task.id); else next.add(row.task.id); return next; }); }} onPrepareSubtask={() => { prepareSubtask(row.task.id); }} onSave={onSave} onMove={(direction) => { void onMove(row.task.id, direction); }} onCreateDependency={onCreateDependency} onDeleteDependency={onDeleteDependency} onDuplicate={(includeDescendants) => { void onDuplicate(row.task.id, includeDescendants).then((copy) => { if (copy !== null && includeDescendants) setExpandedTaskIds((current) => new Set([...current, copy.id])); }); }} onPrepareTemplate={() => { prepareTemplate(row.task); }} onDelete={() => { if (window.confirm(`Excluir “${row.task.title}” e todas as suas subtarefas? Esta ação não pode ser desfeita.`)) void onDelete(row.task.id); }} />;
            })}
          </tbody>
        </table>
      </div>
      <div ref={horizontalScrollRef} className="table-horizontal-scrollbar" role="region" aria-label="Rolagem horizontal da tabela" tabIndex={0} title="Role horizontalmente para visualizar todas as colunas" onScroll={(event) => { if (tableScrollRef.current !== null) tableScrollRef.current.scrollLeft = event.currentTarget.scrollLeft; }}>
        <div style={{ width: `${String(tableScrollWidth)}px` }} />
      </div>
      </div>
      {templateSource === null ? null : (
        <ModalDialog
          className="template-dialog"
          backdropClassName="dialog-backdrop"
          labelledBy="template-dialog-title"
          describedBy="template-dialog-description"
          closeDisabled={disabled}
          onClose={() => { setTemplateSource(null); }}
        >
            <div>
              <h2 id="template-dialog-title">Salvar árvore como template</h2>
              <p id="template-dialog-description">“{templateSource.title}” e suas subtarefas ficarão disponíveis em todo o workspace.</p>
            </div>
            <form onSubmit={(event) => { void saveTemplate(event); }}>
              <label>Nome<input required autoFocus value={templateName} disabled={disabled} onChange={(event) => { setTemplateName(event.target.value); }} /></label>
              <label>Descrição<textarea rows={3} value={templateDescription} disabled={disabled} onChange={(event) => { setTemplateDescription(event.target.value); }} /></label>
              <div className="dialog-actions">
                <button type="button" disabled={disabled} onClick={() => { setTemplateSource(null); }}>Cancelar</button>
                <button className="primary-button" type="submit" disabled={disabled}>Salvar template</button>
              </div>
            </form>
        </ModalDialog>
      )}
      {dependencyParentId === null ? null : (
        <ModalDialog className="template-dialog" labelledBy="dependency-parent-title" describedBy="dependency-parent-description" onClose={() => { setDependencyParentId(null); }}>
          <h2 id="dependency-parent-title">Transformar em tarefa-resumo?</h2>
          <p id="dependency-parent-description">Esta tarefa participa de dependências. Ao criar a subtarefa, escolha como tratar essas relações.</p>
          <div className="dialog-actions">
            <button type="button" onClick={() => { setDependencyParentId(null); }}>Cancelar</button>
            <button type="button" onClick={() => { void createWithDependencyPolicy("REMOVE"); }}>Remover dependências</button>
            <button className="primary-button" type="button" onClick={() => { void createWithDependencyPolicy("TRANSFER"); }}>Transferir para a nova subtarefa</button>
            {dependencies.some((dependency) => dependency.successorId === dependencyParentId) ? null : (
              <button type="button" onClick={() => { void createWithDependencyPolicy("KEEP"); }}>Manter no novo resumo</button>
            )}
          </div>
        </ModalDialog>
      )}
    </section>
  );
}
