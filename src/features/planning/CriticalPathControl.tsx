import { useState } from "react";

import { ModalDialog } from "../../components/ModalDialog";
import type { Project } from "../../domain/projects/project";
import type { CriticalPathAnalysis } from "../../domain/scheduling/critical-path";

interface CriticalPathControlProps {
  readonly project: Project;
  readonly targetEndDate: string | null;
  readonly analysis: CriticalPathAnalysis;
  readonly open: boolean;
  readonly disabled: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (project: Project) => Promise<boolean>;
}

function displayDate(value: string | null, emptyLabel: string): string {
  if (value === null) return emptyLabel;
  const [year = "", month = "", day = ""] = value.split("-");
  return `${day}/${month}/${year}`;
}

function targetMarginLabel(days: number | null, targetEndDate: string | null, available: boolean): string {
  if (targetEndDate === null) return "Sem meta";
  if (!available || days === null) return "Indisponível";
  if (days === 0) return "Sem margem";
  if (days > 0) return `+${String(days)} dias úteis`;
  return `${String(days)} dias úteis`;
}

export function CriticalPathControl({ project, targetEndDate, analysis, open, disabled, onOpenChange, onSave }: CriticalPathControlProps) {
  const [busy, setBusy] = useState(false);

  const toggle = async (): Promise<void> => {
    const enabling = !project.criticalPathEnabled;
    setBusy(true);
    try {
      const saved = await onSave({ ...project, criticalPathEnabled: enabling });
      if (saved && enabling) onOpenChange(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`critical-path-control${project.criticalPathEnabled ? " active" : ""}`}>
      <span className="critical-path-inline-label">
        <strong>Caminho crítico</strong>
        <small>{project.criticalPathEnabled ? "Ativo" : "Inativo"}</small>
      </span>
      <button
        className="critical-path-switch compact"
        type="button"
        role="switch"
        aria-checked={project.criticalPathEnabled}
        aria-label="Exibir análise do caminho crítico"
        disabled={disabled || busy}
        onClick={() => { void toggle(); }}
      >
        <span className="critical-path-switch-thumb" />
        <span className="critical-path-switch-state">{project.criticalPathEnabled ? "ON" : "OFF"}</span>
      </button>
      <button
        className="critical-path-info"
        type="button"
        aria-label="Entender caminho crítico"
        aria-haspopup="dialog"
        onClick={() => { onOpenChange(true); }}
      >
        i
      </button>

      {open ? (
        <ModalDialog
          className="critical-path-dialog"
          backdropClassName="dialog-backdrop"
          labelledBy="critical-path-dialog-title"
          describedBy="critical-path-dialog-description"
          closeDisabled={busy}
          onClose={() => { onOpenChange(false); }}
        >
          <header>
            <div>
              <h2 id="critical-path-dialog-title">Caminho crítico e meta do projeto</h2>
              <p id="critical-path-dialog-description">Identifique a cadeia que controla o término e acompanhe separadamente a margem até a meta.</p>
            </div>
            <button type="button" aria-label="Fechar caminho crítico" disabled={busy} onClick={() => { onOpenChange(false); }}>×</button>
          </header>

          <div className="critical-path-explainer" aria-label="Exemplo visual do caminho crítico">
            <svg className="critical-path-network" viewBox="0 0 640 210" role="img" aria-labelledby="critical-path-example-title critical-path-example-description">
              <title id="critical-path-example-title">Rede de exemplo com dois caminhos</title>
              <desc id="critical-path-example-description">A atividade A se divide entre B e C. Os dois ramos convergem em D e terminam em E. A, C, D e E formam o caminho crítico de treze dias. B possui três dias de folga.</desc>
              <defs>
                <marker id="network-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
                <marker id="critical-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
              </defs>
              <text className="network-caption" x="18" y="22">Duas rotas possíveis até o mesmo término</text>
              <path className="network-edge critical" d="M 83 108 L 142 108 L 176 153 L 237 153" markerEnd="url(#critical-arrow)" />
              <path className="network-edge" d="M 83 102 L 142 102 L 176 61 L 237 61" markerEnd="url(#network-arrow)" />
              <path className="network-edge" d="M 283 61 L 320 61 L 354 102 L 397 102" markerEnd="url(#network-arrow)" />
              <path className="network-edge critical" d="M 283 153 L 320 153 L 354 108 L 397 108" markerEnd="url(#critical-arrow)" />
              <path className="network-edge critical" d="M 443 105 L 510 105" markerEnd="url(#critical-arrow)" />
              <g className="network-node critical" transform="translate(58 105)"><polygon points="0,-25 25,0 0,25 -25,0" /><text y="4">A</text><text className="duration" y="40">4 dias</text></g>
              <g className="network-node" transform="translate(260 61)"><rect x="-23" y="-20" width="46" height="40" /><text y="4">B</text><text className="duration" y="36">2 dias</text><text className="slack" y="51">folga +3d</text></g>
              <g className="network-node critical" transform="translate(260 153)"><polygon points="0,-25 25,0 0,25 -25,0" /><text y="4">C</text><text className="duration" y="40">5 dias</text></g>
              <g className="network-node critical" transform="translate(420 105)"><polygon points="0,-25 25,0 0,25 -25,0" /><text y="4">D</text><text className="duration" y="40">3 dias</text></g>
              <g className="network-node critical" transform="translate(535 105)"><polygon points="0,-25 25,0 0,25 -25,0" /><text y="4">E</text><text className="duration" y="40">1 dia</text></g>
              <g className="network-finish" transform="translate(605 105)"><line x1="-24" y1="-30" x2="-24" y2="30" /><text x="-14" y="-3">Fim</text><text x="-14" y="13">13d</text></g>
            </svg>
            <div className="critical-path-reading">
              <strong>O caminho crítico é a rota mais longa da rede.</strong>
              <ol>
                <li><b>A → C → D → E</b> soma 13 dias e controla o término: qualquer atraso nessa rota atrasa o projeto.</li>
                <li><b>A → B → D → E</b> soma 10 dias: B pode atrasar até 3 dias sem mudar o término.</li>
                <li>O maior prazo-limite é comparado depois e gera somente a margem global da meta.</li>
              </ol>
            </div>
          </div>

          <div className="critical-path-summary">
            <div className="critical-path-metrics" aria-label="Resumo do caminho crítico e da meta">
              <div>
                <span>Término previsto</span>
                <output>{displayDate(analysis.projectEndDate, "Indisponível")}</output>
              </div>
              <div className={targetEndDate === null ? "missing" : ""}>
                <span>Meta final</span>
                <output>{displayDate(targetEndDate, "Sem prazo-limite")}</output>
              </div>
              <div className="margin">
                <span>Margem global</span>
                <output>{targetMarginLabel(analysis.projectTargetSlackDays, targetEndDate, analysis.available)}</output>
              </div>
            </div>
            <p className="critical-path-metrics-note">A meta é o maior prazo-limite das tarefas não canceladas. Ela não define o caminho crítico; apenas permite calcular a margem global.</p>
            {!analysis.available && analysis.reason !== null ? <p className="critical-path-unavailable" role="status"><strong>Análise indisponível:</strong> {analysis.reason}</p> : null}
            {project.criticalPathEnabled && targetEndDate === null ? <p className="critical-path-missing-target">Sem prazo-limite, o caminho crítico continua disponível; apenas a margem da meta não é calculada.</p> : null}
            <footer>
              <button className="primary-button" type="button" onClick={() => { onOpenChange(false); }}>Entendi</button>
            </footer>
          </div>
        </ModalDialog>
      ) : null}
    </div>
  );
}
