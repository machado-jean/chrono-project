import type { Project } from "../../domain/projects/project";
import { useLanguage } from "../../i18n/language";

interface ProjectActionsMenuProps {
  readonly project: Project;
  readonly disabled: boolean;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoLabel: string | null;
  readonly redoLabel: string | null;
  readonly historyEntries: readonly {
    readonly label: string;
    readonly state: "APPLIED" | "UNDONE";
  }[];
  readonly onUndo: () => Promise<boolean>;
  readonly onRedo: () => Promise<boolean>;
  readonly onSave: (project: Project) => Promise<boolean>;
  readonly onMove: (projectId: string, direction: "up" | "down") => Promise<boolean>;
  readonly onDelete: (projectId: string) => Promise<boolean>;
  readonly onDuplicate: (projectId: string) => Promise<Project | null>;
}

export function ProjectActionsMenu({
  project,
  disabled,
  canMoveUp,
  canMoveDown,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  historyEntries,
  onUndo,
  onRedo,
  onSave,
  onMove,
  onDelete,
  onDuplicate,
}: ProjectActionsMenuProps) {
  const { language, t } = useLanguage();
  const confirmDelete = (): void => {
    if (window.confirm(language === "en" ? `Permanently delete “${project.name}” and all its tasks? This action cannot be undone.` : `Excluir definitivamente “${project.name}” e todas as suas tarefas? Esta ação não pode ser desfeita.`)) {
      void onDelete(project.id);
    }
  };

  return (
    <details className="workspace-menu project-actions-menu" name="workspace-menu">
      <summary>{t("menu.edit")}</summary>
      <div className="workspace-menu-popover project-actions-popover">
        <button type="button" aria-keyshortcuts="Control+Z" disabled={disabled || !canUndo} title={undoLabel ?? t("edit.noUndo")} onClick={() => { void onUndo(); }}>
          <span>{undoLabel === null ? t("edit.undo") : `${t("edit.undo")} — ${undoLabel}`}</span><kbd>Ctrl+Z</kbd>
        </button>
        <button type="button" aria-keyshortcuts="Control+Shift+Z" disabled={disabled || !canRedo} title={redoLabel ?? t("edit.noRedo")} onClick={() => { void onRedo(); }}>
          <span>{redoLabel === null ? t("edit.redo") : `${t("edit.redo")} — ${redoLabel}`}</span><kbd>Ctrl+Shift+Z</kbd>
        </button>
        <details className="edit-history-panel">
          <summary>{t("edit.history")}</summary>
          <ol>
            {historyEntries.length === 0 ? <li className="empty">{t("edit.noHistory")}</li> : historyEntries.slice(0, 12).map((entry, index) => (
              <li key={`${entry.state}-${String(index)}-${entry.label}`} className={entry.state === "UNDONE" ? "undone" : ""}>
                <span>{entry.label}</span><small>{entry.state === "UNDONE" ? t("edit.undone") : t("edit.applied")}</small>
              </li>
            ))}
          </ol>
        </details>
        <hr />
        <button type="button" disabled={disabled || !canMoveUp} onClick={() => { void onMove(project.id, "up"); }}>{t("edit.moveUp")}</button>
        <button type="button" disabled={disabled || !canMoveDown} onClick={() => { void onMove(project.id, "down"); }}>{t("edit.moveDown")}</button>
        <hr />
        <button type="button" disabled={disabled} onClick={() => { void onDuplicate(project.id); }}>{t("edit.duplicateProject")}</button>
        <button type="button" disabled={disabled} onClick={() => { void onSave({ ...project, isArchived: !project.isArchived }); }}>
          {project.isArchived ? t("edit.restoreProject") : t("edit.archiveProject")}
        </button>
        <button className="danger-menu-item" type="button" disabled={disabled} onClick={confirmDelete}>{t("edit.deleteProject")}</button>
      </div>
    </details>
  );
}
