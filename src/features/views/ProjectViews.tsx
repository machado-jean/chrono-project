import { lazy, Suspense, useMemo, type KeyboardEvent, type ReactNode } from "react";

import type { Calendar } from "../../domain/calendars/calendar";
import type { Project } from "../../domain/projects/project";
import type { BaselineTask } from "../../domain/planning/baseline";
import type { TaskDependency } from "../../domain/scheduling/dependency";
import type { SchedulingConflict } from "../../domain/scheduling/scheduler";
import type { Task } from "../../domain/tasks/task";
import type { SchedulingMode } from "../../domain/tasks/task";
import type { TaskSaveResult } from "../../domain/tasks/task-save";
import type { GanttHistoryState } from "../../domain/history/gantt-history";
import { TaskKanban } from "../kanban/TaskKanban";
import { TaskTable } from "../table/TaskTable";
import { TaskFilterBar } from "./TaskFilterBar";
import { ViewErrorBoundary } from "./ViewErrorBoundary";
import { PROJECT_VIEW_LABELS, type ProjectView } from "./project-view";
import type { TaskFilters } from "./task-filters";

const TaskGantt = lazy(async () => {
  const module = await import("../gantt/TaskGantt");
  return { default: module.TaskGantt };
});

interface ProjectViewsProps {
  readonly activeView: ProjectView;
  readonly project: Project;
  readonly tasks: readonly Task[];
  readonly calendars: readonly Calendar[];
  readonly projectCalendarId: string;
  readonly dependencies: readonly TaskDependency[];
  readonly conflicts: readonly SchedulingConflict[];
  readonly activeBaselineTasks: readonly BaselineTask[];
  readonly filters: TaskFilters;
  readonly filtersActive: boolean;
  readonly matchingTasks: readonly Task[];
  readonly visibleTaskIds: ReadonlySet<string>;
  readonly disabled: boolean;
  readonly onFiltersChange: (filters: TaskFilters) => void;
  readonly onCreate: (input: { readonly title: string; readonly parentId: string | null; readonly parentDependencyPolicy?: "KEEP" | "TRANSFER" | "REMOVE" }) => Promise<Task | null>;
  readonly onSave: (
    task: Task,
    dependencyUpdates?: readonly TaskDependency[],
  ) => Promise<TaskSaveResult>;
  readonly onSetSchedulingMode: (taskIds: readonly string[], mode: SchedulingMode) => Promise<boolean>;
  readonly onLoadGanttHistory: (projectId: string) => Promise<GanttHistoryState>;
  readonly onSaveGanttHistory: (projectId: string, state: GanttHistoryState) => Promise<void>;
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
}

function ViewGlyph({ view }: { readonly view: ProjectView }): ReactNode {
  if (view === "TABLE") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3" width="15" height="14" rx="1" /><path d="M2.5 7.5h15M7.5 3v14" /></svg>;
  }
  if (view === "KANBAN") {
    return <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3" width="4" height="10" rx="1" /><rect x="8" y="3" width="4" height="14" rx="1" /><rect x="13.5" y="3" width="4" height="8" rx="1" /></svg>;
  }
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4v13h14M5.5 7h5M8 11h7M5.5 15h7" /><path d="M10.5 7l2.5 4M15 11l-2.5 4" /></svg>;
}

interface ProjectViewRailProps {
  readonly activeView: ProjectView;
  readonly disabled?: boolean;
  readonly onViewChange: (view: ProjectView) => void;
}

