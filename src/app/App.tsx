import { useMemo, useState } from "react";

import chronoMark from "../assets/chrono-mark.png";
import { ProjectHeader } from "../features/projects/ProjectHeader";
import { ProjectActionsMenu } from "../features/projects/ProjectActionsMenu";
import { CalendarSettings } from "../features/projects/CalendarSettings";
import { ProjectSidebar } from "../features/projects/ProjectSidebar";
import { ProjectViews } from "../features/views/ProjectViews";
import { TemplateLibrary } from "../features/templates/TemplateLibrary";
import { PortabilityPanel } from "../features/import-export/PortabilityPanel";
import { safeFilename } from "../features/import-export/safe-filename";
import { TauriWorkspaceRepository } from "../repositories/tauri-workspace-repository";
import type { WorkspaceRepository } from "../repositories/workspace-repository";
import { useWorkspace } from "../state/use-workspace";
import "./App.css";
import { scheduleYears } from "../domain/calendars/official-holidays";
import { WorkspaceHelpMenu } from "../components/WorkspaceHelpMenu";
import { WorkspaceMenuBar } from "../components/WorkspaceMenuBar";
import { TextContextMenu } from "../components/TextContextMenu";
import { ModalDialog } from "../components/ModalDialog";
import type { Task } from "../domain/tasks/task";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "../domain/tasks/task";
import { collectTaskTreeIds } from "../domain/tasks/hierarchy";
import type { TaskDependency } from "../domain/scheduling/dependency";
import type { TaskSaveResult } from "../domain/tasks/task-save";

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

function displayReviewDate(value: string | null): string {
  if (value === null) return "Não informada";
  const [year, month, day] = value.split("-");
  return `${day ?? ""}/${month ?? ""}/${year ?? ""}`;
}

function suggestedReopenProgress(task: Task): number {
  if (task.status === "NOT_STARTED") return 0;
  if (task.status === "CANCELLED") return 100;
  return 99;
}

