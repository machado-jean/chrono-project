import { useMemo, useState, type SyntheticEvent } from "react";

import { ModalDialog } from "../../components/ModalDialog";
import type { BaselineTask, ProjectBaseline } from "../../domain/planning/baseline";
import type { Task } from "../../domain/tasks/task";

interface ProjectBaselineControlProps {
  readonly tasks: readonly Task[];
  readonly baselines: readonly ProjectBaseline[];
  readonly activeBaseline: ProjectBaseline | null;
  readonly activeBaselineTasks: readonly BaselineTask[];
  readonly disabled: boolean;
  readonly onCreate: (name: string) => Promise<ProjectBaseline | null>;
  readonly onDelete: () => Promise<boolean>;
}

function displayTimestamp(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Plano aprovado");
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
        <span className="baseline-status">Sem plano de referência</span>
      ) : (
        <button
          className="baseline-status active"
          type="button"
          aria-expanded={showHistory}
          onClick={() => { setShowHistory((current) => !current); }}
        >
          Plano de referência: {activeBaseline.name}
        </button>
      )}
      <button
        className="secondary-button"
        type="button"
        disabled={disabled || tasks.length === 0}
        onClick={() => {
          setName(activeBaseline === null ? "Plano aprovado" : `Revisão ${String(baselines.length + 1)}`);
          setOpen(true);
        }}
      >
        {activeBaseline === null ? "Criar plano de referência" : "Atualizar plano de referência"}
      </button>
      {showHistory && activeBaseline !== null ? (
        <div className="baseline-history" role="status">
          <p>É uma fotografia do planejamento aprovada para comparar mudanças futuras. Ela não altera as tarefas atuais.</p>
          <strong>{activeBaseline.name}</strong>
          <span>{displayTimestamp(activeBaseline.createdAt)} · {activeBaselineTasks.length} tarefas</span>
          {baselines.filter((baseline) => !baseline.isActive).map((baseline) => (
            <span key={baseline.id}>Anterior: {baseline.name} · {displayTimestamp(baseline.createdAt)}</span>
          ))}
          <button
            className="baseline-delete-button"
            type="button"
            disabled={disabled}
            onClick={() => {
              if (window.confirm("Excluir o plano de referência e todo o histórico de revisões? As tarefas atuais não serão alteradas.")) {
                void onDelete().then((deleted) => { if (deleted) setShowHistory(false); });
              }
            }}
          >
            Excluir plano e histórico
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
              <h2 id="baseline-dialog-title">{activeBaseline === null ? "Criar plano de referência" : "Atualizar plano de referência"}</h2>
              <p id="baseline-dialog-description">
                Essa fotografia guardará as datas planejadas, a duração e o progresso de {tasks.length} tarefas ({scheduledCount} com cronograma).
              </p>
            </div>
            <button className="baseline-dialog-close" type="button" aria-label="Fechar plano de referência" disabled={busy} onClick={() => { setOpen(false); }}>×</button>
          </header>
          {activeBaseline === null ? null : (
            <p className="baseline-warning">O plano de referência atual continuará no histórico, e esta nova fotografia passará a ser usada nas comparações.</p>
          )}
          <form onSubmit={(event) => { void submit(event); }}>
            <label>Nome do plano de referência<input required autoFocus value={name} disabled={busy} onChange={(event) => { setName(event.target.value); }} /></label>
            <footer>
              <button type="button" className="secondary-button" disabled={busy} onClick={() => { setOpen(false); }}>Cancelar</button>
              <button type="submit" className="primary-button" disabled={busy}>{busy ? "Registrando…" : "Registrar plano"}</button>
            </footer>
          </form>
        </ModalDialog>
      ) : null}
    </div>
  );
}
