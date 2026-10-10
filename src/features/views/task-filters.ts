import type { Task, TaskPriority, TaskStatus } from "../../domain/tasks/task";
import type { TaskCriticality } from "../../domain/scheduling/critical-path";

export type CriticalityFilter = "ALL" | "CRITICAL" | "NEAR_CRITICAL";
export const UNASSIGNED_FILTER_VALUE = "__UNASSIGNED__";

export interface TaskFilters {
  readonly query: string;
  readonly status: TaskStatus | "ALL";
  readonly priority: TaskPriority | "ALL";
  readonly criticality: CriticalityFilter;
  readonly assignees: readonly string[];
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly tag: string;
}

export const EMPTY_TASK_FILTERS: TaskFilters = {
  query: "",
  status: "ALL",
  priority: "ALL",
  criticality: "ALL",
  assignees: [],
  dateFrom: "",
  dateTo: "",
  tag: "",
};

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function matchesText(task: Task, query: string): boolean {
  const search = normalized(query);
  if (search.length === 0) return true;

  return [
    task.title,
    task.code,
    task.description,
    task.assignee,
    task.notes,
    ...task.tags,
  ].some((value) => value !== null && normalized(value).includes(search));
}

function matchesDateRange(task: Task, dateFrom: string, dateTo: string): boolean {
  if (dateFrom.length === 0 && dateTo.length === 0) return true;
  if (task.startDate === null || task.endDate === null) return false;
  if (dateFrom.length > 0 && task.endDate < dateFrom) return false;
  if (dateTo.length > 0 && task.startDate > dateTo) return false;
  return true;
}

export function taskMatchesFilters(
  task: Task,
  filters: TaskFilters,
  criticalityByTaskId: ReadonlyMap<string, TaskCriticality> = new Map(),
): boolean {
  if (!matchesText(task, filters.query)) return false;
  if (filters.status !== "ALL" && task.status !== filters.status) return false;
  if (filters.priority !== "ALL" && task.priority !== filters.priority) return false;
  const criticality = criticalityByTaskId.get(task.id);
  if (filters.criticality === "CRITICAL" && criticality?.isCritical !== true) return false;
  if (filters.criticality === "NEAR_CRITICAL" && criticality?.isNearCritical !== true) return false;
  if (filters.assignees.length > 0) {
    const matchesUnassigned = task.assignee === null &&
      filters.assignees.includes(UNASSIGNED_FILTER_VALUE);
    const matchesNamed = task.assignee !== null && filters.assignees.some(
      (assignee) => assignee !== UNASSIGNED_FILTER_VALUE &&
        normalized(assignee) === normalized(task.assignee ?? ""),
    );
    if (!matchesUnassigned && !matchesNamed) return false;
  }
  if (!matchesDateRange(task, filters.dateFrom, filters.dateTo)) return false;

  const tag = normalized(filters.tag);
  return tag.length === 0 || task.tags.some((candidate) => normalized(candidate).includes(tag));
}

export function filterTasks(
  tasks: readonly Task[],
  filters: TaskFilters,
  criticalityByTaskId: ReadonlyMap<string, TaskCriticality> = new Map(),
): readonly Task[] {
  return tasks.filter((task) => taskMatchesFilters(task, filters, criticalityByTaskId));
}

export function includeTaskAncestors(
  tasks: readonly Task[],
  matchingTasks: readonly Task[],
): ReadonlySet<string> {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const visibleIds = new Set(matchingTasks.map((task) => task.id));

  for (const task of matchingTasks) {
    let parentId = task.parentId;
    const visited = new Set<string>();
    while (parentId !== null && !visited.has(parentId)) {
      visited.add(parentId);
      visibleIds.add(parentId);
      parentId = tasksById.get(parentId)?.parentId ?? null;
    }
  }

  return visibleIds;
}

export function hasActiveTaskFilters(filters: TaskFilters): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === "status" || key === "priority" || key === "criticality") return value !== "ALL";
    if (key === "assignees") return Array.isArray(value) && value.length > 0;
    return value !== "";
  });
}
