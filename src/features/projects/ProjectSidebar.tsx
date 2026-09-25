import { useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";

import chronoMark from "../../assets/chrono-mark.png";
import { PROJECT_STATUS_LABELS, type Project } from "../../domain/projects/project";

interface ProjectSidebarProps {
  readonly collapsed: boolean;
  readonly projects: readonly Project[];
  readonly selectedProjectId: string | null;
  readonly disabled: boolean;
  readonly onSelect: (projectId: string) => void;
  readonly onCreate: (input: {
    readonly name: string;
    readonly description: string | null;
  }) => Promise<unknown>;
  readonly onArchive: (project: Project) => Promise<boolean>;
  readonly onDelete: (projectId: string) => Promise<boolean>;
  readonly onToggle: () => void;
}

interface ProjectContextMenu {
  readonly project: Project;
  readonly x: number;
  readonly y: number;
}

export function ProjectSidebar({
  collapsed,
  projects,
  selectedProjectId,
  disabled,
  onSelect,
  onCreate,
  onArchive,
  onDelete,
  onToggle,
}: ProjectSidebarProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contextMenu, setContextMenu] = useState<ProjectContextMenu | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const visibleProjects = projects.filter((project) => showArchived || !project.isArchived);

  useEffect(() => {
    if (contextMenu === null) return;
    const close = (event: PointerEvent): void => {
      if (!contextMenuRef.current?.contains(event.target as Node)) setContextMenu(null);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  const openProjectMenu = (event: MouseEvent, project: Project): void => {
    event.preventDefault();
    onSelect(project.id);
    setContextMenu({
      project,
      x: Math.min(event.clientX, window.innerWidth - 230),
      y: Math.min(event.clientY, window.innerHeight - 125),
    });
  };

  const deleteProject = (project: Project): void => {
    setContextMenu(null);
    if (window.confirm(`Excluir definitivamente “${project.name}” e todas as suas tarefas? Esta ação não pode ser desfeita.`)) {
      void onDelete(project.id);
    }
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const created = await onCreate({ name, description: description || null });
    if (created !== null) {
      setName("");
      setDescription("");
      setShowCreateForm(false);
    }
  };

  return (
    <aside className={`project-sidebar${collapsed ? " collapsed" : ""}`} aria-label="Projetos">
      {collapsed ? (
        <button className="sidebar-expand-button brand-expand-button" type="button" aria-label="Mostrar projetos" title="Mostrar projetos" onClick={onToggle}>
          <img src={chronoMark} alt="" />
        </button>
      ) : (
        <>
      <div className="brand-block">
        <img className="brand-mark" src={chronoMark} alt="" />
        <span className="brand-context">Planejamento local</span>
        <button className="sidebar-collapse-button" type="button" aria-label="Recolher projetos" title="Recolher projetos" onClick={onToggle}>‹</button>
      </div>

      <div className="sidebar-heading">
        <h2>Projetos</h2>
        <button
          className="icon-button"
          type="button"
          aria-label="Criar projeto"
          title="Criar projeto"
          disabled={disabled}
          onClick={() => { setShowCreateForm((visible) => !visible); }}
        >+</button>
      </div>

      {showCreateForm ? (
        <form className="create-project-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Nome
            <input autoFocus required value={name} disabled={disabled} onChange={(event) => { setName(event.target.value); }} />
          </label>
          <label>
            Descrição
            <textarea rows={2} value={description} disabled={disabled} onChange={(event) => { setDescription(event.target.value); }} />
          </label>
          <div className="form-actions">
            <button className="primary-button compact" type="submit" disabled={disabled}>Criar</button>
            <button className="text-button" type="button" onClick={() => { setShowCreateForm(false); }}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <nav className="project-list" aria-label="Lista de projetos">
        {visibleProjects.length === 0 ? <p className="sidebar-empty">Nenhum projeto nesta lista.</p> : visibleProjects.map((project) => (
          <button
            className={project.id === selectedProjectId ? "project-item selected" : "project-item"}
            type="button"
            key={project.id}
            aria-current={project.id === selectedProjectId ? "page" : undefined}
            onClick={() => { onSelect(project.id); }}
            onContextMenu={(event) => { openProjectMenu(event, project); }}
          >
            <span className="project-color" aria-hidden="true" />
            <span>
              <strong>{project.name}</strong>
              <small>{PROJECT_STATUS_LABELS[project.status]}{project.isArchived ? " · Arquivado" : ""}</small>
            </span>
          </button>
        ))}
      </nav>

      <label className="archive-toggle">
        <input type="checkbox" checked={showArchived} onChange={(event) => { setShowArchived(event.target.checked); }} />
        Mostrar arquivados
      </label>
      {contextMenu === null ? null : (
        <div
          ref={contextMenuRef}
          className="project-context-menu"
          role="menu"
          aria-label={`Ações de ${contextMenu.project.name}`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <strong>{contextMenu.project.name}</strong>
          <button role="menuitem" type="button" disabled={disabled} onClick={() => {
            setContextMenu(null);
            void onArchive({ ...contextMenu.project, isArchived: !contextMenu.project.isArchived });
          }}>
            {contextMenu.project.isArchived ? "Restaurar projeto" : "Arquivar projeto"}
          </button>
          <button className="danger-menu-item" role="menuitem" type="button" disabled={disabled} onClick={() => { deleteProject(contextMenu.project); }}>
            Excluir projeto…
          </button>
        </div>
      )}
        </>
      )}
    </aside>
  );
}
