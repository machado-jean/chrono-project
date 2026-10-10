import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useEffect, type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import App from "../../../src/app/App";
import {
  CONTINUOUS_CALENDAR_ID,
  DEFAULT_CALENDAR_ID,
  type Calendar,
} from "../../../src/domain/calendars/calendar";
import type { Project } from "../../../src/domain/projects/project";
import type {
  BaselineBundle,
  BaselineTask,
  ProjectBaseline,
} from "../../../src/domain/planning/baseline";
import type { Task } from "../../../src/domain/tasks/task";
import type { TaskDependency } from "../../../src/domain/scheduling/dependency";
import type {
  TaskTemplate,
  TaskTemplateBundle,
  TaskTemplateDependency,
  TaskTemplateItem,
} from "../../../src/domain/templates/template";
import type {
  BackupResult,
  DuplicationBundle,
  ExportResult,
  ImportPackagePreview,
  ImportResult,
  ImportSelection,
  RestoreResult,
  ScheduleChangeSet,
  WorkspaceRepository,
  WorkspaceSnapshot,
} from "../../../src/repositories/workspace-repository";
import type { GanttHistoryState } from "../../../src/domain/history/gantt-history";

const ganttHarness = vi.hoisted(() => {
  let selectionListener: ((event: { readonly id: string }) => void) | null = null;
  let selectionTag: symbol | null = null;
  let scrollTop = 0;
  const interceptors = new Map<string, { listener: (event: unknown) => unknown; tag: symbol | null }>();
  const setScrollState = vi.fn((state: { readonly scrollTop?: number }) => {
    if (state.scrollTop !== undefined) scrollTop = state.scrollTop;
  });
  return {
    setScrollState,
    api: {
      exec: vi.fn((action: string, event?: { readonly top?: number }) => {
        if (action === "scroll-chart" && event?.top !== undefined) scrollTop = event.top;
        return Promise.resolve();
      }),
      getState: vi.fn(() => ({ scrollTop })),
      getStores: vi.fn(() => ({ data: { setState: setScrollState } })),
      on: vi.fn((action: string, listener: (event: { readonly id: string }) => void, config?: { readonly tag?: symbol }) => {
        if (action === "select-task") {
          selectionListener = listener;
          selectionTag = config?.tag ?? null;
        }
      }),
      intercept: vi.fn((action: string, listener: (event: unknown) => unknown, config?: { readonly tag?: symbol }) => {
        interceptors.set(action, { listener, tag: config?.tag ?? null });
      }),
      detach: vi.fn((tag: symbol) => {
        if (selectionTag === tag) selectionListener = null;
        for (const [action, interceptor] of interceptors) {
          if (interceptor.tag === tag) interceptors.delete(action);
        }
      }),
    },
    select(id: string) { selectionListener?.({ id }); },
    intercept(action: string, event: unknown) { return interceptors.get(action)?.listener(event); },
    hasInterceptor(action: string) { return interceptors.has(action); },
  };
});

vi.mock("@svar-ui/react-gantt", () => ({
  Gantt: ({
    tasks,
    links,
    init,
  }: {
    readonly tasks?: readonly { readonly id?: string; readonly text?: string }[];
    readonly links?: readonly { readonly id?: string }[];
    readonly init?: (api: typeof ganttHarness.api) => void;
  }) => {
    useEffect(() => { init?.(ganttHarness.api); }, [init]);
    return (
      <div className="wx-gantt" data-testid="svar-gantt">
        <div className="wx-pseudo-rows" data-testid="svar-gantt-rows" />
        <div className="wx-chart" data-testid="svar-gantt-timeline" />
        {tasks?.map((task) => (
          <button key={task.id} type="button" data-task-id={`:${String(task.id)}`} onClick={() => { if (task.id !== undefined) ganttHarness.select(task.id); }}>
            {task.text}
          </button>
        ))}
        {links?.map((link) => (
          <button key={link.id} type="button" data-link-id={`:${String(link.id)}`}>
            Dependência {link.id}
          </button>
        ))}
      </div>
    );
  },
  Willow: ({ children }: PropsWithChildren) => <>{children}</>,
}));

const NOW = "2026-08-27T15:00:00.000Z";
const PROJECT_ID = "10000000-0000-4000-8000-000000000001";
const TASK_ID = "20000000-0000-4000-8000-000000000001";
const SECOND_TASK_ID = "20000000-0000-4000-8000-000000000002";
const THIRD_TASK_ID = "20000000-0000-4000-8000-000000000003";

async function addPredecessors(
  successorTitle: string,
  predecessorLabels: readonly string[],
  lagDays = 0,
): Promise<void> {
  const buttons = await screen.findAllByRole("button", {
    name: `Adicionar predecessoras a ${successorTitle}`,
  });
  const openButton = buttons[0];
  if (openButton === undefined) throw new Error("Botão de predecessoras não encontrado.");
  fireEvent.click(openButton);
  const dialog = await screen.findByRole("dialog", { name: "Adicionar predecessoras" });
  for (const label of predecessorLabels) {
    fireEvent.click(within(dialog).getByRole("checkbox", { name: label }));
  }
  if (lagDays !== 0) {
    fireEvent.change(within(dialog).getByLabelText("Intervalo comum (dias úteis)"), {
      target: { value: String(lagDays) },
    });
  }
  fireEvent.click(within(dialog).getByRole("button", {
    name: `Adicionar ${String(predecessorLabels.length)} predecessora${predecessorLabels.length === 1 ? "" : "s"}`,
  }));
}

const defaultCalendar: Calendar = {
  id: DEFAULT_CALENDAR_ID,
  name: "Calendário padrão",
  workingDays: [1, 2, 3, 4, 5],
  exceptions: [],
  isDefault: true,
  createdAt: NOW,
  updatedAt: NOW,
};

const continuousCalendar: Calendar = {
  id: CONTINUOUS_CALENDAR_ID,
  name: "Todos os dias",
  workingDays: [1, 2, 3, 4, 5, 6, 7],
  exceptions: [],
  isDefault: false,
  createdAt: NOW,
  updatedAt: NOW,
};

