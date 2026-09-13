import { lazy, Suspense, useMemo, useState, type KeyboardEvent } from "react";

import type { Calendar } from "../../domain/calendars/calendar";
import type { Project } from "../../domain/projects/project";
import type { BaselineTask, ProjectBaseline } from "../../domain/planning/baseline";
import type { TaskDependency } from "../../domain/scheduling/dependency";
import type { SchedulingConflict } from "../../domain/scheduling/scheduler";
import type { Task } from "../../domain/tasks/task";
import { TaskKanban } from "../kanban/TaskKanban";
import { ProjectPdfExport } from "../reporting/ProjectPdfExport";
import { ProjectBaselineControl } from "../planning/ProjectBaselineControl";
import { TaskTable } from "../table/TaskTable";
import { TaskFilterBar } from "./TaskFilterBar";
import { ViewErrorBoundary } from "./ViewErrorBoundary";
import {
  EMPTY_TASK_FILTERS,
  filterTasks,
  hasActiveTaskFilters,
  includeTaskAncestors,
  type TaskFilters,
} from "./task-filters";

export type ProjectView = "TABLE" | "KANBAN" | "GANTT";

const TaskGantt = lazy(async () => {
  const module = await import("../gantt/TaskGantt");
  return { default: module.TaskGantt };
});

interface ProjectViewsProps {
  readonly project: Project;
  readonly tasks: readonly Task[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly dependencies: readonly TaskDependency[];
  readonly conflicts: readonly SchedulingConflict[];
  readonly baselines: readonly ProjectBaseline[];
  readonly activeBaseline: ProjectBaseline | null;
  readonly activeBaselineTasks: readonly BaselineTask[];
  readonly disabled: boolean;
  readonly onCreate: (input: { readonly title: string; readonly parentId: string | null; readonly parentDependencyPolicy?: "TRANSFER" | "REMOVE" }) => Promise<Task | null>;
  readonly onSave: (
    task: Task,
    dependencyUpdates?: readonly TaskDependency[],
  ) => Promise<boolean>;
  readonly onMove: (taskId: string, direction: "up" | "down") => Promise<boolean>;
  readonly onDelete: (taskId: string) => Promise<boolean>;
  readonly onCreateDependency: (input: {
    readonly predecessorId: string;
    readonly successorId: string;
    readonly lagDays: number;
  }) => Promise<TaskDependency | null>;
  readonly onDeleteDependency: (dependencyId: string) => Promise<boolean>;
  readonly onDuplicateTask: (taskId: string, includeDescendants: boolean) => Promise<Task | null>;
  readonly onCreateTemplate: (input: {
    readonly rootTaskId: string;
    readonly name: string;
    readonly description: string | null;
  }) => Promise<unknown>;
  readonly onSavePdf: (suggestedName: string, bytes: readonly number[]) => Promise<string | null>;
  readonly onCreateBaseline: (name: string) => Promise<ProjectBaseline | null>;
  readonly onDeleteBaselines: () => Promise<boolean>;
}

const VIEW_LABELS: Readonly<Record<ProjectView, string>> = {
  TABLE: "Tabela",
  KANBAN: "Kanban",
  GANTT: "Gantt",
};

export function ProjectViews({
  project,
  tasks,
  calendars,
  projectCalendarId,
  dependencies,
  conflicts,
  baselines,
  activeBaseline,
  activeBaselineTasks,
  disabled,
  onCreate,
  onSave,
  onMove,
  onDelete,
  onCreateDependency,
  onDeleteDependency,
  onDuplicateTask,
  onCreateTemplate,
  onSavePdf,
  onCreateBaseline,
  onDeleteBaselines,
}: ProjectViewsProps) {
  const [activeView, setActiveView] = useState<ProjectView>("TABLE");
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const filtersActive = hasActiveTaskFilters(filters);
  const matchingTasks = useMemo(() => filterTasks(tasks, filters), [filters, tasks]);
  const visibleTaskIds = useMemo(
    () => includeTaskAncestors(tasks, matchingTasks),
    [matchingTasks, tasks],
  );
  const ganttTasks = useMemo(
    () => tasks.filter((task) => visibleTaskIds.has(task.id)),
    [tasks, visibleTaskIds],
  );

  const moveTabFocus = (event: KeyboardEvent<HTMLButtonElement>, view: ProjectView): void => {
    const views = Object.keys(VIEW_LABELS) as ProjectView[];
    const currentIndex = views.indexOf(view);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % views.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + views.length) % views.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = views.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextView = views[nextIndex];
    if (nextView === undefined) return;
    setActiveView(nextView);
    document.getElementById(`view-tab-${nextView.toLocaleLowerCase()}`)?.focus();
  };