function App({ repository }: AppProps) {
  const activeRepository = useMemo(() => repository ?? new TauriWorkspaceRepository(), [repository]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [completionRequest, setCompletionRequest] = useState<TaskStatusReviewRequest | null>(null);
  const [completionConfirming, setCompletionConfirming] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState(localTodayDate);
  const [reopenProgress, setReopenProgress] = useState("99");
  const workspace = useWorkspace(activeRepository);
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

  const saveTaskWithCompletionReview = (
    task: Task,
    dependencyUpdates: readonly TaskDependency[] = [],
  ): Promise<TaskSaveResult> => {
    const currentTask = workspace.selectedProjectTasks.find((candidate) => candidate.id === task.id);
    const isCompleting = task.status === "COMPLETED" && currentTask?.status !== "COMPLETED";
    const isReopening = task.status !== "COMPLETED" && currentTask?.status === "COMPLETED";
    if (!isCompleting && !isReopening) {
      return workspace.saveTask(task, dependencyUpdates);
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
  };

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
        setCompletionError("Informe uma data de conclusão válida, entre a data de início e hoje.");
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
      setCompletionError("Ao reabrir, informe um progresso inteiro entre 0% e 99%.");
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
        setCompletionError("Não foi possível salvar a alteração. Revise a mensagem exibida no aplicativo e tente novamente.");
        return;
      }
      request.resolve(true);
      setCompletionRequest(null);
    } catch {
      setCompletionError("Não foi possível salvar a alteração. Tente novamente.");
    } finally {
      setCompletionConfirming(false);
    }
  };

  return (
    <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <TextContextMenu />
      <a className="skip-link" href="#workspace-content">Ir para o conteúdo principal</a>
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
        onToggle={() => { setSidebarCollapsed((current) => !current); }}
      />

      <main className="workspace-main" id="workspace-content" tabIndex={-1}>
        {workspace.error !== null ? (
          <div className="error-banner" role="alert">
            <span>{workspace.error}</span>
            <button type="button" aria-label="Fechar mensagem de erro" onClick={workspace.clearError}>Fechar</button>
          </div>
        ) : null}

        {workspace.isLoading ? (
          <section className="center-state" aria-live="polite">
            <div className="loading-indicator" aria-hidden="true" />
            <h1>Carregando seu workspace…</h1>
            <p>Os dados permanecem neste computador.</p>
          </section>
        ) : workspace.selectedProject === null ? (
          <>
            <WorkspaceMenuBar>
              <PortabilityPanel
                repository={activeRepository}
                selectedProject={null}
                disabled={workspace.isSaving}
                onWorkspaceChanged={workspace.reloadWorkspace}
              />
              <WorkspaceHelpMenu />
            </WorkspaceMenuBar>
            <section className="center-state">
              <img className="empty-illustration" src={chronoMark} alt="" />
              <h1>Organize seu primeiro projeto</h1>
              <p>Use o botão “+” ao lado de Projetos para criar um espaço de planejamento.</p>
            </section>
          </>
        ) : (
          <div className="project-workspace">
            <WorkspaceMenuBar>
              <PortabilityPanel
                repository={activeRepository}
                selectedProject={workspace.selectedProject}
                disabled={workspace.isSaving}
                onWorkspaceChanged={workspace.reloadWorkspace}
              />
              <ProjectActionsMenu
                project={workspace.selectedProject}
                disabled={workspace.isSaving}
                canMoveUp={selectedProjectIndex > 0}
                canMoveDown={selectedProjectIndex >= 0 && selectedProjectIndex < projectPeers.length - 1}
                onSave={workspace.saveProject}
                onMove={workspace.moveProject}
                onDelete={workspace.removeProject}
                onDuplicate={workspace.duplicateProject}
              />
              {selectedCalendar !== undefined ? (
                <CalendarSettings
                  key={selectedCalendar.updatedAt}
                  calendar={selectedCalendar}
                  disabled={workspace.isSaving || workspace.selectedProject.isArchived}
                  usedYears={scheduleYears(workspace.selectedProjectTasks)}
                  onSave={workspace.saveCalendar}
                />
              ) : null}
              <TemplateLibrary
                templates={workspace.templates}
                items={workspace.templateItems}
                projectName={workspace.selectedProject.name}
                disabled={workspace.isSaving || workspace.selectedProject.isArchived}
                onApply={workspace.applyTemplate}
                onDelete={workspace.removeTemplate}
              />
              <WorkspaceHelpMenu />
            </WorkspaceMenuBar>
            <ProjectHeader
              key={`${workspace.selectedProject.id}-${workspace.selectedProject.updatedAt}`}
              project={workspace.selectedProject}
              taskCount={workspace.selectedProjectTasks.length}
              disabled={workspace.isSaving}
              onSave={workspace.saveProject}
            />
            <ProjectViews
              project={workspace.selectedProject}
              tasks={workspace.selectedProjectTasks}
              calendars={workspace.calendars}
              projectCalendarId={workspace.selectedProject.calendarId}
              dependencies={workspace.selectedProjectDependencies}
              conflicts={workspace.schedulingConflicts.filter((conflict) =>
                workspace.selectedProjectTasks.some((task) => task.id === conflict.taskId),
              )}
              baselines={workspace.selectedProjectBaselines}
              activeBaseline={workspace.activeBaseline}
              activeBaselineTasks={workspace.activeBaselineTasks}
              disabled={workspace.isSaving || workspace.selectedProject.isArchived}
              onCreate={workspace.createTask}
              onSave={saveTaskWithCompletionReview}
              onSetSchedulingMode={workspace.setTasksSchedulingMode}
              onLoadGanttHistory={workspace.loadGanttHistory}
              onSaveGanttHistory={workspace.saveGanttHistory}
              onMove={workspace.moveTask}
              onDelete={workspace.removeTaskTree}
              onCreateDependency={workspace.createDependency}
              onDeleteDependency={workspace.removeDependency}
              onDuplicateTask={workspace.duplicateTask}
              onCreateTemplate={workspace.createTemplate}
              onCreateBaseline={workspace.createBaseline}
              onDeleteBaselines={workspace.removeProjectBaselines}
              onSavePdf={async (suggestedName, bytes) => {
                const result = await activeRepository.savePdfReport(suggestedName, bytes);
                return result?.path ?? null;
              }}
            />
          </div>
        )}

        {workspace.isSaving ? <div className="saving-toast" role="status">Salvando no dispositivo…</div> : null}
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
                ? "Confirmar conclusão"
                : completionRequest.task.status === "CANCELLED"
                  ? "Alterar atividade concluída"
                  : "Reabrir atividade"}
            </h2>
            <p id="completion-review-description">
              {completionRequest.kind === "COMPLETE"
                ? "Revise as informações já preenchidas. A conclusão ficará registrada na data informada e o progresso será elevado para 100%."
                : `Confirme a mudança para ${TASK_STATUS_LABELS[completionRequest.task.status]}. A data de conclusão será removida${completionRequest.task.status === "CANCELLED" ? "." : " e o progresso deve voltar para menos de 100%."}`}
            </p>
          </div>
          <dl className="completion-review-data">
            <div className="completion-review-title-row"><dt>Atividade</dt><dd>{completionRequest.task.title}</dd></div>
            <div><dt>Prioridade</dt><dd>{TASK_PRIORITY_LABELS[completionRequest.task.priority]}</dd></div>
            <div><dt>Início</dt><dd>{displayReviewDate(completionRequest.task.startDate)}</dd></div>
            <div><dt>Fim</dt><dd>{displayReviewDate(completionRequest.task.endDate)}</dd></div>
            <div><dt>Duração</dt><dd>{completionRequest.task.durationDays === null ? "Não informada" : `${String(completionRequest.task.durationDays)} dia${completionRequest.task.durationDays === 1 ? "" : "s"} útil${completionRequest.task.durationDays === 1 ? "" : "eis"}`}</dd></div>
            <div><dt>Prazo-limite</dt><dd>{displayReviewDate(completionRequest.task.deadlineDate)}</dd></div>
            <div><dt>Progresso atual</dt><dd>{String(completionRequest.task.progress)}%</dd></div>
            <div><dt>Responsável</dt><dd>{completionRequest.task.assignee ?? "Não informado"}</dd></div>
          </dl>
          {completionRequest.kind === "COMPLETE" ? (
            <label className="completion-review-field" htmlFor="completion-date">
              <span>Data real da conclusão</span>
              <input
                id="completion-date"
                aria-label="Data real da conclusão"
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
              <span>Progresso ao reabrir</span>
              <span className="completion-progress-input">
                <input
                  id="reopen-progress"
                  aria-label="Progresso ao reabrir"
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
              <strong>Conclua primeiro as subtarefas abertas.</strong>
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
            <button type="button" disabled={completionConfirming} onClick={cancelCompletion}>Cancelar</button>
            <button
              className="primary-button"
              type="button"
              data-dialog-initial-focus
              disabled={completionConfirming || openCompletionDescendants.length > 0}
              onClick={() => { void confirmCompletion(); }}
            >
              {completionConfirming
                ? "Salvando…"
                : completionRequest.kind === "COMPLETE"
                  ? "Confirmar conclusão"
                  : completionRequest.task.status === "CANCELLED"
                    ? "Confirmar alteração"
                    : "Confirmar reabertura"}
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

export default App;
