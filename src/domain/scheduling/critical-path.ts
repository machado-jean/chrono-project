import type { Calendar } from "../calendars/calendar";
import { addWorkingDays, workingDaysBetween } from "../calendars/working-calendar";
import type { Task } from "../tasks/task";
import type { TaskDependency } from "./dependency";
import { topologicalSort } from "./graph";

export interface TaskCriticality {
  readonly taskId: string;
  readonly totalSlackDays: number;
  readonly isCritical: boolean;
  readonly isNearCritical: boolean;
}

export interface CriticalPathAnalysis {
  readonly available: boolean;
  readonly reason: string | null;
  readonly projectEndDate: string | null;
  readonly targetEndDate: string | null;
  readonly projectTargetSlackDays: number | null;
  readonly tasks: readonly TaskCriticality[];
}

interface CriticalPathInput {
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly targetEndDate?: string | null;
  readonly nearCriticalThresholdDays?: number;
}

function workingDaySlack(calendar: Calendar, endDate: string, referenceDate: string): number {
  return endDate <= referenceDate
    ? workingDaysBetween(calendar, endDate, referenceDate) - 1
    : -(workingDaysBetween(calendar, referenceDate, endDate) - 1);
}

function unavailable(reason: string): CriticalPathAnalysis {
  return {
    available: false,
    reason,
    projectEndDate: null,
    targetEndDate: null,
    projectTargetSlackDays: null,
    tasks: [],
  };
}

export function analyzeCriticalPath({
  tasks,
  dependencies,
  calendars,
  projectCalendarId,
  targetEndDate = null,
  nearCriticalThresholdDays = 2,
}: CriticalPathInput): CriticalPathAnalysis {
  const summaryIds = new Set(tasks.flatMap((task) => task.parentId === null ? [] : [task.parentId]));
  const scheduledLeaves = tasks.filter((task) =>
    !summaryIds.has(task.id) &&
    task.status !== "CANCELLED" &&
    task.startDate !== null &&
    task.endDate !== null &&
    task.durationDays !== null);
  if (scheduledLeaves.length === 0) {
    return unavailable("Informe datas nas tarefas para calcular o caminho crítico.");
  }

  const leafIds = new Set(scheduledLeaves.map(({ id }) => id));
  const childrenByParent = new Map<string, string[]>();
  for (const task of tasks) {
    if (task.parentId === null) continue;
    childrenByParent.set(task.parentId, [...(childrenByParent.get(task.parentId) ?? []), task.id]);
  }
  const controllingLeaves = (taskId: string): readonly string[] => {
    if (leafIds.has(taskId)) return [taskId];
    const pending = [...(childrenByParent.get(taskId) ?? [])];
    const descendantLeaves: Task[] = [];
    while (pending.length > 0) {
      const id = pending.shift();
      if (id === undefined) break;
      const child = scheduledLeaves.find((task) => task.id === id);
      if (child !== undefined) descendantLeaves.push(child);
      pending.push(...(childrenByParent.get(id) ?? []));
    }
    const latestEnd = descendantLeaves.reduce(
      (latest, task) => task.endDate !== null && task.endDate > latest ? task.endDate : latest,
      "",
    );
    return descendantLeaves.filter(({ endDate }) => endDate === latestEnd).map(({ id }) => id);
  };
  const edges = dependencies.flatMap((dependency): TaskDependency[] => {
    if (!leafIds.has(dependency.successorId)) return [];
    return controllingLeaves(dependency.predecessorId).map((predecessorId) => ({
      ...dependency,
      predecessorId,
    }));
  });
  if (edges.length === 0) {
    return unavailable("Adicione dependências entre tarefas programadas para calcular o caminho crítico.");
  }

  const connectedTasks = scheduledLeaves;
  const taskById = new Map(connectedTasks.map((task) => [task.id, task]));
  const calendarById = new Map(calendars.map((calendar) => [calendar.id, calendar]));
  const calendarFor = (task: Task): Calendar | null =>
    calendarById.get(task.calendarId ?? projectCalendarId) ?? null;
  if (connectedTasks.some((task) => calendarFor(task) === null)) {
    return unavailable("Um calendário usado pelo projeto não está disponível.");
  }

  const projectEndDate = connectedTasks.reduce(
    (latest, task) => task.endDate !== null && task.endDate > latest ? task.endDate : latest,
    connectedTasks[0]?.endDate ?? "",
  );
  const projectCalendar = calendarById.get(projectCalendarId) ?? null;
  const projectTargetSlackDays = targetEndDate === null || projectCalendar === null
    ? null
    : workingDaySlack(projectCalendar, projectEndDate, targetEndDate);
  const orderedIds = topologicalSort(connectedTasks.map(({ id }) => id), edges);
  const outgoing = new Map(orderedIds.map((id) => [id, [] as TaskDependency[]]));
  for (const edge of edges) outgoing.get(edge.predecessorId)?.push(edge);

  const slackById = new Map<string, number>();
  for (const taskId of [...orderedIds].reverse()) {
    const task = taskById.get(taskId);
    if (task === undefined || task.endDate === null) continue;
    const taskCalendar = calendarFor(task);
    if (taskCalendar === null) continue;
    const successors = outgoing.get(taskId) ?? [];
    if (successors.length === 0) {
      slackById.set(taskId, workingDaySlack(taskCalendar, task.endDate, projectEndDate));
      continue;
    }

    let smallest = Number.POSITIVE_INFINITY;
    for (const edge of successors) {
      const successor = taskById.get(edge.successorId);
      if (successor === undefined || successor.startDate === null) continue;
      const successorCalendar = calendarFor(successor);
      if (successorCalendar === null) continue;
      const requiredStart = addWorkingDays(successorCalendar, task.endDate, edge.lagDays);
      const gap = successor.startDate <= requiredStart
        ? 0
        : workingDaysBetween(successorCalendar, requiredStart, successor.startDate) - 1;
      smallest = Math.min(smallest, gap + (slackById.get(successor.id) ?? 0));
    }
    slackById.set(taskId, Number.isFinite(smallest) ? smallest : 0);
  }

  const leafCriticalities = connectedTasks.map((task): TaskCriticality => {
    const totalSlackDays = slackById.get(task.id) ?? 0;
    return {
      taskId: task.id,
      totalSlackDays,
      isCritical: totalSlackDays <= 0,
      isNearCritical: totalSlackDays > 0 && totalSlackDays <= nearCriticalThresholdDays,
    };
  });
  const criticalityById = new Map(leafCriticalities.map((entry) => [entry.taskId, entry]));
  const summaryCriticalities = tasks.flatMap((task): TaskCriticality[] => {
    if (!summaryIds.has(task.id)) return [];
    const pending = [...(childrenByParent.get(task.id) ?? [])];
    const descendantEntries: TaskCriticality[] = [];
    while (pending.length > 0) {
      const id = pending.shift();
      if (id === undefined) break;
      const entry = criticalityById.get(id);
      if (entry !== undefined) descendantEntries.push(entry);
      pending.push(...(childrenByParent.get(id) ?? []));
    }
    if (descendantEntries.length === 0) return [];
    const totalSlackDays = Math.min(...descendantEntries.map(({ totalSlackDays }) => totalSlackDays));
    return [{
      taskId: task.id,
      totalSlackDays,
      isCritical: totalSlackDays <= 0,
      isNearCritical: totalSlackDays > 0 && totalSlackDays <= nearCriticalThresholdDays,
    }];
  });

  return {
    available: true,
    reason: null,
    projectEndDate,
    targetEndDate,
    projectTargetSlackDays,
    tasks: [...leafCriticalities, ...summaryCriticalities],
  };
}

