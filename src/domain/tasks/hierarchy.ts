import { DomainValidationError } from "../shared/validation";
import type { Task } from "./task";

export interface VisibleTask {
  readonly task: Task;
  readonly depth: number;
  readonly hasChildren: boolean;
}

export const MAX_TASK_HIERARCHY_LEVELS = 4;

export function taskHierarchyDepth(tasks: readonly Task[], taskId: string): number {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  let task = tasksById.get(taskId);
  let depth = 0;
  const visited = new Set<string>();
  while (task?.parentId !== null && task !== undefined) {
    if (visited.has(task.id)) return Number.POSITIVE_INFINITY;
    visited.add(task.id);
    depth += 1;
    task = tasksById.get(task.parentId);
  }
  return depth;
}

function descendantOffset(tasks: readonly Task[], taskId: string): number {
  let maximum = 0;
  const pending: Array<{ readonly id: string; readonly offset: number }> = [{ id: taskId, offset: 0 }];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || visited.has(current.id)) continue;
    visited.add(current.id);
    maximum = Math.max(maximum, current.offset);
    tasks
      .filter((task) => task.parentId === current.id)
      .forEach((task) => { pending.push({ id: task.id, offset: current.offset + 1 }); });
  }
  return maximum;
}

export function canTaskHaveChild(tasks: readonly Task[], taskId: string): boolean {
  return taskHierarchyDepth(tasks, taskId) < MAX_TASK_HIERARCHY_LEVELS - 1;
}

function comparePosition(left: Task, right: Task): number {
  return left.position - right.position || left.createdAt.localeCompare(right.createdAt);
}

export function assertValidParentAssignment(
  tasks: readonly Task[],
  taskId: string,
  projectId: string,
  parentId: string | null,
): void {
  if (parentId === null) {
    return;
  }
  if (parentId === taskId) {
    throw new DomainValidationError(
      "self_parent",
      "parentId",
      "Uma tarefa não pode ser filha dela mesma.",
    );
  }

  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  let candidate = tasksById.get(parentId);

  if (candidate === undefined) {
    throw new DomainValidationError(
      "parent_not_found",
      "parentId",
      "A tarefa-pai selecionada não existe.",
    );
  }
  if (candidate.projectId !== projectId) {
    throw new DomainValidationError(
      "cross_project_parent",
      "parentId",
      "A tarefa-pai deve pertencer ao mesmo projeto.",
    );
  }

  const visited = new Set<string>();
  while (candidate !== undefined) {
    if (candidate.id === taskId) {
      throw new DomainValidationError(
        "hierarchy_cycle",
        "parentId",
        "Essa alteração criaria um ciclo na hierarquia.",
      );
    }
    if (visited.has(candidate.id)) {
      throw new DomainValidationError(
        "existing_hierarchy_cycle",
        "parentId",
        "A hierarquia existente contém um ciclo.",
      );
    }
    visited.add(candidate.id);
    candidate = candidate.parentId === null ? undefined : tasksById.get(candidate.parentId);
  }

  const parentDepth = taskHierarchyDepth(tasks, parentId);
  const resultingDepth = parentDepth + 1 + descendantOffset(tasks, taskId);
  if (resultingDepth >= MAX_TASK_HIERARCHY_LEVELS) {
    throw new DomainValidationError(
      "hierarchy_depth_limit",
      "parentId",
      `A hierarquia pode ter no máximo ${String(MAX_TASK_HIERARCHY_LEVELS)} níveis.`,
    );
  }
}

export function flattenVisibleTasks(
  tasks: readonly Task[],
  expandedTaskIds: ReadonlySet<string>,
): VisibleTask[] {
  const childrenByParent = new Map<string | null, Task[]>();
  for (const task of tasks) {
    const siblings = childrenByParent.get(task.parentId) ?? [];
    siblings.push(task);
    childrenByParent.set(task.parentId, siblings);
  }
  for (const siblings of childrenByParent.values()) {
    siblings.sort(comparePosition);
  }

  const visible: VisibleTask[] = [];
  const visited = new Set<string>();

  const appendChildren = (parentId: string | null, depth: number): void => {
    for (const task of childrenByParent.get(parentId) ?? []) {
      if (visited.has(task.id)) {
        throw new DomainValidationError(
          "hierarchy_cycle",
          "parentId",
          "A hierarquia de tarefas contém um ciclo.",
        );
      }
      visited.add(task.id);
      const hasChildren = (childrenByParent.get(task.id)?.length ?? 0) > 0;
      visible.push({ task, depth, hasChildren });
      if (hasChildren && expandedTaskIds.has(task.id)) {
        appendChildren(task.id, depth + 1);
      }
    }
  };

  appendChildren(null, 0);
  return visible;
}

export function collectTaskTreeIds(tasks: readonly Task[], rootTaskId: string): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const task of tasks) {
    if (task.parentId !== null) {
      const children = childrenByParent.get(task.parentId) ?? [];
      children.push(task.id);
      childrenByParent.set(task.parentId, children);
    }
  }

  const collected = new Set<string>();
  const pending = [rootTaskId];
  while (pending.length > 0) {
    const taskId = pending.pop();
    if (taskId === undefined || collected.has(taskId)) {
      continue;
    }
    collected.add(taskId);
    pending.push(...(childrenByParent.get(taskId) ?? []));
  }

  return collected;
}
