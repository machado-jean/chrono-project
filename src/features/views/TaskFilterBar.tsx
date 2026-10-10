import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "../../domain/tasks/task";
import { EMPTY_TASK_FILTERS, UNASSIGNED_FILTER_VALUE, type TaskFilters } from "./task-filters";

interface TaskFilterBarProps {
  readonly filters: TaskFilters;
  readonly resultCount: number;
  readonly totalCount: number;
  readonly availableAssignees: readonly string[];
  readonly criticalPathAvailable: boolean;
  readonly onChange: (filters: TaskFilters) => void;
}

export function TaskFilterBar({
  filters,
  resultCount,
  totalCount,
  availableAssignees,
  criticalPathAvailable,
  onChange,
}: TaskFilterBarProps) {
  const update = (changes: Partial<TaskFilters>): void => {
    onChange({ ...filters, ...changes });
  };

  return (
    <section className="task-filters" aria-labelledby="task-filters-title">
      <div className="filter-heading">
        <div>
          <strong id="task-filters-title">Localizar e filtrar</strong>
          <span aria-live="polite">{String(resultCount)} de {String(totalCount)} tarefas</span>
        </div>
        <button
          type="button"
          className="text-button filter-clear"
          onClick={() => { onChange(EMPTY_TASK_FILTERS); }}
        >
          Limpar filtros
        </button>
      </div>
      <div className="filter-grid">
        <label className="filter-search">
          <span>Texto</span>
          <input
            type="search"
            placeholder="Título, código, responsável…"
            value={filters.query}
            onChange={(event) => { update({ query: event.target.value }); }}
          />
        </label>
        <label>
          <span>Status</span>
          <select
            value={filters.status}
            onChange={(event) => {
              update({ status: event.target.value as TaskFilters["status"] });
            }}
          >
            <option value="ALL">Todos</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>{TASK_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Prioridade</span>
          <select
            value={filters.priority}
            onChange={(event) => {
              update({ priority: event.target.value as TaskFilters["priority"] });
            }}
          >
            <option value="ALL">Todas</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{TASK_PRIORITY_LABELS[priority]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>De</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => { update({ dateFrom: event.target.value }); }}
          />
        </label>
        <label>
          <span>Até</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => { update({ dateTo: event.target.value }); }}
          />
        </label>
        <label>
          <span>Cronograma</span>
          <select
            disabled={!criticalPathAvailable}
            value={filters.criticality}
            onChange={(event) => {
              update({ criticality: event.target.value as TaskFilters["criticality"] });
            }}
          >
            <option value="ALL">{criticalPathAvailable ? "Todas" : "Desativado"}</option>
            <option value="CRITICAL">Caminho crítico</option>
            <option value="NEAR_CRITICAL">Próximas do crítico</option>
          </select>
        </label>
        <div className="filter-multi">
          <span>Responsável</span>
          <details>
            <summary>{filters.assignees.length === 0 ? "Todos" : `${String(filters.assignees.length)} selecionado${filters.assignees.length === 1 ? "" : "s"}`}</summary>
            <div className="filter-multi-options">
              {[UNASSIGNED_FILTER_VALUE, ...availableAssignees].map((assignee) => (
                <label key={assignee}>
                  <input
                    type="checkbox"
                    checked={filters.assignees.includes(assignee)}
                    onChange={(event) => {
                      update({ assignees: event.target.checked
                        ? [...filters.assignees, assignee]
                        : filters.assignees.filter((candidate) => candidate !== assignee) });
                    }}
                  />
                  <span>{assignee === UNASSIGNED_FILTER_VALUE ? "Sem responsável" : assignee}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
        <label>
          <span>Tag</span>
          <input
            type="search"
            placeholder="Ex.: frontend"
            value={filters.tag}
            onChange={(event) => { update({ tag: event.target.value }); }}
          />
        </label>
      </div>
    </section>
  );
}
