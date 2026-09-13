import type { Calendar } from "../calendars/calendar";
import { workingDaysBetween } from "../calendars/working-calendar";
import { buildTaskOutlineNumbers } from "../tasks/outline-number";
import type { Task } from "../tasks/task";
import {
  optionalText,
  requireDateOnly,
  requireIsoTimestamp,
  requireText,
  requireUuid,
} from "../shared/validation";

export interface ProjectBaseline {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly replacedAt: string | null;
}

export interface BaselineTask {
  readonly baselineId: string;
  readonly taskId: string;
  readonly title: string;
  readonly outline: string;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly durationDays: number | null;
  readonly progress: number;
}

export interface BaselineBundle {
  readonly baseline: ProjectBaseline;
  readonly tasks: readonly BaselineTask[];
}

export type ScheduleHealth = "NO_DEADLINE" | "ON_TRACK" | "AT_RISK" | "OVERDUE";

export interface BaselineComparison {
  readonly taskId: string;
  readonly baseline: BaselineTask | null;
  readonly startVarianceDays: number | null;
  readonly endVarianceDays: number | null;
  readonly durationVarianceDays: number | null;
  readonly progressVariance: number | null;
  readonly health: ScheduleHealth;
}

function validateSnapshotSchedule(task: BaselineTask): void {
  const allEmpty = task.startDate === null && task.endDate === null && task.durationDays === null;
  if (allEmpty) return;
  if (task.startDate === null || task.endDate === null || task.durationDays === null) {
    throw new Error("A fotografia da tarefa deve possuir o cronograma completo.");
  }
  requireDateOnly(task.startDate, "startDate", "O início planejado");
  requireDateOnly(task.endDate, "endDate", "O fim planejado");
  if (!Number.isInteger(task.durationDays) || task.durationDays < 1 || task.endDate < task.startDate) {
    throw new Error("O cronograma armazenado no plano de referência não é válido.");
  }
}

export function validateProjectBaseline(baseline: ProjectBaseline): ProjectBaseline {
  return {
    ...baseline,
    id: requireUuid(baseline.id, "id", "O plano de referência"),
    projectId: requireUuid(baseline.projectId, "projectId", "O projeto do plano de referência"),
    name: requireText(baseline.name, "name", "O nome do plano de referência"),
    createdAt: requireIsoTimestamp(baseline.createdAt, "createdAt"),
    replacedAt: baseline.replacedAt === null
      ? null
      : requireIsoTimestamp(baseline.replacedAt, "replacedAt"),
  };
}

export function validateBaselineTask(task: BaselineTask): BaselineTask {
  validateSnapshotSchedule(task);
  if (!Number.isInteger(task.progress) || task.progress < 0 || task.progress > 100) {
    throw new Error("O progresso planejado deve estar entre 0 e 100.");
  }
  return {
    ...task,
    baselineId: requireUuid(task.baselineId, "baselineId", "O plano de referência"),
    taskId: requireUuid(task.taskId, "taskId", "A tarefa planejada"),
    title: requireText(task.title, "title", "O título planejado"),
    outline: optionalText(task.outline) ?? "",
  };
}

export function createBaselineBundle(
  projectId: string,
  name: string,
  tasks: readonly Task[],
  createdAt: string,
): BaselineBundle {
  const baseline = validateProjectBaseline({
    id: crypto.randomUUID(),
    projectId,
    name,
    isActive: true,
    createdAt,
    replacedAt: null,
  });
  const outlines = buildTaskOutlineNumbers(tasks);
  return {
    baseline,
    tasks: tasks.map((task) => validateBaselineTask({
      baselineId: baseline.id,
      taskId: task.id,
      title: task.title,
      outline: outlines.get(task.id) ?? "",
      startDate: task.startDate,
      endDate: task.endDate,
      durationDays: task.durationDays,
      progress: task.progress,
    })),
  };
}

function signedWorkingDayVariance(calendar: Calendar, planned: string, current: string): number {
  if (current === planned) return 0;
  if (current > planned) return workingDaysBetween(calendar, planned, current) - 1;
  return -(workingDaysBetween(calendar, current, planned) - 1);
}

export function taskScheduleHealth(task: Task, today: string): ScheduleHealth {
  if (task.deadlineDate === null) return "NO_DEADLINE";
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return "ON_TRACK";
  if (task.deadlineDate < today) return "OVERDUE";
  if (task.endDate !== null && task.endDate > task.deadlineDate) return "AT_RISK";
  return "ON_TRACK";
}

export function compareTaskWithBaseline(
  task: Task,
  baselineTask: BaselineTask | null,
  calendar: Calendar,
  today: string,
): BaselineComparison {
  return {
    taskId: task.id,
    baseline: baselineTask,
    startVarianceDays: baselineTask !== null && baselineTask.startDate !== null && task.startDate !== null
      ? signedWorkingDayVariance(calendar, baselineTask.startDate, task.startDate)
      : null,
    endVarianceDays: baselineTask !== null && baselineTask.endDate !== null && task.endDate !== null
      ? signedWorkingDayVariance(calendar, baselineTask.endDate, task.endDate)
      : null,
    durationVarianceDays: baselineTask !== null && baselineTask.durationDays !== null && task.durationDays !== null
      ? task.durationDays - baselineTask.durationDays
      : null,
    progressVariance: baselineTask === null ? null : task.progress - baselineTask.progress,
    health: taskScheduleHealth(task, today),
  };
}
