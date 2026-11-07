import { useState, type ReactNode } from "react";

import {
  PROJECT_STATUSES,
  type Project,
  type ProjectStatus,
} from "../../domain/projects/project";
import { useLanguage } from "../../i18n/language";

interface ProjectHeaderProps {
  readonly project: Project;
  readonly taskCount: number;
  readonly disabled: boolean;
  readonly tools?: ReactNode;
  readonly onSave: (project: Project) => Promise<boolean>;
}

export function ProjectHeader({
  project,
  taskCount,
  disabled,
  tools,
  onSave,
}: ProjectHeaderProps) {
  const { projectStatusLabel, t } = useLanguage();
  const [draft, setDraft] = useState(project);
  const [dirty, setDirty] = useState(false);

  const updateDraft = (patch: Partial<Project>): void => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const save = async (): Promise<void> => {
    if (await onSave(draft)) setDirty(false);
  };

  return (
    <header className="project-header">
      <div className="project-heading-fields">
        <label className="sr-only" htmlFor="project-name">{t("project.nameLabel")}</label>
        <input id="project-name" className="project-name-input" value={draft.name} disabled={disabled} onChange={(event) => { updateDraft({ name: event.target.value }); }} />
        <label className="sr-only" htmlFor="project-description">{t("project.descriptionLabel")}</label>
        <input id="project-description" className="project-description-input" placeholder={t("project.descriptionPlaceholder")} value={draft.description ?? ""} disabled={disabled} onChange={(event) => { updateDraft({ description: event.target.value || null }); }} />
        <span className="project-meta">{taskCount} {taskCount === 1 ? t("project.task") : t("project.tasks")}</span>
      </div>

      <div className="project-header-actions">
        <div className="project-status-actions">
          <label>
            <span className="sr-only">{t("project.status")}</span>
            <select value={draft.status} disabled={disabled} onChange={(event) => { updateDraft({ status: event.target.value as ProjectStatus }); }}>
              {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{projectStatusLabel(status)}</option>)}
            </select>
          </label>
          {dirty ? <button className="primary-button" type="button" disabled={disabled} onClick={() => void save()}>{t("project.save")}</button> : null}
        </div>
        {tools}
      </div>
    </header>
  );
}
