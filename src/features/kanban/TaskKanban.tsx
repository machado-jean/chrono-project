import { useCallback, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { ContextMenu, type ContextMenuItem } from "../../components/ContextMenu";
import type { TaskDependency } from "../../domain/scheduling/dependency";
import {
  buildTaskOutlineNumbers,
  taskOutlineLabel,
  titleWithoutMatchingOutline,
} from "../../domain/tasks/outline-number";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  type Task,
  type TaskStatus,
} from "../../domain/tasks/task";
import { taskSaveWasCancelled, taskSaveSucceeded, type TaskSaveResult } from "../../domain/tasks/task-save";

interface TaskKanbanProps {
  readonly tasks: readonly Task[];
  readonly allProjectTasks: readonly Task[];
  readonly dependencies: readonly TaskDependency[];
  readonly disabled: boolean;
  readonly onSave: (task: Task) => Promise<TaskSaveResult>;
  readonly onDuplicate: (taskId: string, includeDescendants: boolean) => Promise<Task | null>;
  readonly onDelete: (taskId: string) => Promise<boolean>;
}

function taskPath(
  task: Task,
  tasksById: ReadonlyMap<string, Task>,
  outlineNumbers: ReadonlyMap<string, string>,
): string | null {
  const titles: string[] = [];
  let parentId = task.parentId;
  const visited = new Set<string>();
  while (parentId !== null && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = tasksById.get(parentId);
    if (parent === undefined) break;
    titles.unshift(taskOutlineLabel(parent, outlineNumbers));
    parentId = parent.parentId;
  }
  return titles.length === 0 ? null : titles.join(" › ");
}

function taskDates(task: Task): string {
  if (task.startDate === null || task.endDate === null) return "Sem cronograma";
  const formatDate = (date: string): string => {
    const [year, month, day] = date.split("-");
    return year === undefined || month === undefined || day === undefined
      ? date
      : `${day}/${month}/${year}`;
  };
  return task.startDate === task.endDate
    ? formatDate(task.startDate)
    : `${formatDate(task.startDate)} → ${formatDate(task.endDate)}`;
}

