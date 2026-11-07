import { useMemo, useState, type SyntheticEvent } from "react";

import { ModalDialog } from "../../components/ModalDialog";
import type { BaselineTask, ProjectBaseline } from "../../domain/planning/baseline";
import type { Task } from "../../domain/tasks/task";
import { useLanguage } from "../../i18n/language";

interface ProjectBaselineControlProps {
  readonly tasks: readonly Task[];
  readonly baselines: readonly ProjectBaseline[];
  readonly activeBaseline: ProjectBaseline | null;
  readonly activeBaselineTasks: readonly BaselineTask[];
  readonly disabled: boolean;
  readonly onCreate: (name: string) => Promise<ProjectBaseline | null>;
  readonly onDelete: () => Promise<boolean>;
}

function displayTimestamp(value: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProjectBaselineControl({
  tasks,
  baselines,
  activeBaseline,
  activeBaselineTasks,
  disabled,
  onCreate,
  onDelete,
}: ProjectBaselineControlProps) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => t("baseline.defaultName"));
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scheduledCount = useMemo(
    () => tasks.filter((task) => task.startDate !== null).length,
    [tasks],
  );

  const submit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await onCreate(name);
      if (created !== null) setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="baseline-control">
      {activeBaseline === null ? (
        <span className="baseline-status">{t("baseline.none")}</span>
      ) : (
        <button
          className="baseline-status active"
          type="button"
          aria-expanded={showHistory}
          onClick={() => { setShowHistory((current) => !current); }}
        >
          {t("baseline.history")} {activeBaseline.name}
        </button>
      )}
      <button
        className="secondary-button"
        type="button"
        disabled={disabled || tasks.length === 0}
        onClick={() => {
          setName(activeBaseline === null ? t("baseline.defaultName") : `${t("baseline.revision")} ${String(baselines.length + 1)}`);
          setOpen(true);
        }}
      >
        {activeBaseline === null ? t("baseline.create") : t("baseline.update")}
      </button>
      {showHistory && activeBaseline !== null ? (
        <div className="baseline-history" role="status">
          <p>{t("baseline.about")}</p>
          <strong>{activeBaseline.name}</strong>
          <span>{displayTimestamp(activeBaseline.createdAt, language)} · {activeBaselineTasks.length} {t("project.tasks")}</span>
          {baselines.filter((baseline) => !baseline.isActive).map((baseline) => (
            <span key={baseline.id}>{t("baseline.previous")} {baseline.name} · {displayTimestamp(baseline.createdAt, language)}</span>
          ))}
          <button
            className="baseline-delete-button"
            type="button"
            disabled={disabled}
            onClick={() => {
              if (window.confirm(t("baseline.deleteConfirm"))) {
                void onDelete().then((deleted) => { if (deleted) setShowHistory(false); });
              }
            }}
          >
            {t("baseline.delete")}
          </button>
        </div>
      ) : null}
      {open ? (
        <ModalDialog
          className="baseline-dialog"
          backdropClassName="dialog-backdrop"
          labelledBy="baseline-dialog-title"
          describedBy="baseline-dialog-description"
          closeDisabled={busy}
          onClose={() => { setOpen(false); }}
        >
          <header>
            <div>
              <h2 id="baseline-dialog-title">{activeBaseline === null ? t("baseline.create") : t("baseline.update")}</h2>
              <p id="baseline-dialog-description">
                {t("baseline.dialogDescription")} {tasks.length} {t("baseline.dialogContinuation")} ({scheduledCount} {t("baseline.scheduledCount")}).
              </p>
            </div>
            <button className="baseline-dialog-close" type="button" aria-label={t("baseline.close")} disabled={busy} onClick={() => { setOpen(false); }}>×</button>
          </header>
          {activeBaseline === null ? null : (
            <p className="baseline-warning">{t("baseline.warning")}</p>
          )}
          <form onSubmit={(event) => { void submit(event); }}>
            <label>{t("baseline.nameLabel")}<input required autoFocus value={name} disabled={busy} onChange={(event) => { setName(event.target.value); }} /></label>
            <footer>
              <button type="button" className="secondary-button" disabled={busy} onClick={() => { setOpen(false); }}>{t("app.cancel")}</button>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? t("baseline.registering") : t("baseline.register")}</button>
            </footer>
          </form>
        </ModalDialog>
      ) : null}
    </div>
  );
}
