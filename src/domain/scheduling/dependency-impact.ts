import type { Calendar } from "../calendars/calendar";
import type { Task } from "../tasks/task";
import type { TaskDependency } from "./dependency";
import { rescheduleAffectedTasks } from "./scheduler";

export interface DependencyImpactChange {
  readonly taskId: string;
  readonly title: string;
  readonly beforeStartDate: string | null;
  readonly beforeEndDate: string | null;
  readonly afterStartDate: string | null;
  readonly afterEndDate: string | null;
}

export interface DependencyImpactPreview {
  readonly successorId: string;
  readonly changes: readonly DependencyImpactChange[];
}

function scheduleChanged(before: Task, after: Task): boolean {
  return before.startDate !== after.startDate ||
    before.endDate !== after.endDate ||
    before.durationDays !== after.durationDays;
}

export function previewDependencyImpact(input: {
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly dependency: TaskDependency;
  readonly action: "ADD" | "REMOVE";
}): DependencyImpactPreview {
  return previewDependenciesImpact({
    ...input,
    dependenciesToChange: [input.dependency],
  });
}

export function previewDependenciesImpact(input: {
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly dependenciesToChange: readonly TaskDependency[];
  readonly action: "ADD" | "REMOVE";
}): DependencyImpactPreview {
  if (input.dependenciesToChange.length === 0) {
    throw new Error("Selecione ao menos uma dependência para visualizar o impacto.");
  }
  const changedIds = new Set(input.dependenciesToChange.map(({ id }) => id));
  const dependencies = input.action === "ADD"
    ? [...input.dependencies, ...input.dependenciesToChange]
    : input.dependencies.filter(({ id }) => !changedIds.has(id));
  const successorIds = [...new Set(input.dependenciesToChange.map(({ successorId }) => successorId))];
  const result = rescheduleAffectedTasks({
    tasks: input.tasks,
    dependencies,
    calendars: input.calendars,
    projectCalendarId: input.projectCalendarId,
    changedTaskIds: successorIds,
  });
  const beforeById = new Map(input.tasks.map((task) => [task.id, task]));
  return {
    successorId: successorIds[0] ?? "",
    changes: result.tasks.flatMap((after) => {
      const before = beforeById.get(after.id);
      return before === undefined || !scheduleChanged(before, after)
        ? []
        : [{
            taskId: after.id,
            title: after.title,
            beforeStartDate: before.startDate,
            beforeEndDate: before.endDate,
            afterStartDate: after.startDate,
            afterEndDate: after.endDate,
          }];
    }),
  };
}
