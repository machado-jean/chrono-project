import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_CALENDAR_ID,
  validateCalendar,
  type Calendar,
} from "../domain/calendars/calendar";
import {
  endDateForDuration,
  onOrNextWorkingDay,
} from "../domain/calendars/working-calendar";
import {
  applyTaskTemplate,
  createTemplateFromTaskTree,
  duplicateProject as duplicateProjectStructure,
  duplicateTaskTree,
} from "../domain/duplication/reuse";
import { validateProject, type Project, type ProjectStatus } from "../domain/projects/project";
import {
  createBaselineBundle,
  type BaselineTask,
  type ProjectBaseline,
} from "../domain/planning/baseline";
import {
  validateTaskDependency,
  type TaskDependency,
} from "../domain/scheduling/dependency";
import { validateGraph } from "../domain/scheduling/graph";
import {
  rescheduleAffectedTasks,
  type SchedulingConflict,
} from "../domain/scheduling/scheduler";
import {
  assertValidParentAssignment,
  collectTaskTreeIds,
} from "../domain/tasks/hierarchy";
import {
  validateTask,
  type SchedulingMode,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "../domain/tasks/task";
import { buildTaskOutlineNumbers } from "../domain/tasks/outline-number";
import type {
  TaskTemplate,
  TaskTemplateBundle,
  TaskTemplateDependency,
  TaskTemplateItem,
} from "../domain/templates/template";
import type { WorkspaceRepository } from "../repositories/workspace-repository";
import type { GanttHistoryState } from "../domain/history/gantt-history";

interface CreateProjectInput {
  readonly name: string;
  readonly description: string | null;
}

interface CreateTaskInput {
  readonly title: string;
  readonly parentId: string | null;
  readonly parentDependencyPolicy?: "KEEP" | "TRANSFER" | "REMOVE";
}

interface DependencyInput {
  readonly predecessorId: string;
  readonly successorId: string;
  readonly lagDays: number;
}

interface CreateDependenciesOptions {
  readonly historyLabel?: string;
}

interface CreateTemplateInput {
  readonly rootTaskId: string;
  readonly name: string;
  readonly description: string | null;
}

interface SaveTaskOptions {
  readonly recordHistory?: boolean;
  readonly historyLabel?: string;
}

interface TaskEditHistoryEntry {
  readonly projectId: string;
  readonly label: string;
  readonly beforeTasks: readonly Task[];
  readonly afterTasks: readonly Task[];
  readonly beforeDependencies: readonly TaskDependency[];
  readonly afterDependencies: readonly TaskDependency[];
}

interface TaskEditHistoryStacks {
  readonly undoEntries: TaskEditHistoryEntry[];
  readonly redoEntries: TaskEditHistoryEntry[];
}

export type MoveDirection = "up" | "down";

export interface WorkspaceController {
  readonly calendars: readonly Calendar[];
  readonly projects: readonly Project[];
  readonly tasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly baselines: readonly ProjectBaseline[];
  readonly baselineTasks: readonly BaselineTask[];
  readonly templates: readonly TaskTemplate[];
  readonly templateItems: readonly TaskTemplateItem[];
  readonly templateDependencies: readonly TaskTemplateDependency[];
  readonly schedulingConflicts: readonly SchedulingConflict[];
  readonly selectedProjectId: string | null;
  readonly selectedProject: Project | null;
  readonly selectedProjectTasks: readonly Task[];
  readonly selectedProjectDependencies: readonly TaskDependency[];
  readonly selectedProjectBaselines: readonly ProjectBaseline[];
  readonly activeBaseline: ProjectBaseline | null;
  readonly activeBaselineTasks: readonly BaselineTask[];
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: string | null;
  readonly selectProject: (projectId: string) => void;
  readonly clearError: () => void;
  readonly reloadWorkspace: () => void;
  readonly createProject: (input: CreateProjectInput) => Promise<Project | null>;
  readonly saveProject: (project: Project) => Promise<boolean>;
  readonly moveProject: (projectId: string, direction: MoveDirection) => Promise<boolean>;
  readonly removeProject: (projectId: string) => Promise<boolean>;
  readonly saveCalendar: (calendar: Calendar) => Promise<boolean>;
  readonly createBaseline: (name: string) => Promise<ProjectBaseline | null>;
  readonly removeProjectBaselines: () => Promise<boolean>;
  readonly createTask: (input: CreateTaskInput) => Promise<Task | null>;
  readonly saveTask: (
    task: Task,
    dependencyUpdates?: readonly TaskDependency[],
    options?: SaveTaskOptions,
  ) => Promise<boolean>;
  readonly canUndoTaskEdit: boolean;
  readonly canRedoTaskEdit: boolean;
  readonly undoTaskEditLabel: string | null;
  readonly redoTaskEditLabel: string | null;
  readonly taskEditHistoryEntries: readonly {
    readonly label: string;
    readonly state: "APPLIED" | "UNDONE";
  }[];
  readonly undoTaskEdit: () => Promise<boolean>;
  readonly redoTaskEdit: () => Promise<boolean>;
  readonly setTasksSchedulingMode: (
    taskIds: readonly string[],
    schedulingMode: SchedulingMode,
  ) => Promise<boolean>;
  readonly loadGanttHistory: (projectId: string) => Promise<GanttHistoryState>;
  readonly saveGanttHistory: (projectId: string, state: GanttHistoryState) => Promise<void>;
  readonly moveTask: (taskId: string, direction: MoveDirection) => Promise<boolean>;
  readonly removeTaskTree: (taskId: string) => Promise<boolean>;
  readonly createDependency: (input: DependencyInput) => Promise<TaskDependency | null>;
  readonly createDependencies: (
    inputs: readonly DependencyInput[],
    options?: CreateDependenciesOptions,
  ) => Promise<readonly TaskDependency[] | null>;
  readonly saveDependency: (dependency: TaskDependency) => Promise<boolean>;
  readonly saveDependencies: (
    dependencies: readonly TaskDependency[],
    historyLabel?: string,
  ) => Promise<boolean>;
  readonly removeDependency: (dependencyId: string) => Promise<boolean>;
  readonly removeDependencies: (
    dependencyIds: readonly string[],
    historyLabel?: string,
  ) => Promise<boolean>;
  readonly duplicateTask: (taskId: string, includeDescendants: boolean) => Promise<Task | null>;
  readonly duplicateProject: (projectId: string) => Promise<Project | null>;
  readonly createTemplate: (input: CreateTemplateInput) => Promise<TaskTemplate | null>;
  readonly applyTemplate: (templateId: string, startDate: string) => Promise<Task | null>;
  readonly removeTemplate: (templateId: string) => Promise<boolean>;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Ocorreu um erro inesperado.";
}

function nowUtc(): string {
  return new Date().toISOString();
}

function nextPosition(items: readonly { readonly position: number }[]): number {
  return items.reduce((highest, item) => Math.max(highest, item.position), -1) + 1;
}

function orderAfterMove(
  items: readonly { readonly id: string; readonly position: number; readonly createdAt: string }[],
  itemId: string,
  direction: MoveDirection,
): readonly string[] | null {
  const orderedIds = [...items]
    .sort(
      (left, right) =>
        left.position - right.position || left.createdAt.localeCompare(right.createdAt),
    )
    .map(({ id }) => id);
  const currentIndex = orderedIds.indexOf(itemId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedIds.length) return null;

  const currentId = orderedIds[currentIndex];
  const targetId = orderedIds[targetIndex];
  if (currentId === undefined || targetId === undefined) return null;
  orderedIds[currentIndex] = targetId;
  orderedIds[targetIndex] = currentId;
  return orderedIds;
}

function positionsById(orderedIds: readonly string[]): ReadonlyMap<string, number> {
  return new Map(orderedIds.map((id, position) => [id, position]));
}

function replaceTasks(
  currentTasks: readonly Task[],
  replacements: readonly Task[],
  removedIds: ReadonlySet<string> = new Set(),
): readonly Task[] {
  const replacementsById = new Map(replacements.map((task) => [task.id, task]));
  const existingIds = new Set(currentTasks.map(({ id }) => id));
  return [
    ...currentTasks
      .filter((task) => !removedIds.has(task.id))
      .map((task) => replacementsById.get(task.id) ?? task),
    ...replacements.filter((task) => !existingIds.has(task.id)),
  ];
}

function uniqueTasks(tasks: readonly Task[]): readonly Task[] {
  return [...new Map(tasks.map((task) => [task.id, task])).values()];
}

function stampedScheduledTasks(
  scheduledTasks: readonly Task[],
  taskIds: ReadonlySet<string>,
  updatedAt: string,
): readonly Task[] {
  return scheduledTasks.map((task) =>
    taskIds.has(task.id) ? validateTask({ ...task, updatedAt }) : task,
  );
}

function projectSchedulingConflicts(
  project: Project,
  projectTasks: readonly Task[],
  projectDependencies: readonly TaskDependency[],
  calendars: readonly Calendar[],
): readonly SchedulingConflict[] {
  return rescheduleAffectedTasks({
    tasks: projectTasks,
    dependencies: projectDependencies,
    calendars,
    projectCalendarId: project.calendarId,
    changedTaskIds: projectTasks.map(({ id }) => id),
  }).conflicts;
}

function workspaceSchedulingConflicts(
  projects: readonly Project[],
  tasks: readonly Task[],
  dependencies: readonly TaskDependency[],
  calendars: readonly Calendar[],
): readonly SchedulingConflict[] {
  return projects.flatMap((project) =>
    projectSchedulingConflicts(
      project,
      tasks.filter((task) => task.projectId === project.id),
      dependencies.filter((dependency) => dependency.projectId === project.id),
      calendars,
    ),
  );
}

function replaceProjectConflicts(
  current: readonly SchedulingConflict[],
  projectTaskIds: ReadonlySet<string>,
  next: readonly SchedulingConflict[],
): readonly SchedulingConflict[] {
  return [...current.filter((conflict) => !projectTaskIds.has(conflict.taskId)), ...next];
}

export function useWorkspace(repository: WorkspaceRepository): WorkspaceController {
  const [calendars, setCalendars] = useState<readonly Calendar[]>([]);
  const [projects, setProjects] = useState<readonly Project[]>([]);
  const [tasks, setTasks] = useState<readonly Task[]>([]);
  const [dependencies, setDependencies] = useState<readonly TaskDependency[]>([]);
  const [baselines, setBaselines] = useState<readonly ProjectBaseline[]>([]);
  const [baselineTasks, setBaselineTasks] = useState<readonly BaselineTask[]>([]);
  const [templates, setTemplates] = useState<readonly TaskTemplate[]>([]);
  const [templateItems, setTemplateItems] = useState<readonly TaskTemplateItem[]>([]);
  const [templateDependencies, setTemplateDependencies] = useState<readonly TaskTemplateDependency[]>([]);
  const [schedulingConflicts, setSchedulingConflicts] = useState<readonly SchedulingConflict[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const calendarsRef = useRef(calendars);
  const projectsRef = useRef(projects);
  const tasksRef = useRef(tasks);
  const dependenciesRef = useRef(dependencies);
  const taskEditHistoryRef = useRef(new Map<string, TaskEditHistoryStacks>());
  const [taskEditHistoryAvailability, setTaskEditHistoryAvailability] = useState(
    new Map<string, {
      readonly canUndo: boolean;
      readonly canRedo: boolean;
      readonly undoLabel: string | null;
      readonly redoLabel: string | null;
      readonly undoLabels: readonly string[];
      readonly redoLabels: readonly string[];
    }>(),
  );
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useLayoutEffect(() => { calendarsRef.current = calendars; }, [calendars]);
  useLayoutEffect(() => { projectsRef.current = projects; }, [projects]);
  useLayoutEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useLayoutEffect(() => { dependenciesRef.current = dependencies; }, [dependencies]);

  useEffect(() => {
    let active = true;
    repository
      .load()
      .then(async (snapshot) => {
        if (!active) return;
        const updatedAt = nowUtc();
        let reconciledTasks = [...snapshot.tasks];
        const tasksToPersist: Task[] = [];
        const loadedConflicts: SchedulingConflict[] = [];
        for (const project of snapshot.projects) {
          const projectTasks = reconciledTasks.filter((task) => task.projectId === project.id);
          const projectDependencies = snapshot.dependencies.filter(
            (dependency) => dependency.projectId === project.id,
          );
          const scheduled = rescheduleAffectedTasks({
            tasks: projectTasks,
            dependencies: projectDependencies,
            calendars: snapshot.calendars,
            projectCalendarId: project.calendarId,
            changedTaskIds: projectTasks.map(({ id }) => id),
          });
          const stamped = stampedScheduledTasks(
            scheduled.tasks,
            scheduled.changedTaskIds,
            updatedAt,
          );
          tasksToPersist.push(
            ...stamped.filter((task) => scheduled.changedTaskIds.has(task.id)),
          );
          reconciledTasks = [...replaceTasks(reconciledTasks, stamped)];
          loadedConflicts.push(...scheduled.conflicts);
        }
        if (tasksToPersist.length > 0) {
          await repository.applyScheduleChanges({
            calendarsToSave: [],
            tasks: uniqueTasks(tasksToPersist),
            dependenciesToSave: [],
            dependencyIdsToDelete: [],
            taskTreeIdsToDelete: [],
          });
        }
        // A desmontagem pode ocorrer enquanto a transação assíncrona está em andamento.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!active) return;
        calendarsRef.current = snapshot.calendars;
        projectsRef.current = snapshot.projects;
        tasksRef.current = reconciledTasks;
        dependenciesRef.current = snapshot.dependencies;
        taskEditHistoryRef.current.clear();
        setTaskEditHistoryAvailability(new Map());
        setCalendars(snapshot.calendars);
        setProjects(snapshot.projects);
        setTasks(reconciledTasks);
        setDependencies(snapshot.dependencies);
        setBaselines(snapshot.baselines);
        setBaselineTasks(snapshot.baselineTasks);
        setTemplates(snapshot.templates);
        setTemplateItems(snapshot.templateItems);
        setTemplateDependencies(snapshot.templateDependencies);
        setSchedulingConflicts(loadedConflicts);
        setSelectedProjectId((current) =>
          snapshot.projects.some((project) => project.id === current)
            ? current
            : snapshot.projects.find((project) => !project.isArchived)?.id ??
              snapshot.projects[0]?.id ??
              null,
        );
      })
      .catch((loadError: unknown) => {
        if (active) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, reloadVersion]);

  const runMutation = useCallback(async <T,>(
    mutation: () => Promise<T>,
    options: { readonly blocking?: boolean } = {},
  ): Promise<T | null> => {
    const execute = async (): Promise<T | null> => {
      const blocking = options.blocking ?? true;
      if (blocking) setIsSaving(true);
      setError(null);
      try {
        return await mutation();
      } catch (mutationError) {
        setError(errorMessage(mutationError));
        return null;
      } finally {
        if (blocking) setIsSaving(false);
      }
    };
    const queued = mutationQueueRef.current.then(execute, execute);
    mutationQueueRef.current = queued.then(() => undefined, () => undefined);
    return await queued;
  }, []);

  const recordTaskEditHistory = useCallback((entry: TaskEditHistoryEntry): void => {
    const history = taskEditHistoryRef.current.get(entry.projectId) ?? {
      undoEntries: [],
      redoEntries: [],
    };
    history.undoEntries.push(entry);
    if (history.undoEntries.length > 50) history.undoEntries.shift();
    history.redoEntries.splice(0);
    taskEditHistoryRef.current.set(entry.projectId, history);
    setTaskEditHistoryAvailability((current) => {
      const next = new Map(current);
      next.set(entry.projectId, {
        canUndo: true,
        canRedo: false,
        undoLabel: entry.label,
        redoLabel: null,
        undoLabels: history.undoEntries.map(({ label }) => label),
        redoLabels: [],
      });
      return next;
    });
  }, []);

  const createProject = useCallback(
    async (input: CreateProjectInput): Promise<Project | null> =>
      runMutation(async () => {
        const createdAt = nowUtc();
        const project = validateProject({
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          status: "ACTIVE",
          calendarId: calendars.find((calendar) => calendar.isDefault)?.id ?? DEFAULT_CALENDAR_ID,
          position: nextPosition(projects),
          isArchived: false,
          criticalPathEnabled: false,
          createdAt,
          updatedAt: createdAt,
        });
        await repository.saveProject(project);
        setProjects((currentProjects) => [...currentProjects, project]);
        setSelectedProjectId(project.id);
        return project;
      }),
    [calendars, projects, repository, runMutation],
  );

  const saveProject = useCallback(
    async (project: Project): Promise<boolean> => {
      const result = await runMutation(async () => {
        const validated = validateProject({ ...project, updatedAt: nowUtc() });
        await repository.saveProject(validated);
        setProjects((currentProjects) =>
          currentProjects.map((candidate) => (candidate.id === validated.id ? validated : candidate)),
        );
        return true;
      });
      return result ?? false;
    },
    [repository, runMutation],
  );

  const moveProject = useCallback(
    async (projectId: string, direction: MoveDirection): Promise<boolean> => {
      const project = projects.find((candidate) => candidate.id === projectId);
      if (project === undefined) {
        setError("O projeto selecionado não existe.");
        return false;
      }
      const projectIds = orderAfterMove(
        projects.filter((candidate) => candidate.isArchived === project.isArchived),
        projectId,
        direction,
      );
      if (projectIds === null) return false;
      const positions = positionsById(projectIds);
      const result = await runMutation(async () => {
        await repository.reorderProjects(projectIds);
        setProjects((currentProjects) =>
          currentProjects.map((candidate) => {
            const position = positions.get(candidate.id);
            return position === undefined ? candidate : { ...candidate, position };
          }),
        );
        return true;
      });
      return result ?? false;
    },
    [projects, repository, runMutation],
  );

  const removeProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      const result = await runMutation(async () => {
        await repository.deleteProject(projectId);
        const removedTaskIds = new Set(
          tasks.filter((task) => task.projectId === projectId).map(({ id }) => id),
        );
        setProjects((currentProjects) => {
          const remaining = currentProjects.filter((project) => project.id !== projectId);
          setSelectedProjectId((selection) =>
            selection === projectId ? (remaining[0]?.id ?? null) : selection,
          );
          return remaining;
        });
        setTasks((currentTasks) => currentTasks.filter((task) => task.projectId !== projectId));
        setDependencies((current) => current.filter((item) => item.projectId !== projectId));
        const removedBaselineIds = new Set(
          baselines.filter((baseline) => baseline.projectId === projectId).map(({ id }) => id),
        );
        setBaselines((current) => current.filter((baseline) => baseline.projectId !== projectId));
        setBaselineTasks((current) =>
          current.filter((task) => !removedBaselineIds.has(task.baselineId)),
        );
        setSchedulingConflicts((current) =>
          current.filter((conflict) => !removedTaskIds.has(conflict.taskId)),
        );
        return true;
      });
      return result ?? false;
    },
    [baselines, repository, runMutation, tasks],
  );

  const createBaseline = useCallback(
    async (name: string): Promise<ProjectBaseline | null> => {
      if (selectedProjectId === null) {
        setError("Selecione um projeto antes de criar um plano de referência.");
        return null;
      }
      return runMutation(async () => {
        const projectTasks = tasks.filter((task) => task.projectId === selectedProjectId);
        if (projectTasks.length === 0) {
          throw new Error("Crie ao menos uma tarefa antes de registrar o plano de referência.");
        }
        const createdAt = nowUtc();
        const bundle = createBaselineBundle(selectedProjectId, name, projectTasks, createdAt);
        await repository.saveBaseline(bundle);
        setBaselines((current) => [
          ...current.map((baseline) =>
            baseline.projectId === selectedProjectId && baseline.isActive
              ? { ...baseline, isActive: false, replacedAt: createdAt }
              : baseline,
          ),
          bundle.baseline,
        ]);
        setBaselineTasks((current) => [...current, ...bundle.tasks]);
        return bundle.baseline;
      });
    },
    [repository, runMutation, selectedProjectId, tasks],
  );

  const removeProjectBaselines = useCallback(async (): Promise<boolean> => {
    if (selectedProjectId === null) {
      setError("Selecione um projeto antes de excluir o plano de referência.");
      return false;
    }
    const result = await runMutation(async () => {
      const removedIds = new Set(
        baselines
          .filter((baseline) => baseline.projectId === selectedProjectId)
          .map((baseline) => baseline.id),
      );
      await repository.deleteProjectBaselines(selectedProjectId);
      setBaselines((current) => current.filter((baseline) => !removedIds.has(baseline.id)));
      setBaselineTasks((current) => current.filter((task) => !removedIds.has(task.baselineId)));
      return true;
    });
    return result ?? false;
  }, [baselines, repository, runMutation, selectedProjectId]);

  const saveCalendar = useCallback(
    async (calendar: Calendar): Promise<boolean> => {
      const result = await runMutation(async () => {
        const updatedAt = nowUtc();
        const validatedCalendar = validateCalendar({ ...calendar, updatedAt });
        const nextCalendars = calendars.map((candidate) =>
          candidate.id === validatedCalendar.id ? validatedCalendar : candidate,
        );
        let nextTasks = [...tasks];
        const allTasksToPersist: Task[] = [];

        for (const project of projects) {
          const projectTasks = nextTasks.filter((task) => task.projectId === project.id);
          const projectDependencies = dependencies.filter(
            (dependency) => dependency.projectId === project.id,
          );
          const directlyAffectedIds = new Set(
            projectTasks
              .filter(
                (task) =>
                  (task.calendarId ?? project.calendarId) === validatedCalendar.id &&
                  !projectTasks.some((candidate) => candidate.parentId === task.id),
              )
              .map(({ id }) => id),
          );
          if (directlyAffectedIds.size === 0) continue;
          const impactedIds = new Set(
            projectTasks
              .filter(
                (task) =>
                  directlyAffectedIds.has(task.id) &&
                  task.schedulingMode === "AUTO" &&
                  task.startDate !== null &&
                  task.durationDays !== null,
              )
              .map(({ id }) => id),
          );
          const recalculated = projectTasks.map((task) => {
            if (!impactedIds.has(task.id) || task.startDate === null || task.durationDays === null) {
              return task;
            }
            const startDate = onOrNextWorkingDay(validatedCalendar, task.startDate);
            return {
              ...task,
              startDate,
              endDate: endDateForDuration(validatedCalendar, startDate, task.durationDays),
            };
          });
          const scheduled = rescheduleAffectedTasks({
            tasks: recalculated,
            dependencies: projectDependencies,
            calendars: nextCalendars,
            projectCalendarId: project.calendarId,
            changedTaskIds: [...directlyAffectedIds],
          });
          const persistIds = new Set([...impactedIds, ...scheduled.changedTaskIds]);
          const stamped = stampedScheduledTasks(scheduled.tasks, persistIds, updatedAt);
          allTasksToPersist.push(...stamped.filter((task) => persistIds.has(task.id)));
          nextTasks = [...replaceTasks(nextTasks, stamped)];
        }

        await repository.applyScheduleChanges({
          calendarsToSave: [validatedCalendar],
          tasks: uniqueTasks(allTasksToPersist),
          dependenciesToSave: [],
          dependencyIdsToDelete: [],
          taskTreeIdsToDelete: [],
        });
        setCalendars(nextCalendars);
        setTasks(nextTasks);
        setSchedulingConflicts(
          workspaceSchedulingConflicts(projects, nextTasks, dependencies, nextCalendars),
        );
        return true;
      });
      return result ?? false;
    },
    [calendars, dependencies, projects, repository, runMutation, tasks],
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<Task | null> => {
      if (selectedProjectId === null) {
        setError("Selecione um projeto antes de criar uma tarefa.");
        return null;
      }
      return runMutation(async () => {
        const project = projects.find((candidate) => candidate.id === selectedProjectId);
        if (project === undefined) throw new Error("O projeto selecionado não existe.");
        const projectTasks = tasks.filter((task) => task.projectId === selectedProjectId);
        const projectDependencies = dependencies.filter(
          (dependency) => dependency.projectId === selectedProjectId,
        );
        const siblings = projectTasks.filter((task) => task.parentId === input.parentId);
        const createdAt = nowUtc();
        const createdTask = validateTask({
          id: crypto.randomUUID(),
          code: null,
          projectId: selectedProjectId,
          parentId: input.parentId,
          calendarId: null,
          title: input.title,
          description: null,
          status: "NOT_STARTED",
          priority: "NORMAL",
          progress: 0,
          startDate: null,
          endDate: null,
          durationDays: null,
          deadlineDate: null,
          completedDate: null,
          schedulingMode: "AUTO",
          position: nextPosition(siblings),
          assignee: null,
          tags: [],
          notes: null,
          createdAt,
          updatedAt: createdAt,
        });
        assertValidParentAssignment(tasks, createdTask.id, createdTask.projectId, createdTask.parentId);
        const parentDependencyIds = new Set(
          input.parentId === null
            ? []
            : projectDependencies
                .filter((dependency) => dependency.predecessorId === input.parentId || dependency.successorId === input.parentId)
                .map((dependency) => dependency.id),
        );
        const parentAlreadySummary = input.parentId !== null && projectTasks.some(
          (task) => task.parentId === input.parentId,
        );
        const parentDependencyPolicy = input.parentDependencyPolicy
          ?? (parentAlreadySummary ? "KEEP" : undefined);
        if (parentDependencyIds.size > 0 && parentDependencyPolicy === undefined) {
          throw new Error("Escolha como tratar as dependências da tarefa-pai.");
        }
        const parentHasIncomingDependency = projectDependencies.some(
          (dependency) => parentDependencyIds.has(dependency.id) && dependency.successorId === input.parentId,
        );
        if (parentDependencyPolicy === "KEEP" && parentHasIncomingDependency) {
          throw new Error("Uma tarefa-resumo não pode manter dependências em que ela é sucessora.");
        }
        const mutatedParentDependencyIds = parentDependencyPolicy === "KEEP"
          ? new Set<string>()
          : parentDependencyIds;
        const nextProjectDependencies = projectDependencies.flatMap((dependency) => {
          if (!parentDependencyIds.has(dependency.id)) return [dependency];
          if (parentDependencyPolicy === "KEEP") return [dependency];
          if (parentDependencyPolicy === "REMOVE") return [];
          return [{
            ...dependency,
            predecessorId: dependency.predecessorId === input.parentId ? createdTask.id : dependency.predecessorId,
            successorId: dependency.successorId === input.parentId ? createdTask.id : dependency.successorId,
            updatedAt: createdAt,
          }];
        });
        const nextProjectTasks = [...projectTasks, createdTask];
        validateGraph(nextProjectTasks, nextProjectDependencies);
        const scheduled = rescheduleAffectedTasks({
          tasks: nextProjectTasks,
          dependencies: nextProjectDependencies,
          calendars,
          projectCalendarId: project.calendarId,
          changedTaskIds: [createdTask.id],
        });
        const persistIds = new Set([createdTask.id, ...scheduled.changedTaskIds]);
        const persistedTasks = stampedScheduledTasks(scheduled.tasks, persistIds, createdAt);
        await repository.applyScheduleChanges({
          calendarsToSave: [],
          tasks: persistedTasks.filter((task) => persistIds.has(task.id)),
          dependenciesToSave: nextProjectDependencies.filter((dependency) => mutatedParentDependencyIds.has(dependency.id)),
          dependencyIdsToDelete: [...mutatedParentDependencyIds],
          taskTreeIdsToDelete: [],
        });
        setTasks((current) => replaceTasks(current, persistedTasks));
        setDependencies((current) => current
          .filter((dependency) => !mutatedParentDependencyIds.has(dependency.id))
          .concat(nextProjectDependencies.filter((dependency) => mutatedParentDependencyIds.has(dependency.id))));
        setSchedulingConflicts((current) =>
          replaceProjectConflicts(
            current,
            new Set(persistedTasks.map(({ id }) => id)),
            projectSchedulingConflicts(project, persistedTasks, nextProjectDependencies, calendars),
          ),
        );
        return persistedTasks.find((task) => task.id === createdTask.id) ?? createdTask;
      });
    },
    [calendars, dependencies, projects, repository, runMutation, selectedProjectId, tasks],
  );


  const saveTask = useCallback(
    async (
      task: Task,
      dependencyUpdates: readonly TaskDependency[] = [],
      options: SaveTaskOptions = {},
    ): Promise<boolean> => {
      const result = await runMutation(async () => {
        const currentProjects = projectsRef.current;
        const currentCalendars = calendarsRef.current;
        const currentTasks = tasksRef.current;
        const currentDependencies = dependenciesRef.current;
        const project = currentProjects.find((candidate) => candidate.id === task.projectId);
        if (project === undefined) throw new Error("O projeto da tarefa não existe.");
        if (!currentCalendars.some((calendar) => calendar.id === (task.calendarId ?? project.calendarId))) {
          throw new Error("O calendário usado pela tarefa não existe.");
        }
        assertValidParentAssignment(currentTasks, task.id, task.projectId, task.parentId);
        const previous = currentTasks.find((candidate) => candidate.id === task.id);
        const movedToAnotherParent = previous !== undefined && previous.parentId !== task.parentId;
        const position = movedToAnotherParent
          ? nextPosition(
              currentTasks.filter(
                (candidate) =>
                  candidate.id !== task.id &&
                  candidate.projectId === task.projectId &&
                  candidate.parentId === task.parentId,
              ),
            )
          : task.position;
        const updatedAt = nowUtc();
        const validated = validateTask({ ...task, position, updatedAt });
        const projectTasks = currentTasks
          .filter((candidate) => candidate.projectId === task.projectId)
          .map((candidate) => (candidate.id === validated.id ? validated : candidate));
        const existingProjectDependencies = currentDependencies.filter(
          (dependency) => dependency.projectId === task.projectId,
        );
        const dependencyUpdateIds = new Set<string>();
        const validatedDependencyUpdates = dependencyUpdates.map((dependency) => {
          if (dependencyUpdateIds.has(dependency.id)) {
            throw new Error("A mesma dependência não pode ser alterada duas vezes.");
          }
          dependencyUpdateIds.add(dependency.id);
          const existing = existingProjectDependencies.find(
            (candidate) => candidate.id === dependency.id,
          );
          if (existing === undefined || existing.successorId !== validated.id) {
            throw new Error("A dependência alterada não pertence a esta tarefa.");
          }
          if (
            existing.projectId !== dependency.projectId ||
            existing.predecessorId !== dependency.predecessorId ||
            existing.successorId !== dependency.successorId
          ) {
            throw new Error("Nesta linha, somente o intervalo da dependência pode ser alterado.");
          }
          return validateTaskDependency({ ...dependency, updatedAt }, projectTasks);
        });
        const updatesById = new Map(
          validatedDependencyUpdates.map((dependency) => [dependency.id, dependency]),
        );
        const projectDependencies = existingProjectDependencies.map(
          (dependency) => updatesById.get(dependency.id) ?? dependency,
        );
        validateGraph(projectTasks, projectDependencies);
        const scheduled = rescheduleAffectedTasks({
          tasks: projectTasks,
          dependencies: projectDependencies,
          calendars: currentCalendars,
          projectCalendarId: project.calendarId,
          changedTaskIds: [
            validated.id,
            ...validatedDependencyUpdates.map(({ successorId }) => successorId),
          ],
        });
        const persistIds = new Set([validated.id, ...scheduled.changedTaskIds]);
        const persistedTasks = stampedScheduledTasks(scheduled.tasks, persistIds, updatedAt);
        await repository.applyScheduleChanges({
          calendarsToSave: [],
          tasks: persistedTasks.filter((candidate) => persistIds.has(candidate.id)),
          dependenciesToSave: validatedDependencyUpdates,
          dependencyIdsToDelete: [],
          taskTreeIdsToDelete: [],
        });
        const replacements = persistedTasks.filter((candidate) => persistIds.has(candidate.id));
        const beforeTasks = currentTasks.filter((candidate) => persistIds.has(candidate.id));
        const beforeDependencies = existingProjectDependencies.filter((dependency) =>
          dependencyUpdateIds.has(dependency.id));
        const nextTasks = replaceTasks(tasksRef.current, replacements);
        tasksRef.current = nextTasks;
        setTasks(nextTasks);
        if (validatedDependencyUpdates.length > 0) {
          const nextDependencies = dependenciesRef.current.map(
            (dependency) => updatesById.get(dependency.id) ?? dependency,
          );
          dependenciesRef.current = nextDependencies;
          setDependencies(nextDependencies);
        }
        if ((options.recordHistory ?? true) && beforeTasks.length === replacements.length) {
          recordTaskEditHistory({
            projectId: task.projectId,
            label: options.historyLabel ?? `Alteração em ${validated.title}`,
            beforeTasks,
            afterTasks: replacements,
            beforeDependencies,
            afterDependencies: validatedDependencyUpdates,
          });
        }
        setSchedulingConflicts((current) =>
          replaceProjectConflicts(
            current,
            new Set(persistedTasks.map(({ id }) => id)),
            projectSchedulingConflicts(project, persistedTasks, projectDependencies, currentCalendars),
          ),
        );
        return true;
      }, { blocking: false });
      return result ?? false;
    },
    [recordTaskEditHistory, repository, runMutation],
  );

  const restoreTaskEdit = useCallback(
    async (direction: "UNDO" | "REDO"): Promise<boolean> => {
      const result = await runMutation(async () => {
        const projectId = selectedProjectId;
        if (projectId === null) return false;
        const history = taskEditHistoryRef.current.get(projectId);
        if (history === undefined) return false;
        const source = direction === "UNDO" ? history.undoEntries : history.redoEntries;
        const destination = direction === "UNDO" ? history.redoEntries : history.undoEntries;
        const entry = source[source.length - 1];
        if (entry === undefined || entry.projectId !== projectId) return false;

        const project = projectsRef.current.find((candidate) => candidate.id === projectId);
        if (project === undefined) throw new Error("O projeto do histórico não existe mais.");
        const updatedAt = nowUtc();
        const sourceTasks = direction === "UNDO" ? entry.afterTasks : entry.beforeTasks;
        const snapshotTasks = direction === "UNDO" ? entry.beforeTasks : entry.afterTasks;
        const sourceDependencies = direction === "UNDO"
          ? entry.afterDependencies
          : entry.beforeDependencies;
        const snapshotDependencies = direction === "UNDO"
          ? entry.beforeDependencies
          : entry.afterDependencies;
        const restoredTasks = snapshotTasks.map((task) =>
          validateTask({ ...task, updatedAt }));
        const restoredTaskIds = new Set(restoredTasks.map(({ id }) => id));
        const removedTaskIds = new Set(
          sourceTasks.filter((task) => !restoredTaskIds.has(task.id)).map(({ id }) => id),
        );
        const taskTreeIdsToDelete = sourceTasks
          .filter((task) => removedTaskIds.has(task.id) &&
            (task.parentId === null || !removedTaskIds.has(task.parentId)))
          .map(({ id }) => id);
        const projectTasksWithRestore = replaceTasks(
          tasksRef.current.filter((task) => task.projectId === projectId),
          restoredTasks,
          removedTaskIds,
        );
        const restoredDependencies = snapshotDependencies.map((dependency) =>
          validateTaskDependency({ ...dependency, updatedAt }, projectTasksWithRestore));
        const restoredDependenciesById = new Map(
          restoredDependencies.map((dependency) => [dependency.id, dependency]),
        );
        const restoredDependencyIds = new Set(restoredDependencies.map(({ id }) => id));
        const dependencyIdsToDelete = sourceDependencies
          .filter((dependency) => !restoredDependencyIds.has(dependency.id))
          .map(({ id }) => id);
        const deletedDependencyIds = new Set(dependencyIdsToDelete);
        const nextDependencies = [
          ...dependenciesRef.current
            .filter((dependency) =>
              !deletedDependencyIds.has(dependency.id) &&
              !removedTaskIds.has(dependency.predecessorId) &&
              !removedTaskIds.has(dependency.successorId))
            .map((dependency) => restoredDependenciesById.get(dependency.id) ?? dependency),
          ...restoredDependencies.filter((dependency) =>
            !dependenciesRef.current.some(({ id }) => id === dependency.id)),
        ];
        const nextTasks = replaceTasks(tasksRef.current, restoredTasks, removedTaskIds);
        const nextProjectDependencies = nextDependencies.filter(
          (dependency) => dependency.projectId === projectId,
        );
        validateGraph(projectTasksWithRestore, nextProjectDependencies);
        await repository.applyScheduleChanges({
          calendarsToSave: [],
          tasks: restoredTasks,
          dependenciesToSave: restoredDependencies,
          dependencyIdsToDelete,
          taskTreeIdsToDelete,
        });
        tasksRef.current = nextTasks;
        dependenciesRef.current = nextDependencies;
        setTasks(nextTasks);
        setDependencies(nextDependencies);
        setSchedulingConflicts((current) =>
          replaceProjectConflicts(
            current,
            new Set(projectTasksWithRestore.map(({ id }) => id)),
            projectSchedulingConflicts(
              project,
              projectTasksWithRestore,
              nextProjectDependencies,
              calendarsRef.current,
            ),
          ),
        );
        source.pop();
        destination.push(entry);
        setTaskEditHistoryAvailability((current) => {
          const next = new Map(current);
          next.set(projectId, {
            canUndo: history.undoEntries.length > 0,
            canRedo: history.redoEntries.length > 0,
            undoLabel: history.undoEntries.at(-1)?.label ?? null,
            redoLabel: history.redoEntries.at(-1)?.label ?? null,
            undoLabels: history.undoEntries.map(({ label }) => label),
            redoLabels: history.redoEntries.map(({ label }) => label),
          });
          return next;
        });
        return true;
      }, { blocking: false });
      return result ?? false;
    },
    [repository, runMutation, selectedProjectId],
  );

  const undoTaskEdit = useCallback(
    () => restoreTaskEdit("UNDO"),
    [restoreTaskEdit],
  );
  const redoTaskEdit = useCallback(
    () => restoreTaskEdit("REDO"),
    [restoreTaskEdit],
  );

  const setTasksSchedulingMode = useCallback(
    async (taskIds: readonly string[], schedulingMode: SchedulingMode): Promise<boolean> => {
      const result = await runMutation(async () => {
        if (taskIds.length === 0) return false;
        const uniqueIds = new Set(taskIds);
        const selectedTasks = tasks.filter((task) => uniqueIds.has(task.id));
        if (selectedTasks.length !== uniqueIds.size) {
          throw new Error("Uma das tarefas selecionadas não existe mais.");
        }
        const projectId = selectedTasks[0]?.projectId;
        const project = projects.find((candidate) => candidate.id === projectId);
        if (project === undefined || selectedTasks.some((task) => task.projectId !== project.id)) {
          throw new Error("A trava em massa só pode ser aplicada dentro do mesmo projeto.");
        }
        const summaryIds = new Set(
          tasks.flatMap((task) => task.parentId === null ? [] : [task.parentId]),
        );
        if (selectedTasks.some((task) => summaryIds.has(task.id))) {
          throw new Error("Tarefas-resumo têm datas derivadas e não podem ser travadas manualmente.");
        }
        const updatedAt = nowUtc();
        const projectTasks = tasks
          .filter((task) => task.projectId === project.id)
          .map((task) => uniqueIds.has(task.id)
            ? validateTask({ ...task, schedulingMode, updatedAt })
            : task);
        const projectDependencies = dependencies.filter(
          (dependency) => dependency.projectId === project.id,
        );
        const scheduled = rescheduleAffectedTasks({
          tasks: projectTasks,
          dependencies: projectDependencies,
          calendars,
          projectCalendarId: project.calendarId,
          changedTaskIds: [...uniqueIds],
        });
        const persistIds = new Set([...uniqueIds, ...scheduled.changedTaskIds]);
        const persistedTasks = stampedScheduledTasks(scheduled.tasks, persistIds, updatedAt);
        const replacements = persistedTasks.filter((task) => persistIds.has(task.id));
        await repository.applyScheduleChanges({
          calendarsToSave: [], tasks: replacements, dependenciesToSave: [],
          dependencyIdsToDelete: [], taskTreeIdsToDelete: [],
        });
        setTasks((current) => replaceTasks(current, replacements));
        setSchedulingConflicts((current) =>
          replaceProjectConflicts(
            current,
            new Set(projectTasks.map(({ id }) => id)),
            projectSchedulingConflicts(project, persistedTasks, projectDependencies, calendars),
          ),
        );
        return true;
      });
      return result ?? false;
    },
    [calendars, dependencies, projects, repository, runMutation, tasks],
  );

  const loadGanttHistory = useCallback(
    (projectId: string) => repository.loadGanttHistory(projectId),
    [repository],
  );

  const saveGanttHistory = useCallback(
    (projectId: string, state: GanttHistoryState) => repository.saveGanttHistory(projectId, state),
    [repository],
  );

  const moveTask = useCallback(
    async (taskId: string, direction: MoveDirection): Promise<boolean> => {
      const task = tasks.find((candidate) => candidate.id === taskId);
      if (task === undefined) {
        setError("A tarefa selecionada não existe.");
        return false;
      }
      const taskIds = orderAfterMove(
        tasks.filter(
          (candidate) =>
            candidate.projectId === task.projectId && candidate.parentId === task.parentId,
        ),
        taskId,
        direction,
      );
      if (taskIds === null) return false;
      const positions = positionsById(taskIds);
      const result = await runMutation(async () => {
        const beforeTasks = tasksRef.current.filter((candidate) => taskIds.includes(candidate.id));
        await repository.reorderTasks(taskIds);
        const nextTasks = tasksRef.current.map((candidate) => {
            const position = positions.get(candidate.id);
            return position === undefined ? candidate : { ...candidate, position };
          });
        const afterTasks = nextTasks.filter((candidate) => taskIds.includes(candidate.id));
        tasksRef.current = nextTasks;
        setTasks(nextTasks);
        recordTaskEditHistory({
          projectId: task.projectId,
          label: `${task.title} movida para ${direction === "up" ? "cima" : "baixo"}`,
          beforeTasks,
          afterTasks,
          beforeDependencies: [],
          afterDependencies: [],
        });
        return true;
      });
      return result ?? false;
    },
    [recordTaskEditHistory, repository, runMutation, tasks],
  );

  const removeTaskTree = useCallback(
    async (taskId: string): Promise<boolean> => {
      const result = await runMutation(async () => {
        const root = tasks.find((task) => task.id === taskId);
        if (root === undefined) throw new Error("A tarefa selecionada não existe.");
        const project = projects.find((candidate) => candidate.id === root.projectId);
        if (project === undefined) throw new Error("O projeto da tarefa não existe.");
        const removedIds = collectTaskTreeIds(tasks, taskId);
        const remainingProjectTasks = tasks.filter(
          (task) => task.projectId === root.projectId && !removedIds.has(task.id),
        );
        const remainingDependencies = dependencies.filter(
          (dependency) =>
            dependency.projectId === root.projectId &&
            !removedIds.has(dependency.predecessorId) &&
            !removedIds.has(dependency.successorId),
        );
        const scheduled = rescheduleAffectedTasks({
          tasks: remainingProjectTasks,
          dependencies: remainingDependencies,
          calendars,
          projectCalendarId: project.calendarId,
          changedTaskIds: root.parentId === null ? [] : [root.parentId],
        });
        const updatedAt = nowUtc();
        const persistedTasks = stampedScheduledTasks(
          scheduled.tasks,
          scheduled.changedTaskIds,
          updatedAt,
        );
        const affectedIds = new Set([...removedIds, ...scheduled.changedTaskIds]);
        const beforeTasks = tasks.filter((task) => affectedIds.has(task.id));
        const afterTasks = persistedTasks.filter((task) => scheduled.changedTaskIds.has(task.id));
        const removedDependencies = dependencies.filter((dependency) =>
          removedIds.has(dependency.predecessorId) || removedIds.has(dependency.successorId));
        await repository.applyScheduleChanges({
          calendarsToSave: [],
          tasks: persistedTasks.filter((task) => scheduled.changedTaskIds.has(task.id)),
          dependenciesToSave: [],
          dependencyIdsToDelete: removedDependencies.map(({ id }) => id),
          taskTreeIdsToDelete: [taskId],
        });
        const nextTasks = replaceTasks(tasksRef.current, persistedTasks, removedIds);
        const nextDependencies = dependenciesRef.current.filter(
            (dependency) =>
              !removedIds.has(dependency.predecessorId) &&
              !removedIds.has(dependency.successorId),
          );
        tasksRef.current = nextTasks;
        dependenciesRef.current = nextDependencies;
        setTasks(nextTasks);
        setDependencies(nextDependencies);
        recordTaskEditHistory({
          projectId: root.projectId,
          label: `${root.title} excluída${removedIds.size === 1 ? "" : ` com ${String(removedIds.size - 1)} subtarefa${removedIds.size === 2 ? "" : "s"}`}`,
          beforeTasks,
          afterTasks,
          beforeDependencies: removedDependencies,
          afterDependencies: [],
        });
        setSchedulingConflicts((current) =>
          replaceProjectConflicts(
            current,
            new Set(
              tasks.filter((task) => task.projectId === root.projectId).map(({ id }) => id),
            ),
            projectSchedulingConflicts(project, persistedTasks, remainingDependencies, calendars),
          ),
        );
        return true;
      });
      return result ?? false;
    },
    [calendars, dependencies, projects, recordTaskEditHistory, repository, runMutation, tasks],
  );

  const persistDependency = useCallback(
    async (
      dependency: TaskDependency,
      nextDependencies: readonly TaskDependency[],
    ): Promise<boolean> => {
      const currentProjects = projectsRef.current;
      const currentTasks = tasksRef.current;
      const currentCalendars = calendarsRef.current;
      const project = currentProjects.find((candidate) => candidate.id === dependency.projectId);
      if (project === undefined) throw new Error("O projeto da dependência não existe.");
      const projectTasks = currentTasks.filter((task) => task.projectId === dependency.projectId);
      const projectDependencies = nextDependencies.filter(
        (candidate) => candidate.projectId === dependency.projectId,
      );
      validateGraph(projectTasks, projectDependencies);
      const scheduled = rescheduleAffectedTasks({
        tasks: projectTasks,
        dependencies: projectDependencies,
        calendars: currentCalendars,
        projectCalendarId: project.calendarId,
        changedTaskIds: [dependency.successorId],
      });
      const updatedAt = nowUtc();
      const persistedTasks = stampedScheduledTasks(
        scheduled.tasks,
        scheduled.changedTaskIds,
        updatedAt,
      );
      await repository.applyScheduleChanges({
        calendarsToSave: [],
        tasks: persistedTasks.filter((task) => scheduled.changedTaskIds.has(task.id)),
        dependenciesToSave: [{ ...dependency, updatedAt }],
        dependencyIdsToDelete: [],
        taskTreeIdsToDelete: [],
      });
      const nextTasks = replaceTasks(tasksRef.current, persistedTasks);
      const persistedDependencies = nextDependencies.map((item) =>
        item.id === dependency.id ? { ...dependency, updatedAt } : item,
      );
      tasksRef.current = nextTasks;
      dependenciesRef.current = persistedDependencies;
      setTasks(nextTasks);
      setDependencies(persistedDependencies);
      setSchedulingConflicts((current) =>
        replaceProjectConflicts(
          current,
          new Set(persistedTasks.map(({ id }) => id)),
          projectSchedulingConflicts(project, persistedTasks, projectDependencies, currentCalendars),
        ),
      );
      return true;
    },
    [repository],
  );

  const createDependencies = useCallback(
    async (
      inputs: readonly DependencyInput[],
      options: CreateDependenciesOptions = {},
    ): Promise<readonly TaskDependency[] | null> => {
      if (inputs.length === 0) return [];
      return runMutation(async () => {
        const currentTasks = tasksRef.current;
        const currentDependencies = dependenciesRef.current;
        const successorIds = new Set(inputs.map(({ successorId }) => successorId));
        if (successorIds.size !== 1) {
          throw new Error("A inclusão múltipla deve usar a mesma tarefa sucessora.");
        }
        const successorId = inputs[0]?.successorId;
        const successor = currentTasks.find((task) => task.id === successorId);
        if (successor === undefined) throw new Error("A tarefa sucessora não existe.");
        const project = projectsRef.current.find(({ id }) => id === successor.projectId);
        if (project === undefined) throw new Error("O projeto da dependência não existe.");
        const uniquePredecessorIds = new Set(inputs.map(({ predecessorId }) => predecessorId));
        if (uniquePredecessorIds.size !== inputs.length) {
          throw new Error("A mesma predecessora não pode ser adicionada duas vezes.");
        }
        if (inputs.some((input) => currentDependencies.some((dependency) =>
          dependency.predecessorId === input.predecessorId &&
          dependency.successorId === input.successorId))) {
          throw new Error("Uma das predecessoras selecionadas já foi adicionada.");
        }
        const createdAt = nowUtc();
        const created = inputs.map((input) => validateTaskDependency({
            id: crypto.randomUUID(),
            projectId: successor.projectId,
            predecessorId: input.predecessorId,
            successorId: input.successorId,
            type: "FS",
            lagDays: input.lagDays,
            createdAt,
            updatedAt: createdAt,
          }, currentTasks));
        const nextDependencies = [...currentDependencies, ...created];
        const projectTasks = currentTasks.filter((task) => task.projectId === successor.projectId);
        const projectDependencies = nextDependencies.filter(
          (dependency) => dependency.projectId === successor.projectId,
        );
        validateGraph(projectTasks, projectDependencies);
        const scheduled = rescheduleAffectedTasks({
          tasks: projectTasks,
          dependencies: projectDependencies,
          calendars: calendarsRef.current,
          projectCalendarId: project.calendarId,
          changedTaskIds: [successor.id],
        });
        const persistedTasks = stampedScheduledTasks(
          scheduled.tasks,
          scheduled.changedTaskIds,
          createdAt,
        );
        const replacements = persistedTasks.filter((task) => scheduled.changedTaskIds.has(task.id));
        const beforeTasks = currentTasks.filter((task) => scheduled.changedTaskIds.has(task.id));
        await repository.applyScheduleChanges({
          calendarsToSave: [],
          tasks: replacements,
          dependenciesToSave: created,
          dependencyIdsToDelete: [],
          taskTreeIdsToDelete: [],
        });
        const nextTasks = replaceTasks(currentTasks, replacements);
        tasksRef.current = nextTasks;
        dependenciesRef.current = nextDependencies;
        setTasks(nextTasks);
        setDependencies(nextDependencies);
        const outline = buildTaskOutlineNumbers(projectTasks).get(successor.id);
        const targetLabel = `${outline === undefined ? "" : `${outline}. `}${successor.title}`;
        recordTaskEditHistory({
          projectId: successor.projectId,
          label: options.historyLabel ?? `${String(created.length)} predecessora${created.length === 1 ? "" : "s"} adicionada${created.length === 1 ? "" : "s"} a ${targetLabel}`,
          beforeTasks,
          afterTasks: replacements,
          beforeDependencies: [],
          afterDependencies: created,
        });
        setSchedulingConflicts((current) =>
          replaceProjectConflicts(
            current,
            new Set(projectTasks.map(({ id }) => id)),
            projectSchedulingConflicts(project, persistedTasks, projectDependencies, calendarsRef.current),
          ),
        );
        return created;
      });
    },
    [recordTaskEditHistory, repository, runMutation],
  );

  const createDependency = useCallback(
    async (input: DependencyInput): Promise<TaskDependency | null> => {
      const created = await createDependencies([input]);
      return created?.[0] ?? null;
    },
    [createDependencies],
  );

  const saveDependency = useCallback(
    async (dependency: TaskDependency): Promise<boolean> => {
      const result = await runMutation(async () => {
        const validated = validateTaskDependency(dependency, tasks);
        const nextDependencies = dependencies.map((candidate) =>
          candidate.id === validated.id ? validated : candidate,
        );
        return persistDependency(validated, nextDependencies);
      });
      return result ?? false;
    },
    [dependencies, persistDependency, runMutation, tasks],
  );

  const saveDependencies = useCallback(
    async (updates: readonly TaskDependency[], historyLabel?: string): Promise<boolean> => {
      if (updates.length === 0) return true;
      const result = await runMutation(async () => {
        const currentTasks = tasksRef.current;
        const currentDependencies = dependenciesRef.current;
        const updateIds = new Set(updates.map(({ id }) => id));
        const previous = currentDependencies.filter(({ id }) => updateIds.has(id));
        if (previous.length !== updateIds.size) throw new Error("Uma das dependências selecionadas não existe.");
        const projectIds = new Set(previous.map(({ projectId }) => projectId));
        if (projectIds.size !== 1) throw new Error("As dependências devem pertencer ao mesmo projeto.");
        const projectId = previous[0]?.projectId;
        const project = projectsRef.current.find(({ id }) => id === projectId);
        if (project === undefined) throw new Error("O projeto da dependência não existe.");
        const updatedAt = nowUtc();
        const validated = updates.map((dependency) => validateTaskDependency({ ...dependency, updatedAt }, currentTasks));
        const updateById = new Map(validated.map((dependency) => [dependency.id, dependency]));
        const nextDependencies = currentDependencies.map((dependency) => updateById.get(dependency.id) ?? dependency);
        const projectTasks = currentTasks.filter((task) => task.projectId === project.id);
        const projectDependencies = nextDependencies.filter((dependency) => dependency.projectId === project.id);
        validateGraph(projectTasks, projectDependencies);
        const changedTaskIds = [...new Set(validated.map(({ successorId }) => successorId))];
        const scheduled = rescheduleAffectedTasks({
          tasks: projectTasks,
          dependencies: projectDependencies,
          calendars: calendarsRef.current,
          projectCalendarId: project.calendarId,
          changedTaskIds,
        });
        const persistedTasks = stampedScheduledTasks(scheduled.tasks, scheduled.changedTaskIds, updatedAt);
        const replacements = persistedTasks.filter((task) => scheduled.changedTaskIds.has(task.id));
        const beforeTasks = currentTasks.filter((task) => scheduled.changedTaskIds.has(task.id));
        await repository.applyScheduleChanges({
          calendarsToSave: [],
          tasks: replacements,
          dependenciesToSave: validated,
          dependencyIdsToDelete: [],
          taskTreeIdsToDelete: [],
        });
        const nextTasks = replaceTasks(currentTasks, persistedTasks);
        tasksRef.current = nextTasks;
        dependenciesRef.current = nextDependencies;
        setTasks(nextTasks);
        setDependencies(nextDependencies);
        recordTaskEditHistory({
          projectId: project.id,
          label: historyLabel ?? `${String(validated.length)} predecessora${validated.length === 1 ? "" : "s"} atualizada${validated.length === 1 ? "" : "s"}`,
          beforeTasks,
          afterTasks: replacements,
          beforeDependencies: previous,
          afterDependencies: validated,
        });
        setSchedulingConflicts((current) => replaceProjectConflicts(
          current,
          new Set(projectTasks.map(({ id }) => id)),
          projectSchedulingConflicts(project, persistedTasks, projectDependencies, calendarsRef.current),
        ));
        return true;
      });
      return result ?? false;
    },
    [recordTaskEditHistory, repository, runMutation],
  );

  const removeDependencies = useCallback(
    async (dependencyIds: readonly string[], historyLabel?: string): Promise<boolean> => {
      if (dependencyIds.length === 0) return true;
      const result = await runMutation(async () => {
        const currentTasks = tasksRef.current;
        const currentDependencies = dependenciesRef.current;
        const ids = new Set(dependencyIds);
        const removed = currentDependencies.filter(({ id }) => ids.has(id));
        if (removed.length !== ids.size) throw new Error("Uma das dependências selecionadas não existe.");
        const projectIds = new Set(removed.map(({ projectId }) => projectId));
        if (projectIds.size !== 1) throw new Error("As dependências devem pertencer ao mesmo projeto.");
        const projectId = removed[0]?.projectId;
        const project = projectsRef.current.find(({ id }) => id === projectId);
        if (project === undefined) throw new Error("O projeto da dependência não existe.");
        const nextDependencies = currentDependencies.filter(({ id }) => !ids.has(id));
        const projectTasks = currentTasks.filter((task) => task.projectId === project.id);
        const projectDependencies = nextDependencies.filter((dependency) => dependency.projectId === project.id);
        const scheduled = rescheduleAffectedTasks({
          tasks: projectTasks,
          dependencies: projectDependencies,
          calendars: calendarsRef.current,
          projectCalendarId: project.calendarId,
          changedTaskIds: [...new Set(removed.map(({ successorId }) => successorId))],
        });
        const updatedAt = nowUtc();
        const persistedTasks = stampedScheduledTasks(scheduled.tasks, scheduled.changedTaskIds, updatedAt);
        const replacements = persistedTasks.filter((task) => scheduled.changedTaskIds.has(task.id));
        const beforeTasks = currentTasks.filter((task) => scheduled.changedTaskIds.has(task.id));
        await repository.applyScheduleChanges({
          calendarsToSave: [],
          tasks: replacements,
          dependenciesToSave: [],
          dependencyIdsToDelete: [...ids],
          taskTreeIdsToDelete: [],
        });
        const nextTasks = replaceTasks(currentTasks, persistedTasks);
        tasksRef.current = nextTasks;
        dependenciesRef.current = nextDependencies;
        setTasks(nextTasks);
        setDependencies(nextDependencies);
        const successor = currentTasks.find(({ id }) => id === removed[0]?.successorId);
        recordTaskEditHistory({
          projectId: project.id,
          label: historyLabel ?? `${String(removed.length)} predecessora${removed.length === 1 ? "" : "s"} removida${removed.length === 1 ? "" : "s"} de ${successor?.title ?? "tarefa"}`,
          beforeTasks,
          afterTasks: replacements,
          beforeDependencies: removed,
          afterDependencies: [],
        });
        setSchedulingConflicts((current) => replaceProjectConflicts(
          current,
          new Set(projectTasks.map(({ id }) => id)),
          projectSchedulingConflicts(project, persistedTasks, projectDependencies, calendarsRef.current),
        ));
        return true;
      });
      return result ?? false;
    },
    [recordTaskEditHistory, repository, runMutation],
  );

  const removeDependency = useCallback(
    async (dependencyId: string): Promise<boolean> => {
      return removeDependencies([dependencyId]);
    },
    [removeDependencies],
  );

  const duplicateTask = useCallback(
    async (taskId: string, includeDescendants: boolean): Promise<Task | null> =>
      runMutation(async () => {
        const source = tasks.find((task) => task.id === taskId);
        if (source === undefined) throw new Error("A tarefa selecionada não existe.");
        const project = projects.find((candidate) => candidate.id === source.projectId);
        if (project === undefined) throw new Error("O projeto da tarefa não existe.");
        const projectTasks = tasks.filter((task) => task.projectId === source.projectId);
        const projectDependencies = dependencies.filter(
          (dependency) => dependency.projectId === source.projectId,
        );
        const rootPosition = nextPosition(
          projectTasks.filter((task) => task.parentId === source.parentId),
        );
        const timestamp = nowUtc();
        const duplicated = duplicateTaskTree({
          tasks: projectTasks,
          dependencies: projectDependencies,
          rootTaskId: taskId,
          includeDescendants,
          rootPosition,
          idFactory: () => crypto.randomUUID(),
          timestamp,
        });
        const nextDependencies = [...projectDependencies, ...duplicated.dependencies];
        const nextProjectTasks = [...projectTasks, ...duplicated.tasks];
        validateGraph(nextProjectTasks, nextDependencies);
        const scheduled = rescheduleAffectedTasks({
          tasks: nextProjectTasks,
          dependencies: nextDependencies,
          calendars,
          projectCalendarId: project.calendarId,
          changedTaskIds: duplicated.tasks.map((task) => task.id),
        });
        const persistIds = new Set([
          ...duplicated.tasks.map((task) => task.id),
          ...scheduled.changedTaskIds,
        ]);
        const persistedProjectTasks = stampedScheduledTasks(
          scheduled.tasks,
          persistIds,
          timestamp,
        );
        await repository.saveDuplicationBundle({
          project: null,
          tasks: persistedProjectTasks.filter((task) => persistIds.has(task.id)),
          dependencies: duplicated.dependencies,
        });
        const replacements = persistedProjectTasks.filter((task) => persistIds.has(task.id));
        const duplicatedIds = new Set(duplicated.tasks.map(({ id }) => id));
        const beforeTasks = tasks.filter((task) =>
          persistIds.has(task.id) && !duplicatedIds.has(task.id));
        const nextTasks = replaceTasks(tasksRef.current, persistedProjectTasks);
        const nextWorkspaceDependencies = [...dependenciesRef.current, ...duplicated.dependencies];
        tasksRef.current = nextTasks;
        dependenciesRef.current = nextWorkspaceDependencies;
        setTasks(nextTasks);
        setDependencies(nextWorkspaceDependencies);
        recordTaskEditHistory({
          projectId: source.projectId,
          label: `${source.title} duplicada${includeDescendants ? " com subtarefas" : ""}`,
          beforeTasks,
          afterTasks: replacements,
          beforeDependencies: [],
          afterDependencies: duplicated.dependencies,
        });
        setSchedulingConflicts((current) =>
          replaceProjectConflicts(
            current,
            new Set(persistedProjectTasks.map(({ id }) => id)),
            projectSchedulingConflicts(project, persistedProjectTasks, nextDependencies, calendars),
          ),
        );
        const copiedRootId = duplicated.sourceToCopyId.get(taskId);
        return persistedProjectTasks.find((task) => task.id === copiedRootId) ?? null;
      }),
    [calendars, dependencies, projects, recordTaskEditHistory, repository, runMutation, tasks],
  );

  const duplicateProject = useCallback(
    async (projectId: string): Promise<Project | null> =>
      runMutation(async () => {
        const source = projects.find((project) => project.id === projectId);
        if (source === undefined) throw new Error("O projeto selecionado não existe.");
        const timestamp = nowUtc();
        const duplicated = duplicateProjectStructure({
          project: source,
          tasks,
          dependencies,
          position: nextPosition(projects.filter((project) => !project.isArchived)),
          idFactory: () => crypto.randomUUID(),
          timestamp,
        });
        await repository.saveDuplicationBundle({
          project: duplicated.project,
          tasks: duplicated.tasks,
          dependencies: duplicated.dependencies,
        });
        setProjects((current) => [...current, duplicated.project]);
        setTasks((current) => [...current, ...duplicated.tasks]);
        setDependencies((current) => [...current, ...duplicated.dependencies]);
        setSelectedProjectId(duplicated.project.id);
        return duplicated.project;
      }),
    [dependencies, projects, repository, runMutation, tasks],
  );

  const createTemplate = useCallback(
    async (input: CreateTemplateInput): Promise<TaskTemplate | null> =>
      runMutation(async () => {
        const timestamp = nowUtc();
        const bundle = createTemplateFromTaskTree({
          ...input,
          tasks,
          dependencies,
          idFactory: () => crypto.randomUUID(),
          timestamp,
        });
        await repository.saveTemplateBundle(bundle);
        setTemplates((current) => [...current, bundle.template]);
        setTemplateItems((current) => [...current, ...bundle.items]);
        setTemplateDependencies((current) => [...current, ...bundle.dependencies]);
        return bundle.template;
      }),
    [dependencies, repository, runMutation, tasks],
  );

  const applyTemplate = useCallback(
    async (templateId: string, startDate: string): Promise<Task | null> => {
      if (selectedProjectId === null) {
        setError("Selecione um projeto antes de aplicar um template.");
        return null;
      }
      return runMutation(async () => {
        const template = templates.find((candidate) => candidate.id === templateId);
        const project = projects.find((candidate) => candidate.id === selectedProjectId);
        if (template === undefined) throw new Error("O template selecionado não existe.");
        if (project === undefined) throw new Error("O projeto de destino não existe.");
        const bundle: TaskTemplateBundle = {
          template,
          items: templateItems.filter((item) => item.templateId === templateId),
          dependencies: templateDependencies.filter(
            (dependency) => dependency.templateId === templateId,
          ),
        };
        const timestamp = nowUtc();
        const applied = applyTaskTemplate({
          bundle,
          targetProject: project,
          calendars,
          startDate,
          rootPosition: nextPosition(
            tasks.filter(
              (task) => task.projectId === selectedProjectId && task.parentId === null,
            ),
          ),
          idFactory: () => crypto.randomUUID(),
          timestamp,
        });
        await repository.saveDuplicationBundle({
          project: null,
          tasks: applied.tasks,
          dependencies: applied.dependencies,
        });
        setTasks((current) => [...current, ...applied.tasks]);
        setDependencies((current) => [...current, ...applied.dependencies]);
        setSchedulingConflicts((current) => [
          ...current,
          ...projectSchedulingConflicts(project, applied.tasks, applied.dependencies, calendars),
        ]);
        const root = applied.tasks.find((task) => task.parentId === null);
        return root ?? null;
      });
    },
    [
      calendars,
      projects,
      repository,
      runMutation,
      selectedProjectId,
      tasks,
      templateDependencies,
      templateItems,
      templates,
    ],
  );

  const removeTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      const result = await runMutation(async () => {
        if (!templates.some((template) => template.id === templateId)) {
          throw new Error("O template selecionado não existe.");
        }
        await repository.deleteTemplate(templateId);
        setTemplates((current) => current.filter((template) => template.id !== templateId));
        setTemplateItems((current) => current.filter((item) => item.templateId !== templateId));
        setTemplateDependencies((current) =>
          current.filter((dependency) => dependency.templateId !== templateId),
        );
        return true;
      });
      return result ?? false;
    },
    [repository, runMutation, templates],
  );

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedProjectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === selectedProjectId),
    [selectedProjectId, tasks],
  );
  const selectedProjectDependencies = useMemo(
    () => dependencies.filter((dependency) => dependency.projectId === selectedProjectId),
    [dependencies, selectedProjectId],
  );
  const selectedProjectBaselines = useMemo(
    () => baselines
      .filter((baseline) => baseline.projectId === selectedProjectId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [baselines, selectedProjectId],
  );
  const activeBaseline = selectedProjectBaselines.find((baseline) => baseline.isActive) ?? null;
  const activeBaselineTasks = useMemo(
    () => activeBaseline === null
      ? []
      : baselineTasks.filter((task) => task.baselineId === activeBaseline.id),
    [activeBaseline, baselineTasks],
  );
  const selectedTaskEditHistoryAvailability = selectedProjectId === null
    ? undefined
    : taskEditHistoryAvailability.get(selectedProjectId);

  return {
    calendars,
    projects,
    tasks,
    dependencies,
    baselines,
    baselineTasks,
    templates,
    templateItems,
    templateDependencies,
    schedulingConflicts,
    selectedProjectId,
    selectedProject,
    selectedProjectTasks,
    selectedProjectDependencies,
    selectedProjectBaselines,
    activeBaseline,
    activeBaselineTasks,
    isLoading,
    isSaving,
    error,
    selectProject: setSelectedProjectId,
    clearError: () => { setError(null); },
    reloadWorkspace: () => {
      setReloadVersion((current) => current + 1);
    },
    createProject,
    saveProject,
    moveProject,
    removeProject,
    saveCalendar,
    createBaseline,
    removeProjectBaselines,
    createTask,
    saveTask,
    canUndoTaskEdit: selectedTaskEditHistoryAvailability?.canUndo ?? false,
    canRedoTaskEdit: selectedTaskEditHistoryAvailability?.canRedo ?? false,
    undoTaskEditLabel: selectedTaskEditHistoryAvailability?.undoLabel ?? null,
    redoTaskEditLabel: selectedTaskEditHistoryAvailability?.redoLabel ?? null,
    taskEditHistoryEntries: [
      ...(selectedTaskEditHistoryAvailability?.undoLabels ?? []).map((label) => ({
        label,
        state: "APPLIED" as const,
      })),
      ...[...(selectedTaskEditHistoryAvailability?.redoLabels ?? [])].reverse().map((label) => ({
        label,
        state: "UNDONE" as const,
      })),
    ].reverse(),
    undoTaskEdit,
    redoTaskEdit,
    setTasksSchedulingMode,
    loadGanttHistory,
    saveGanttHistory,
    moveTask,
    removeTaskTree,
    createDependency,
    createDependencies,
    saveDependency,
    saveDependencies,
    removeDependency,
    removeDependencies,
    duplicateTask,
    duplicateProject,
    createTemplate,
    applyTemplate,
    removeTemplate,
  };
}

export type { ProjectStatus, SchedulingMode, TaskPriority, TaskStatus };
