import type { TaskDependency } from "../scheduling/dependency";
import { validateTask, type Task } from "../tasks/task";

export interface GanttHistoryEntry {
  readonly label: string;
  readonly beforeTask: Task;
  readonly afterTask: Task;
  readonly beforeDependencies: readonly TaskDependency[];
  readonly afterDependencies: readonly TaskDependency[];
}

export interface GanttHistoryState {
  readonly undoEntries: readonly GanttHistoryEntry[];
  readonly redoEntries: readonly GanttHistoryEntry[];
}

export const EMPTY_GANTT_HISTORY: GanttHistoryState = {
  undoEntries: [],
  redoEntries: [],
};

function isDependency(value: unknown): value is TaskDependency {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<TaskDependency>;
  return typeof candidate.id === "string" && typeof candidate.projectId === "string" &&
    typeof candidate.predecessorId === "string" && typeof candidate.successorId === "string" &&
    candidate.type === "FS" && Number.isInteger(candidate.lagDays) &&
    typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string";
}

function parseEntry(value: unknown): GanttHistoryEntry {
  if (typeof value !== "object" || value === null) throw new Error("Entrada inválida no histórico do Gantt.");
  const candidate = value as Partial<GanttHistoryEntry>;
  if (typeof candidate.label !== "string" || candidate.label.length === 0 || candidate.label.length > 200) {
    throw new Error("Rótulo inválido no histórico do Gantt.");
  }
  if (!Array.isArray(candidate.beforeDependencies) || !candidate.beforeDependencies.every(isDependency) ||
      !Array.isArray(candidate.afterDependencies) || !candidate.afterDependencies.every(isDependency)) {
    throw new Error("Dependências inválidas no histórico do Gantt.");
  }
  return {
    label: candidate.label,
    beforeTask: validateTask(candidate.beforeTask as Task),
    afterTask: validateTask(candidate.afterTask as Task),
    beforeDependencies: candidate.beforeDependencies,
    afterDependencies: candidate.afterDependencies,
  };
}

export function parseGanttHistoryState(value: unknown): GanttHistoryState {
  if (typeof value !== "object" || value === null) return EMPTY_GANTT_HISTORY;
  const candidate = value as Partial<GanttHistoryState>;
  if (!Array.isArray(candidate.undoEntries) || !Array.isArray(candidate.redoEntries)) {
    return EMPTY_GANTT_HISTORY;
  }
  return {
    undoEntries: candidate.undoEntries.slice(-50).map(parseEntry),
    redoEntries: candidate.redoEntries.slice(-50).map(parseEntry),
  };
}
