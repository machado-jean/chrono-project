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

  it("oferece relatório, atividades e Gantt no diálogo de PDF", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Planejar relatório", "2026-09-08")],
    });
    render(<App repository={repository} />);

    fireEvent.click(await screen.findByRole("button", { name: "Gerar PDF" }));
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

  it("carrega uma tarefa persistida", async () => {
    render(<App repository={new MemoryWorkspaceRepository({ projects: [project()], tasks: [task()] })} />);

    expect(await screen.findByDisplayValue("Preparar operação")).toBeVisible();
    expect(screen.getByDisplayValue("Não iniciada")).toBeVisible();
  });

  it("abre detalhes em uma linha ampla e explica o código visual", async () => {
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
    expect(screen.getByRole("button", { name: "Ocultar detalhes" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("table")).toHaveAccessibleName(/Tarefas do projeto/);

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
    expect(screen.getByText("Fechar menu, diálogo ou detalhes da tarefa")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("button", { name: "Fechar" }), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Atalhos de teclado" })).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: "/", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Atalhos de teclado" })).toBeVisible();
  });

  it("identifica o projeto atual e fecha o menu superior com Escape", async () => {
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

  it("cria predecessora TI com lag zero no mesmo dia do fim", async () => {
    const predecessor = scheduledTask(TASK_ID, "Predecessora", "2026-08-28");
    const successor = scheduledTask(SECOND_TASK_ID, "Sucessora", "2026-08-28", { position: 1 });
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [predecessor, successor],
    });
    render(<App repository={repository} />);

    fireEvent.change(await screen.findByLabelText("Nova predecessora de Sucessora"), {
      target: { value: predecessor.id },
    });
    fireEvent.click(screen.getByLabelText("Confirmar predecessora de Sucessora"));

    await waitFor(() => {
      expect(repository.dependencies).toHaveLength(1);
      expect(repository.tasks.find(({ id }) => id === successor.id)?.startDate).toBe("2026-08-28");
      expect(repository.tasks.find(({ id }) => id === successor.id)?.endDate).toBe("2026-08-28");
    });
    expect(screen.getByLabelText("Confirmar predecessora de Sucessora")).toHaveTextContent("Adicionar");
    expect(await screen.findByText("1. Predecessora", { selector: ".dependency-item span" })).toBeVisible();
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

    fireEvent.change(await screen.findByLabelText("Nova predecessora de CBM"), {
      target: { value: predecessor.id },
    });
    fireEvent.click(screen.getByLabelText("Confirmar predecessora de CBM"));

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

    fireEvent.change(await screen.findByLabelText("Nova predecessora de Marco manual"), {
      target: { value: predecessor.id },
    });
    fireEvent.click(screen.getByLabelText("Confirmar predecessora de Marco manual"));

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

    fireEvent.change(await screen.findByLabelText("Nova predecessora de Plantão"), {
      target: { value: predecessor.id },
    });
    fireEvent.change(screen.getByLabelText("Novo intervalo de Plantão"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByLabelText("Confirmar predecessora de Plantão"));

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
      expect(screen.getByLabelText("Percorrer atividades do Gantt")).toHaveAttribute("max", "670");
      expect(screen.getByTestId("svar-gantt-rows")).toHaveStyle({ minHeight: "1260px" });
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

    fireEvent.click(await screen.findByText("Projeto"));
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

  it("registra plano de referência, mantém histórico e salva prazo-limite na mesma tarefa", async () => {
    const repository = new MemoryWorkspaceRepository({
      projects: [project()],
      tasks: [scheduledTask(TASK_ID, "Entrega controlada", "2026-09-10")],
    });
    render(<App repository={repository} />);

    await screen.findByRole("heading", { name: "Tabela de tarefas" });
    expect(screen.queryByLabelText("Informação sobre Início planejado")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Criar plano de referência" }));
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