  return (
    <div className="project-views">
      <div className="view-command-bar">
        <div className="view-navigation">
          <div className="view-heading">
            <strong>Visualizações do projeto</strong>
            <span>As alterações são compartilhadas entre Tabela, Kanban e Gantt.</span>
          </div>
          <nav className="view-tabs" aria-label="Visualização do projeto" role="tablist">
            {(Object.keys(VIEW_LABELS) as ProjectView[]).map((view) => (
              <button
                key={view}
                type="button"
                role="tab"
                id={`view-tab-${view.toLocaleLowerCase()}`}
                aria-selected={activeView === view}
                aria-controls={`view-panel-${view.toLocaleLowerCase()}`}
                tabIndex={activeView === view ? 0 : -1}
                className={activeView === view ? "active" : ""}
                onClick={() => { setActiveView(view); }}
                onKeyDown={(event) => { moveTabFocus(event, view); }}
              >
                {VIEW_LABELS[view]}
              </button>
            ))}
          </nav>
        </div>
        <div className="view-command-actions">
          <ProjectBaselineControl
            tasks={tasks}
            baselines={baselines}
            activeBaseline={activeBaseline}
            activeBaselineTasks={activeBaselineTasks}
            disabled={disabled}
            onCreate={onCreateBaseline}
            onDelete={onDeleteBaselines}
          />
          <ProjectPdfExport
            project={project}
            tasks={tasks}
            dependencies={dependencies}
            calendars={calendars}
            baselineTasks={activeBaselineTasks}
            visibleTaskIds={visibleTaskIds}
            filtersActive={filtersActive}
            disabled={disabled || tasks.length === 0}
            onSave={onSavePdf}
          />
        </div>
      </div>

      <TaskFilterBar
        filters={filters}
        resultCount={matchingTasks.length}
        totalCount={tasks.length}
        onChange={setFilters}
      />

      <div
        id={`view-panel-${activeView.toLocaleLowerCase()}`}
        role="tabpanel"
        aria-labelledby={`view-tab-${activeView.toLocaleLowerCase()}`}
      >
        {activeView === "TABLE" ? (
          <TaskTable
            tasks={tasks}
            {...(filtersActive ? { visibleTaskIds } : {})}
            calendars={calendars}
            projectCalendarId={projectCalendarId}
            dependencies={dependencies}
            conflicts={conflicts}
            baselineTasks={activeBaselineTasks}
            disabled={disabled}
            onCreate={onCreate}
            onSave={(task, updates) => onSave(task, updates)}
            onMove={onMove}
            onDelete={onDelete}
            onCreateDependency={onCreateDependency}
            onDeleteDependency={onDeleteDependency}
            onDuplicate={onDuplicateTask}
            onCreateTemplate={onCreateTemplate}
          />
        ) : null}
        {activeView === "KANBAN" ? (
          <TaskKanban
            tasks={matchingTasks}
            allProjectTasks={tasks}
            dependencies={dependencies}
            disabled={disabled}
            onSave={onSave}
          />
        ) : null}
        {activeView === "GANTT" ? (
          <ViewErrorBoundary viewName="o gráfico de Gantt">
            <Suspense fallback={<div className="view-loading" role="status">Carregando o gráfico de Gantt…</div>}>
              <TaskGantt
                tasks={ganttTasks}
                allProjectTasks={tasks}
                calendars={calendars}
                projectCalendarId={projectCalendarId}
                dependencies={dependencies}
                baselineTasks={activeBaselineTasks}
                disabled={disabled}
                onSave={onSave}
                onCreateDependency={onCreateDependency}
                onDeleteDependency={onDeleteDependency}
              />
            </Suspense>
          </ViewErrorBoundary>
        ) : null}
      </div>
    </div>
  );
}