export function TaskKanban({
  tasks,
  allProjectTasks,
  dependencies,
  disabled,
  onSave,
  onDuplicate,
  onDelete,
}: TaskKanbanProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    readonly task: Task;
    readonly x: number;
    readonly y: number;
  } | null>(null);
  const contextMenuButtonRef = useRef<HTMLButtonElement>(null);
  const tasksById = useMemo(
    () => new Map(allProjectTasks.map((task) => [task.id, task])),
    [allProjectTasks],
  );
  const summaryIds = useMemo(
    () => new Set(allProjectTasks.flatMap((task) => task.parentId === null ? [] : [task.parentId])),
    [allProjectTasks],
  );
  const outlineNumbers = useMemo(
    () => buildTaskOutlineNumbers(allProjectTasks),
    [allProjectTasks],
  );

  const changeStatus = async (task: Task, status: TaskStatus): Promise<void> => {
    if (disabled || task.status === status) return;
    setSavingTaskId(task.id);
    setLocalError(null);
    try {
      const saved = await onSave({ ...task, status });
      if (taskSaveSucceeded(saved)) {
        setAnnouncement(`${task.title} movida para ${TASK_STATUS_LABELS[status]}.`);
      } else if (!taskSaveWasCancelled(saved)) {
        setLocalError("Não foi possível salvar o novo status. A tarefa permaneceu na coluna anterior.");
      }
    } catch {
      setLocalError("Não foi possível salvar o novo status. A tarefa permaneceu na coluna anterior.");
    } finally {
      setSavingTaskId(null);
    }
  };

  const statusAtPoint = (clientX: number, clientY: number): TaskStatus | null => {
    const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-kanban-status]");
    const status = element?.dataset.kanbanStatus;
    return TASK_STATUSES.find((candidate) => candidate === status) ?? null;
  };

  const finishPointerDrag = (event: PointerEvent<HTMLButtonElement>): void => {
    const taskId = draggedTaskId;
    const status = statusAtPoint(event.clientX, event.clientY) ?? dropTargetStatus;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggedTaskId(null);
    setDropTargetStatus(null);
    if (taskId === null || status === null) return;
    const task = allProjectTasks.find((candidate) => candidate.id === taskId);
    if (task !== undefined) void changeStatus(task, status);
  };

  const closeContextMenu = useCallback((): void => { setContextMenu(null); }, []);

  const openContextMenu = (event: MouseEvent<HTMLElement>, task: Task): void => {
    if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']") !== null) return;
    event.preventDefault();
    setContextMenu({ task, x: event.clientX, y: event.clientY });
  };

  const contextMenuItems: readonly ContextMenuItem[] = contextMenu === null ? [] : [
    ...TASK_STATUSES
      .filter((status) => status !== contextMenu.task.status)
      .map((status) => ({
        id: `status-${status}`,
        label: `Mover para ${TASK_STATUS_LABELS[status]}`,
        disabled: disabled || savingTaskId === contextMenu.task.id,
        onSelect: () => { void changeStatus(contextMenu.task, status); },
      } satisfies ContextMenuItem)),
    {
      id: "duplicate",
      label: "Duplicar tarefa",
      separatorBefore: true,
      disabled,
      onSelect: () => { void onDuplicate(contextMenu.task.id, false); },
    },
    ...(summaryIds.has(contextMenu.task.id) ? [{
      id: "duplicate-tree",
      label: "Duplicar tarefa e subtarefas",
      disabled,
      onSelect: () => { void onDuplicate(contextMenu.task.id, true); },
    } satisfies ContextMenuItem] : []),
    {
      id: "delete",
      label: "Excluir tarefa…",
      danger: true,
      separatorBefore: true,
      disabled,
      onSelect: () => {
        if (window.confirm(`Excluir “${contextMenu.task.title}” e todas as suas subtarefas? Esta ação não pode ser desfeita.`)) {
          void onDelete(contextMenu.task.id);
        }
      },
    },
  ];

  return (
    <section className="kanban-section" aria-labelledby="kanban-title">
      <header className="view-heading">
        <div>
          <h2 id="kanban-title">Quadro Kanban</h2>
          <p>Arraste um cartão ou altere o campo “Status”.</p>
        </div>
        <span>{String(tasks.length)} tarefa{tasks.length === 1 ? "" : "s"}</span>
      </header>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
      {localError === null ? null : <p className="field-error kanban-error" role="alert">{localError}</p>}

      {tasks.length === 0 ? (
        <div className="view-empty" role="status">
          <strong>Nenhuma tarefa corresponde aos filtros.</strong>
          <span>Limpe ou ajuste os filtros para recuperar os cartões.</span>
        </div>
      ) : (
        <div className="kanban-board" aria-label="Tarefas organizadas por status">
          {TASK_STATUSES.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status);
            return (
              <section
                key={status}
                className={`kanban-column status-${status.toLocaleLowerCase().replace("_", "-")}${dropTargetStatus === status ? " drop-target" : ""}`}
                aria-labelledby={`kanban-${status}`}
                data-kanban-status={status}
              >
                <header>
                  <h3 id={`kanban-${status}`}>{TASK_STATUS_LABELS[status]}</h3>
                  <span aria-label={`${String(columnTasks.length)} tarefas`}>{String(columnTasks.length)}</span>
                </header>
                <div className="kanban-cards">
                  {columnTasks.length === 0 ? (
                    <p className="kanban-column-empty">Solte uma tarefa aqui</p>
                  ) : columnTasks.map((task) => {
                    const predecessors = dependencies.filter(
                      (dependency) => dependency.successorId === task.id,
                    ).length;
                    const path = taskPath(task, tasksById, outlineNumbers);
                    const outlineNumber = outlineNumbers.get(task.id) ?? "";
                    const isSaving = savingTaskId === task.id;
                    return (
                      <article
                        key={task.id}
                        className={`kanban-card${draggedTaskId === task.id ? " dragging" : ""}`}
                        aria-busy={isSaving}
                        onContextMenu={(event) => { openContextMenu(event, task); }}
                      >
                        {path === null ? null : <span className="kanban-path">{path}</span>}
                        <div className="kanban-card-title">
                          <div>
                            <button
                              className="kanban-drag-handle"
                              type="button"
                              aria-label={`Arrastar ${task.title}`}
                              title="Arrastar para outra coluna"
                              disabled={disabled || isSaving}
                              onPointerDown={(event) => {
                                if (event.button !== 0) return;
                                event.preventDefault();
                                event.currentTarget.setPointerCapture(event.pointerId);
                                setDraggedTaskId(task.id);
                                setDropTargetStatus(task.status);
                                setLocalError(null);
                              }}
                              onPointerMove={(event) => {
                                if (draggedTaskId !== task.id) return;
                                const status = statusAtPoint(event.clientX, event.clientY);
                                if (status !== dropTargetStatus) setDropTargetStatus(status);
                              }}
                              onPointerUp={finishPointerDrag}
                              onPointerCancel={(event) => {
                                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                  event.currentTarget.releasePointerCapture(event.pointerId);
                                }
                                setDraggedTaskId(null);
                                setDropTargetStatus(null);
                              }}
                            >
                              <span aria-hidden="true">⠿</span>
                            </button>
                            <span className="kanban-outline-number">{outlineNumber}.</span>
                            <strong>{titleWithoutMatchingOutline(task.title, outlineNumber)}</strong>
                          </div>
                          <div className="kanban-card-actions">
                            {summaryIds.has(task.id) ? <span>Resumo</span> : null}
                            <button
                              ref={contextMenu?.task.id === task.id ? contextMenuButtonRef : undefined}
                              type="button"
                              aria-label={`Mais ações para ${task.title}`}
                              aria-haspopup="menu"
                              aria-expanded={contextMenu?.task.id === task.id}
                              disabled={disabled || isSaving}
                              onClick={(event) => {
                                const bounds = event.currentTarget.getBoundingClientRect();
                                setContextMenu({ task, x: bounds.right, y: bounds.bottom });
                              }}
                            >⋯</button>
                          </div>
                        </div>
                        <div className="kanban-meta">
                          <span className={`priority priority-${task.priority.toLocaleLowerCase()}`}>
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </span>
                          <span>{taskDates(task)}</span>
                        </div>
                        <div className="kanban-progress" aria-label={`Progresso: ${String(task.progress)}%`}>
                          <span style={{ width: `${String(task.progress)}%` }} />
                        </div>
                        <div className="kanban-card-footer">
                          <span>{String(task.progress)}%</span>
                          {predecessors > 0 ? <span>{String(predecessors)} pred.</span> : null}
                          {task.assignee === null ? null : <span>{task.assignee}</span>}
                        </div>
                        {task.tags.length === 0 ? null : (
                          <ul className="kanban-tags" aria-label="Tags">
                            {task.tags.map((tag) => <li key={tag}>{tag}</li>)}
                          </ul>
                        )}
                        <label className="kanban-move">
                          <span>Status</span>
                          <select
                            aria-label={`Status de ${task.title}`}
                            value={task.status}
                            disabled={disabled || isSaving}
                            onChange={(event) => {
                              void changeStatus(task, event.target.value as TaskStatus);
                            }}
                          >
                            {TASK_STATUSES.map((candidate) => (
                              <option value={candidate} key={candidate}>
                                {TASK_STATUS_LABELS[candidate]}
                              </option>
                            ))}
                          </select>
                        </label>
                        {isSaving ? <span className="sr-only" role="status">Salvando status de {task.title}</span> : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {contextMenu === null ? null : (
        <ContextMenu
          ariaLabel={`Ações de ${contextMenu.task.title}`}
          heading={contextMenu.task.title}
          items={contextMenuItems}
          returnFocusRef={contextMenuButtonRef}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </section>
  );
}
