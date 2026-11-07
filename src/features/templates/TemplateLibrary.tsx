import { useState, type SyntheticEvent } from "react";

import type { TaskTemplate, TaskTemplateItem } from "../../domain/templates/template";
import { useLanguage } from "../../i18n/language";

interface TemplateLibraryProps {
  readonly templates: readonly TaskTemplate[];
  readonly items: readonly TaskTemplateItem[];
  readonly projectName: string;
  readonly disabled: boolean;
  readonly onApply: (templateId: string, startDate: string) => Promise<unknown>;
  readonly onDelete: (templateId: string) => Promise<boolean>;
}

function localToday(): string {
  const today = new Date();
  const year = String(today.getFullYear());
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TemplateLibrary({
  templates,
  items,
  projectName,
  disabled,
  onApply,
  onDelete,
}: TemplateLibraryProps) {
  const { language, t } = useLanguage();
  const [startDates, setStartDates] = useState<Readonly<Record<string, string>>>({});

  const apply = async (
    event: SyntheticEvent<HTMLFormElement>,
    templateId: string,
  ): Promise<void> => {
    event.preventDefault();
    await onApply(templateId, startDates[templateId] ?? localToday());
  };

  return (
    <details className="workspace-menu template-library" name="workspace-menu">
      <summary>
        <span>{t("menu.templates")}</span>
        <span className="template-count">{templates.length}</span>
      </summary>
      <div className="workspace-menu-popover template-library-content">
        <div className="template-library-heading">
          <div>
            <h2>{t("template.applyStructure")}</h2>
            <p>{t("template.destination")} <strong>{projectName}</strong>. {language === "en" ? "Dates will be calculated by the scheduler." : "Datas serão calculadas pelo scheduler."}</p>
          </div>
        </div>
        {templates.length === 0 ? (
          <p className="template-empty">{t("template.empty")}</p>
        ) : (
          <ul className="template-list">
            {templates.map((template) => {
              const taskCount = items.filter((item) => item.templateId === template.id).length;
              return (
                <li className="template-card" key={template.id}>
                  <div className="template-card-copy">
                    <strong>{template.name}</strong>
                    {template.description === null ? null : <span>{template.description}</span>}
                    <small>{taskCount} {language === "en" ? (taskCount === 1 ? "task" : "tasks") : (taskCount === 1 ? "tarefa" : "tarefas")}</small>
                  </div>
                  <form onSubmit={(event) => { void apply(event, template.id); }}>
                    <label>
                      {t("template.startDate")}
                      <input
                        type="date"
                        required
                        value={startDates[template.id] ?? localToday()}
                        disabled={disabled}
                        onChange={(event) => {
                          setStartDates((current) => ({
                            ...current,
                            [template.id]: event.target.value,
                          }));
                        }}
                      />
                    </label>
                    <button className="primary-button" type="submit" disabled={disabled}>{t("template.apply")}</button>
                    <button
                      className="danger-button"
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (window.confirm(language === "en" ? `Delete template “${template.name}”? Tasks already applied will not be changed.` : `Excluir o template “${template.name}”? As tarefas já aplicadas não serão alteradas.`)) {
                          void onDelete(template.id);
                        }
                      }}
                    >
                      {t("template.delete")}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
