import { useCallback, useEffect, useMemo, useState } from "react";

import chronoMark from "../assets/chrono-mark.png";
import { ProjectHeader } from "../features/projects/ProjectHeader";
import { ProjectBaselineControl } from "../features/planning/ProjectBaselineControl";
import { CriticalPathControl } from "../features/planning/CriticalPathControl";
import { ProjectPdfExport } from "../features/reporting/ProjectPdfExport";
import { ProjectActionsMenu } from "../features/projects/ProjectActionsMenu";
import { CalendarSettings } from "../features/projects/CalendarSettings";
import { ProjectSidebar } from "../features/projects/ProjectSidebar";
import { ProjectViewRail, ProjectViews } from "../features/views/ProjectViews";
import type { ProjectView } from "../features/views/project-view";
import { ProjectViewMenu } from "../features/views/ProjectViewMenu";
import { TemplateLibrary } from "../features/templates/TemplateLibrary";
import { PortabilityPanel } from "../features/import-export/PortabilityPanel";
import { safeFilename } from "../features/import-export/safe-filename";
import { TauriWorkspaceRepository } from "../repositories/tauri-workspace-repository";
import type { WorkspaceRepository } from "../repositories/workspace-repository";
import { useWorkspace } from "../state/use-workspace";
import "./App.css";
import { scheduleYears } from "../domain/calendars/official-holidays";
import { WorkspaceHelpMenu } from "../components/WorkspaceHelpMenu";
import { LanguageMenu } from "../components/LanguageMenu";
import { WorkspaceMenuBar } from "../components/WorkspaceMenuBar";
import { TextContextMenu } from "../components/TextContextMenu";
import { ModalDialog } from "../components/ModalDialog";
import { LanguageProvider, useLanguage } from "../i18n/language";
import type { Task } from "../domain/tasks/task";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "../domain/tasks/task";
import { collectTaskTreeIds } from "../domain/tasks/hierarchy";
import type { TaskDependency } from "../domain/scheduling/dependency";
import type { TaskSaveResult } from "../domain/tasks/task-save";
import { analyzeCriticalPath, type CriticalPathAnalysis } from "../domain/scheduling/critical-path";
import {
  EMPTY_TASK_FILTERS,
  filterTasks,
  hasActiveTaskFilters,
  includeTaskAncestors,
  type TaskFilters,
} from "../features/views/task-filters";

interface AppProps {
  readonly repository?: WorkspaceRepository;
}

interface TaskStatusReviewRequest {
  readonly kind: "COMPLETE" | "REOPEN";
  readonly task: Task;
  readonly dependencyUpdates: readonly TaskDependency[];
  readonly resolve: (result: TaskSaveResult) => void;
}

