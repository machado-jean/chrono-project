import { PROJECT_VIEW_LABELS, type ProjectView } from "./project-view";

interface ProjectViewMenuProps {
  readonly activeView: ProjectView;
  readonly onChange: (view: ProjectView) => void;
}

export function ProjectViewMenu({ activeView, onChange }: ProjectViewMenuProps) {
  return (
    <details className="workspace-menu view-menu" name="workspace-menu">
      <summary>Exibir</summary>
      <div className="workspace-menu-popover view-menu-popover">
        {(Object.keys(PROJECT_VIEW_LABELS) as ProjectView[]).map((view) => (
          <button
            key={view}
            type="button"
            aria-current={activeView === view ? "page" : undefined}
            onClick={(event) => {
              onChange(view);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            <span>{PROJECT_VIEW_LABELS[view]}</span>
            {activeView === view ? <span aria-hidden="true">✓</span> : null}
          </button>
        ))}
      </div>
    </details>
  );
}
