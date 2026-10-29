import { useState } from "react";

import { ModalDialog } from "../../components/ModalDialog";
import type { Project } from "../../domain/projects/project";
import type { CriticalPathAnalysis } from "../../domain/scheduling/critical-path";
import { useLanguage } from "../../i18n/language";

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

export function CriticalPathControl({ project, targetEndDate, analysis, open, disabled, onOpenChange, onSave }: CriticalPathControlProps) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const targetMarginLabel = (days: number | null): string => {
    if (targetEndDate === null) return t("critical.noTarget");
    if (!analysis.available || days === null) return t("critical.unavailable");
    if (days === 0) return t("critical.noMargin");
    return `${days > 0 ? "+" : ""}${String(days)} ${t("critical.workDays")}`;
  };

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
        <strong>{t("critical.title")}</strong>
        <small>{project.criticalPathEnabled ? t("critical.active") : t("critical.inactive")}</small>
      </span>
      <button
        className="critical-path-switch compact"
        type="button"
        role="switch"
        aria-checked={project.criticalPathEnabled}
        aria-label={t("critical.toggle")}
        disabled={disabled || busy}
        onClick={() => { void toggle(); }}
      >
        <span className="critical-path-switch-thumb" />
        <span className="critical-path-switch-state">{project.criticalPathEnabled ? "ON" : "OFF"}</span>
      </button>
      <button
        className="critical-path-info"
        type="button"
        aria-label={t("critical.help")}
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
              <h2 id="critical-path-dialog-title">{t("critical.dialogTitle")}</h2>
              <p id="critical-path-dialog-description">{t("critical.dialogDescription")}</p>
            </div>
            <button type="button" aria-label={t("critical.close")} disabled={busy} onClick={() => { onOpenChange(false); }}>×</button>
          </header>

          <div className="critical-path-explainer" aria-label={t("critical.exampleLabel")}>
            <svg className="critical-path-network" viewBox="0 0 640 210" role="img" aria-labelledby="critical-path-example-title critical-path-example-description">
              <title id="critical-path-example-title">{t("critical.exampleTitle")}</title>
              <desc id="critical-path-example-description">{t("critical.exampleDescription")}</desc>
              <defs>
                <marker id="network-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
                <marker id="critical-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
              </defs>
              <text className="network-caption" x="18" y="22">{t("critical.caption")}</text>
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
              <strong>{t("critical.explanation")}</strong>
              <ol>
                <li>{t("critical.pathOne")}</li>
                <li>{t("critical.pathTwo")}</li>
                <li>{t("critical.pathThree")}</li>
              </ol>
            </div>
          </div>

          <div className="critical-path-summary">
            <div className="critical-path-metrics" aria-label={t("critical.summary")}>
              <div>
                <span>{t("critical.projectEnd")}</span>
                <output>{displayDate(analysis.projectEndDate, t("critical.unavailable"))}</output>
              </div>
              <div className={targetEndDate === null ? "missing" : ""}>
                <span>{t("critical.finalTarget")}</span>
                <output>{displayDate(targetEndDate, t("critical.noDeadline"))}</output>
              </div>
              <div className="margin">
                <span>{t("critical.globalMargin")}</span>
                <output>{targetMarginLabel(analysis.projectTargetSlackDays)}</output>
              </div>
            </div>
            <p className="critical-path-metrics-note">{t("critical.targetNote")}</p>
            {!analysis.available && analysis.reason !== null ? <p className="critical-path-unavailable" role="status"><strong>{t("critical.analysisUnavailable")}</strong> {analysis.reason}</p> : null}
            {project.criticalPathEnabled && targetEndDate === null ? <p className="critical-path-missing-target">{t("critical.missingTarget")}</p> : null}
            <footer>
              <button className="primary-button" type="button" onClick={() => { onOpenChange(false); }}>{t("critical.understood")}</button>
            </footer>
          </div>
        </ModalDialog>
      ) : null}
    </div>
  );
}
