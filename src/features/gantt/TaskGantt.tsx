import {
  Gantt,
  Willow,
  type IApi,
  type IColumnConfig,
  type ILink,
  type IScaleConfig,
  type TMethodsConfig,
} from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

import type { Calendar } from "../../domain/calendars/calendar";
import type { BaselineTask } from "../../domain/planning/baseline";
import { addCalendarDays } from "../../domain/calendars/date-only";
import { applyScheduleEdit } from "../../domain/scheduling/schedule-edit";
import { applyGanttDateEdit, planGanttFsMove, type GanttDateEditMode } from "../../domain/scheduling/gantt-edit";
import type { TaskDependency } from "../../domain/scheduling/dependency";
import type { TaskCriticality } from "../../domain/scheduling/critical-path";
import {
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "../../domain/tasks/task";
import { useLanguage } from "../../i18n/language";
import { taskSaveSucceeded, type TaskSaveResult } from "../../domain/tasks/task-save";
import {
  buildTaskOutlineNumbers,
  taskOutlineLabel,
} from "../../domain/tasks/outline-number";
import {
  buildGanttProjection,
  calculateGanttDateRange,
  ganttCalendarClass,
} from "./gantt-adapter";

type GanttScale = "DAY" | "WEEK" | "MONTH";
const GANTT_CELL_HEIGHT = 48;

interface TaskGanttProps {
  readonly tasks: readonly Task[];
  readonly allProjectTasks: readonly Task[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly dependencies: readonly TaskDependency[];
  readonly baselineTasks: readonly BaselineTask[];
  readonly criticalityByTaskId: ReadonlyMap<string, TaskCriticality>;
  readonly disabled: boolean;
  readonly onSave: (task: Task, dependencyUpdates?: readonly TaskDependency[]) => Promise<TaskSaveResult>;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onUndo: () => Promise<boolean>;
  readonly onRedo: () => Promise<boolean>;
  readonly onCreateDependency: (input: {
    readonly predecessorId: string;
    readonly successorId: string;
    readonly lagDays: number;
  }) => Promise<TaskDependency | null>;
  readonly onDeleteDependency: (dependencyId: string) => Promise<boolean>;
}

interface GanttContextMenuState {
  readonly x: number;
  readonly y: number;
  readonly taskId: string | null;
  readonly dependencyId: string | null;
  readonly addPredecessor: boolean;
}

interface GanttVirtualScrollState {
  readonly _tasks?: readonly unknown[];
  readonly _chartHeight?: number;
  readonly _scales?: { readonly height?: number };
  readonly cellHeight?: number;
  readonly scrollTop?: number;
}

function ensureFullVerticalScrollRange(
  shell: HTMLElement,
  api: IApi | null,
  fallbackTaskCount: number,
): void {
  const pseudoRows = shell.querySelector<HTMLElement>(".wx-pseudo-rows");
  if (pseudoRows === null) return;
  const state = api?.getState() as GanttVirtualScrollState | undefined;
  const taskCount = Math.max(state?._tasks?.length ?? 0, fallbackTaskCount);
  const cellHeight = state?.cellHeight ?? GANTT_CELL_HEIGHT;
  const scaleHeight = state?._scales?.height ?? 0;
  const requiredHeight = scaleHeight + taskCount * cellHeight;
  pseudoRows.style.setProperty("min-height", `${String(requiredHeight)}px`, "important");
}

function calculateVerticalMaximum(
  api: IApi | null,
  fallbackTaskCount: number,
  fallbackViewportHeight: number,
): number {
  const state = api?.getState() as GanttVirtualScrollState | undefined;
  const taskCount = Math.max(state?._tasks?.length ?? 0, fallbackTaskCount);
  const cellHeight = state?.cellHeight ?? GANTT_CELL_HEIGHT;
  const scaleHeight = state?._scales?.height ?? 0;
  const viewportHeight = fallbackViewportHeight > 0
    ? fallbackViewportHeight
    : state?._chartHeight ?? 0;
  return Math.max(0, scaleHeight + taskCount * cellHeight - viewportHeight);
}

function ganttColumns(english: boolean): IColumnConfig[] {
  return [
  {
    id: "text",
    header: english ? "Task" : "Tarefa",
    width: 270,
    flexgrow: 1,
    resize: false,
    cell: ({ row }) => {
      const title = String(row.text ?? "");
      return <span className="gantt-task-title" title={title}>{title}</span>;
    },
  },
  { id: "start", header: english ? "Start" : "Início", width: 105, resize: false },
  { id: "workDuration", header: english ? "Duration" : "Duração", width: 102, align: "right", resize: false },
  ];
}

const MONTH_NAMES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

function scalesFor(scale: GanttScale, english: boolean): { readonly scales: IScaleConfig[]; readonly cellWidth: number } {
  if (scale === "MONTH") {
    return {
      cellWidth: 110,
      scales: [
        { unit: "year", step: 1, format: (date) => String(date.getFullYear()) },
        { unit: "month", step: 1, format: (date) => MONTH_NAMES[date.getMonth()] ?? "" },
      ],
    };
  }
  if (scale === "WEEK") {
    return {
      cellWidth: 82,
      scales: [
        { unit: "month", step: 1, format: (date) => `${MONTH_NAMES[date.getMonth()] ?? ""} ${String(date.getFullYear())}` },
        { unit: "week", step: 1, format: (date) => `${english ? "Wk" : "Sem."} ${String(date.getDate()).padStart(2, "0")}` },
      ],
    };
  }
  return {
    cellWidth: 42,
    scales: [
      { unit: "month", step: 1, format: (date) => `${MONTH_NAMES[date.getMonth()] ?? ""} ${String(date.getFullYear())}` },
      { unit: "day", step: 1, format: (date) => String(date.getDate()).padStart(2, "0") },
    ],
  };
}

function displayDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day ?? ""}/${month ?? ""}/${year ?? ""}`;
}

function describeTaskCriticality(criticality: TaskCriticality, english: boolean): string {
  const days = criticality.totalSlackDays;
  const absoluteDays = Math.abs(days);
  const unit = english ? (absoluteDays === 1 ? "working day" : "working days") : (absoluteDays === 1 ? "dia útil" : "dias úteis");
  const slack = days < 0
    ? english ? `${String(absoluteDays)} ${unit} beyond target` : `${String(absoluteDays)} ${unit} além da meta`
    : english ? `${String(days)} ${unit} of float` : `${String(days)} ${unit} de folga`;
  if (criticality.isCritical) return `${english ? "Critical" : "Crítica"} · ${slack}`;
  if (criticality.isNearCritical) return `${english ? "Near critical" : "Quase crítica"} · ${slack}`;
  return slack;
}

export function TaskGantt({
  tasks,
  allProjectTasks,
  calendars,
  projectCalendarId,
  dependencies,
  baselineTasks,
  criticalityByTaskId,
  disabled,
  onSave,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCreateDependency,
  onDeleteDependency,
}: TaskGanttProps) {
  const { language, statusLabel, t } = useLanguage();
  const english = language === "en";
  const [scale, setScale] = useState<GanttScale>("DAY");
  const [ganttApi, setGanttApi] = useState<IApi | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusedDependencyId, setFocusedDependencyId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [localError, setLocalError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [savingVisualEdit, setSavingVisualEdit] = useState(false);
  const [ganttRevision, setGanttRevision] = useState(0);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const ganttLayoutRef = useRef<HTMLDivElement>(null);
  const chartShellRef = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const verticalOffsetRef = useRef(0);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [verticalMaximum, setVerticalMaximum] = useState(0);
  const [timelineScrollWidth, setTimelineScrollWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(590);
  const [contextMenu, setContextMenu] = useState<GanttContextMenuState | null>(null);
  const [contextPredecessorId, setContextPredecessorId] = useState("");
  const projection = useMemo(
    () => buildGanttProjection(tasks, allProjectTasks, dependencies, baselineTasks),
    [allProjectTasks, baselineTasks, dependencies, tasks],
  );
  const scaleConfig = useMemo(() => scalesFor(scale, english), [english, scale]);
  const dateRange = useMemo(
    () => calculateGanttDateRange(allProjectTasks),
    [allProjectTasks],
  );
  const tasksById = useMemo(
    () => new Map(allProjectTasks.map((task) => [task.id, task])),
    [allProjectTasks],
  );
  const outlineNumbers = useMemo(
    () => buildTaskOutlineNumbers(allProjectTasks),
    [allProjectTasks],
  );
  const dependenciesById = useMemo(
    () => new Map(dependencies.map((dependency) => [dependency.id, dependency])),
    [dependencies],
  );
  const focusedLink = projection.links.find(
    (link) => String(link.id) === focusedDependencyId,
  ) ?? null;
  const focusedDependency = focusedDependencyId === null
    ? null
    : dependenciesById.get(focusedDependencyId) ?? null;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const selectedTaskCriticality = selectedTask === null
    ? null
    : criticalityByTaskId.get(selectedTask.id) ?? null;
  const summaryIds = useMemo(
    () => new Set(allProjectTasks.flatMap((task) => task.parentId === null ? [] : [task.parentId])),
    [allProjectTasks],
  );
  const isSummary = selectedTask !== null && summaryIds.has(selectedTask.id);
  const selectedHasPredecessors = selectedTask !== null && dependencies.some(
    (dependency) => dependency.successorId === selectedTask.id,
  );
  const projectCalendar = calendars.find((calendar) => calendar.id === projectCalendarId);
  const selectedGanttTaskIds = focusedDependency === null
    ? selectedTaskId === null ? [] : [selectedTaskId]
    : [focusedDependency.predecessorId, focusedDependency.successorId];
  const contextTask = contextMenu?.taskId === null || contextMenu?.taskId === undefined
    ? null
    : tasksById.get(contextMenu.taskId) ?? null;
  const contextStartDate = contextTask?.startDate ?? null;
  const predecessorOptions = contextMenu?.addPredecessor !== true || contextTask === null || contextStartDate === null
    ? []
    : allProjectTasks.filter((candidate) =>
      candidate.id !== contextTask.id &&
      candidate.endDate !== null &&
      candidate.endDate < contextStartDate &&
      !dependencies.some((dependency) =>
        dependency.predecessorId === candidate.id && dependency.successorId === contextTask.id))
      .sort((left, right) =>
        (right.endDate ?? "").localeCompare(left.endDate ?? "") || left.position - right.position);

  const ganttDomId = (value: string | null): string | null =>
    value?.startsWith(":") === true ? value.slice(1) : value;

  const applyVerticalScroll = useCallback((requestedOffset: number): void => {
    const offset = Math.min(verticalMaximum, Math.max(0, requestedOffset));
    const verticalScroller = chartShellRef.current?.querySelector<HTMLElement>(".wx-gantt");
    verticalOffsetRef.current = offset;
    setVerticalOffset((current) => current === offset ? current : offset);
    if (verticalScroller !== null && verticalScroller !== undefined) verticalScroller.scrollTop = offset;
    ganttApi?.getStores().data.setState({ scrollTop: offset });
  }, [ganttApi, verticalMaximum]);

  useEffect(() => {
    const layout = ganttLayoutRef.current;
    if (layout === null) return;
    const syncHeight = (): void => {
      const available = Math.floor(window.innerHeight - layout.getBoundingClientRect().top - 24);
      const nextHeight = Math.max(280, Math.min(900, available));
      setChartHeight((current) => current === nextHeight ? current : nextHeight);
    };
    const workspace = layout.closest<HTMLElement>(".workspace-main");
    syncHeight();
    window.addEventListener("resize", syncHeight);
    workspace?.addEventListener("scroll", syncHeight, { passive: true });
    return () => {
      window.removeEventListener("resize", syncHeight);
      workspace?.removeEventListener("scroll", syncHeight);
    };
  }, [optionsOpen, projection.tasks.length]);

  useEffect(() => {
    const chart = chartShellRef.current;
    if (chart === null) return;
    const applyHierarchyColors = (): void => {
      const projectedById = new Map(projection.tasks.map((task) => [String(task.id), task]));
      for (const element of chart.querySelectorAll<HTMLElement>("[data-task-id]")) {
        const taskId = ganttDomId(element.dataset.taskId ?? null);
        if (taskId === null) continue;
        const task = projectedById.get(taskId);
        if (task === undefined) continue;
        element.dataset.hierarchyLevel = String(task.hierarchyLevel ?? 0);
        const criticality = criticalityByTaskId.get(taskId);
        element.classList.toggle("critical-path-task", criticality?.isCritical === true);
        element.classList.toggle("near-critical-task", criticality?.isNearCritical === true);
      }
    };
    applyHierarchyColors();
    let animationFrame: number | null = null;
    const scheduleHierarchyColors = (): void => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        applyHierarchyColors();
      });
    };
    const observer = new MutationObserver(scheduleHierarchyColors);
    observer.observe(chart, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [criticalityByTaskId, ganttRevision, projection.tasks]);

  useEffect(() => {
    const shell = chartShellRef.current;
    if (shell === null) return;
    let timeline: HTMLElement | null = null;
    let verticalScroller: HTMLElement | null = null;
    const syncFromTimeline = (): void => {
      if (timeline !== null && horizontalScrollRef.current !== null) {
        horizontalScrollRef.current.scrollLeft = timeline.scrollLeft;
      }
    };
    const syncFromVertical = (): void => {
      if (verticalScroller === null) return;
      const offset = verticalScroller.scrollTop;
      verticalOffsetRef.current = offset;
      setVerticalOffset((current) => current === offset
        ? current
        : offset);
    };
    const measureTimeline = (): void => {
      ensureFullVerticalScrollRange(shell, ganttApi, projection.tasks.length);
      const nextTimeline = shell.querySelector<HTMLElement>(".wx-chart");
      const nextVerticalScroller = shell.querySelector<HTMLElement>(".wx-gantt");
      if (nextTimeline !== timeline) {
        timeline?.removeEventListener("scroll", syncFromTimeline);
        timeline = nextTimeline;
        timeline?.addEventListener("scroll", syncFromTimeline, { passive: true });
      }
      if (nextVerticalScroller !== verticalScroller) {
        verticalScroller?.removeEventListener("scroll", syncFromVertical);
        verticalScroller = nextVerticalScroller;
        verticalScroller?.addEventListener("scroll", syncFromVertical, { passive: true });
      }
      if (timeline !== null) {
        setTimelineScrollWidth(Math.max(timeline.clientWidth, timeline.scrollWidth));
        syncFromTimeline();
      }
      if (verticalScroller !== null) {
        setVerticalMaximum(Math.max(
          verticalScroller.scrollHeight - verticalScroller.clientHeight,
          calculateVerticalMaximum(ganttApi, projection.tasks.length, verticalScroller.clientHeight),
        ));
        syncFromVertical();
      }
    };
    let animationFrame: number | null = null;
    const scheduleMeasurement = (): void => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        measureTimeline();
      });
    };
    measureTimeline();
    const mutationObserver = new MutationObserver(scheduleMeasurement);
    mutationObserver.observe(shell, { childList: true, subtree: true });
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(scheduleMeasurement);
    resizeObserver?.observe(shell);
    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      timeline?.removeEventListener("scroll", syncFromTimeline);
      verticalScroller?.removeEventListener("scroll", syncFromVertical);
    };
  }, [ganttApi, ganttRevision, projection.tasks, scale]);

  const dependencyLabel = useCallback((dependency: TaskDependency): string => {
    const predecessor = tasksById.get(dependency.predecessorId);
    const successor = tasksById.get(dependency.successorId);
    const predecessorLabel = predecessor === undefined
      ? (english ? "Deleted task" : "Tarefa removida")
      : taskOutlineLabel(predecessor, outlineNumbers);
    const successorLabel = successor === undefined
      ? (english ? "Deleted task" : "Tarefa removida")
      : taskOutlineLabel(successor, outlineNumbers);
    const lag = dependency.lagDays === 0 ? "lag 0" : `lag +${String(dependency.lagDays)}`;
    return `${predecessorLabel} → ${successorLabel} · FS, ${lag}`;
  }, [english, outlineNumbers, tasksById]);

  const focusDependencyFromChart = (event: MouseEvent<HTMLDivElement>): void => {
    if (!(event.target instanceof Element)) return;
    const linkElement = event.target.closest("[data-link-id]");
    const linkId = ganttDomId(linkElement?.getAttribute("data-link-id") ?? null);
    if (linkId !== null && dependenciesById.has(linkId)) {
      setFocusedDependencyId(linkId);
    }
  };

  const openContextMenu = (event: MouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (!(event.target instanceof Element)) return;
    const linkId = ganttDomId(event.target.closest("[data-link-id]")?.getAttribute("data-link-id") ?? null);
    const taskElement = event.target.closest("[data-task-id]");
    const taskId = ganttDomId(taskElement?.getAttribute("data-task-id") ?? null);
    if (linkId === null && taskId === null) {
      setContextMenu(null);
      return;
    }
    setContextPredecessorId("");
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 310),
      y: Math.min(event.clientY, window.innerHeight - 220),
      taskId,
      dependencyId: linkId,
      addPredecessor: false,
    });
  };

  useEffect(() => {
    const shell = chartShellRef.current;
    if (shell === null || ganttApi === null) return;
    const handleWheel = (event: globalThis.WheelEvent): void => {
      if (event.ctrlKey || event.deltaY === 0) return;
      const verticalScroller = shell.querySelector<HTMLElement>(".wx-gantt");
      const viewportHeight = verticalScroller?.clientHeight ?? shell.clientHeight;
      const maximumScroll = Math.max(
        verticalMaximum,
        calculateVerticalMaximum(ganttApi, projection.tasks.length, viewportHeight),
      );
      if (maximumScroll <= 0) return;
      const apiPosition = ganttApi.getState().scrollTop;
      const currentPosition = typeof apiPosition === "number" ? apiPosition : verticalOffsetRef.current;
      const nextScroll = Math.min(maximumScroll, Math.max(0, currentPosition + event.deltaY));
      if (nextScroll === currentPosition) return;
      event.preventDefault();
      event.stopPropagation();
      applyVerticalScroll(nextScroll);
    };
    shell.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    return () => { shell.removeEventListener("wheel", handleWheel, { capture: true }); };
  }, [applyVerticalScroll, ganttApi, projection.tasks.length, verticalMaximum]);

  const scrollTimeline = (event: SyntheticEvent<HTMLDivElement>): void => {
    const offset = event.currentTarget.scrollLeft;
    const timeline = chartShellRef.current?.querySelector<HTMLElement>(".wx-chart");
    if (timeline !== null && timeline !== undefined) {
      timeline.scrollLeft = offset;
      void ganttApi?.exec("scroll-chart", { left: offset });
    }
  };

  const scrollTaskRowsFromBar = (event: SyntheticEvent<HTMLInputElement>): void => {
    applyVerticalScroll(Number(event.currentTarget.value));
  };

  useEffect(() => {
    if (contextMenu === null) return;
    const close = (event: globalThis.PointerEvent): void => {
      if (event.target instanceof Node && contextMenuRef.current?.contains(event.target)) return;
      setContextMenu(null);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  const addContextPredecessor = async (): Promise<void> => {
    if (contextTask === null || contextPredecessorId.length === 0) return;
    setContextMenu(null);
    await saveVisualDependency({
      source: contextPredecessorId,
      target: contextTask.id,
      type: "e2s",
    });
  };

  const deleteContextDependency = async (): Promise<void> => {
    const dependencyId = contextMenu?.dependencyId;
    if (dependencyId === null || dependencyId === undefined) return;
    setContextMenu(null);
    setSavingVisualEdit(true);
    setLocalError(null);
    try {
      if (await onDeleteDependency(dependencyId)) {
        setFocusedDependencyId(null);
        setAnnouncement(english ? "FS dependency deleted." : "Dependência FS excluída.");
      } else {
        setLocalError(english ? "Unable to delete dependency." : "Não foi possível excluir a dependência.");
      }
    } catch (error) {
      setLocalError(english ? "Unable to delete dependency." : error instanceof Error ? error.message : "Não foi possível excluir a dependência.");
    } finally {
      setSavingVisualEdit(false);
    }
  };

  const toggleContextTaskLock = async (): Promise<void> => {
    if (contextTask === null || summaryIds.has(contextTask.id)) return;
    setContextMenu(null);
    setSavingVisualEdit(true);
    setLocalError(null);
    const locked = contextTask.schedulingMode === "MANUAL";
    try {
      if (taskSaveSucceeded(await onSave({ ...contextTask, schedulingMode: locked ? "AUTO" : "MANUAL" }))) {
        setAnnouncement(`${contextTask.title}: datas ${locked ? "destravadas para agendamento automático" : "travadas contra arrasto e reagendamento automático"}.`);
      } else {
        setLocalError(english ? "Unable to change date lock." : "Não foi possível alterar a trava de datas.");
      }
    } catch (error) {
      setLocalError(english ? "Unable to change date lock." : error instanceof Error ? error.message : "Não foi possível alterar a trava de datas.");
    } finally {
      setSavingVisualEdit(false);
      resetGanttProjection();
    }
  };

  const selectTask = useCallback((taskId: string | null): void => {
    const task = tasks.find((candidate) => candidate.id === taskId);
    setSelectedTaskId(task?.id ?? null);
    setStartDate(task?.startDate ?? "");
    setDurationDays(task?.durationDays ?? 1);
    setLocalError(null);
  }, [tasks]);

  useEffect(() => {
    if (ganttApi === null) return;
    const listenerTag = Symbol("chronoproject-gantt-selection");
    ganttApi.on("select-task", ({ id }) => {
      if (typeof id === "string") selectTask(id);
    }, { tag: listenerTag });
    return () => { ganttApi.detach(listenerTag); };
  }, [ganttApi, selectTask]);

  const resetGanttProjection = useCallback((): void => {
    setGanttRevision((revision) => revision + 1);
  }, []);

  const saveVisualTaskEdit = useCallback(async (
    input: TMethodsConfig["update-task"],
  ): Promise<void> => {
    if (savingVisualEdit || disabled) return;
    const task = tasksById.get(String(input.id));
    if (task === undefined) return;
    if ("progress" in input.task) {
      if (task.status === "COMPLETED") {
        setLocalError(`${task.title} está concluída. Reabra a atividade pelo inspetor antes de alterar o progresso.`);
        resetGanttProjection();
        return;
      }
      const progress = input.task.progress;
      if (typeof progress !== "number" || !Number.isFinite(progress)) {
        setLocalError(english ? "The completion percentage entered in Gantt is invalid." : "O percentual de conclusão informado pelo Gantt é inválido.");
        resetGanttProjection();
        return;
      }
      setSavingVisualEdit(true);
      setLocalError(null);
      try {
        const normalizedProgress = Math.round(Math.min(100, Math.max(0, progress)));
        const saved = await onSave({ ...task, progress: normalizedProgress });
        if (!taskSaveSucceeded(saved)) {
          setLocalError(english ? "Unable to save completion. No change was applied." : "Não foi possível salvar a conclusão. Nenhuma alteração foi aplicada.");
          resetGanttProjection();
        } else {
          setAnnouncement(`${task.title}: conclusão atualizada para ${String(normalizedProgress)}%.`);
          setSelectedTaskId(task.id);
          resetGanttProjection();
        }
      } catch (error) {
        setLocalError(english ? "Unable to save completion." : error instanceof Error ? error.message : "Não foi possível salvar a conclusão.");
        resetGanttProjection();
      } finally {
        setSavingVisualEdit(false);
      }
      return;
    }
    const mode: GanttDateEditMode | null = input.task.start instanceof Date && input.task.end instanceof Date
      ? "MOVE"
      : input.task.start instanceof Date
        ? "START"
        : input.task.end instanceof Date
          ? "END"
          : null;
    if (mode === null || input.diff === undefined) {
      resetGanttProjection();
      return;
    }
    if (task.schedulingMode === "MANUAL") {
      setLocalError(`${task.title} está com as datas travadas. Destrave o cadeado antes de arrastar ou redimensionar.`);
      resetGanttProjection();
      return;
    }
    const calendar = calendars.find(
      (candidate) => candidate.id === (task.calendarId ?? projectCalendarId),
    );
    if (calendar === undefined) {
      setLocalError(english ? "The task's effective calendar was not found." : "O calendário efetivo da tarefa não foi encontrado.");
      resetGanttProjection();
      return;
    }
    try {
      const hasPredecessors = dependencies.some((dependency) => dependency.successorId === task.id);
      if (summaryIds.has(task.id)) throw new Error(english ? "Summary task dates are calculated from subtasks." : "As datas desta tarefa-resumo são calculadas pelas subtarefas.");
      const fsMove = mode === "MOVE" && hasPredecessors
        ? planGanttFsMove(task, input.diff, calendar, dependencies, allProjectTasks)
        : null;
      const edited = fsMove?.task ?? applyGanttDateEdit(task, {
        mode,
        differenceInCalendarDays: input.diff,
      }, calendar, { hasPredecessors, isSummary: false });
      const requestedStartDate = mode === "MOVE" && task.startDate !== null
        ? addCalendarDays(task.startDate, input.diff)
        : null;
      const calendarAdjusted = fsMove?.calendarAdjusted
        ?? (requestedStartDate !== null && edited.startDate !== requestedStartDate);
      const unchangedTask = edited.startDate === task.startDate
        && edited.endDate === task.endDate
        && edited.durationDays === task.durationDays;
      const dependencyUpdates = fsMove?.dependencyUpdates ?? [];
      if (unchangedTask && dependencyUpdates.length === 0) {
        setAnnouncement(calendarAdjusted && requestedStartDate !== null && edited.startDate !== null
          ? `${displayDate(requestedStartDate)} não é um dia útil. ${task.title} foi mantida em ${displayDate(edited.startDate)}, conforme o calendário.`
          : `${task.title}: nenhuma alteração necessária.`);
        resetGanttProjection();
        return;
      }
      setSavingVisualEdit(true);
      setLocalError(null);
      const saved = await onSave(edited, fsMove?.dependencyUpdates ?? []);
      if (!taskSaveSucceeded(saved)) {
        setLocalError(english ? "Unable to save schedule. No change was applied." : "Não foi possível salvar o cronograma. Nenhuma alteração foi aplicada.");
        resetGanttProjection();
      } else {
        const lagChanges = fsMove?.dependencyUpdates.length ?? 0;
        const limited = fsMove !== null && fsMove.requestedStartDate !== fsMove.appliedStartDate;
        setAnnouncement(limited
          ? `${task.title}: movida até ${fsMove.appliedStartDate}; uma predecessora com lag zero impede antecipar mais.`
          : `${task.title}: cronograma atualizado${lagChanges > 0 ? ` e ${String(lagChanges)} intervalo FS ajustado${lagChanges === 1 ? "" : "s"}` : ""}.`);
        setSelectedTaskId(task.id);
        resetGanttProjection();
      }
    } catch (error) {
      setLocalError(english ? "Unable to change schedule." : error instanceof Error ? error.message : "Não foi possível alterar o cronograma.");
      resetGanttProjection();
    } finally {
      setSavingVisualEdit(false);
    }
  }, [allProjectTasks, calendars, dependencies, disabled, english, onSave, projectCalendarId, resetGanttProjection, savingVisualEdit, summaryIds, tasksById]);

  const restoreHistory = useCallback(async (direction: "UNDO" | "REDO"): Promise<void> => {
    if (savingVisualEdit || disabled) return;
    setSavingVisualEdit(true);
    try {
      if (await (direction === "UNDO" ? onUndo() : onRedo())) {
        setAnnouncement(english ? `Last change ${direction === "UNDO" ? "undone" : "redone"}.` : `Última alteração ${direction === "UNDO" ? "desfeita" : "refeita"}.`);
      } else {
        setLocalError(english ? `There is no change to ${direction === "UNDO" ? "undo" : "redo"}.` : `Não há alteração para ${direction === "UNDO" ? "desfazer" : "refazer"}.`);
      }
    } catch (error) {
      setLocalError(english ? "Unable to restore change." : error instanceof Error ? error.message : "Não foi possível restaurar a alteração.");
    } finally {
      setSavingVisualEdit(false);
      resetGanttProjection();
    }
  }, [disabled, english, onRedo, onUndo, resetGanttProjection, savingVisualEdit]);

  const saveVisualDependency = useCallback(async (link: Partial<ILink>): Promise<void> => {
    if (savingVisualEdit || disabled) return;
    const predecessorId = String(link.source ?? "");
    const successorId = String(link.target ?? "");
    if (link.type !== "e2s") {
      setLocalError(english ? "This version supports Finish-to-Start (FS) dependencies only." : "Nesta versão, crie somente dependências Término para Início (FS).");
      resetGanttProjection();
      return;
    }
    if (predecessorId === successorId) {
      setLocalError(english ? "A task cannot depend on itself." : "Uma tarefa não pode depender dela mesma.");
      resetGanttProjection();
      return;
    }
    if (summaryIds.has(successorId)) {
      setLocalError(english ? "A summary task cannot be a successor because its dates are derived." : "Uma tarefa-resumo não pode ser sucessora porque suas datas são derivadas.");
      resetGanttProjection();
      return;
    }
    setSavingVisualEdit(true);
    setLocalError(null);
    try {
      const created = await onCreateDependency({ predecessorId, successorId, lagDays: 0 });
      if (created === null) {
        setLocalError(english ? "Unable to create dependency. Check whether it would create a cycle." : "Não foi possível criar a dependência. Verifique se ela produziria um ciclo.");
        resetGanttProjection();
      } else {
        setFocusedDependencyId(created.id);
        setAnnouncement(english ? "FS dependency created with zero lag." : "Dependência FS criada com intervalo zero.");
        resetGanttProjection();
      }
    } catch (error) {
      setLocalError(english ? "Unable to save dependency. No change was applied." : error instanceof Error ? error.message : "Não foi possível salvar a dependência. Nenhuma alteração foi aplicada.");
      resetGanttProjection();
    } finally {
      setSavingVisualEdit(false);
    }
  }, [disabled, english, onCreateDependency, resetGanttProjection, savingVisualEdit, summaryIds]);

  useEffect(() => {
    if (ganttApi === null) return;
    const listenerTag = Symbol("chronoproject-gantt-edits");
    ganttApi.intercept("update-task", (input) => {
      if (input.eventSource !== undefined) return true;
      if (input.inProgress === true) return true;
      void saveVisualTaskEdit(input);
      return true;
    }, { tag: listenerTag });
    ganttApi.intercept("add-link", ({ link }) => {
      void saveVisualDependency(link);
      return true;
    }, { tag: listenerTag });
    return () => { ganttApi.detach(listenerTag); };
  }, [ganttApi, saveVisualDependency, saveVisualTaskEdit]);

  const saveSchedule = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (selectedTask === null || isSummary) return;
    if (startDate.length === 0 || !Number.isInteger(durationDays) || durationDays < 1) {
      setLocalError(english ? "Enter a start date and a whole duration greater than zero." : "Informe uma data de início e uma duração inteira maior que zero.");
      return;
    }
    const calendarId = selectedTask.calendarId ?? projectCalendarId;
    const calendar = calendars.find((candidate) => candidate.id === calendarId);
    if (calendar === undefined) {
      setLocalError(english ? "The task's effective calendar was not found." : "O calendário efetivo da tarefa não foi encontrado.");
      return;
    }
    try {
      const withStart = applyScheduleEdit(
        selectedTask,
        { field: "startDate", value: startDate },
        calendar,
      );
      const scheduled = applyScheduleEdit(
        withStart,
        { field: "durationDays", value: durationDays },
        calendar,
      );
      const saved = await onSave(scheduled);
      if (!taskSaveSucceeded(saved)) return;
      setLocalError(null);
    } catch (error) {
      setLocalError(english ? "Unable to change schedule." : error instanceof Error ? error.message : "Não foi possível alterar o cronograma.");
    }
  };

  const saveStatus = async (status: TaskStatus): Promise<void> => {
    if (selectedTask === null || selectedTask.status === status || disabled || savingVisualEdit) return;
    setSavingVisualEdit(true);
    setLocalError(null);
    try {
      const saved = await onSave({ ...selectedTask, status });
      if (taskSaveSucceeded(saved)) {
        setAnnouncement(`${selectedTask.title}: ${t("kanban.movedTo")} ${statusLabel(status)}.`);
        setSelectedTaskId(selectedTask.id);
        resetGanttProjection();
      }
    } catch (error) {
      setLocalError(english ? "Unable to change status." : error instanceof Error ? error.message : "Não foi possível alterar o status.");
    } finally {
      setSavingVisualEdit(false);
    }
  };

  return (
    <section className="gantt-section" aria-labelledby="gantt-title">
      <header className="view-heading gantt-heading">
        <div>
          <h2 id="gantt-title">{t("gantt.title")}</h2>
          <p className="gantt-heading-note">{t("gantt.description")}</p>
        </div>
        <div className="gantt-header-controls" aria-label={t("gantt.controls")}>
          <button type="button" disabled={disabled || savingVisualEdit || !canUndo} onClick={() => { void restoreHistory("UNDO"); }}>{t("gantt.undo")}</button>
          <button type="button" disabled={disabled || savingVisualEdit || !canRedo} onClick={() => { void restoreHistory("REDO"); }}>{t("gantt.redo")}</button>
          <label className="gantt-scale-control">
            <span>{t("gantt.scale")}</span>
            <select value={scale} onChange={(event) => { setScale(event.target.value as GanttScale); }}>
              <option value="DAY">{t("gantt.days")}</option>
              <option value="WEEK">{t("gantt.weeks")}</option>
              <option value="MONTH">{t("gantt.months")}</option>
            </select>
          </label>
          <div className="gantt-legend gantt-compact-legend" aria-label={t("gantt.legend")}>
            <span><i className="legend-task" /> {t("gantt.task")}</span>
            <span><i className="legend-summary" /> {t("gantt.summary")}</span>
            {criticalityByTaskId.size === 0 ? null : (
              <>
                <span><i className="legend-critical" aria-hidden="true" /> {t("gantt.critical")}</span>
                <span><i className="legend-near-critical" aria-hidden="true" /> {t("gantt.nearCritical")}</span>
              </>
            )}
            <span><i className="legend-weekend" /> {t("gantt.weekend")}</span>
            <span><i className="legend-holiday" /> {t("gantt.holiday")}</span>
            <span><i className="legend-link" /> {t("gantt.dependency")}</span>
          </div>
          <button type="button" className="gantt-toolbar-button" aria-expanded={optionsOpen} onClick={() => { setOptionsOpen((current) => !current); }}>{t("gantt.options")}</button>
        </div>
      </header>
      {savingVisualEdit ? <p className="gantt-saving" role="status">{english ? "Saving Gantt change…" : "Salvando alteração do Gantt…"}</p> : null}
      {announcement.length > 0 ? <p className="gantt-toolbar-status" key={announcement} role="status">{announcement}</p> : null}
      {localError === null ? null : <p className="field-error gantt-error" role="alert">{localError}</p>}

      {optionsOpen ? <div className="gantt-options-panel">
        <p className="gantt-scroll-hint">
          {english ? "Use the mouse wheel to move through tasks, the bottom bar to navigate schedule dates, and the right button to create or delete FS dependencies." : "Use a roda do mouse para percorrer atividades, a barra inferior para navegar pelas datas e o botão direito para criar ou excluir dependências FS."}
        </p>

        {projection.links.length === 0 ? null : (
          <div className="gantt-dependency-focus">
          <label>
            <span>{english ? "Focused dependency" : "Dependência em foco"}</span>
            <select
              aria-label={english ? "Focused dependency" : "Dependência em foco"}
              value={focusedDependencyId ?? ""}
              onChange={(event) => { setFocusedDependencyId(event.target.value || null); }}
            >
              <option value="">{english ? "All dependencies" : "Todas as dependências"}</option>
              {projection.links.map((link) => {
                const dependency = dependenciesById.get(String(link.id));
                return dependency === undefined ? null : (
                  <option value={dependency.id} key={dependency.id}>
                    {dependencyLabel(dependency)}
                  </option>
                );
              })}
            </select>
          </label>
          <p>
            {focusedDependency === null
              ? (english ? "Click a line or choose a relationship to isolate its path." : "Clique em uma linha ou escolha a relação para isolar seu caminho.")
              : `${english ? "Focused" : "Em foco"}: ${dependencyLabel(focusedDependency)}`}
          </p>
          </div>
        )}
      </div> : null}

      {projection.tasks.length === 0 ? (
        <div className="view-empty" role="status">
          <strong>{english ? "No scheduled task matches the filters." : "Nenhuma tarefa agendada corresponde aos filtros."}</strong>
          <span>{english ? "Set start and duration in Table or adjust the filters." : "Defina início e duração na Tabela ou ajuste os filtros."}</span>
        </div>
      ) : (
        <div
          ref={ganttLayoutRef}
          className="gantt-layout"
          style={{ "--gantt-chart-height": `${String(chartHeight)}px` } as CSSProperties}
        >
          <div
            ref={chartShellRef}
            className={`gantt-chart-shell${focusedLink === null ? "" : " dependency-focus-active"}`}
            data-testid="chronoproject-gantt"
            onClick={focusDependencyFromChart}
            onContextMenu={openContextMenu}
          >
            <div className="gantt-renderer">
              <Willow fonts={false}>
                <Gantt
                key={ganttRevision}
                tasks={[...projection.tasks]}
                links={[...projection.links]}
                columns={ganttColumns(english)}
                scales={scaleConfig.scales}
                {...(dateRange === null ? {} : { start: dateRange.start, end: dateRange.end })}
                cellWidth={scaleConfig.cellWidth}
                cellHeight={GANTT_CELL_HEIGHT}
                gridWidth={454}
                readonly={disabled || savingVisualEdit}
                zoom
                baselines={baselineTasks.length > 0}
                init={setGanttApi}
                selected={selectedGanttTaskIds}
                highlightTime={(date, unit) =>
                  unit === "day" && projectCalendar !== undefined
                    ? ganttCalendarClass(projectCalendar, date)
                    : ""
                }
                />
              </Willow>
            </div>
          </div>

          <div className="gantt-vertical-scroll">
            <input
              className="gantt-vertical-scroll-input"
              type="range"
              aria-label={english ? "Browse Gantt tasks" : "Percorrer atividades do Gantt"}
              min={0}
              max={Math.max(1, Math.round(verticalMaximum))}
              step={1}
              value={Math.min(verticalOffset, Math.max(1, verticalMaximum))}
              onInput={scrollTaskRowsFromBar}
            />
            <span
              className="gantt-vertical-scroll-thumb"
              style={{
                top: verticalMaximum <= 0
                  ? 0
                  : `calc(${String((verticalOffset / verticalMaximum) * 100)}% - ${String((verticalOffset / verticalMaximum) * 28)}px)`,
              }}
            />
          </div>

          <div
            ref={horizontalScrollRef}
            className="gantt-horizontal-scrollbar"
            role="region"
            aria-label={english ? "Gantt horizontal scrolling" : "Rolagem horizontal do Gantt"}
            tabIndex={0}
            title={english ? "Scroll horizontally to browse schedule dates" : "Role horizontalmente para navegar pelas datas do cronograma"}
            onScroll={scrollTimeline}
          >
            <div style={{ width: `${String(timelineScrollWidth)}px` }} />
          </div>

          {contextMenu === null ? null : (
            <div
              className="gantt-context-menu"
              ref={contextMenuRef}
              role="dialog"
              aria-label={english ? "Gantt actions" : "Ações do Gantt"}
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onPointerDown={(event) => { event.stopPropagation(); }}
            >
              {contextMenu.dependencyId === null ? null : (
                <button type="button" onClick={() => { void deleteContextDependency(); }}>
                  {english ? "Delete dependency" : "Excluir dependência"}
                </button>
              )}
              {contextTask === null || summaryIds.has(contextTask.id) ? null : (
                <>
                  <button type="button" onClick={() => { void toggleContextTaskLock(); }}>
                    {contextTask.schedulingMode === "MANUAL" ? (english ? "Unlock dates" : "Destravar datas") : (english ? "Lock dates" : "Travar datas")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setContextMenu((current) => current === null ? null : { ...current, addPredecessor: true }); }}
                  >
                    {english ? "Add predecessor…" : "Adicionar predecessora…"}
                  </button>
                  {contextMenu.addPredecessor ? (
                    <div className="gantt-context-predecessor">
                      <label>
                        <span>{english ? "FS predecessor" : "Predecessora FS"}</span>
                        <select value={contextPredecessorId} autoFocus onChange={(event) => { setContextPredecessorId(event.target.value); }}>
                          <option value="">{english ? "Select a task" : "Selecione uma tarefa"}</option>
                          {predecessorOptions.map((task) => (
                            <option value={task.id} key={task.id}>{taskOutlineLabel(task, outlineNumbers)}</option>
                          ))}
                        </select>
                      </label>
                      <button type="button" disabled={contextPredecessorId.length === 0} onClick={() => { void addContextPredecessor(); }}>
                        {english ? "Create FS" : "Criar FS"}
                      </button>
                      {predecessorOptions.length === 0 ? (
                        <p>{english ? "No eligible previous task." : "Nenhuma tarefa anterior elegível."}</p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}

          <aside className="gantt-inspector" aria-labelledby="gantt-inspector-title">
            <h3 id="gantt-inspector-title">{t("gantt.inspector")}</h3>
            <label>
              <span>{t("gantt.task")}</span>
              <select
                aria-label={english ? "Selected Gantt task" : "Tarefa selecionada no Gantt"}
                value={selectedTask?.id ?? ""}
                onChange={(event) => { selectTask(event.target.value || null); }}
              >
                <option value="">{t("gantt.selectOnChart")}</option>
                {tasks.map((task) => <option value={task.id} key={task.id}>{taskOutlineLabel(task, outlineNumbers)}</option>)}
              </select>
            </label>
            {selectedTask === null ? (
              <p className="gantt-inspector-empty">{t("gantt.selectHint")}</p>
            ) : (
              <>
                <dl>
                  <div className="gantt-status-row">
                    <dt>{t("filters.status")}</dt>
                    <dd>
                      <select
                        aria-label={`${english ? "Status of" : "Status de"} ${selectedTask.title}`}
                        value={selectedTask.status}
                        disabled={disabled || savingVisualEdit}
                        onChange={(event) => { void saveStatus(event.target.value as TaskStatus); }}
                      >
                        {TASK_STATUSES.map((status) => (
                          <option value={status} key={status}>{statusLabel(status)}</option>
                        ))}
                      </select>
                    </dd>
                  </div>
                  <div><dt>{t("gantt.dates")}</dt><dd>{selectedTask.schedulingMode === "MANUAL" ? (english ? "🔒 Locked" : "🔒 Travadas") : (english ? "🔓 Automatic" : "🔓 Automáticas")}</dd></div>
                  <div><dt>{t("gantt.progress")}</dt><dd>{String(selectedTask.progress)}%</dd></div>
                  {selectedTaskCriticality === null ? null : (
                    <div>
                      <dt>{english ? "CPM float" : "Folga CPM"}</dt>
                      <dd>{describeTaskCriticality(selectedTaskCriticality, english)}</dd>
                    </div>
                  )}
                </dl>
                <form className="gantt-schedule-form" onSubmit={(event) => { void saveSchedule(event); }}>
                  <label>
                    <span>{t("gantt.start")}</span>
                    <input
                      type="date"
                      required
                      value={startDate}
                      disabled={disabled || isSummary || selectedHasPredecessors}
                      onChange={(event) => { setStartDate(event.target.value); }}
                    />
                  </label>
                  <label>
                    <span>{t("gantt.duration")}</span>
                    <input
                      type="number"
                      min={1}
                      required
                      value={durationDays}
                      disabled={disabled || isSummary}
                      onChange={(event) => { setDurationDays(Number(event.target.value)); }}
                    />
                  </label>
                  {isSummary ? (
                    <p className="gantt-summary-note">{english ? "Summary task dates are derived from subtasks." : "Datas de tarefas-resumo são derivadas das subtarefas."}</p>
                  ) : selectedTask.schedulingMode === "MANUAL" ? (
                    <p className="gantt-summary-note">{english ? "🔒 Locked dates: dragging is disabled. Use exact values here or unlock using the context menu." : "🔒 Datas travadas: o arrasto está bloqueado. Use valores exatos aqui ou destrave pelo menu de contexto."}</p>
                  ) : selectedHasPredecessors ? (
                    <p className="gantt-summary-note">{english ? "Start date follows predecessors. Moving the bar automatically adjusts FS lag; duration remains editable." : "A data inicial segue as predecessoras. Mover a barra ajusta automaticamente o lag FS; a duração continua editável."}</p>
                  ) : (
                    <button className="primary-button" type="submit" disabled={disabled}>
                      {t("gantt.saveSchedule")}
                    </button>
                  )}
                  {!isSummary && selectedHasPredecessors ? (
                    <button className="primary-button" type="submit" disabled={disabled}>{english ? "Save duration" : "Salvar duração"}</button>
                  ) : null}
                </form>
              </>
            )}
          </aside>
        </div>
      )}
      {projection.unscheduledCount > 0 ? (
        <p className="gantt-unscheduled-note">
          {english
            ? `${String(projection.unscheduledCount)} unscheduled task${projection.unscheduledCount === 1 ? " is" : "s are"} not shown as a bar.`
            : `${String(projection.unscheduledCount)} tarefa${projection.unscheduledCount === 1 ? "" : "s"} sem cronograma não ${projection.unscheduledCount === 1 ? "é exibida" : "são exibidas"} como barra.`}
        </p>
      ) : null}
    </section>
  );
}