function project(): Project {
  return {
    id: PROJECT_ID,
    name: "Projeto Alfa",
    description: null,
    status: "ACTIVE",
    calendarId: DEFAULT_CALENDAR_ID,
    position: 0,
    isArchived: false,
    criticalPathEnabled: false,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function task(): Task {
  return {
    id: TASK_ID,
    code: null,
    projectId: PROJECT_ID,
    parentId: null,
    calendarId: null,
    title: "Preparar operação",
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
    position: 0,
    assignee: null,
    tags: [],
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function scheduledTask(
  id: string,
  title: string,
  startDate: string,
  options: Partial<Task> = {},
): Task {
  return {
    ...task(),
    id,
    title,
    startDate,
    endDate: startDate,
    durationDays: 1,
    ...options,
  };
}

function dependency(predecessorId: string, successorId: string): TaskDependency {
  return {
    id: "40000000-0000-4000-8000-000000000001",
    projectId: PROJECT_ID,
    predecessorId,
    successorId,
    type: "FS",
    lagDays: 0,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

class MemoryWorkspaceRepository implements WorkspaceRepository {
  readonly calendars: Calendar[];
  readonly projects: Project[];
  readonly tasks: Task[];
  readonly dependencies: TaskDependency[];
  readonly baselines: ProjectBaseline[];
  readonly baselineTasks: BaselineTask[];
  readonly templates: TaskTemplate[];
  readonly templateItems: TaskTemplateItem[];
  readonly templateDependencies: TaskTemplateDependency[];
  readonly appliedScheduleChanges: ScheduleChangeSet[] = [];
  private readonly ganttHistory = new Map<string, GanttHistoryState>();
  importPreview: ImportPackagePreview | null = null;
  restorePreview: ImportPackagePreview | null = null;
  lastImportSelection: ImportSelection | null = null;

  constructor(snapshot: Partial<WorkspaceSnapshot> = {}) {
    this.calendars = [...(snapshot.calendars ?? [defaultCalendar])];
    this.projects = [...(snapshot.projects ?? [])];
    this.tasks = [...(snapshot.tasks ?? [])];
    this.dependencies = [...(snapshot.dependencies ?? [])];
    this.baselines = [...(snapshot.baselines ?? [])];
    this.baselineTasks = [...(snapshot.baselineTasks ?? [])];
    this.templates = [...(snapshot.templates ?? [])];
    this.templateItems = [...(snapshot.templateItems ?? [])];
    this.templateDependencies = [...(snapshot.templateDependencies ?? [])];
  }

  load(): Promise<WorkspaceSnapshot> {
    return Promise.resolve({
      calendars: [...this.calendars],
      projects: [...this.projects],
      tasks: [...this.tasks],
      dependencies: [...this.dependencies],
      baselines: [...this.baselines],
      baselineTasks: [...this.baselineTasks],
      templates: [...this.templates],
      templateItems: [...this.templateItems],
      templateDependencies: [...this.templateDependencies],
    });
  }

  saveCalendar(savedCalendar: Calendar): Promise<void> {
    const index = this.calendars.findIndex((candidate) => candidate.id === savedCalendar.id);
    if (index === -1) this.calendars.push(savedCalendar);
    else this.calendars[index] = savedCalendar;
    return Promise.resolve();
  }

  saveBaseline(bundle: BaselineBundle): Promise<void> {
    this.baselines.forEach((baseline, index) => {
      if (baseline.projectId === bundle.baseline.projectId && baseline.isActive) {
        this.baselines[index] = {
          ...baseline,
          isActive: false,
          replacedAt: bundle.baseline.createdAt,
        };
      }
    });
    this.baselines.push(bundle.baseline);
    this.baselineTasks.push(...bundle.tasks);
    return Promise.resolve();
  }

  deleteProjectBaselines(projectId: string): Promise<void> {
    const removedIds = new Set(this.baselines.filter((item) => item.projectId === projectId).map((item) => item.id));
    for (let index = this.baselines.length - 1; index >= 0; index -= 1) {
      if (this.baselines[index]?.projectId === projectId) this.baselines.splice(index, 1);
    }
    for (let index = this.baselineTasks.length - 1; index >= 0; index -= 1) {
      const task = this.baselineTasks[index];
      if (task !== undefined && removedIds.has(task.baselineId)) this.baselineTasks.splice(index, 1);
    }
    return Promise.resolve();
  }

  saveProject(savedProject: Project): Promise<void> {
    const index = this.projects.findIndex((candidate) => candidate.id === savedProject.id);
    if (index === -1) this.projects.push(savedProject);
    else this.projects[index] = savedProject;
    return Promise.resolve();
  }

  reorderProjects(projectIds: readonly string[]): Promise<void> {
    projectIds.forEach((projectId, position) => {
      const project = this.projects.find((candidate) => candidate.id === projectId);
      if (project === undefined) throw new Error("Projeto não encontrado.");
      this.projects[this.projects.indexOf(project)] = { ...project, position };
    });
    return Promise.resolve();
  }

  deleteProject(projectId: string): Promise<void> {
    const projectIndex = this.projects.findIndex((candidate) => candidate.id === projectId);
    if (projectIndex >= 0) this.projects.splice(projectIndex, 1);
    for (let index = this.tasks.length - 1; index >= 0; index -= 1) {
      if (this.tasks[index]?.projectId === projectId) this.tasks.splice(index, 1);
    }
    return Promise.resolve();
  }

  saveTask(savedTask: Task): Promise<void> {
    const index = this.tasks.findIndex((candidate) => candidate.id === savedTask.id);
    if (index === -1) this.tasks.push(savedTask);
    else this.tasks[index] = savedTask;
    return Promise.resolve();
  }

  reorderTasks(taskIds: readonly string[]): Promise<void> {
    taskIds.forEach((taskId, position) => {
      const task = this.tasks.find((candidate) => candidate.id === taskId);
      if (task === undefined) throw new Error("Tarefa não encontrada.");
      this.tasks[this.tasks.indexOf(task)] = { ...task, position };
    });
    return Promise.resolve();
  }

  async applyScheduleChanges(changes: ScheduleChangeSet): Promise<void> {
    this.appliedScheduleChanges.push(changes);
    for (const calendar of changes.calendarsToSave) await this.saveCalendar(calendar);
    for (const taskId of changes.taskTreeIdsToDelete) await this.deleteTaskTree(taskId);
    for (const dependencyId of changes.dependencyIdsToDelete) {
      const index = this.dependencies.findIndex((dependency) => dependency.id === dependencyId);
      if (index >= 0) this.dependencies.splice(index, 1);
    }
    for (const dependency of changes.dependenciesToSave) {
      const index = this.dependencies.findIndex((candidate) => candidate.id === dependency.id);
      if (index === -1) this.dependencies.push(dependency);
      else this.dependencies[index] = dependency;
    }
    for (const task of changes.tasks) await this.saveTask(task);
  }

  loadGanttHistory(projectId: string): Promise<GanttHistoryState> {
    return Promise.resolve(this.ganttHistory.get(projectId) ?? { undoEntries: [], redoEntries: [] });
  }

  saveGanttHistory(projectId: string, state: GanttHistoryState): Promise<void> {
    this.ganttHistory.set(projectId, state);
    return Promise.resolve();
  }

  deleteTaskTree(taskId: string): Promise<void> {
    const pending = [taskId];
    const removed = new Set<string>();
    while (pending.length > 0) {
      const current = pending.pop();
      if (current === undefined || removed.has(current)) continue;
      removed.add(current);
      pending.push(...this.tasks.filter((candidate) => candidate.parentId === current).map(({ id }) => id));
    }
    for (let index = this.tasks.length - 1; index >= 0; index -= 1) {
      const candidate = this.tasks[index];
      if (candidate !== undefined && removed.has(candidate.id)) this.tasks.splice(index, 1);
    }
    return Promise.resolve();
  }

  async saveDuplicationBundle(bundle: DuplicationBundle): Promise<void> {
    if (bundle.project !== null) await this.saveProject(bundle.project);
    for (const task of bundle.tasks) await this.saveTask(task);
    for (const dependency of bundle.dependencies) {
      const index = this.dependencies.findIndex((candidate) => candidate.id === dependency.id);
      if (index === -1) this.dependencies.push(dependency);
      else this.dependencies[index] = dependency;
    }
  }

  saveTemplateBundle(bundle: TaskTemplateBundle): Promise<void> {
    const templateIndex = this.templates.findIndex(
      (candidate) => candidate.id === bundle.template.id,
    );
    if (templateIndex === -1) this.templates.push(bundle.template);
    else this.templates[templateIndex] = bundle.template;
    for (let index = this.templateItems.length - 1; index >= 0; index -= 1) {
      if (this.templateItems[index]?.templateId === bundle.template.id) {
        this.templateItems.splice(index, 1);
      }
    }
    for (let index = this.templateDependencies.length - 1; index >= 0; index -= 1) {
      if (this.templateDependencies[index]?.templateId === bundle.template.id) {
        this.templateDependencies.splice(index, 1);
      }
    }
    this.templateItems.push(...bundle.items);
    this.templateDependencies.push(...bundle.dependencies);
    return Promise.resolve();
  }

  deleteTemplate(templateId: string): Promise<void> {
    const templateIndex = this.templates.findIndex((candidate) => candidate.id === templateId);
    if (templateIndex >= 0) this.templates.splice(templateIndex, 1);
    for (let index = this.templateItems.length - 1; index >= 0; index -= 1) {
      if (this.templateItems[index]?.templateId === templateId) this.templateItems.splice(index, 1);
    }
    for (let index = this.templateDependencies.length - 1; index >= 0; index -= 1) {
      if (this.templateDependencies[index]?.templateId === templateId) {
        this.templateDependencies.splice(index, 1);
      }
    }
    return Promise.resolve();
  }

  exportProject(): Promise<ExportResult | null> {
    return Promise.resolve({ path: "C:\\exports\\projeto.chronoproject", projectCount: 1, templateCount: 0 });
  }

  exportWorkspace(): Promise<ExportResult | null> {
    return Promise.resolve({ path: "C:\\exports\\workspace.chronoproject", projectCount: this.projects.length, templateCount: this.templates.length });
  }

  savePdfReport(): Promise<{ readonly path: string } | null> {
    return Promise.resolve({ path: "C:\\exports\\relatorio.pdf" });
  }

  chooseImportPackage(): Promise<ImportPackagePreview | null> {
    return Promise.resolve(this.importPreview);
  }

  applyImportPackage(_packagePath: string, selection: ImportSelection): Promise<ImportResult> {
    this.lastImportSelection = selection;
    return Promise.resolve({
      backupPath: "C:\\backups\\antes-importacao.sqlite",
      importedProjectCount: selection.projects.filter(({ mode }) => mode === "REPLACE").length,
      copiedProjectCount: selection.projects.filter(({ mode }) => mode === "COPY").length,
      importedTemplateCount: selection.templateIds.length,
    });
  }

  createBackup(): Promise<BackupResult | null> {
    return Promise.resolve({ path: "C:\\backups\\manual.sqlite" });
  }

  openBackupFolder(): Promise<void> {
    return Promise.resolve();
  }

  chooseRestoreBackup(): Promise<ImportPackagePreview | null> {
    return Promise.resolve(this.restorePreview);
  }

  restoreBackup(): Promise<RestoreResult> {
    return Promise.resolve({ safetyBackupPath: "C:\\backups\\seguranca.sqlite", projectCount: this.projects.length, templateCount: this.templates.length });
  }
}

describe("aplicação Chrono Project", () => {
  it("integra os controles da janela à moldura do aplicativo", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()] })} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    const controls = screen.getByLabelText("Controles da janela");
    expect(within(controls).getByRole("button", { name: "Minimizar janela" })).toBeVisible();
    expect(within(controls).getByRole("button", { name: "Maximizar janela" })).toBeVisible();
    expect(within(controls).getByRole("button", { name: "Fechar janela" })).toBeVisible();
    expect(document.querySelector(".window-drag-region")).toHaveAttribute("data-tauri-drag-region");
  });

  it("permite ajustar e restaurar a largura da coluna Tarefa", async () => {
    window.localStorage.removeItem("chrono-project.task-table.task-column-width");
    window.localStorage.removeItem("chrono-project.task-table.predecessors-column-width");
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()] })} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    const resizeHandle = screen.getByRole("separator", { name: "Ajustar largura da coluna Tarefa" });
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "380");

    fireEvent.keyDown(resizeHandle, { key: "ArrowRight" });
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "396");
    await waitFor(() => {
      expect(window.localStorage.getItem("chrono-project.task-table.task-column-width")).toBe("396");
    });

    fireEvent.doubleClick(resizeHandle);
    expect(resizeHandle).toHaveAttribute("aria-valuenow", "380");

    const predecessorsResizeHandle = screen.getByRole("separator", { name: "Ajustar largura da coluna Predecessoras" });
    expect(predecessorsResizeHandle).toHaveAttribute("aria-valuenow", "240");

    fireEvent.keyDown(predecessorsResizeHandle, { key: "ArrowRight" });
    expect(predecessorsResizeHandle).toHaveAttribute("aria-valuenow", "256");
    await waitFor(() => {
      expect(window.localStorage.getItem("chrono-project.task-table.predecessors-column-width")).toBe("256");
    });

    fireEvent.doubleClick(predecessorsResizeHandle);
    expect(predecessorsResizeHandle).toHaveAttribute("aria-valuenow", "240");
  });

  it("recolhe e restaura a lista de projetos", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()] })} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    fireEvent.click(screen.getByRole("button", { name: "Recolher projetos" }));
    expect(screen.queryByRole("navigation", { name: "Lista de projetos" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar projetos" }));
    expect(screen.getByRole("navigation", { name: "Lista de projetos" })).toBeVisible();
  });

  it("arquiva e exclui projetos pelo menu de contexto da barra lateral", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()] });
    render(<App repository={repository} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    fireEvent.contextMenu(screen.getByRole("button", { name: /Projeto Alfa/ }));
    const menu = screen.getByRole("menu", { name: "Ações de Projeto Alfa" });
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Arquivar projeto" }));
    await waitFor(() => { expect(repository.projects[0]?.isArchived).toBe(true); });

    fireEvent.click(screen.getByLabelText("Mostrar arquivados"));
    fireEvent.contextMenu(screen.getByRole("button", { name: /Projeto Alfa/ }));
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("menuitem", { name: "Excluir projeto…" }));
    await waitFor(() => { expect(repository.projects).toHaveLength(0); });
  });

  it("exporta um projeto pelo menu de contexto da barra lateral", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()] });
    const exportProject = vi.spyOn(repository, "exportProject");
    render(<App repository={repository} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    fireEvent.contextMenu(screen.getByRole("button", { name: /Projeto Alfa/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Exportar projeto…" }));

    await waitFor(() => {
      expect(exportProject).toHaveBeenCalledWith(PROJECT_ID, "Projeto-Alfa");
    });
    expect(await screen.findByText("Projeto exportado para C:\\exports\\projeto.chronoproject")).toBeVisible();
  });

  it("oferece relatório, atividades e Gantt no diálogo de PDF", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Planejar relatório", "2026-09-08")],
    });
    render(<App repository={repository} />);

    const pdfButton = await screen.findByRole("button", { name: "Gerar PDF" });
    expect(pdfButton.closest("header")).toHaveClass("project-header");
    fireEvent.click(pdfButton);
    const dialog = screen.getByRole("dialog", { name: "Gerar PDF do projeto" });

    expect(within(dialog).getByText("Relatório completo")).toBeVisible();
    expect(within(dialog).getByText("Lista de atividades")).toBeVisible();
    expect(within(dialog).getByText("Cronograma Gantt")).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "Todas (1)" })).toBeVisible();
    expect(within(dialog).getByRole("option", { name: "Visíveis pelos filtros (1)" })).toBeDisabled();
    expect(within(dialog).getByLabelText("Cronograma de")).toHaveValue("2026-09-08");
    expect(within(dialog).getByLabelText("Cronograma até")).toHaveValue("2026-09-08");

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Gerar PDF do projeto" })).not.toBeInTheDocument();
  });

  it("permite escolher projetos e templates de um pacote antes de importar", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()] });
    repository.importPreview = {
      packagePath: "C:\\imports\\workspace.chronoproject",
      exportType: "workspace",
      exportedAt: NOW,
      schemaVersion: 4,
      projects: [
        { id: PROJECT_ID, name: "Projeto existente", updatedAt: NOW, taskCount: 3, existsLocally: true, localUpdatedAt: NOW },
        { id: "20000000-0000-4000-8000-000000000099", name: "Projeto novo", updatedAt: NOW, taskCount: 5, existsLocally: false, localUpdatedAt: null },
      ],
      templates: [
        { id: "50000000-0000-4000-8000-000000000099", name: "Template novo", updatedAt: NOW, itemCount: 4, existsLocally: false, localUpdatedAt: null },
      ],
    };
    render(<App repository={repository} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    fireEvent.click(screen.getByText("Arquivo"));
    fireEvent.click(screen.getByRole("button", { name: "Importar pacote" }));
    const dialog = await screen.findByRole("dialog", { name: "Escolher conteúdo para importar" });
    fireEvent.change(within(dialog).getByLabelText("Ação para Projeto existente"), { target: { value: "IGNORE" } });
    fireEvent.change(within(dialog).getByLabelText("Ação para Projeto novo"), { target: { value: "COPY" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Importar seleção" }));

    await waitFor(() => {
      expect(repository.lastImportSelection).toEqual({
        projects: [{ projectId: "20000000-0000-4000-8000-000000000099", mode: "COPY" }],
        templateIds: ["50000000-0000-4000-8000-000000000099"],
      });
    });
    expect(await screen.findByText(/Importação concluída:/)).toBeVisible();
  });

  it("cria backup manual e informa onde ele foi salvo", async () => {
    render(<App repository={new MemoryWorkspaceRepository()} />);
    await screen.findByRole("heading", { name: "Organize seu primeiro projeto" });
    fireEvent.click(screen.getByText("Arquivo"));
    fireEvent.click(screen.getByRole("button", { name: "Criar backup" }));
    expect(await screen.findByText(/Backup verificado criado em C:\\backups\\manual.sqlite/)).toBeVisible();
  });

  it("apresenta o estado vazio inteiramente em português", async () => {
    render(<App repository={new MemoryWorkspaceRepository()} />);

    expect(await screen.findByRole("heading", { name: "Organize seu primeiro projeto" })).toBeVisible();
    expect(screen.queryByText("Os dados permanecem neste computador.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar projeto" })).toBeVisible();
  });

  it("cria um projeto e abre sua tabela", async () => {
    const repository = new MemoryWorkspaceRepository();
    render(<App repository={repository} />);

    await screen.findByRole("heading", { name: "Organize seu primeiro projeto" });
    fireEvent.click(screen.getByRole("button", { name: "Criar projeto" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Implantação" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    expect(await screen.findByRole("heading", { name: "Tabela de tarefas" })).toBeVisible();
    expect(screen.getByLabelText("Nome do projeto")).toHaveValue("Implantação");
    expect(repository.projects).toHaveLength(1);
  });

  it("cria e edita uma tarefa na tabela", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()] });
    render(<App repository={repository} />);

    const quickTask = await screen.findByLabelText("Título da nova tarefa");
    fireEvent.change(quickTask, { target: { value: "Validar escopo" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    const title = await screen.findByLabelText("Título da tarefa");
    fireEvent.change(title, { target: { value: "Validar escopo aprovado" } });
    fireEvent.change(screen.getByLabelText("Status da tarefa"), {
      target: { value: "IN_PROGRESS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.title).toBe("Validar escopo aprovado");
      expect(repository.tasks[0]?.status).toBe("IN_PROGRESS");
    });
  });

  it("salva texto ao sair do campo sem exigir o botão Salvar", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    render(<App repository={repository} />);

    const title = await screen.findByLabelText("Título da tarefa");
    fireEvent.change(title, { target: { value: "Escopo salvo automaticamente" } });
    expect(screen.getByRole("status", { name: "Alteração pendente" })).toBeVisible();
    fireEvent.blur(title);

    await waitFor(() => {
      expect(repository.tasks[0]?.title).toBe("Escopo salvo automaticamente");
      expect(screen.getByRole("status")).toHaveClass("saved");
    });
  });

  it("salva texto após uma pausa curta mesmo quando o campo continua em foco", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Responsável pela tarefa"), {
      target: { value: "Planejamento" },
    });

    await waitFor(() => {
      expect(repository.tasks[0]?.assignee).toBe("Planejamento");
    }, { timeout: 2_000 });
  });

  it("salva seleções e datas válidas assim que a alteração é confirmada", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Preparar operação", "2026-08-28")],
    });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Prioridade da tarefa"), {
      target: { value: "HIGH" },
    });
    await waitFor(() => { expect(repository.tasks[0]?.priority).toBe("HIGH"); });

    fireEvent.change(screen.getByLabelText("Prazo-limite da tarefa"), {
      target: { value: "2026-09-04" },
    });
    await waitFor(() => { expect(repository.tasks[0]?.deadlineDate).toBe("2026-09-04"); });
  });

  it("desfaz e refaz uma alteração de prioridade pelos atalhos globais", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Preparar operação", "2026-08-28")],
    });
    render(<App repository={repository} />);

    const priority = await screen.findByLabelText("Prioridade da tarefa");
    fireEvent.change(priority, { target: { value: "HIGH" } });
    await waitFor(() => { expect(repository.tasks[0]?.priority).toBe("HIGH"); });

    fireEvent.keyDown(priority, { key: "z", ctrlKey: true });
    await waitFor(() => {
      expect(repository.tasks[0]?.priority).toBe("NORMAL");
      expect(priority).toHaveValue("NORMAL");
    });

    fireEvent.keyDown(priority, { key: "Z", ctrlKey: true, shiftKey: true });
    await waitFor(() => {
      expect(repository.tasks[0]?.priority).toBe("HIGH");
      expect(priority).toHaveValue("HIGH");
    });
  });

  it("preserva o desfazer nativo enquanto um campo de texto está sendo editado", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    render(<App repository={repository} />);

    const priority = await screen.findByLabelText("Prioridade da tarefa");
    fireEvent.change(priority, { target: { value: "HIGH" } });
    await waitFor(() => { expect(repository.tasks[0]?.priority).toBe("HIGH"); });

    const title = screen.getByLabelText("Título da tarefa");
    fireEvent.keyDown(title, { key: "z", ctrlKey: true });
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(repository.tasks[0]?.priority).toBe("HIGH");
  });

  it("salva a edição pendente antes de desmontar a tabela ao trocar de visualização", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Responsável pela tarefa"), {
      target: { value: "Equipe de implantação" },
    });
    fireEvent.click(screen.getByRole("tab", { name: "Kanban" }));

    expect(await screen.findByRole("heading", { name: "Quadro Kanban" })).toBeVisible();
    await waitFor(() => {
      expect(repository.tasks[0]?.assignee).toBe("Equipe de implantação");
    });
  });

  it("serializa salvamentos rápidos e preserva a edição mais recente", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    const persistChanges = repository.applyScheduleChanges.bind(repository);
    let releaseFirstSave!: () => void;
    const firstSaveGate = new Promise<void>((resolve) => { releaseFirstSave = resolve; });
    let saveCount = 0;
    vi.spyOn(repository, "applyScheduleChanges").mockImplementation(async (changes) => {
      saveCount += 1;
      if (saveCount === 1) await firstSaveGate;
      await persistChanges(changes);
    });
    render(<App repository={repository} />);

    const title = await screen.findByLabelText("Título da tarefa");
    fireEvent.change(title, { target: { value: "Primeira edição" } });
    fireEvent.blur(title);
    await waitFor(() => { expect(saveCount).toBe(1); });

    fireEvent.change(title, { target: { value: "Edição definitiva" } });
    fireEvent.blur(title);
    releaseFirstSave();

    await waitFor(() => {
      expect(saveCount).toBe(2);
      expect(repository.tasks[0]?.title).toBe("Edição definitiva");
    });
  });

  it("mantém a edição local e permite tentar novamente após falha", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    const persistChanges = repository.applyScheduleChanges.bind(repository);
    let shouldFail = true;
    vi.spyOn(repository, "applyScheduleChanges").mockImplementation(async (changes) => {
      if (shouldFail) {
        shouldFail = false;
        throw new Error("Falha de escrita simulada.");
      }
      await persistChanges(changes);
    });
    render(<App repository={repository} />);

    const title = await screen.findByLabelText("Título da tarefa");
    fireEvent.change(title, { target: { value: "Edição preservada" } });
    fireEvent.blur(title);

    expect(await screen.findByRole("status", { name: "Erro ao salvar" })).toBeVisible();
    expect(title).toHaveValue("Edição preservada");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.title).toBe("Edição preservada");
      expect(screen.getByRole("status")).toHaveClass("saved");
    });
  });

  it("carrega uma tarefa persistida", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] })} />);

    expect(await screen.findByDisplayValue("Preparar operação")).toBeVisible();
    expect(screen.getByDisplayValue("Não iniciada")).toBeVisible();
  });

  it("mantém os detalhes abertos ao clicar fora e fecha com Escape", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] })} />);

    const detailsButton = await screen.findByRole("button", { name: "Detalhes" });
    expect(detailsButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(detailsButton);

    const code = screen.getByLabelText("Código visual da tarefa");
    const detailsRow = code.closest("tr");
    expect(detailsRow).toHaveClass("task-details-row");
    expect(code.closest("td")).toHaveAttribute("colspan", "16");
    expect(screen.getByLabelText("Ajuda sobre o código visual")).toHaveAttribute(
      "title",
      expect.stringContaining("DEV-01"),
    );
    expect(screen.getByText(/Ele não altera o UUID interno da tarefa/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Detalhes da tarefa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ocultar detalhes" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("table")).toHaveAccessibleName(/Tarefas do projeto/);

    fireEvent.pointerDown(screen.getByRole("heading", { name: "Tabela de tarefas" }));
    expect(screen.getByLabelText("Código visual da tarefa")).toBeInTheDocument();

    code.focus();
    fireEvent.keyDown(code, { key: "Escape" });
    expect(screen.queryByLabelText("Código visual da tarefa")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Detalhes" })).toHaveFocus();
  });

  it("apresenta os atalhos pelo menu Ajuda e pelo teclado", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()] })} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    fireEvent.click(screen.getByText("Ajuda"));
    const shortcutsButton = screen.getByRole("button", { name: /Atalhos de teclado/ });
    expect(shortcutsButton).toHaveAttribute("aria-keyshortcuts", "Control+/");
    fireEvent.click(shortcutsButton);
    expect(screen.getByRole("dialog", { name: "Atalhos de teclado" })).toBeVisible();
    expect(screen.getByText("Desfazer a última edição salva de tarefa")).toBeVisible();
    expect(screen.getByText("Refazer a última edição desfeita")).toBeVisible();
    expect(screen.getByText("Fechar menu, diálogo ou detalhes da tarefa")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("button", { name: "Fechar" }), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Atalhos de teclado" })).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: "/", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Atalhos de teclado" })).toBeVisible();
  });

  it("identifica o projeto atual e fecha o menu superior com Escape ou clique externo", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()] })} />);
    await screen.findByRole("heading", { name: "Tabela de tarefas" });

    expect(screen.getByRole("button", { name: /Projeto Alfa/ })).toHaveAttribute("aria-current", "page");
    const fileSummary = screen.getByText("Arquivo");
    fireEvent.click(fileSummary);
    const fileMenu = fileSummary.closest("details");
    expect(fileMenu).toHaveAttribute("open");

    const importButton = screen.getByRole("button", { name: "Importar pacote" });
    importButton.focus();
    fireEvent.keyDown(importButton, { key: "Escape" });
    expect(fileMenu).not.toHaveAttribute("open");
    expect(fileSummary).toHaveFocus();

    fireEvent.click(fileSummary);
    expect(fileMenu).toHaveAttribute("open");
    fireEvent.pointerDown(screen.getByRole("heading", { name: "Tabela de tarefas" }));
    expect(fileMenu).not.toHaveAttribute("open");
  });

  it("apresenta erros de validação em português sem persistir dados incompletos", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    render(<App repository={repository} />);

    const startDate = await screen.findByLabelText("Início da tarefa");
    fireEvent.change(startDate, { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Início, fim e duração devem ser informados juntos.",
    );
    expect(repository.tasks[0]?.startDate).toBeNull();
  });

  it("reordena tarefas irmãs e persiste as novas posições", async () => {
    const firstTask = task();
    const secondTask: Task = {
      ...task(),
      id: "20000000-0000-4000-8000-000000000002",
      title: "Executar operação",
      position: 1,
    };
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [firstTask, secondTask],
    });
    render(<App repository={repository} />);

    const moveDown = await screen.findByRole("button", {
      name: "Mover Preparar operação para baixo",
    });
    fireEvent.click(moveDown);

    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === firstTask.id)?.position).toBe(1);
      expect(repository.tasks.find(({ id }) => id === secondTask.id)?.position).toBe(0);
    });
    expect(
      screen
        .getAllByLabelText("Título da tarefa")
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(["Executar operação", "Preparar operação"]);
  });

  it("calcula o fim ao informar início e duração", async () => {
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Início da tarefa"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.change(screen.getByLabelText("Duração da tarefa"), {
      target: { value: "3" },
    });

    expect(screen.getByLabelText("Fim da tarefa")).toHaveValue("2026-09-02");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.startDate).toBe("2026-08-31");
      expect(repository.tasks[0]?.endDate).toBe("2026-09-02");
      expect(repository.tasks[0]?.durationDays).toBe(3);
    });
  });

  it("ignora um ano parcial na data sem derrubar a tabela", async () => {
    const scheduled = scheduledTask(TASK_ID, "Preparar operação", "2026-08-28");
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);

    const startDate = await screen.findByLabelText("Início da tarefa");
    fireEvent.change(startDate, { target: { value: "0002-08-28" } });

    expect(screen.getByRole("heading", { name: "Tabela de tarefas" })).toBeVisible();
    expect(screen.queryByText("Não foi possível exibir a tabela de tarefas.")).not.toBeInTheDocument();
    expect(repository.tasks[0]?.startDate).toBe("2026-08-28");

    fireEvent.blur(startDate);
    expect(startDate).toHaveValue("2026-08-28");

    fireEvent.change(startDate, { target: { value: "2027-08-30" } });
    expect(startDate).toHaveValue("2027-08-30");
  });

  it("preserva o cronograma enquanto o ano da data ainda está sendo digitado", async () => {
    const scheduled = scheduledTask(TASK_ID, "Preparar operação", "2026-08-28");
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);

    const startDate = await screen.findByLabelText("Início da tarefa");
    const endDate = screen.getByLabelText("Fim da tarefa");
    startDate.focus();

    // Um input date nativo expõe value="" temporariamente durante a digitação
    // segmentada de dd/mm/aaaa no WebView2.
    fireEvent.change(startDate, { target: { value: "" } });

    expect(endDate).toHaveValue("2026-08-28");
    expect(repository.tasks[0]?.startDate).toBe("2026-08-28");

    fireEvent.change(startDate, { target: { value: "2026-10-01" } });
    fireEvent.blur(startDate);

    await waitFor(() => {
      expect(repository.tasks[0]?.startDate).toBe("2026-10-01");
    });
  });

  it("cria predecessora TI com lag zero no mesmo dia do fim", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-28", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
    });
    render(<App repository={repository} />);

    await addPredecessors("Sucessora", ["1. Predecessora"]);

    await waitFor(() => {
      expect(repository.dependencies).toHaveLength(1);
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-08-28");
      expect(repository.tasks.find(({ id }) => id === successor.id)?.endDate).toBe("2026-08-28");
    });
    expect(screen.getAllByRole("button", { name: "Adicionar predecessoras a Sucessora" })[1]).toHaveTextContent("+");
    expect(await screen.findByText("1. Predecessora", { selector: ".dependency-item span" })).toBeVisible();
  });

  it("permite adicionar três predecessoras à mesma atividade", async () => {
    const root = scheduledTask("50000000-0000-4000-8000-000000000001", "Raiz", "2026-08-28");
    const sourceSummary = scheduledTask("50000000-0000-4000-8000-000000000002", "Grupo de origem", "2026-08-28", { parentId: root.id });
    const first = scheduledTask(TASK_ID, "Predecessora A", "2026-08-28", { parentId: sourceSummary.id });
    const second = scheduledTask(SECOND_TASK_ID, "Predecessora B", "2026-08-28", { parentId: sourceSummary.id, position: 1 });
    const third = scheduledTask(THIRD_TASK_ID, "Predecessora C", "2026-08-28", { parentId: sourceSummary.id, position: 2 });
    const targetSummary = scheduledTask("50000000-0000-4000-8000-000000000003", "Grupo de destino", "2026-08-28", { parentId: root.id, position: 1 });
    const successor = scheduledTask(
      "50000000-0000-4000-8000-000000000004",
      "Atividade com três predecessoras",
      "2026-08-28",
      { parentId: targetSummary.id },
    );
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [root, sourceSummary, targetSummary, successor, third, first, second],
    });
    render(<App repository={repository} />);

    const rootRow = (await screen.findByDisplayValue("Raiz")).closest("tr");
    expect(rootRow).not.toBeNull();
    fireEvent.click(within(rootRow as HTMLElement).getByRole("button", { name: "Expandir subtarefas" }));
    const targetRow = (await screen.findByDisplayValue("Grupo de destino")).closest("tr");
    expect(targetRow).not.toBeNull();
    fireEvent.click(within(targetRow as HTMLElement).getByRole("button", { name: "Expandir subtarefas" }));

    const pickerButtons = await screen.findAllByRole("button", {
      name: "Adicionar predecessoras a Atividade com três predecessoras",
    });
    fireEvent.click(pickerButtons[0] as HTMLElement);
    const picker = await screen.findByRole("dialog", { name: "Adicionar predecessoras" });
    const optionLabels = within(picker).getAllByRole("checkbox").map(
      (checkbox) => checkbox.closest("label")?.textContent,
    );
    expect(optionLabels).toEqual([
      "1.1. Grupo de origemResumo",
      "1.1.1. Predecessora A",
      "1.1.2. Predecessora B",
      "1.1.3. Predecessora C",
    ]);
    for (const label of optionLabels.slice(1)) {
      fireEvent.click(within(picker).getByRole("checkbox", { name: label ?? "" }));
    }
    fireEvent.click(within(picker).getByRole("button", { name: "Adicionar 3 predecessoras" }));
    await waitFor(() => { expect(repository.dependencies).toHaveLength(3); });

    expect(repository.dependencies.map(({ predecessorId }) => predecessorId)).toEqual(
      expect.arrayContaining([first.id, second.id, third.id]),
    );
    expect(screen.getByTitle("3 predecessoras adicionadas a 1.2.1. Atividade com três predecessoras")).toBeEnabled();
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    await waitFor(() => { expect(repository.dependencies).toHaveLength(0); });
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    await waitFor(() => { expect(repository.dependencies).toHaveLength(3); });

    const successorRow = (await screen.findByDisplayValue("Atividade com três predecessoras")).closest("tr");
    expect(successorRow).not.toBeNull();
    fireEvent.click(within(successorRow as HTMLElement).getByRole("button", { name: "Gerenciar" }));
    const manager = await screen.findByRole("dialog", { name: "Gerenciar predecessoras" });
    const firstLag = within(manager).getByLabelText("Intervalo de 1.1.1. Predecessora A");
    const secondLag = within(manager).getByLabelText("Intervalo de 1.1.2. Predecessora B");
    expect(firstLag).toHaveValue(0);
    expect(secondLag).toHaveValue(0);
    fireEvent.change(firstLag, { target: { value: "2" } });
    expect(within(manager).getByRole("checkbox", { name: "1.1.1. Predecessora A" })).toBeChecked();
    fireEvent.click(within(manager).getByRole("button", { name: "Aplicar intervalos" }));
    await waitFor(() => {
      expect(repository.dependencies.find(({ predecessorId }) => predecessorId === first.id)?.lagDays).toBe(2);
      expect(repository.dependencies.find(({ predecessorId }) => predecessorId === second.id)?.lagDays).toBe(0);
    });
  });

  it("oferece confirmação compacta e menu de contexto próprio na tarefa", async () => {
    const writeClipboard = vi.fn<(text: string) => Promise<void>>().mockResolvedValue();
    const readClipboard = vi.fn<() => Promise<string>>().mockResolvedValue(" revisada");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { readText: readClipboard, writeText: writeClipboard },
    });
    const first = scheduledTask(TASK_ID, "Preparar operação", "2026-08-28");
    const second = scheduledTask(SECOND_TASK_ID, "Executar operação", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [first, second],
    });
    render(<App repository={repository} />);

    const secondRow = (await screen.findByDisplayValue("Executar operação")).closest("tr");
    expect(secondRow).not.toBeNull();
    const addPredecessor = within(secondRow as HTMLElement).getByTitle("Adicionar predecessoras");
    expect(addPredecessor).toHaveTextContent("+");

    fireEvent.contextMenu(secondRow as HTMLElement, { clientX: 320, clientY: 240 });
    const menu = screen.getByRole("menu", { name: "Ações de Executar operação" });
    expect(within(menu).getByRole("menuitem", { name: "Abrir detalhes" })).toBeVisible();
    expect(within(menu).getByRole("menuitem", { name: "Adicionar subtarefa" })).toBeVisible();
    expect(within(menu).getByRole("menuitem", { name: "Adicionar predecessora" })).toBeVisible();
    expect(within(menu).getByRole("menuitem", { name: "Duplicar tarefa" })).toBeVisible();
    expect(within(menu).getByRole("menuitem", { name: "Salvar como template" })).toBeVisible();
    expect(within(menu).getByRole("menuitem", { name: "Excluir tarefa…" })).toBeVisible();

    fireEvent.click(within(menu).getByRole("menuitem", { name: "Adicionar predecessora" }));
    expect(within(secondRow as HTMLElement).getAllByRole("button", { name: "Adicionar predecessoras a Executar operação" })[0]).toHaveFocus();

    const titleInput = within(secondRow as HTMLElement).getByLabelText("Título da tarefa");
    (titleInput as HTMLInputElement).setSelectionRange(0, 8);
    fireEvent.contextMenu(titleInput, { clientX: 360, clientY: 260 });
    const textMenu = screen.getByRole("menu", { name: "Ações de Executar operação" });
    expect(within(textMenu).getByRole("menuitem", { name: "Recortar" })).toBeEnabled();
    expect(within(textMenu).getByRole("menuitem", { name: "Copiar" })).toBeEnabled();
    expect(within(textMenu).getByRole("menuitem", { name: "Colar" })).toBeEnabled();
    expect(within(textMenu).getByRole("menuitem", { name: "Selecionar tudo" })).toBeEnabled();
    expect(within(textMenu).getByRole("menuitem", { name: "Abrir detalhes" })).toBeVisible();
    fireEvent.click(within(textMenu).getByRole("menuitem", { name: "Copiar" }));
    await waitFor(() => { expect(writeClipboard).toHaveBeenCalledWith("Executar"); });
    await waitFor(() => { expect(titleInput).toHaveFocus(); });

    (titleInput as HTMLInputElement).setSelectionRange(17, 17);
    fireEvent.contextMenu(titleInput, { clientX: 360, clientY: 260 });
    fireEvent.click(within(screen.getByRole("menu", { name: "Ações de Executar operação" })).getByRole("menuitem", { name: "Colar" }));
    expect(secondRow?.querySelectorAll(".row-terminal-action")).toHaveLength(1);
    await waitFor(() => { expect(titleInput).toHaveValue("Executar operação revisada"); });
    await waitFor(() => { expect(repository.tasks.find(({ id }) => id === SECOND_TASK_ID)?.title).toBe("Executar operação revisada"); });

    const moreActions = within(secondRow as HTMLElement).getByRole("button", { name: "Mais ações para Executar operação revisada" });
    fireEvent.click(moreActions);
    expect(within(screen.getByRole("menu", { name: "Ações de Executar operação revisada" })).getByRole("menuitem", { name: "Abrir detalhes" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("menu", { name: "Ações de Executar operação revisada" }), { key: "Escape" });
    expect(moreActions).toHaveFocus();

    fireEvent.click(screen.getByRole("tab", { name: "Kanban" }));
    const kanbanCard = (await screen.findByText("Executar operação revisada", { selector: ".kanban-card-title strong" })).closest("article");
    expect(kanbanCard).not.toBeNull();
    fireEvent.contextMenu(kanbanCard as HTMLElement, { clientX: 420, clientY: 260 });
    const kanbanMenu = screen.getByRole("menu", { name: "Ações de Executar operação revisada" });
    expect(within(kanbanMenu).getByRole("menuitem", { name: "Mover para Em andamento" })).toBeVisible();
    expect(within(kanbanMenu).getByRole("menuitem", { name: "Duplicar tarefa" })).toBeVisible();
    expect(within(kanbanMenu).getByRole("menuitem", { name: "Excluir tarefa…" })).toBeVisible();

    fireEvent.click(within(kanbanMenu).getByRole("menuitem", { name: "Duplicar tarefa" }));
    await waitFor(() => { expect(repository.tasks).toHaveLength(3); });
  });

  it("sincroniza a barra horizontal sempre disponível com a tabela", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] })} />);

    const table = await screen.findByRole("table", { name: /Tarefas do projeto/ });
    const tableScroll = table.parentElement as HTMLDivElement;
    const horizontalScroll = screen.getByRole("region", { name: "Rolagem horizontal da tabela" });

    horizontalScroll.scrollLeft = 240;
    fireEvent.scroll(horizontalScroll);
    expect(tableScroll.scrollLeft).toBe(240);

    tableScroll.scrollLeft = 80;
    fireEvent.scroll(tableScroll);
    expect(horizontalScroll.scrollLeft).toBe(80);

    fireEvent.wheel(tableScroll, { deltaX: 120 });
    expect(tableScroll.scrollLeft).toBe(200);
    expect(horizontalScroll.scrollLeft).toBe(200);

    fireEvent.wheel(tableScroll, { deltaY: 40, shiftKey: true });
    expect(tableScroll.scrollLeft).toBe(240);
    expect(horizontalScroll.scrollLeft).toBe(240);
  });

  it("substitui o menu nativo por edição clara nos demais campos de texto", async () => {
    const writeClipboard = vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error("permissão negada"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { readText: vi.fn<() => Promise<string>>(), writeText: writeClipboard },
    });
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()] })} />);

    const projectName = await screen.findByLabelText("Nome do projeto");
    (projectName as HTMLInputElement).setSelectionRange(0, 7);
    fireEvent.contextMenu(projectName, { clientX: 240, clientY: 180 });

    const menu = screen.getByRole("menu", { name: "Edição de campo" });
    expect(menu).toHaveClass("app-context-menu");
    expect(within(menu).getByRole("menuitem", { name: "Recortar" })).toBeEnabled();
    expect(within(menu).getByRole("menuitem", { name: "Copiar" })).toBeEnabled();
    expect(within(menu).getByRole("menuitem", { name: "Colar" })).toBeEnabled();
    expect(within(menu).getByRole("menuitem", { name: "Selecionar tudo" })).toBeEnabled();

    fireEvent.click(within(menu).getByRole("menuitem", { name: "Copiar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("permissão negada");
    expect(projectName).toHaveFocus();

    const dateFilter = screen.getByLabelText("De");
    fireEvent.contextMenu(dateFilter, { clientX: 260, clientY: 200 });
    const dateMenu = screen.getByRole("menu", { name: "Edição de campo" });
    expect(within(dateMenu).getByRole("menuitem", { name: "Copiar valor" })).toBeDisabled();

    fireEvent.keyDown(dateMenu, { key: "Escape" });
    expect(dateFilter).toHaveFocus();
  });

  it("preenche o cronograma de uma nova tarefa ao adicionar predecessora", async () => {
    const predecessor = scheduledTask(TASK_ID, "Descongelamento", "2026-09-14", {
      endDate: "2026-09-15",
      durationDays: 2,
    });
    const successor = {
      ...task(),
      id: SECOND_TASK_ID,
      title: "CBM",
      position: 1,
    };
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
    });
    render(<App repository={repository} />);

    await addPredecessors("CBM", ["1. Descongelamento"]);

    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === successor.id)).toMatchObject({
        startDate: "2026-09-15",
        endDate: "2026-09-15",
        durationDays: 1,
      });
    });
  });

  it("antecipa sucessoras automáticas em cadeia quando a predecessora termina mais cedo", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-09-01", {
      endDate: "2026-09-04",
      durationDays: 4,
    });
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-09-07", {
      position: 1,
    });
    const finalTask = scheduledTask(THIRD_TASK_ID, "Entrega final", "2026-09-08", {
      position: 2,
    });
    const firstRelation = dependency(predecessor.id, successor.id);
    const secondRelation = {
      ...dependency(successor.id, finalTask.id),
      id: "40000000-0000-4000-8000-000000000002",
    };
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor, finalTask],
      dependencies: [firstRelation, secondRelation],
    });
    render(<App repository={repository} />);

    const endFields = await screen.findAllByLabelText("Fim da tarefa");
    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-09-04");
      expect(repository.tasks.find(({ id }) => id === finalTask.id)?.startDate).toBe("2026-09-04");
    });
    fireEvent.change(endFields[0] as HTMLElement, {
      target: { value: "2026-09-02" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === predecessor.id)?.endDate).toBe("2026-09-02");
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-09-02");
      expect(repository.tasks.find(({ id }) => id === finalTask.id)?.startDate).toBe("2026-09-02");
    });
    expect(repository.appliedScheduleChanges.at(-1)?.tasks.map(({ id }) => id)).toEqual(
      expect.arrayContaining([predecessor.id, successor.id, finalTask.id]),
    );

    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true });
    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === predecessor.id)?.endDate).toBe("2026-09-04");
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-09-04");
      expect(repository.tasks.find(({ id }) => id === finalTask.id)?.startDate).toBe("2026-09-04");
    });

    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true, shiftKey: true });
    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === predecessor.id)?.endDate).toBe("2026-09-02");
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-09-02");
      expect(repository.tasks.find(({ id }) => id === finalTask.id)?.startDate).toBe("2026-09-02");
    });
  });

  it("salva tarefa e lag juntos pelo único botão da coluna Ações", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-28", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
      dependencies: [dependency(predecessor.id, successor.id)],
    });
    render(<App repository={repository} />);

    const lag = await screen.findByLabelText("Intervalo após 1. Predecessora");
    fireEvent.change(lag, { target: { value: "2" } });
    fireEvent.change(screen.getAllByLabelText("Status da tarefa")[1] as HTMLElement, {
      target: { value: "IN_PROGRESS" },
    });

    expect(repository.dependencies[0]?.lagDays).toBe(0);
    expect(repository.tasks.find(({ id }) => id === successor.id)?.status).toBe("NOT_STARTED");
    const saveButtons = screen.getAllByRole("button", { name: "Salvar" });
    expect(saveButtons).toHaveLength(1);
    expect(saveButtons[0]?.closest("td")).toHaveClass("row-actions");
    fireEvent.click(saveButtons[0] as HTMLElement);

    await waitFor(() => {
      expect(repository.dependencies[0]?.lagDays).toBe(2);
      expect(repository.tasks.find(({ id }) => id === successor.id)?.status).toBe("IN_PROGRESS");
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-09-01");
    });
    expect(repository.appliedScheduleChanges).toHaveLength(1);
    expect(repository.appliedScheduleChanges[0]?.dependenciesToSave[0]?.lagDays).toBe(2);
    expect(
      repository.appliedScheduleChanges[0]?.tasks.some(({ id }) => id === successor.id),
    ).toBe(true);
  });

  it("não salva a tarefa quando o lag da mesma linha é inválido", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-28", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
      dependencies: [dependency(predecessor.id, successor.id)],
    });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Intervalo após 1. Predecessora"), {
      target: { value: "-1" },
    });
    fireEvent.change(screen.getAllByLabelText("Status da tarefa")[1] as HTMLElement, {
      target: { value: "IN_PROGRESS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O intervalo deve ser um número inteiro maior ou igual a zero.",
    );
    expect(repository.dependencies[0]?.lagDays).toBe(0);
    expect(repository.tasks.find(({ id }) => id === successor.id)?.status).toBe("NOT_STARTED");
    expect(repository.appliedScheduleChanges).toHaveLength(0);
  });

  it("preserva tarefa manual e apresenta conflito apenas para sua predecessora declarada", async () => {
    const predecessor = scheduledTask(TASK_ID, "Entrega anterior", "2026-08-28");
    const manual = scheduledTask(SECOND_TASK_ID, "Marco manual", "2026-08-27", {
      position: 1,
      schedulingMode: "MANUAL",
    });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, manual],
    });
    render(<App repository={repository} />);

    await addPredecessors("Marco manual", ["1. Entrega anterior"]);

    expect(await screen.findByText("1 conflito de agendamento")).toBeVisible();
    expect(screen.getByText(/deveria começar em 2026-08-28 ou depois/)).toBeVisible();
    expect(repository.tasks.find(({ id }) => id === manual.id)?.startDate).toBe("2026-08-27");
  });

  it("usa o calendário da tarefa para permitir propagação no fim de semana", async () => {
    const predecessor = scheduledTask(TASK_ID, "Fechamento", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Plantão", "2026-08-28", {
      position: 1,
      calendarId: CONTINUOUS_CALENDAR_ID,
    });
    const repository = new MemoryWorkspaceRepository({
      calendars: [defaultCalendar, continuousCalendar],
      projects: [project()],
      tasks: [predecessor, successor],
    });
    render(<App repository={repository} />);

    await addPredecessors("Plantão", ["1. Fechamento"], 1);

    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-08-29");
    });
  });

  it("salva uma exceção do calendário e reposiciona tarefa automática em transação", async () => {
    const automaticTask = scheduledTask(TASK_ID, "Atividade útil", "2026-08-31");
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [automaticTask],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByText("Calendário"));
    fireEvent.change(screen.getByLabelText("Data"), {
      target: { value: "2026-08-31" },
    });
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Feriado local" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar exceção" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar calendário" }));

    await waitFor(() => {
      expect(repository.calendars[0]?.exceptions[0]?.date).toBe("2026-08-31");
      expect(repository.tasks[0]?.startDate).toBe("2026-09-01");
      expect(repository.tasks[0]?.endDate).toBe("2026-09-01");
    });
  });

  it("recalcula conflito manual ao alterar o calendário da sucessora", async () => {
    const predecessor = scheduledTask(TASK_ID, "Entrega anterior", "2026-09-04");
    const manual = scheduledTask(SECOND_TASK_ID, "Marco manual", "2026-09-07", {
      position: 1,
      schedulingMode: "MANUAL",
    });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, manual],
      dependencies: [{ ...dependency(predecessor.id, manual.id), lagDays: 1 }],
    });
    render(<App repository={repository} />);

    expect(await screen.findByDisplayValue("Marco manual")).toBeVisible();
    expect(screen.queryByText("1 conflito de agendamento")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Calendário"));
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-09-07" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar exceção" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar calendário" }));

    expect(await screen.findByText("1 conflito de agendamento")).toBeVisible();
    expect(screen.getByText(/deveria começar em 2026-09-08 ou depois/)).toBeVisible();
    expect(repository.tasks.find(({ id }) => id === manual.id)?.startDate).toBe("2026-09-07");
  });

  it("reconstrói e mantém conflito persistido ao editar uma tarefa não relacionada", async () => {
    const predecessor = scheduledTask(TASK_ID, "Entrega anterior", "2026-08-28");
    const manual = scheduledTask(SECOND_TASK_ID, "Marco manual", "2026-08-27", {
      position: 1,
      schedulingMode: "MANUAL",
    });
    const unrelated = scheduledTask(THIRD_TASK_ID, "Atividade paralela", "2026-08-28", {
      position: 2,
    });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, manual, unrelated],
      dependencies: [{ ...dependency(predecessor.id, manual.id), lagDays: 1 }],
    });
    render(<App repository={repository} />);

    expect(await screen.findByText("1 conflito de agendamento")).toBeVisible();
    const statusFields = screen.getAllByLabelText("Status da tarefa");
    fireEvent.change(statusFields[2] as HTMLElement, { target: { value: "IN_PROGRESS" } });
    const saveButtons = screen.getAllByRole("button", { name: "Salvar" });
    fireEvent.click(saveButtons[0] as HTMLElement);

    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === unrelated.id)?.status).toBe("IN_PROGRESS");
    });
    expect(screen.getByText("1 conflito de agendamento")).toBeVisible();
  });

  it("reconcilia e persiste uma cadeia automática ao carregar o workspace", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
      dependencies: [dependency(predecessor.id, successor.id)],
    });
    render(<App repository={repository} />);

    expect(await screen.findByDisplayValue("Sucessora")).toBeVisible();
    await waitFor(() => {
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-08-28");
    });
    expect(screen.getAllByLabelText("Início da tarefa")[1]).toHaveValue("2026-08-28");
  });

  it("deriva e bloqueia as datas da tarefa-resumo a partir da subtarefa", async () => {
    const summary = task();
    const child = scheduledTask(SECOND_TASK_ID, "Subtarefa", "2026-09-01", {
      parentId: summary.id,
    });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [summary, child],
    });
    render(<App repository={repository} />);

    const expandButton = await screen.findByRole("button", { name: "Expandir subtarefas" });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expandButton);
    expect(screen.getByRole("button", { name: "Recolher subtarefas" })).toHaveAttribute("aria-expanded", "true");
    const starts = screen.getAllByLabelText("Início da tarefa");
    const ends = screen.getAllByLabelText("Fim da tarefa");
    const durations = screen.getAllByLabelText("Duração da tarefa");

    expect(starts[0]).toBeDisabled();
    expect(ends[0]).toBeDisabled();
    expect(durations[0]).toBeDisabled();
    expect(screen.getByText("Resumo")).toBeVisible();
    expect(screen.getByText("Datas derivadas")).toBeVisible();
  });

  it("trava e destrava datas pelo cadeado sem perder o cronograma", async () => {
    const scheduled = scheduledTask(TASK_ID, "Atividade controlada", "2026-09-01");
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: "Travar datas de Atividade controlada" }));
    await waitFor(() => {
      expect(repository.tasks[0]?.schedulingMode).toBe("MANUAL");
      expect(screen.getByRole("button", { name: "Destravar datas de Atividade controlada" })).toHaveAttribute("aria-pressed", "true");
    });
    expect(repository.tasks[0]?.startDate).toBe("2026-09-01");

    fireEvent.click(screen.getByRole("button", { name: "Destravar datas de Atividade controlada" }));
    await waitFor(() => { expect(repository.tasks[0]?.schedulingMode).toBe("AUTO"); });
  });

  it("trava tarefas selecionadas em massa e alterna pelo atalho", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [
        scheduledTask(TASK_ID, "Primeira selecionada", "2026-09-01"),
        scheduledTask(SECOND_TASK_ID, "Segunda selecionada", "2026-09-02", { position: 1 }),
      ],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("checkbox", { name: "Selecionar Primeira selecionada" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar Segunda selecionada" }));
    const actions = screen.getByRole("group", { name: "Ações nas tarefas selecionadas" });
    fireEvent.click(within(actions).getByRole("button", { name: /Travar datas/ }));
    await waitFor(() => {
      expect(repository.tasks.every(({ schedulingMode }) => schedulingMode === "MANUAL")).toBe(true);
    });

    fireEvent.keyDown(document, { key: "L", ctrlKey: true, shiftKey: true });
    await waitFor(() => {
      expect(repository.tasks.every(({ schedulingMode }) => schedulingMode === "AUTO")).toBe(true);
    });
  });

  it("permite escolher uma tarefa-resumo como predecessora de uma folha", async () => {
    const summary = task();
    const child = scheduledTask(SECOND_TASK_ID, "Última etapa do resumo", "2026-09-01", {
      parentId: summary.id,
    });
    const successor = scheduledTask(THIRD_TASK_ID, "Sucessora do resumo", "2026-09-02", {
      position: 1,
    });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [summary, child, successor],
    });
    render(<App repository={repository} />);

    const buttons = await screen.findAllByRole("button", { name: "Adicionar predecessoras a Sucessora do resumo" });
    fireEvent.click(buttons[0] as HTMLElement);
    const preview = await screen.findByRole("dialog", { name: "Adicionar predecessoras" });
    expect(preview).toHaveTextContent("Resumo");
    fireEvent.click(within(preview).getByRole("checkbox", { name: /Preparar operação/ }));
    expect(preview).toHaveTextContent("Prévia do impacto");
    fireEvent.click(within(preview).getByRole("button", { name: "Adicionar 1 predecessora" }));

    await waitFor(() => {
      expect(repository.dependencies).toHaveLength(1);
      expect(repository.dependencies[0]?.predecessorId).toBe(summary.id);
      expect(repository.dependencies[0]?.successorId).toBe(successor.id);
    });
  });

  it("mostra a prévia antes de remover uma predecessora-resumo", async () => {
    const summary = scheduledTask(TASK_ID, "Resumo fornecedor", "2026-09-01");
    const child = scheduledTask(SECOND_TASK_ID, "Entrega final", "2026-09-01", {
      parentId: summary.id,
    });
    const successor = scheduledTask(THIRD_TASK_ID, "Receber entrega", "2026-09-02", {
      position: 1,
    });
    const relation = dependency(summary.id, successor.id);
    const repository = new MemoryWorkspaceRepository({
      projects: [project()], tasks: [summary, child, successor], dependencies: [relation],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: /Remover predecessora.*Resumo fornecedor/ }));
    const preview = screen.getByRole("dialog", { name: "Prévia do impacto no cronograma" });
    expect(preview).toHaveTextContent("Remover");
    fireEvent.click(within(preview).getByRole("button", { name: "Remover predecessora" }));
    await waitFor(() => { expect(repository.dependencies).toHaveLength(0); });
  });

  it("mantém a dependência do resumo ao adicionar outra subtarefa", async () => {
    const summary = task();
    const child = scheduledTask(SECOND_TASK_ID, "Etapa 1.5", "2026-09-01", {
      parentId: summary.id,
    });
    const successor = scheduledTask(THIRD_TASK_ID, "Etapa 2.1", "2026-09-02", { position: 1 });
    const relation = dependency(summary.id, successor.id);
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [summary, child, successor],
      dependencies: [relation],
    });
    render(<App repository={repository} />);

    const summaryRow = (await screen.findByDisplayValue("Preparar operação")).closest("tr");
    expect(summaryRow).not.toBeNull();
    fireEvent.click(within(summaryRow as HTMLElement).getByRole("button", { name: "+ Subtarefa" }));
    fireEvent.change(screen.getByPlaceholderText("Nova subtarefa"), { target: { value: "Etapa 1.6" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => { expect(repository.tasks.some(({ title }) => title === "Etapa 1.6")).toBe(true); });
    expect(screen.queryByRole("dialog", { name: "Transformar em tarefa-resumo?" })).not.toBeInTheDocument();
    expect(repository.dependencies).toEqual([
      expect.objectContaining({ predecessorId: summary.id, successorId: successor.id }),
    ]);
  });

  it("altera status no Kanban e reflete a mesma tarefa na Tabela", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Preparar operação", "2026-08-28")],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("tab", { name: "Kanban" }));
    expect(screen.getByRole("heading", { name: "Quadro Kanban" })).toBeVisible();
    expect(screen.getByText("28/08/2026")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Status de Preparar operação"), {
      target: { value: "IN_PROGRESS" },
    });

    await waitFor(() => {
      expect(repository.tasks[0]?.status).toBe("IN_PROGRESS");
    });
    fireEvent.click(screen.getByRole("tab", { name: "Tabela" }));
    expect(await screen.findByLabelText("Status da tarefa")).toHaveValue("IN_PROGRESS");
  });

  it("revisa os dados preenchidos antes de concluir pela Tabela", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Preparar operação", "2026-08-28", {
        priority: "HIGH",
        progress: 40,
        deadlineDate: "2026-09-04",
        assignee: "Ana",
      })],
    });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Status da tarefa"), {
      target: { value: "COMPLETED" },
    });
    const dialog = await screen.findByRole("alertdialog", { name: "Confirmar conclusão" });
    expect(within(dialog).getByText("Preparar operação")).toBeVisible();
    expect(within(dialog).getByText("Alta")).toBeVisible();
    expect(within(dialog).getAllByText("28/08/2026")).toHaveLength(2);
    expect(within(dialog).getByText("04/09/2026")).toBeVisible();
    expect(within(dialog).getByText("40%")).toBeVisible();
    expect(within(dialog).getByText("Ana")).toBeVisible();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => { expect(screen.getByLabelText("Status da tarefa")).toHaveValue("NOT_STARTED"); });
    expect(repository.tasks[0]?.status).toBe("NOT_STARTED");

    fireEvent.change(screen.getByLabelText("Status da tarefa"), {
      target: { value: "COMPLETED" },
    });
    fireEvent.click(within(await screen.findByRole("alertdialog", { name: "Confirmar conclusão" }))
      .getByRole("button", { name: "Confirmar conclusão" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.status).toBe("COMPLETED");
      expect(repository.tasks[0]?.progress).toBe(100);
      expect(repository.tasks[0]?.completedDate).not.toBeNull();
    });
  });

  it("confirma a reabertura, remove a data de conclusão e ajusta o progresso", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Preparar operação", "2026-08-28", {
        status: "COMPLETED",
        progress: 100,
        completedDate: "2026-09-01",
      })],
    });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Status da tarefa"), {
      target: { value: "IN_PROGRESS" },
    });
    const dialog = await screen.findByRole("alertdialog", { name: "Reabrir atividade" });
    expect(within(dialog).getByText(/data de conclusão será removida/)).toBeVisible();
    fireEvent.change(within(dialog).getByLabelText("Progresso ao reabrir"), {
      target: { value: "65" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar reabertura" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.status).toBe("IN_PROGRESS");
      expect(repository.tasks[0]?.progress).toBe(65);
      expect(repository.tasks[0]?.completedDate).toBeNull();
    });
  });

  it("impede concluir uma tarefa-resumo enquanto houver subtarefa aberta", async () => {
    const summary = scheduledTask(TASK_ID, "Entrega", "2026-08-28");
    const child = scheduledTask(SECOND_TASK_ID, "Validação pendente", "2026-08-28", {
      parentId: summary.id,
      position: 0,
    });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [summary, child] });
    render(<App repository={repository} />);

    const summaryRow = (await screen.findByDisplayValue("Entrega")).closest("tr");
    expect(summaryRow).not.toBeNull();
    fireEvent.change(within(summaryRow as HTMLElement).getByLabelText("Status da tarefa"), {
      target: { value: "COMPLETED" },
    });
    const dialog = await screen.findByRole("alertdialog", { name: "Confirmar conclusão" });
    expect(within(dialog).getByText("Conclua primeiro as subtarefas abertas.")).toBeVisible();
    expect(within(dialog).getByText("Validação pendente")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Confirmar conclusão" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(repository.tasks.find(({ id }) => id === summary.id)?.status).toBe("NOT_STARTED");
  });

  it("confirma a conclusão iniciada pelo Kanban", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Preparar operação", "2026-08-28")],
    });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Kanban" }));

    fireEvent.change(screen.getByLabelText("Status de Preparar operação"), {
      target: { value: "COMPLETED" },
    });
    const dialog = await screen.findByRole("alertdialog", { name: "Confirmar conclusão" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar conclusão" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.status).toBe("COMPLETED");
      expect(repository.tasks[0]?.progress).toBe(100);
      expect(repository.tasks[0]?.completedDate).not.toBeNull();
    });
  });

  it("move uma tarefa entre colunas do Kanban por arrastar e soltar", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Preparar operação", "2026-08-28")],
    });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Kanban" }));

    const handle = screen.getByRole("button", { name: "Arrastar Preparar operação" });
    const target = screen.getByRole("heading", { name: "Em andamento" }).closest("section");
    expect(target).not.toBeNull();
    Object.defineProperties(handle, {
      setPointerCapture: { configurable: true, value: vi.fn() },
      hasPointerCapture: { configurable: true, value: vi.fn(() => false) },
    });
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: vi.fn(() => target),
    });

    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(target).toHaveClass("drop-target");
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 100, clientY: 100 });

    await waitFor(() => { expect(repository.tasks[0]?.status).toBe("IN_PROGRESS"); });
    expect(target).not.toHaveClass("drop-target");
    expect(await screen.findByRole("status")).toHaveTextContent("movida para Em andamento");
    Reflect.deleteProperty(document, "elementFromPoint");
  });

  it("permite alternar as visualizações pelo teclado", async () => {
    const repository = new MemoryWorkspaceRepository({
      calendars: [defaultCalendar, continuousCalendar],
      projects: [project()],
      tasks: [task()],
      dependencies: [],
      templates: [],
      templateItems: [],
      templateDependencies: [],
    });
    render(<App repository={repository} />);

    const tableTab = await screen.findByRole("tab", { name: "Tabela" });
    tableTab.focus();
    fireEvent.keyDown(tableTab, { key: "ArrowRight" });

    const kanbanTab = screen.getByRole("tab", { name: "Kanban" });
    expect(kanbanTab).toHaveFocus();
    expect(kanbanTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Quadro Kanban" })).toBeVisible();

    fireEvent.keyDown(kanbanTab, { key: "End" });
    expect(screen.getByRole("tab", { name: "Gantt" })).toHaveFocus();
    expect(await screen.findByRole("heading", { name: "Gráfico de Gantt" })).toBeVisible();
  });

  it("mantém filtros ao alternar entre Tabela, Kanban e Gantt", async () => {
    const first = scheduledTask(TASK_ID, "Desenvolver interface", "2026-08-28", {
      tags: ["frontend"],
    });
    const second = scheduledTask(SECOND_TASK_ID, "Escrever manual", "2026-08-31", {
      position: 1,
      tags: ["documentação"],
    });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [first, second] });
    render(<App repository={repository} />);

    expect(await screen.findByDisplayValue("Desenvolver interface")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Tag"), { target: { value: "frontend" } });
    expect(screen.getByText("1 de 2 tarefas")).toBeVisible();
    expect(screen.queryByDisplayValue("Escrever manual")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Kanban" }));
    expect(screen.getByText("Desenvolver interface")).toBeVisible();
    expect(screen.queryByText("Escrever manual")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Gantt" }));
    expect(await screen.findByTestId("svar-gantt")).toHaveTextContent("Desenvolver interface");
    expect(screen.getByTestId("svar-gantt")).not.toHaveTextContent("Escrever manual");
  });

  it("edita cronograma com segurança pelo inspetor do Gantt", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28");
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    fireEvent.change(await screen.findByLabelText("Tarefa selecionada no Gantt"), {
      target: { value: TASK_ID },
    });
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-08-31" } });
    fireEvent.change(screen.getByLabelText("Duração útil"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar cronograma" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.startDate).toBe("2026-08-31");
      expect(repository.tasks[0]?.endDate).toBe("2026-09-02");
      expect(repository.tasks[0]?.durationDays).toBe(3);
    });
  });

  it("confirma a conclusão iniciada pelo inspetor do Gantt", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28", { progress: 55 });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    fireEvent.change(await screen.findByLabelText("Tarefa selecionada no Gantt"), {
      target: { value: TASK_ID },
    });
    fireEvent.change(screen.getByLabelText("Status de Planejar entrega"), {
      target: { value: "COMPLETED" },
    });
    const dialog = await screen.findByRole("alertdialog", { name: "Confirmar conclusão" });
    expect(within(dialog).getByText("55%")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar conclusão" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.status).toBe("COMPLETED");
      expect(repository.tasks[0]?.progress).toBe(100);
      expect(repository.tasks[0]?.completedDate).not.toBeNull();
    });
  });

  it("percorre as atividades do Gantt com a roda do mouse", async () => {
    const scheduled = Array.from({ length: 30 }, (_, index) => scheduledTask(
      `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      `Atividade ${String(index + 1)}`,
      "2026-08-28",
      { position: index },
    ));
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: scheduled });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    const verticalScroller = await screen.findByTestId("svar-gantt");
    Object.defineProperties(verticalScroller, {
      clientHeight: { configurable: true, value: 590 },
      scrollHeight: { configurable: true, value: 590 },
    });
    const timeline = screen.getByTestId("svar-gantt-timeline");
    Object.defineProperties(timeline, {
      clientWidth: { configurable: true, value: 500 },
      scrollWidth: { configurable: true, value: 1800 },
    });
    timeline.append(document.createElement("span"));
    await waitFor(() => {
      expect(screen.getByLabelText("Percorrer atividades do Gantt")).toHaveAttribute("max", "850");
      expect(screen.getByTestId("svar-gantt-rows")).toHaveStyle({ minHeight: "1440px" });
    });

    fireEvent.wheel(screen.getByTestId("chronoproject-gantt"), { deltaY: 140 });

    expect(verticalScroller.scrollTop).toBe(140);
    expect(ganttHarness.setScrollState).toHaveBeenCalledWith({ scrollTop: 140 });
    fireEvent.wheel(screen.getByTestId("chronoproject-gantt"), { deltaY: 140 });
    expect(verticalScroller.scrollTop).toBe(280);
    expect(ganttHarness.setScrollState).toHaveBeenCalledWith({ scrollTop: 280 });
    const verticalBar = screen.getByLabelText("Percorrer atividades do Gantt");
    expect(screen.getByTestId("chronoproject-gantt")).not.toContainElement(verticalBar);
    fireEvent.input(verticalBar, { target: { value: "305" } });
    expect(ganttHarness.setScrollState).toHaveBeenCalledWith({ scrollTop: 305 });
    expect(screen.getByText(/barra inferior para navegar pelas datas/i)).toBeVisible();
    const horizontalScroll = screen.getByLabelText("Navegar pelas datas do Gantt");
    expect(screen.getByTestId("chronoproject-gantt")).not.toContainElement(horizontalScroll);
    await waitFor(() => { expect(horizontalScroll).not.toBeDisabled(); });
    fireEvent.input(horizontalScroll, { target: { value: "320" } });
    expect(timeline.scrollLeft).toBe(320);
    expect(ganttHarness.api.exec).toHaveBeenCalledWith("scroll-chart", { left: 320 });
  });

  it("move uma tarefa livre pelo evento visual do Gantt", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28");
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });

    expect(ganttHarness.intercept("update-task", {
      id: TASK_ID,
      task: { start: new Date(2026, 7, 28), end: new Date(2026, 7, 29) },
      diff: 3,
    })).toBe(true);

    await waitFor(() => {
      expect(repository.tasks[0]?.startDate).toBe("2026-08-31");
      expect(repository.tasks[0]?.endDate).toBe("2026-08-31");
    });
  });

  it("impede arrastar no Gantt quando o cadeado de datas está fechado", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28", {
      schedulingMode: "MANUAL",
    });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });

    ganttHarness.intercept("update-task", {
      id: TASK_ID,
      task: { start: new Date(2026, 7, 28), end: new Date(2026, 7, 29) },
      diff: 3,
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/datas travadas/i);
    expect(repository.tasks[0]?.startDate).toBe("2026-08-28");
  });

  it("salva o percentual arrastado no Gantt", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28", { progress: 20 });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });

    expect(ganttHarness.intercept("update-task", {
      id: TASK_ID,
      task: { progress: 65 },
      inProgress: false,
    })).toBe(true);

    await waitFor(() => { expect(repository.tasks[0]?.progress).toBe(65); });
    expect(await screen.findByRole("status")).toHaveTextContent("conclusão atualizada para 65%");
  });

  it("desfaz e refaz a reordenação de tarefas como uma única operação", async () => {
    const first = scheduledTask(TASK_ID, "Primeira", "2026-08-28");
    const second = scheduledTask(SECOND_TASK_ID, "Segunda", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [first, second] });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: "Mover Segunda para cima" }));
    await waitFor(() => { expect(repository.tasks.find(({ id }) => id === second.id)?.position).toBe(0); });
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    await waitFor(() => { expect(repository.tasks.find(({ id }) => id === second.id)?.position).toBe(1); });
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    await waitFor(() => { expect(repository.tasks.find(({ id }) => id === second.id)?.position).toBe(0); });
  });

  it("desfaz e refaz a duplicação de tarefa", async () => {
    const source = scheduledTask(TASK_ID, "Duplicável", "2026-08-28");
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [source] });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: "Mais ações para Duplicável" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicar tarefa" }));
    await waitFor(() => { expect(repository.tasks).toHaveLength(2); });
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    await waitFor(() => { expect(repository.tasks).toHaveLength(1); });
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    await waitFor(() => { expect(repository.tasks).toHaveLength(2); });
  });

  it("restaura tarefa e dependência ao desfazer uma exclusão", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const predecessor = scheduledTask(TASK_ID, "A excluir", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
      dependencies: [dependency(predecessor.id, successor.id)],
    });
    render(<App repository={repository} />);

    const row = (await screen.findByDisplayValue("A excluir")).closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Excluir" }));
    await waitFor(() => {
      expect(repository.tasks).toHaveLength(1);
      expect(repository.dependencies).toHaveLength(0);
    });
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    await waitFor(() => {
      expect(repository.tasks).toHaveLength(2);
      expect(repository.dependencies).toHaveLength(1);
    });
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    await waitFor(() => {
      expect(repository.tasks).toHaveLength(1);
      expect(repository.dependencies).toHaveLength(0);
    });
  });

  it("mantém o histórico compartilhado do Gantt depois de trocar de view", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28", { progress: 20 });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });
    ganttHarness.intercept("update-task", {
      id: TASK_ID,
      task: { progress: 65 },
      inProgress: false,
    });
    await waitFor(() => { expect(repository.tasks[0]?.progress).toBe(65); });

    fireEvent.click(screen.getByRole("tab", { name: "Tabela" }));
    fireEvent.click(screen.getByRole("tab", { name: "Gantt" }));
    const undo = await screen.findByRole("button", { name: "Desfazer" });
    await waitFor(() => { expect(undo).toBeEnabled(); });
    fireEvent.click(undo);
    await waitFor(() => { expect(repository.tasks[0]?.progress).toBe(20); });
  });

  it("não persiste como edição do usuário o recálculo interno de uma tarefa-resumo", async () => {
    const summary = scheduledTask(TASK_ID, "Resumo", "2026-08-28", {
      endDate: "2026-08-28",
      durationDays: 1,
    });
    const child = scheduledTask(SECOND_TASK_ID, "Executar", "2026-08-28", {
      parentId: summary.id,
    });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [summary, child] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });

    expect(ganttHarness.intercept("update-task", {
      id: TASK_ID,
      task: { start: new Date(2026, 7, 29), end: new Date(2026, 7, 30) },
      eventSource: "update-task",
    })).toBe(true);

    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(repository.tasks[0]?.startDate).toBe("2026-08-28");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("bloqueia alteração visual do início de tarefa com predecessora e permite o fim", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
      dependencies: [{ ...dependency(predecessor.id, successor.id), lagDays: 1 }],
    });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });

    ganttHarness.intercept("update-task", {
      id: SECOND_TASK_ID,
      task: { start: new Date(2026, 7, 31) },
      diff: 1,
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("calculada pelas predecessoras");
    expect(repository.tasks[1]?.startDate).toBe("2026-08-31");

    ganttHarness.intercept("update-task", {
      id: SECOND_TASK_ID,
      task: { end: new Date(2026, 8, 1) },
      diff: 1,
    });
    await waitFor(() => {
      expect(repository.tasks[1]?.startDate).toBe("2026-08-31");
      expect(repository.tasks[1]?.endDate).toBe("2026-09-01");
      expect(repository.tasks[1]?.durationDays).toBe(2);
    });
  });

  it("move tarefa automática com predecessora ajustando o lag FS", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()], tasks: [predecessor, successor],
      dependencies: [{ ...dependency(predecessor.id, successor.id), lagDays: 1 }],
    });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });

    ganttHarness.intercept("update-task", {
      id: SECOND_TASK_ID,
      task: { start: new Date(2026, 7, 31), end: new Date(2026, 7, 31) },
      diff: 2,
    });

    await waitFor(() => {
      expect(repository.tasks[1]?.startDate).toBe("2026-09-02");
      expect(repository.dependencies[0]?.lagDays).toBe(3);
    });
    expect(screen.getByText(/1 intervalo FS ajustado/)).toBeInTheDocument();
  });

  it("restaura o Gantt e explica quando um arraste cai em dia não útil", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()], tasks: [predecessor, successor],
      dependencies: [{ ...dependency(predecessor.id, successor.id), lagDays: 1 }],
    });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });

    ganttHarness.intercept("update-task", {
      id: SECOND_TASK_ID,
      task: { start: new Date(2026, 7, 29), end: new Date(2026, 7, 29) },
      diff: -2,
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "29/08/2026 não é um dia útil",
    );
    expect(repository.tasks[1]?.startDate).toBe("2026-08-31");
  });

  it("desfaz e refaz uma edição de progresso do Gantt", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28", { progress: 20 });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("update-task")).toBe(true); });
    ganttHarness.intercept("update-task", { id: TASK_ID, task: { progress: 65 }, inProgress: false });
    await waitFor(() => { expect(repository.tasks[0]?.progress).toBe(65); });

    fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    await waitFor(() => { expect(repository.tasks[0]?.progress).toBe(20); });
    fireEvent.click(screen.getByRole("button", { name: "Refazer" }));
    await waitFor(() => { expect(repository.tasks[0]?.progress).toBe(65); });
  });

  it("cria uma dependência FS pelo evento visual do Gantt", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [predecessor, successor] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    await screen.findByTestId("svar-gantt");
    await waitFor(() => { expect(ganttHarness.hasInterceptor("add-link")).toBe(true); });

    expect(ganttHarness.intercept("add-link", {
      link: { source: TASK_ID, target: SECOND_TASK_ID, type: "e2s" },
    })).toBe(true);
    await waitFor(() => {
      expect(repository.dependencies).toHaveLength(1);
      expect(repository.dependencies[0]).toMatchObject({
        predecessorId: TASK_ID,
        successorId: SECOND_TASK_ID,
        type: "FS",
        lagDays: 0,
      });
    });
  });

  it("adiciona predecessora FS pelo menu de contexto da tarefa", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [predecessor, successor] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    const successorButton = await screen.findByRole("button", { name: "2. Sucessora" });

    fireEvent.contextMenu(successorButton, { clientX: 400, clientY: 300 });
    const openPicker = screen.getByRole("button", { name: "Adicionar predecessora…" });
    fireEvent.pointerDown(openPicker);
    fireEvent.click(openPicker);
    fireEvent.change(screen.getByLabelText("Predecessora FS"), { target: { value: TASK_ID } });
    fireEvent.click(screen.getByRole("button", { name: "Criar FS" }));

    await waitFor(() => {
      expect(repository.dependencies[0]).toMatchObject({
        predecessorId: TASK_ID,
        successorId: SECOND_TASK_ID,
        type: "FS",
        lagDays: 0,
      });
    });
  });

  it("exclui uma dependência pelo menu de contexto da linha", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", { position: 1 });
    const relation = dependency(predecessor.id, successor.id);
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [predecessor, successor], dependencies: [relation] });
    render(<App repository={repository} />);
    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    const link = await screen.findByRole("button", { name: `Dependência ${relation.id}` });

    fireEvent.contextMenu(link, { clientX: 400, clientY: 300 });
    fireEvent.click(screen.getByRole("button", { name: "Excluir dependência" }));

    await waitFor(() => { expect(repository.dependencies).toHaveLength(0); });
    expect(screen.getByText("Dependência FS excluída.")).toBeInTheDocument();
  });

  it("sincroniza o inspetor ao selecionar uma barra do Gantt", async () => {
    const scheduled = scheduledTask(TASK_ID, "Planejar entrega", "2026-08-28");
    const repository = new MemoryWorkspaceRepository({ projects: [project()], tasks: [scheduled] });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    fireEvent.click(await screen.findByRole("button", { name: "1. Planejar entrega" }));

    expect(screen.getByLabelText("Tarefa selecionada no Gantt")).toHaveValue(TASK_ID);
    expect(screen.getByLabelText("Início")).toHaveValue("2026-08-28");
    expect(screen.getByLabelText("Duração útil")).toHaveValue(1);
  });

  it("realça uma dependência sem esconder as demais e permite voltar a todas", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-31", {
      position: 1,
    });
    const third = scheduledTask(THIRD_TASK_ID, "Terceira", "2026-09-01", { position: 2 });
    const relation = dependency(predecessor.id, successor.id);
    const otherRelation = { ...dependency(successor.id, third.id), id: "40000000-0000-4000-8000-000000000099" };
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor, third],
      dependencies: [relation, otherRelation],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("tab", { name: "Gantt" }));
    fireEvent.click(await screen.findByRole("button", {
      name: `Dependência ${relation.id}`,
    }));

    expect(screen.getByLabelText("Dependência em foco")).toHaveValue(relation.id);
    expect(screen.getByText(/Em foco: 1\. Predecessora → 2\. Sucessora/)).toBeVisible();
    expect(screen.getByRole("button", { name: `Dependência ${otherRelation.id}` })).toBeVisible();

    fireEvent.change(screen.getByLabelText("Dependência em foco"), {
      target: { value: "" },
    });
    expect(screen.getByLabelText("Dependência em foco")).toHaveValue("");
  });

  it("duplica uma árvore e preserva somente sua dependência interna", async () => {
    const root = scheduledTask(TASK_ID, "Entrega", "2026-08-28", {
      endDate: "2026-08-31",
      durationDays: 2,
    });
    const first = scheduledTask(SECOND_TASK_ID, "Preparar", "2026-08-28", {
      parentId: root.id,
      position: 0,
    });
    const second = scheduledTask(THIRD_TASK_ID, "Executar", "2026-08-31", {
      parentId: root.id,
      position: 1,
    });
    const relation = dependency(first.id, second.id);
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [root, first, second],
      dependencies: [relation],
    });
    render(<App repository={repository} />);

    fireEvent.click((await screen.findAllByRole("button", { name: "Detalhes" }))[0] as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Duplicar árvore" }));

    await waitFor(() => {
      expect(repository.tasks).toHaveLength(6);
      expect(repository.dependencies).toHaveLength(2);
    });
    const copiedIds = new Set(repository.tasks.slice(3).map(({ id }) => id));
    expect([...copiedIds].some((id) => [root.id, first.id, second.id].includes(id))).toBe(false);
    expect(copiedIds.has(repository.dependencies[1]?.predecessorId ?? "")).toBe(true);
    expect(copiedIds.has(repository.dependencies[1]?.successorId ?? "")).toBe(true);
  });

  it("duplica um projeto completo e seleciona a cópia independente", async () => {
    const first = scheduledTask(TASK_ID, "Preparar", "2026-08-28");
    const second = scheduledTask(SECOND_TASK_ID, "Executar", "2026-08-31", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [first, second],
      dependencies: [dependency(first.id, second.id)],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByText("Editar"));
    fireEvent.click(screen.getByRole("button", { name: "Duplicar projeto" }));

    await waitFor(() => {
      expect(repository.projects).toHaveLength(2);
      expect(screen.getByLabelText("Nome do projeto")).toHaveValue("Projeto Alfa — cópia");
    });
    expect(repository.tasks).toHaveLength(4);
    expect(repository.dependencies).toHaveLength(2);
    expect(repository.tasks.slice(2).every((candidate) => candidate.projectId === repository.projects[1]?.id)).toBe(true);
  });

  it("salva, aplica e exclui um template global sem alterar tarefas aplicadas", async () => {
    const root = scheduledTask(TASK_ID, "Entrega", "2026-08-28", {
      endDate: "2026-08-31",
      durationDays: 2,
    });
    const first = scheduledTask(SECOND_TASK_ID, "Preparar", "2026-08-28", {
      parentId: root.id,
      position: 0,
      priority: "HIGH",
      tags: ["modelo"],
      assignee: "Jean",
      progress: 40,
    });
    const second = scheduledTask(THIRD_TASK_ID, "Executar", "2026-08-31", {
      parentId: root.id,
      position: 1,
      tags: ["modelo"],
    });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [root, first, second],
      dependencies: [dependency(first.id, second.id)],
    });
    render(<App repository={repository} />);

    fireEvent.click((await screen.findAllByRole("button", { name: "Detalhes" }))[0] as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Salvar árvore como template" }));
    const templateDialog = screen.getByRole("dialog", { name: "Salvar árvore como template" });
    fireEvent.change(within(templateDialog).getByLabelText("Nome"), { target: { value: "Entrega padrão" } });
    fireEvent.change(within(templateDialog).getByLabelText("Descrição"), {
      target: { value: "Fluxo reutilizável" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar template" }));

    await waitFor(() => { expect(repository.templates).toHaveLength(1); });
    fireEvent.click(screen.getByText("Templates"));
    fireEvent.change(screen.getByLabelText("Data inicial"), {
      target: { value: "2026-09-04" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => {
      expect(repository.tasks).toHaveLength(6);
      expect(repository.dependencies).toHaveLength(2);
    });
    const applied = repository.tasks.slice(3);
    expect(applied.every((candidate) => candidate.progress === 0)).toBe(true);
    expect(applied.every((candidate) => candidate.assignee === null)).toBe(true);
    expect(applied.find((candidate) => candidate.title === "Executar")?.startDate).toBe("2026-09-04");

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const templateCard = screen.getByText("Entrega padrão").closest("li");
    expect(templateCard).not.toBeNull();
    fireEvent.click(within(templateCard as HTMLElement).getByRole("button", { name: "Excluir" }));
    await waitFor(() => { expect(repository.templates).toHaveLength(0); });
    expect(repository.tasks).toHaveLength(6);
  });

  it("transfere dependências ao transformar uma tarefa em resumo", async () => {
    const predecessor = scheduledTask(TASK_ID, "Planejamento", "2026-09-10");
    const successor = scheduledTask(SECOND_TASK_ID, "Execução", "2026-09-11", { position: 1 });
    const relation = dependency(predecessor.id, successor.id);
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
      dependencies: [relation],
    });
    render(<App repository={repository} />);

    await screen.findByRole("heading", { name: "Tabela de tarefas" });
    const predecessorRow = screen.getByDisplayValue("Planejamento").closest("tr");
    expect(predecessorRow).not.toBeNull();
    fireEvent.click(within(predecessorRow as HTMLElement).getByRole("button", { name: "+ Subtarefa" }));
    fireEvent.change(screen.getByPlaceholderText("Nova subtarefa"), { target: { value: "Detalhar plano" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    const dialog = screen.getByRole("dialog", { name: "Transformar em tarefa-resumo?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Transferir para a nova subtarefa" }));

    await waitFor(() => { expect(repository.tasks).toHaveLength(3); });
    const child = repository.tasks.find((task) => task.parentId === predecessor.id);
    expect(child).toBeDefined();
    expect(repository.dependencies[0]?.predecessorId).toBe(child?.id);
    expect(repository.dependencies[0]?.successorId).toBe(successor.id);
  });

  it("permite manter uma dependência de saída ao transformar a predecessora em resumo", async () => {
    const predecessor = scheduledTask(TASK_ID, "Planejamento", "2026-09-10");
    const successor = scheduledTask(SECOND_TASK_ID, "Execução", "2026-09-11", { position: 1 });
    const relation = dependency(predecessor.id, successor.id);
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
      dependencies: [relation],
    });
    render(<App repository={repository} />);

    const predecessorRow = (await screen.findByDisplayValue("Planejamento")).closest("tr");
    expect(predecessorRow).not.toBeNull();
    fireEvent.click(within(predecessorRow as HTMLElement).getByRole("button", { name: "+ Subtarefa" }));
    fireEvent.change(screen.getByPlaceholderText("Nova subtarefa"), { target: { value: "Detalhar plano" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    const dialog = screen.getByRole("dialog", { name: "Transformar em tarefa-resumo?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Manter no novo resumo" }));

    await waitFor(() => { expect(repository.tasks).toHaveLength(3); });
    expect(repository.dependencies).toEqual([
      expect.objectContaining({ predecessorId: predecessor.id, successorId: successor.id }),
    ]);
  });

  it("habilita o caminho crítico, deriva a meta e separa sua margem da folga da rede", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [
        scheduledTask(TASK_ID, "Preparar operação", "2026-10-05", { deadlineDate: "2026-10-20" }),
        scheduledTask(SECOND_TASK_ID, "Entrega final", "2026-10-06", { deadlineDate: "2026-10-30" }),
        scheduledTask(THIRD_TASK_ID, "Cancelada", "2026-11-10", { status: "CANCELLED", deadlineDate: "2026-11-10" }),
      ],
      dependencies: [dependency(TASK_ID, SECOND_TASK_ID)],
    });
    render(<App repository={repository} />);

    const criticalPathSwitch = await screen.findByRole("switch", { name: "Exibir análise do caminho crítico" });
    expect(criticalPathSwitch).toHaveAttribute("aria-checked", "false");
    fireEvent.click(criticalPathSwitch);
    await waitFor(() => {
      expect(repository.projects[0]?.criticalPathEnabled).toBe(true);
      expect(screen.getByRole("switch", { name: "Exibir análise do caminho crítico" })).toHaveAttribute("aria-checked", "true");
    });

    const dialog = await screen.findByRole("dialog", { name: "Caminho crítico e meta do projeto" });
    expect(within(dialog).getByText(/O caminho crítico é a rota mais longa da rede/)).toBeVisible();
    expect(within(dialog).getByText(/A → C → D → E/)).toBeVisible();
    expect(within(dialog).getByText("Término previsto")).toBeVisible();
    expect(within(dialog).getByText("05/10/2026")).toBeVisible();
    expect(within(dialog).getByText("Meta final")).toBeVisible();
    expect(within(dialog).getByText("30/10/2026")).toBeVisible();
    expect(within(dialog).getByText("Margem global")).toBeVisible();
    expect(within(dialog).getByText("+19 dias úteis")).toBeVisible();
    expect(within(dialog).queryByText("Análise indisponível:")).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Entendi" }));
    fireEvent.click(screen.getByRole("tab", { name: "Gantt" }));
    const ganttLegend = screen.getByLabelText("Legenda do Gantt");
    expect(within(ganttLegend).getByText("Crítica")).toBeVisible();
    expect(within(ganttLegend).getByText("Quase crítica")).toBeVisible();
    fireEvent.click(await screen.findByRole("button", { name: "1. Preparar operação" }));
    expect(screen.getByText("Folga CPM")).toBeVisible();
    expect(screen.getByText("Crítica · 0 dias úteis de folga")).toBeVisible();
    await waitFor(() => {
      const gantt = screen.getByTestId("svar-gantt");
      expect(gantt.querySelector(`[data-task-id=":${TASK_ID}"]`)).toHaveClass("critical-path-task");
      expect(gantt.querySelector(`[data-task-id=":${SECOND_TASK_ID}"]`)).toHaveClass("critical-path-task");
    });
  });

  it("explica por que o caminho crítico ainda não pode ser calculado", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [{ ...project(), criticalPathEnabled: true }],
      tasks: [
        scheduledTask(TASK_ID, "Preparar operação", "2026-10-05"),
        scheduledTask(SECOND_TASK_ID, "Entrega final", "2026-10-06", { position: 1 }),
      ],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: "Entender caminho crítico" }));
    const dialog = await screen.findByRole("dialog", { name: "Caminho crítico e meta do projeto" });

    expect(within(dialog).getByText("Análise indisponível:")).toBeVisible();
    expect(within(dialog).getByText("Adicione dependências entre tarefas programadas para calcular o caminho crítico.")).toBeVisible();
    expect(within(dialog).getByText("Indisponível")).toBeVisible();
  });

  it("registra plano de referência, mantém histórico e salva prazo-limite na mesma tarefa", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Entrega controlada", "2026-09-10")],
    });
    render(<App repository={repository} />);

    await screen.findByRole("heading", { name: "Tabela de tarefas" });
    expect(screen.queryByLabelText("Informação sobre Início planejado")).not.toBeInTheDocument();

    const baselineButton = screen.getByRole("button", { name: "Criar plano de referência" });
    expect(baselineButton.closest("header")).toHaveClass("project-header");
    fireEvent.click(baselineButton);
    const dialog = screen.getByRole("dialog", { name: "Criar plano de referência" });
    fireEvent.change(within(dialog).getByLabelText("Nome do plano de referência"), {
      target: { value: "Plano aprovado" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Registrar plano" }));

    await waitFor(() => {
      expect(repository.baselines).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Plano de referência: Plano aprovado" })).toBeVisible();
    });
    const plannedStartHelp = screen.getByLabelText("Informação sobre Início planejado");
    expect(plannedStartHelp).toHaveAttribute("aria-describedby");
    const deadline = screen.getByLabelText("Prazo-limite da tarefa");
    fireEvent.change(deadline, { target: { value: "2026-09-09" } });
    const row = deadline.closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(repository.tasks[0]?.deadlineDate).toBe("2026-09-09");
    });
    expect(screen.getByText("Atrasada")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Atualizar plano de referência" }));
    fireEvent.click(screen.getByRole("button", { name: "Registrar plano" }));
    await waitFor(() => {
      expect(repository.baselines).toHaveLength(2);
      expect(repository.baselines.filter((baseline) => baseline.isActive)).toHaveLength(1);
      expect(repository.baselines.filter((baseline) => !baseline.isActive)[0]?.replacedAt).not.toBeNull();
    });

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Plano de referência:/ }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir plano e histórico" }));
    await waitFor(() => {
      expect(repository.baselines).toHaveLength(0);
      expect(repository.baselineTasks).toHaveLength(0);
      expect(repository.tasks).toHaveLength(1);
    });
    expect(screen.queryByLabelText("Informação sobre Início planejado")).not.toBeInTheDocument();
  });
});