export function ProjectViewRail({ activeView, disabled = false, onViewChange }: ProjectViewRailProps) {
  const moveTabFocus = (event: KeyboardEvent<HTMLButtonElement>, view: ProjectView): void => {
    const views = Object.keys(PROJECT_VIEW_LABELS) as ProjectView[];
    const currentIndex = views.indexOf(view);
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (currentIndex + 1) % views.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + views.length) % views.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = views.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextView = views[nextIndex];
    if (nextView === undefined) return;
    onViewChange(nextView);
    document.getElementById(`view-tab-${nextView.toLocaleLowerCase()}`)?.focus();
  };

  return (
    <nav className="view-rail" aria-label="Visualização do projeto" role="tablist">
      {(Object.keys(PROJECT_VIEW_LABELS) as ProjectView[]).map((view) => (
        <button
          key={view}
          type="button"
          role="tab"
          id={`view-tab-${view.toLocaleLowerCase()}`}
          aria-label={PROJECT_VIEW_LABELS[view]}
          title={PROJECT_VIEW_LABELS[view]}
          aria-selected={activeView === view}
          aria-controls={`view-panel-${view.toLocaleLowerCase()}`}
          tabIndex={activeView === view ? 0 : -1}
          className={activeView === view ? "active" : ""}
          disabled={disabled}
          onClick={() => { onViewChange(view); }}
          onKeyDown={(event) => { moveTabFocus(event, view); }}
        >
          <ViewGlyph view={view} />
        </button>
      ))}
    </nav>
  );
}

export function ProjectViews({
  activeView,
  project,
  tasks,
  calendars,
  projectCalendarId,
  dependencies,
  conflicts,
  activeBaselineTasks,
  filters,
  filtersActive,
  matchingTasks,
  visibleTaskIds,
  disabled,
  onFiltersChange,
  onCreate,
  onSave,
  onSetSchedulingMode,
  onLoadGanttHistory,
  onSaveGanttHistory,
  onMove,
  onDelete,
  onCreateDependency,
  onDeleteDependency,
  onDuplicateTask,
  onCreateTemplate,
}: ProjectViewsProps) {
  const ganttTasks = useMemo(
    () => tasks.filter((task) => visibleTaskIds.has(task.id)),
    [tasks, visibleTaskIds],
  );

  return (
    <div className="project-views">
      <div className="view-workspace">
      <TaskFilterBar
        filters={filters}
        resultCount={matchingTasks.length}
        totalCount={tasks.length}
        onChange={onFiltersChange}
      />

      <div
        id={`view-panel-${activeView.toLocaleLowerCase()}`}
        role="tabpanel"
        aria-labelledby={`view-tab-${activeView.toLocaleLowerCase()}`}
      >
        {activeView === "TABLE" ? (
          <ViewErrorBoundary viewName="a tabela de tarefas">
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
              onSetSchedulingMode={onSetSchedulingMode}
              onMove={onMove}
              onDelete={onDelete}
              onCreateDependency={onCreateDependency}
              onDeleteDependency={onDeleteDependency}
              onDuplicate={onDuplicateTask}
              onCreateTemplate={onCreateTemplate}
            />
          </ViewErrorBoundary>
        ) : null}
        {activeView === "KANBAN" ? (
          <ViewErrorBoundary viewName="o quadro Kanban">
            <TaskKanban
              tasks={matchingTasks}
              allProjectTasks={tasks}
              dependencies={dependencies}
              disabled={disabled}
              onSave={onSave}
              onDuplicate={onDuplicateTask}
              onDelete={onDelete}
            />
          </ViewErrorBoundary>
        ) : null}
        {activeView === "GANTT" ? (
          <ViewErrorBoundary viewName="o gráfico de Gantt">
            <Suspense fallback={<div className="view-loading" role="status">Carregando o gráfico de Gantt…</div>}>
              <TaskGantt
                key={project.id}
                tasks={ganttTasks}
                allProjectTasks={tasks}
                calendars={calendars}
                projectCalendarId={projectCalendarId}
                dependencies={dependencies}
                baselineTasks={activeBaselineTasks}
                disabled={disabled}
                projectId={project.id}
                onSave={onSave}
                onLoadHistory={onLoadGanttHistory}
                onSaveHistory={onSaveGanttHistory}
                onCreateDependency={onCreateDependency}
                onDeleteDependency={onDeleteDependency}
              />
            </Suspense>
          </ViewErrorBoundary>
        ) : null}
      </div>
      </div>
    </div>
  );
}
