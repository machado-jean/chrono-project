export type ProjectView = "TABLE" | "KANBAN" | "GANTT";

export const PROJECT_VIEW_LABELS: Readonly<Record<ProjectView, string>> = {
  TABLE: "Tabela",
  KANBAN: "Kanban",
  GANTT: "Gantt",
};
