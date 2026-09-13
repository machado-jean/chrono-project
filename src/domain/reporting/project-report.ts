import type { Project } from "../projects/project";
import type { Calendar } from "../calendars/calendar";
import {
  compareTaskWithBaseline,
  type BaselineTask,
  type ScheduleHealth,
} from "../planning/baseline";
import type { TaskDependency } from "../scheduling/dependency";
import { flattenVisibleTasks } from "../tasks/hierarchy";
import { buildTaskOutlineNumbers, taskOutlineLabel } from "../tasks/outline-number";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../tasks/task";

export type ProjectPdfFormat = "REPORT" | "TASKS" | "GANTT";
export type ProjectPdfScope = "ALL" | "VISIBLE";
export type ProjectPdfPageSize = "A4" | "A3";

export interface ProjectPdfOptions {
  readonly format: ProjectPdfFormat;
  readonly scope: ProjectPdfScope;
  readonly pageSize: ProjectPdfPageSize;
  readonly includeDetails: boolean;
  readonly includeBaseline?: boolean;
  readonly timelineStart: string | null;
  readonly timelineEnd: string | null;
}

export interface ProjectReportRow {
  readonly id: string;
  readonly outline: string;
  readonly label: string;
  readonly depth: number;
  readonly isSummary: boolean;
  readonly status: TaskStatus;
  readonly statusLabel: string;
  readonly priority: TaskPriority;
  readonly priorityLabel: string;
  readonly progress: number;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly durationDays: number | null;
  readonly deadlineDate: string | null;
  readonly health: ScheduleHealth;
  readonly baselineStartDate: string | null;
  readonly baselineEndDate: string | null;
  readonly endVarianceDays: number | null;
  readonly assignee: string | null;
  readonly tags: readonly string[];
  readonly description: string | null;
  readonly notes: string | null;
  readonly predecessors: readonly string[];
  readonly predecessorIds: readonly string[];
}

export interface ProjectReport {
  readonly project: Project;
  readonly generatedAt: string;
  readonly options: ProjectPdfOptions;
  readonly rows: readonly ProjectReportRow[];
  readonly statusCounts: Readonly<Record<TaskStatus, number>>;
  readonly priorityCounts: Readonly<Record<TaskPriority, number>>;
  readonly averageProgress: number;
  readonly scheduledCount: number;
  readonly timelineStart: string | null;
  readonly timelineEnd: string | null;
}

interface BuildProjectReportInput {
  readonly project: Project;
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly calendars?: readonly Calendar[];
  readonly baselineTasks?: readonly BaselineTask[];
  readonly visibleTaskIds?: ReadonlySet<string>;
  readonly options: ProjectPdfOptions;
  readonly generatedAt?: string;
}

function emptyCounts<T extends string>(values: readonly T[]): Record<T, number> {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
}

function minDate(values: readonly (string | null)[]): string | null {
  const dates = values.filter((value): value is string => value !== null).sort();
  return dates[0] ?? null;
}

function maxDate(values: readonly (string | null)[]): string | null {
  const dates = values.filter((value): value is string => value !== null).sort();
  return dates.at(-1) ?? null;
}

export function buildProjectReport({
  project,
  tasks,
  dependencies,
  calendars = [],
  baselineTasks = [],
  visibleTaskIds,
  options,
  generatedAt = new Date().toISOString(),
}: BuildProjectReportInput): ProjectReport {
  if (
    options.timelineStart !== null &&
    options.timelineEnd !== null &&
    options.timelineEnd < options.timelineStart
  ) {
    throw new Error("A data final do cronograma PDF deve ser igual ou posterior à inicial.");
  }

  const scopedTasks = options.scope === "VISIBLE" && visibleTaskIds !== undefined
    ? tasks.filter((task) => visibleTaskIds.has(task.id))
    : tasks;
  const scopedIds = new Set(scopedTasks.map((task) => task.id));
  const outlineNumbers = buildTaskOutlineNumbers(tasks);
  const expandedIds = new Set(tasks.map((task) => task.id));
  const orderedTasks = flattenVisibleTasks(tasks, expandedIds)
    .filter(({ task }) => scopedIds.has(task.id));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const baselineByTaskId = new Map(baselineTasks.map((task) => [task.taskId, task]));
  const today = generatedAt.slice(0, 10);

  const rows = orderedTasks.map(({ task, depth }): ProjectReportRow => {
    const calendar = calendars.find((candidate) => candidate.id === (task.calendarId ?? project.calendarId));
    const baseline = options.includeBaseline === false ? undefined : baselineByTaskId.get(task.id);
    const comparison = calendar === undefined
      ? null
      : compareTaskWithBaseline(task, baseline ?? null, calendar, today);
    const predecessorLabels = dependencies
      .filter((dependency) => dependency.successorId === task.id)
      .map((dependency) => {
        const predecessor = tasksById.get(dependency.predecessorId);
        if (predecessor === undefined) return "Tarefa indisponível";
        const lag = dependency.lagDays === 0 ? "" : ` +${String(dependency.lagDays)}d`;
        return `${taskOutlineLabel(predecessor, outlineNumbers)}${lag}`;
      });
    const predecessorIds = dependencies
      .filter((dependency) => dependency.successorId === task.id)
      .map((dependency) => dependency.predecessorId);
    return {
      id: task.id,
      outline: outlineNumbers.get(task.id) ?? "",
      label: taskOutlineLabel(task, outlineNumbers),
      depth,
      isSummary: tasks.some((candidate) => candidate.parentId === task.id),
      status: task.status,
      statusLabel: TASK_STATUS_LABELS[task.status],
      priority: task.priority,
      priorityLabel: TASK_PRIORITY_LABELS[task.priority],
      progress: task.progress,
      startDate: task.startDate,
      endDate: task.endDate,
      durationDays: task.durationDays,
      deadlineDate: task.deadlineDate,
      health: comparison?.health ?? "NO_DEADLINE",
      baselineStartDate: baseline?.startDate ?? null,
      baselineEndDate: baseline?.endDate ?? null,
      endVarianceDays: comparison?.endVarianceDays ?? null,
      assignee: task.assignee,
      tags: task.tags,
      description: task.description,
      notes: task.notes,
      predecessors: predecessorLabels,
      predecessorIds,
    };
  });

  const statusCounts = emptyCounts(TASK_STATUSES);
  const priorityCounts = emptyCounts(TASK_PRIORITIES);
  for (const row of rows) {
    statusCounts[row.status] += 1;
    priorityCounts[row.priority] += 1;
  }

  const scheduledRows = rows.filter((row) => row.startDate !== null && row.endDate !== null);
  const naturalStart = minDate(scheduledRows.map((row) => row.startDate));
  const naturalEnd = maxDate(scheduledRows.map((row) => row.endDate));

  return {
    project,
    generatedAt,
    options,
    rows,
    statusCounts,
    priorityCounts,
    averageProgress: rows.length === 0
      ? 0
      : Math.round(rows.reduce((total, row) => total + row.progress, 0) / rows.length),
    scheduledCount: scheduledRows.length,
    timelineStart: options.timelineStart ?? naturalStart,
    timelineEnd: options.timelineEnd ?? naturalEnd,
  };
}
