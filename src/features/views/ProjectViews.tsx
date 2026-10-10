import { lazy, Suspense, useMemo, type KeyboardEvent, type ReactNode } from "react";

import type { Calendar } from "../../domain/calendars/calendar";
import type { Project } from "../../domain/projects/project";
import type { BaselineTask } from "../../domain/planning/baseline";
import type { TaskDependency } from "../../domain/scheduling/dependency";
import type { SchedulingConflict } from "../../domain/scheduling/scheduler";
import type { CriticalPathAnalysis } from "../../domain/scheduling/critical-path";
import type { Task } from "../../domain/tasks/task";
import type { SchedulingMode } from "../../domain/tasks/task";
import type { TaskSaveResult } from "../../domain/tasks/task-save";
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
  readonly criticalPath: CriticalPathAnalysis;
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
  readonly canUndoTaskEdit: boolean;
  readonly canRedoTaskEdit: boolean;
  readonly onUndoTaskEdit: () => Promise<boolean>;
  readonly onRedoTaskEdit: () => Promise<boolean>;
  readonly onMove: (taskId: string, direction: "up" | "down") => Promise<boolean>;
  readonly onDelete: (taskId: string) => Promise<boolean>;
  readonly onCreateDependency: (input: {
    readonly predecessorId: string;
    readonly successorId: string;
    readonly lagDays: number;
  }) => Promise<TaskDependency | null>;
  readonly onCreateDependencies: (inputs: readonly {
    readonly predecessorId: string;
    readonly successorId: string;
    readonly lagDays: number;
  }[]) => Promise<readonly TaskDependency[] | null>;
  readonly onSaveDependencies: (dependencies: readonly TaskDependency[], historyLabel?: string) => Promise<boolean>;
  readonly onDeleteDependency: (dependencyId: string) => Promise<boolean>;
  readonly onDeleteDependencies: (dependencyIds: readonly string[], historyLabel?: string) => Promise<boolean>;
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
  criticalPath,
  filters,
  filtersActive,
  matchingTasks,
  visibleTaskIds,
  disabled,
  onFiltersChange,
  onCreate,
  onSave,
  onSetSchedulingMode,
  canUndoTaskEdit,
  canRedoTaskEdit,
  onUndoTaskEdit,
  onRedoTaskEdit,
  onMove,
  onDelete,
  onCreateDependency,
  onCreateDependencies,
  onSaveDependencies,
  onDeleteDependency,
  onDeleteDependencies,
  onDuplicateTask,
  onCreateTemplate,
}: ProjectViewsProps) {
  const ganttTasks = useMemo(
    () => tasks.filter((task) => visibleTaskIds.has(task.id)),
    [tasks, visibleTaskIds],
  );
  const assignees = useMemo(
    () => [...new Set(tasks.flatMap((task) => task.assignee === null ? [] : [task.assignee.trim()]))]
      .filter((assignee) => assignee.length > 0)
      .sort((left, right) => left.localeCompare(right, "pt-BR")),
    [tasks],
  );
  const criticalityByTaskId = useMemo(
    () => new Map(criticalPath.tasks.map((entry) => [entry.taskId, entry])),
    [criticalPath],
  );

  return (
    <div className="project-views">
      <div className="view-workspace">
      <TaskFilterBar
        filters={filters}
        resultCount={matchingTasks.length}
        totalCount={tasks.length}
        availableAssignees={assignees}
        criticalPathAvailable={criticalPath.available}
        onChange={onFiltersChange}
      />
      {filters.criticality === "ALL" ? null : (
        <div className={`critical-path-notice${criticalPath.available ? " available" : ""}`} role="status">
          {criticalPath.available
            ? filters.criticality === "CRITICAL"
              ? "Caminho crítico: sequência de tarefas com folga zero que controla o término previsto."
              : "Próximas do crítico: tarefas com apenas 1 ou 2 dias úteis de folga na rede."
            : criticalPath.reason}
        </div>
      )}

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
              criticalityByTaskId={criticalityByTaskId}
              disabled={disabled}
              onCreate={onCreate}
              onSave={(task, updates) => onSave(task, updates)}
              onSetSchedulingMode={onSetSchedulingMode}
              onMove={onMove}
              onDelete={onDelete}
              onCreateDependencies={onCreateDependencies}
              onSaveDependencies={onSaveDependencies}
              onDeleteDependency={onDeleteDependency}
              onDeleteDependencies={onDeleteDependencies}
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
                criticalityByTaskId={criticalityByTaskId}
                disabled={disabled}
                onSave={onSave}
                canUndo={canUndoTaskEdit}
                canRedo={canRedoTaskEdit}
                onUndo={onUndoTaskEdit}
                onRedo={onRedoTaskEdit}
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