function localTodayDate(): string {
  const today = new Date();
  return `${String(today.getFullYear())}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function displayReviewDate(value: string | null, english: boolean): string {
  if (value === null) return english ? "Not provided" : "Não informada";
  const [year, month, day] = value.split("-");
  return `${day ?? ""}/${month ?? ""}/${year ?? ""}`;
}

function suggestedReopenProgress(task: Task): number {
  if (task.status === "NOT_STARTED") return 0;
  if (task.status === "CANCELLED") return 100;
  return 99;
}

function AppContent({ repository }: AppProps) {
  const { language, priorityLabel, statusLabel, t } = useLanguage();
  const english = language === "en";
  const activeRepository = useMemo(() => repository ?? new TauriWorkspaceRepository(), [repository]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ProjectView>("TABLE");
  const [taskFilters, setTaskFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const [completionRequest, setCompletionRequest] = useState<TaskStatusReviewRequest | null>(null);
  const [completionConfirming, setCompletionConfirming] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState(localTodayDate);
  const [reopenProgress, setReopenProgress] = useState("99");
  const [criticalPathHelpOpen, setCriticalPathHelpOpen] = useState(false);
  const workspace = useWorkspace(activeRepository);
  const saveWorkspaceTask = workspace.saveTask;
  const selectedProjectTasks = workspace.selectedProjectTasks;
  const undoTaskEdit = workspace.undoTaskEdit;
  const redoTaskEdit = workspace.redoTaskEdit;
  const projectPeers = workspace.selectedProject === null
    ? []
    : workspace.projects
        .filter((project) => project.isArchived === workspace.selectedProject?.isArchived)
        .sort(
          (left, right) =>
            left.position - right.position || left.createdAt.localeCompare(right.createdAt),
        );
  const selectedProjectIndex = projectPeers.findIndex(
    (project) => project.id === workspace.selectedProjectId,
  );
  const selectedCalendar = workspace.calendars.find(
    (calendar) => calendar.id === workspace.selectedProject?.calendarId,
  );
  const projectTargetEndDate = useMemo(
    () => workspace.selectedProjectTasks.reduce<string | null>((latest, task) => {
      if (task.status === "CANCELLED" || task.deadlineDate === null) return latest;
      return latest === null || task.deadlineDate > latest ? task.deadlineDate : latest;
    }, null),
    [workspace.selectedProjectTasks],
  );
  const criticalPath = useMemo((): CriticalPathAnalysis => {
    if (workspace.selectedProject?.criticalPathEnabled !== true) {
      return {
        available: false,
        reason: english ? "Enable critical path in the project settings." : "Ative o caminho crítico nas configurações do projeto.",
        projectEndDate: null,
        targetEndDate: projectTargetEndDate,
        projectTargetSlackDays: null,
        tasks: [],
      };
    }
    return analyzeCriticalPath({
      tasks: workspace.selectedProjectTasks,
      dependencies: workspace.selectedProjectDependencies,
      calendars: workspace.calendars,
      projectCalendarId: workspace.selectedProject.calendarId,
      targetEndDate: projectTargetEndDate,
    });
  }, [english, projectTargetEndDate, workspace.calendars, workspace.selectedProject, workspace.selectedProjectDependencies, workspace.selectedProjectTasks]);
  const criticalityByTaskId = useMemo(
    () => new Map(criticalPath.tasks.map((entry) => [entry.taskId, entry])),
    [criticalPath],
  );
  const effectiveTaskFilters = useMemo<TaskFilters>(
    () => criticalPath.available || taskFilters.criticality === "ALL"
      ? taskFilters
      : { ...taskFilters, criticality: "ALL" },
    [criticalPath.available, taskFilters],
  );
  const filtersActive = hasActiveTaskFilters(effectiveTaskFilters);
  const changeActiveView = (view: ProjectView): void => {
    setActiveView(view);
  };
  const matchingTasks = useMemo(
    () => filterTasks(workspace.selectedProjectTasks, effectiveTaskFilters, criticalityByTaskId),
    [criticalityByTaskId, effectiveTaskFilters, workspace.selectedProjectTasks],
  );
  const visibleTaskIds = useMemo(
    () => includeTaskAncestors(workspace.selectedProjectTasks, matchingTasks),
    [matchingTasks, workspace.selectedProjectTasks],
  );
  const openCompletionDescendants = useMemo(() => {
    if (completionRequest?.kind !== "COMPLETE") return [];
    const treeIds = collectTaskTreeIds(workspace.selectedProjectTasks, completionRequest.task.id);
    return workspace.selectedProjectTasks.filter(
      (task) =>
        task.id !== completionRequest.task.id &&
        treeIds.has(task.id) &&
        task.status !== "COMPLETED" &&
        task.status !== "CANCELLED",
    );
  }, [completionRequest, workspace.selectedProjectTasks]);

  const saveTaskWithCompletionReview = useCallback((
    task: Task,
    dependencyUpdates: readonly TaskDependency[] = [],
  ): Promise<TaskSaveResult> => {
    const currentTask = selectedProjectTasks.find((candidate) => candidate.id === task.id);
    const isCompleting = task.status === "COMPLETED" && currentTask?.status !== "COMPLETED";
    const isReopening = task.status !== "COMPLETED" && currentTask?.status === "COMPLETED";
    if (!isCompleting && !isReopening) {
      return saveWorkspaceTask(task, dependencyUpdates);
    }

    setCompletionError(null);
    if (isCompleting) setCompletionDate(localTodayDate());
    if (isReopening) setReopenProgress(String(suggestedReopenProgress(task)));
    return new Promise<TaskSaveResult>((resolve) => {
      setCompletionRequest({
        kind: isCompleting ? "COMPLETE" : "REOPEN",
        task,
        dependencyUpdates,
        resolve,
      });
    });
  }, [saveWorkspaceTask, selectedProjectTasks]);

  const cancelCompletion = (): void => {
    if (completionRequest === null || completionConfirming) return;
    completionRequest.resolve("CANCELLED");
    setCompletionRequest(null);
    setCompletionError(null);
  };

  const confirmCompletion = async (): Promise<void> => {
    const request = completionRequest;
    if (request === null || completionConfirming) return;
    if (request.kind === "COMPLETE") {
      if (openCompletionDescendants.length > 0) return;
      if (
        completionDate.length === 0 ||
        completionDate > localTodayDate() ||
        (request.task.startDate !== null && completionDate < request.task.startDate)
      ) {
        setCompletionError(english ? "Enter a valid completion date between the start date and today." : "Informe uma data de conclusão válida, entre a data de início e hoje.");
        return;
      }
    }
    const parsedReopenProgress = Number(reopenProgress);
    if (
      request.kind === "REOPEN" &&
      (!Number.isInteger(parsedReopenProgress) ||
        parsedReopenProgress < 0 ||
        parsedReopenProgress > (request.task.status === "CANCELLED" ? 100 : 99))
    ) {
      setCompletionError(english ? "When reopening, enter a whole-number progress between 0% and 99%." : "Ao reabrir, informe um progresso inteiro entre 0% e 99%.");
      return;
    }
    setCompletionConfirming(true);
    setCompletionError(null);
    try {
      const saved = await workspace.saveTask(
        request.kind === "COMPLETE"
          ? { ...request.task, status: "COMPLETED", progress: 100, completedDate: completionDate }
          : { ...request.task, progress: parsedReopenProgress, completedDate: null },
        request.dependencyUpdates,
      );
      if (!saved) {
        setCompletionError(english ? "The change could not be saved. Review the message shown in the app and try again." : "Não foi possível salvar a alteração. Revise a mensagem exibida no aplicativo e tente novamente.");
        return;
      }
      request.resolve(true);
      setCompletionRequest(null);
    } catch {
      setCompletionError(english ? "The change could not be saved. Try again." : "Não foi possível salvar a alteração. Tente novamente.");
    } finally {
      setCompletionConfirming(false);
    }
  };

  useEffect(() => {
    const hasNativeTextUndo = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
      if (!(target instanceof HTMLInputElement)) return false;
      return target.type !== "checkbox" && target.type !== "radio" && target.type !== "button";
    };
    const handleTaskHistoryShortcut = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (hasNativeTextUndo(event.target)) return;
      const key = event.key.toLocaleLowerCase();
      const undo = key === "z" && !event.shiftKey;
      const redo = key === "z" && event.shiftKey;
      if (!undo && !redo) return;
      event.preventDefault();
      event.stopPropagation();
      void (undo ? undoTaskEdit() : redoTaskEdit());
    };
    window.addEventListener("keydown", handleTaskHistoryShortcut, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleTaskHistoryShortcut, { capture: true });
    };
  }, [redoTaskEdit, undoTaskEdit]);

  return (
    <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <TextContextMenu />
      <a className="skip-link" href="#workspace-content">{t("app.skipToContent")}</a>
      <WorkspaceMenuBar
        sidebarCollapsed={sidebarCollapsed}
        canGoBack={selectedProjectIndex > 0}
        canGoForward={selectedProjectIndex >= 0 && selectedProjectIndex < projectPeers.length - 1}
        onToggleSidebar={() => { setSidebarCollapsed((current) => !current); }}
        onGoBack={() => {
          const project = projectPeers[selectedProjectIndex - 1];
          if (project !== undefined) workspace.selectProject(project.id);
        }}
        onGoForward={() => {
          const project = projectPeers[selectedProjectIndex + 1];
          if (project !== undefined) workspace.selectProject(project.id);
        }}
      >
        <PortabilityPanel
          repository={activeRepository}
          selectedProject={workspace.selectedProject}
          disabled={workspace.isSaving}
          onWorkspaceChanged={workspace.reloadWorkspace}
        />
        {workspace.selectedProject === null ? null : (
          <>
            <ProjectActionsMenu
              project={workspace.selectedProject}
              disabled={workspace.isSaving}
              canMoveUp={selectedProjectIndex > 0}
              canMoveDown={selectedProjectIndex >= 0 && selectedProjectIndex < projectPeers.length - 1}
              canUndo={workspace.canUndoTaskEdit}
              canRedo={workspace.canRedoTaskEdit}
              undoLabel={workspace.undoTaskEditLabel}
              redoLabel={workspace.redoTaskEditLabel}
              historyEntries={workspace.taskEditHistoryEntries}
              onUndo={workspace.undoTaskEdit}
              onRedo={workspace.redoTaskEdit}
              onSave={workspace.saveProject}
              onMove={workspace.moveProject}
              onDelete={workspace.removeProject}
              onDuplicate={workspace.duplicateProject}
            />
            <ProjectViewMenu activeView={activeView} onChange={changeActiveView} />
            {selectedCalendar === undefined ? null : (
              <CalendarSettings
                key={selectedCalendar.updatedAt}
                calendar={selectedCalendar}
                disabled={workspace.isSaving || workspace.selectedProject.isArchived}
                usedYears={scheduleYears(workspace.selectedProjectTasks)}
                onSave={workspace.saveCalendar}
              />
            )}
            <TemplateLibrary
              templates={workspace.templates}
              items={workspace.templateItems}
              projectName={workspace.selectedProject.name}
              disabled={workspace.isSaving || workspace.selectedProject.isArchived}
              onApply={workspace.applyTemplate}
              onDelete={workspace.removeTemplate}
            />
          </>
        )}
        <LanguageMenu />
        <WorkspaceHelpMenu />
      </WorkspaceMenuBar>
      <ProjectViewRail
        activeView={activeView}
        disabled={workspace.selectedProject === null || workspace.isLoading}
        onViewChange={changeActiveView}
      />
      <ProjectSidebar
        collapsed={sidebarCollapsed}
        projects={workspace.projects}
        selectedProjectId={workspace.selectedProjectId}
        disabled={workspace.isLoading || workspace.isSaving}
        onSelect={workspace.selectProject}
        onCreate={workspace.createProject}
        onArchive={workspace.saveProject}
        onExport={async (project) => {
          const result = await activeRepository.exportProject(project.id, safeFilename(project.name));
          return result?.path ?? null;
        }}
        onDelete={workspace.removeProject}
      />

      <main className="workspace-main" id="workspace-content" tabIndex={-1}>
        {workspace.error !== null ? (
          <div className="error-banner" role="alert">
            <span>{english ? "A local operation could not be completed. Review the current data and try again." : workspace.error}</span>
            <button type="button" aria-label={t("app.closeError")} onClick={workspace.clearError}>{t("app.close")}</button>
          </div>
        ) : null}

        {workspace.isLoading ? (
          <section className="center-state" aria-live="polite">
            <div className="loading-indicator" aria-hidden="true" />
            <h1>{t("app.loading")}</h1>
            <p>{t("app.localData")}</p>
          </section>
        ) : workspace.selectedProject === null ? (
          <>
            <section className="center-state">
              <img className="empty-illustration" src={chronoMark} alt="" />
              <h1>{t("app.emptyTitle")}</h1>
              <p>{t("app.emptyDescription")}</p>
            </section>
          </>
        ) : (
          <div className="project-workspace">
            <ProjectHeader
              key={`${workspace.selectedProject.id}-${workspace.selectedProject.updatedAt}`}
              project={workspace.selectedProject}
              taskCount={workspace.selectedProjectTasks.length}
              disabled={workspace.isSaving}
              tools={(
                <div className="project-header-tools">
                  <ProjectBaselineControl
                    tasks={workspace.selectedProjectTasks}
                    baselines={workspace.selectedProjectBaselines}
                    activeBaseline={workspace.activeBaseline}
                    activeBaselineTasks={workspace.activeBaselineTasks}
                    disabled={workspace.isSaving || workspace.selectedProject.isArchived}
                    onCreate={workspace.createBaseline}
                    onDelete={workspace.removeProjectBaselines}
                  />
                  <CriticalPathControl
                    project={workspace.selectedProject}
                    targetEndDate={projectTargetEndDate}
                    analysis={criticalPath}
                    open={criticalPathHelpOpen}
                    disabled={workspace.isSaving || workspace.selectedProject.isArchived}
                    onOpenChange={setCriticalPathHelpOpen}
                    onSave={workspace.saveProject}
                  />
                  <ProjectPdfExport
                    project={workspace.selectedProject}
                    tasks={workspace.selectedProjectTasks}
                    dependencies={workspace.selectedProjectDependencies}
                    calendars={workspace.calendars}
                    baselineTasks={workspace.activeBaselineTasks}
                    criticalPath={criticalPath}
                    visibleTaskIds={visibleTaskIds}
                    filtersActive={filtersActive}
                    disabled={workspace.isSaving || workspace.selectedProjectTasks.length === 0}
                    onSave={async (suggestedName, bytes) => {
                      const result = await activeRepository.savePdfReport(suggestedName, bytes);
                      return result?.path ?? null;
                    }}
                  />
                </div>
              )}
              onSave={workspace.saveProject}
            />
            <ProjectViews
              activeView={activeView}
              project={workspace.selectedProject}
              tasks={workspace.selectedProjectTasks}
              calendars={workspace.calendars}
              projectCalendarId={workspace.selectedProject.calendarId}
              dependencies={workspace.selectedProjectDependencies}
              conflicts={workspace.schedulingConflicts.filter((conflict) =>
                workspace.selectedProjectTasks.some((task) => task.id === conflict.taskId),
              )}
              activeBaselineTasks={workspace.activeBaselineTasks}
              criticalPath={criticalPath}
              filters={effectiveTaskFilters}
              filtersActive={filtersActive}
              matchingTasks={matchingTasks}
              visibleTaskIds={visibleTaskIds}
              disabled={workspace.isSaving || workspace.selectedProject.isArchived}
              onFiltersChange={setTaskFilters}
              onCreate={workspace.createTask}
              onSave={saveTaskWithCompletionReview}
              onSetSchedulingMode={workspace.setTasksSchedulingMode}
              canUndoTaskEdit={workspace.canUndoTaskEdit}
              canRedoTaskEdit={workspace.canRedoTaskEdit}
              onUndoTaskEdit={workspace.undoTaskEdit}
              onRedoTaskEdit={workspace.redoTaskEdit}
              onMove={workspace.moveTask}
              onDelete={workspace.removeTaskTree}
              onCreateDependency={workspace.createDependency}
              onCreateDependencies={workspace.createDependencies}
              onSaveDependencies={workspace.saveDependencies}
              onDeleteDependency={workspace.removeDependency}
              onDeleteDependencies={workspace.removeDependencies}
              onDuplicateTask={workspace.duplicateTask}
              onCreateTemplate={workspace.createTemplate}
            />
          </div>
        )}

        {workspace.isSaving ? <div className="saving-toast" role="status">{t("app.saving")}</div> : null}
      </main>
      {completionRequest === null ? null : (
        <ModalDialog
          className="template-dialog completion-review-dialog"
          labelledBy="completion-review-title"
          describedBy="completion-review-description"
          role="alertdialog"
          closeDisabled={completionConfirming}
          onClose={cancelCompletion}
        >
          <div>
            <h2 id="completion-review-title">
              {completionRequest.kind === "COMPLETE"
                ? (english ? "Confirm completion" : "Confirmar conclusão")
                : completionRequest.task.status === "CANCELLED"
                  ? (english ? "Change completed task" : "Alterar atividade concluída")
                  : (english ? "Reopen task" : "Reabrir atividade")}
            </h2>
            <p id="completion-review-description">
              {completionRequest.kind === "COMPLETE"
                ? (english ? "Review the information already entered. Completion will be recorded on the selected date and progress will become 100%." : "Revise as informações já preenchidas. A conclusão ficará registrada na data informada e o progresso será elevado para 100%.")
                : english
                  ? `Confirm the change to ${statusLabel(completionRequest.task.status)}. The completion date will be removed${completionRequest.task.status === "CANCELLED" ? "." : " and progress must return to less than 100%."}`
                  : `Confirme a mudança para ${TASK_STATUS_LABELS[completionRequest.task.status]}. A data de conclusão será removida${completionRequest.task.status === "CANCELLED" ? "." : " e o progresso deve voltar para menos de 100%."}`}
            </p>
          </div>
          <dl className="completion-review-data">
            <div className="completion-review-title-row"><dt>{english ? "Task" : "Atividade"}</dt><dd>{completionRequest.task.title}</dd></div>
            <div><dt>{english ? "Priority" : "Prioridade"}</dt><dd>{english ? priorityLabel(completionRequest.task.priority) : TASK_PRIORITY_LABELS[completionRequest.task.priority]}</dd></div>
            <div><dt>{english ? "Start" : "Início"}</dt><dd>{displayReviewDate(completionRequest.task.startDate, english)}</dd></div>
            <div><dt>{english ? "Finish" : "Fim"}</dt><dd>{displayReviewDate(completionRequest.task.endDate, english)}</dd></div>
            <div><dt>{english ? "Duration" : "Duração"}</dt><dd>{completionRequest.task.durationDays === null ? (english ? "Not provided" : "Não informada") : `${String(completionRequest.task.durationDays)} ${english ? (completionRequest.task.durationDays === 1 ? "working day" : "working days") : `dia${completionRequest.task.durationDays === 1 ? "" : "s"} útil${completionRequest.task.durationDays === 1 ? "" : "eis"}`}`}</dd></div>
            <div><dt>{english ? "Deadline" : "Prazo-limite"}</dt><dd>{displayReviewDate(completionRequest.task.deadlineDate, english)}</dd></div>
            <div><dt>{english ? "Current progress" : "Progresso atual"}</dt><dd>{String(completionRequest.task.progress)}%</dd></div>
            <div><dt>{english ? "Assignee" : "Responsável"}</dt><dd>{completionRequest.task.assignee ?? (english ? "Unassigned" : "Não informado")}</dd></div>
          </dl>
          {completionRequest.kind === "COMPLETE" ? (
            <label className="completion-review-field" htmlFor="completion-date">
              <span>{english ? "Actual completion date" : "Data real da conclusão"}</span>
              <input
                id="completion-date"
                aria-label={english ? "Actual completion date" : "Data real da conclusão"}
                type="date"
                required
                max={localTodayDate()}
                value={completionDate}
                disabled={completionConfirming || openCompletionDescendants.length > 0}
                onChange={(event) => { setCompletionDate(event.target.value); }}
              />
            </label>
          ) : (
            <label className="completion-review-field" htmlFor="reopen-progress">
              <span>{english ? "Progress when reopening" : "Progresso ao reabrir"}</span>
              <span className="completion-progress-input">
                <input
                  id="reopen-progress"
                  aria-label={english ? "Progress when reopening" : "Progresso ao reabrir"}
                  type="number"
                  min={0}
                  max={completionRequest.task.status === "CANCELLED" ? 100 : 99}
                  step={1}
                  required
                  value={reopenProgress}
                  disabled={completionConfirming}
                  onChange={(event) => { setReopenProgress(event.target.value); }}
                />
                <span aria-hidden="true">%</span>
              </span>
            </label>
          )}
          {openCompletionDescendants.length === 0 ? null : (
            <div className="completion-blocked-message" role="alert">
              <strong>{english ? "Complete open subtasks first." : "Conclua primeiro as subtarefas abertas."}</strong>
              <span>
                {String(openCompletionDescendants.length)} subtarefa{openCompletionDescendants.length === 1 ? " permanece" : "s permanecem"} aberta{openCompletionDescendants.length === 1 ? "" : "s"}.
              </span>
              <ul>
                {openCompletionDescendants.slice(0, 4).map((task) => <li key={task.id}>{task.title}</li>)}
              </ul>
            </div>
          )}
          {completionError === null ? null : <p className="field-error" role="alert">{completionError}</p>}
          <div className="dialog-actions">
            <button type="button" disabled={completionConfirming} onClick={cancelCompletion}>{t("app.cancel")}</button>
            <button
              className="primary-button"
              type="button"
              data-dialog-initial-focus
              disabled={completionConfirming || openCompletionDescendants.length > 0}
              onClick={() => { void confirmCompletion(); }}
            >
              {completionConfirming
                ? (english ? "Saving…" : "Salvando…")
                : completionRequest.kind === "COMPLETE"
                  ? (english ? "Confirm completion" : "Confirmar conclusão")
                  : completionRequest.task.status === "CANCELLED"
                    ? (english ? "Confirm change" : "Confirmar alteração")
                    : (english ? "Confirm reopening" : "Confirmar reabertura")}
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

function App({ repository }: AppProps) {
  return (
    <LanguageProvider>
      {repository === undefined ? <AppContent /> : <AppContent repository={repository} />}
    </LanguageProvider>
  );
}

export default App;
