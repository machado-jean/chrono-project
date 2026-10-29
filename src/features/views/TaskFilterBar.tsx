import { TASK_PRIORITIES, TASK_STATUSES } from "../../domain/tasks/task";
import { useLanguage } from "../../i18n/language";
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
  const { priorityLabel, statusLabel, t } = useLanguage();
  const update = (changes: Partial<TaskFilters>): void => {
    onChange({ ...filters, ...changes });
  };

  return (
    <section className="task-filters" aria-labelledby="task-filters-title">
      <div className="filter-heading">
        <div>
          <strong id="task-filters-title">{t("filters.title")}</strong>
          <span aria-live="polite">{String(resultCount)} {t("filters.countJoin")} {String(totalCount)} {t("project.tasks")}</span>
        </div>
        <button
          type="button"
          className="text-button filter-clear"
          onClick={() => { onChange(EMPTY_TASK_FILTERS); }}
        >
          {t("filters.clear")}
        </button>
      </div>
      <div className="filter-grid">
        <label className="filter-search">
          <span>{t("filters.text")}</span>
          <input
            type="search"
            placeholder={t("filters.searchPlaceholder")}
            value={filters.query}
            onChange={(event) => { update({ query: event.target.value }); }}
          />
        </label>
        <label>
          <span>{t("filters.status")}</span>
          <select
            value={filters.status}
            onChange={(event) => {
              update({ status: event.target.value as TaskFilters["status"] });
            }}
          >
            <option value="ALL">{t("filters.allMasc")}</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("filters.priority")}</span>
          <select
            value={filters.priority}
            onChange={(event) => {
              update({ priority: event.target.value as TaskFilters["priority"] });
            }}
          >
            <option value="ALL">{t("filters.allFem")}</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{priorityLabel(priority)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("filters.from")}</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => { update({ dateFrom: event.target.value }); }}
          />
        </label>
        <label>
          <span>{t("filters.to")}</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => { update({ dateTo: event.target.value }); }}
          />
        </label>
        <label>
          <span>{t("filters.schedule")}</span>
          <select
            disabled={!criticalPathAvailable}
            value={filters.criticality}
            onChange={(event) => {
              update({ criticality: event.target.value as TaskFilters["criticality"] });
            }}
          >
            <option value="ALL">{criticalPathAvailable ? t("filters.allFem") : t("filters.disabled")}</option>
            <option value="CRITICAL">{t("filters.critical")}</option>
            <option value="NEAR_CRITICAL">{t("filters.nearCritical")}</option>
          </select>
        </label>
        <div className="filter-multi">
          <span>{t("filters.assignee")}</span>
          <details>
            <summary>{filters.assignees.length === 0 ? t("filters.allMasc") : `${String(filters.assignees.length)} ${filters.assignees.length === 1 ? t("filters.selected") : t("filters.selectedPlural")}`}</summary>
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
                  <span>{assignee === UNASSIGNED_FILTER_VALUE ? t("filters.unassigned") : assignee}</span>
                </label>
              ))}
            </div>
          </details>
        </div>
        <label>
          <span>{t("filters.tag")}</span>
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
