import { describe, expect, it } from "vitest";

import type { Calendar } from "../../../src/domain/calendars/calendar";
import type { TaskDependency } from "../../../src/domain/scheduling/dependency";
import type { Task } from "../../../src/domain/tasks/task";
import {
  buildTaskOutlineNumbers,
  taskOutlineLabel,
  titleWithoutMatchingOutline,
} from "../../../src/domain/tasks/outline-number";
import {
  buildGanttProjection,
  calculateGanttDateRange,
  dateOnlyToLocalDate,
  ganttCalendarClass,
  localDateToDateOnly,
} from "../../../src/features/gantt/gantt-adapter";
import {
  EMPTY_TASK_FILTERS,
  filterTasks,
  includeTaskAncestors,
} from "../../../src/features/views/task-filters";

const NOW = "2026-08-28T12:00:00.000Z";
const PROJECT_ID = "10000000-0000-4000-8000-000000000001";
const PARENT_ID = "20000000-0000-4000-8000-000000000001";
const CHILD_ID = "20000000-0000-4000-8000-000000000002";
const SUCCESSOR_ID = "20000000-0000-4000-8000-000000000003";

function task(id: string, title: string, changes: Partial<Task> = {}): Task {
  return {
    id,
    code: null,
    projectId: PROJECT_ID,
    parentId: null,
    calendarId: null,
    title,
    description: null,
    status: "NOT_STARTED",
    priority: "NORMAL",
    progress: 0,
    startDate: "2026-08-28",
    endDate: "2026-08-28",
    durationDays: 1,
    deadlineDate: null,
    schedulingMode: "AUTO",
    position: 0,
    assignee: null,
    tags: [],
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...changes,
  };
}

describe("filtros compartilhados das visualizações", () => {
  const parent = task(PARENT_ID, "Entrega principal", { priority: "HIGH" });
  const child = task(CHILD_ID, "Implementar frontend", {
    parentId: PARENT_ID,
    position: 0,
    status: "IN_PROGRESS",
    tags: ["Frontend", "React"],
    assignee: "Ana",
  });
  const successor = task(SUCCESSOR_ID, "Publicar manual", {
    position: 1,
    status: "COMPLETED",
    priority: "LOW",
    startDate: "2026-09-04",
    endDate: "2026-09-04",
  });
  const tasks = [parent, child, successor];

  it("combina texto, status, prioridade, conclusão, datas e tags", () => {
    expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, query: "ana" })).toEqual([child]);
    expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, status: "IN_PROGRESS" })).toEqual([child]);
    expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, priority: "HIGH" })).toEqual([parent]);
    expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, completion: "COMPLETED" })).toEqual([successor]);
    expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, completion: "OPEN" })).toEqual([parent, child]);
    expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, dateFrom: "2026-09-01" })).toEqual([successor]);
    expect(filterTasks(tasks, { ...EMPTY_TASK_FILTERS, tag: "react" })).toEqual([child]);
  });

  it("inclui ancestrais somente como contexto de hierarquia", () => {
    const visibleIds = includeTaskAncestors(tasks, [child]);
    expect(visibleIds).toEqual(new Set([CHILD_ID, PARENT_ID]));
    expect(visibleIds.has(SUCCESSOR_ID)).toBe(false);
  });
});

describe("numeração hierárquica das tarefas", () => {
  it("deriva números da posição e da profundidade sem alterar o título", () => {
    const first = task(PARENT_ID, "1. Entrega principal");
    const child = task(CHILD_ID, "Implementar frontend", { parentId: PARENT_ID });
    const grandchild = task(SUCCESSOR_ID, "Validar interface", { parentId: CHILD_ID });
    const second = task("20000000-0000-4000-8000-000000000004", "Documentação", {
      position: 1,
    });

    const outlineNumbers = buildTaskOutlineNumbers([first, child, grandchild, second]);

    expect([...outlineNumbers.entries()]).toEqual([
      [PARENT_ID, "1"],
      [CHILD_ID, "1.1"],
      [SUCCESSOR_ID, "1.1.1"],
      [second.id, "2"],
    ]);
    expect(taskOutlineLabel(first, outlineNumbers)).toBe("1. Entrega principal");
    expect(titleWithoutMatchingOutline(first.title, "1")).toBe("Entrega principal");
    expect(first.title).toBe("1. Entrega principal");
  });
});

describe("adaptador do Gantt", () => {
  it("mantém date-only no fuso local", () => {
    const date = dateOnlyToLocalDate("2026-08-28");
    expect(localDateToDateOnly(date)).toBe("2026-08-28");
  });

  it("amplia a janela em uma semana antes e um mês depois", () => {
    const first = task(CHILD_ID, "Primeira", {
      startDate: "2026-09-14",
      endDate: "2026-09-15",
      durationDays: 2,
    });
    const last = task(SUCCESSOR_ID, "Última", {
      startDate: "2026-09-28",
      endDate: "2026-09-30",
      durationDays: 3,
    });

    const range = calculateGanttDateRange([first, last]);

    expect(localDateToDateOnly(range?.start as Date)).toBe("2026-09-07");
    expect(localDateToDateOnly(range?.end as Date)).toBe("2026-10-31");
  });

  it("limita corretamente o mês adicional quando o dia não existe", () => {
    const january = task(CHILD_ID, "Fim de janeiro", {
      startDate: "2026-01-31",
      endDate: "2026-01-31",
    });

    const range = calculateGanttDateRange([january]);

    expect(localDateToDateOnly(range?.end as Date)).toBe("2026-03-01");
  });

  it("projeta hierarquia, progresso e dependência FS sem duplicar tarefas", () => {
    const parent = task(PARENT_ID, "Resumo", { endDate: "2026-08-31", durationDays: 2 });
    const child = task(CHILD_ID, "Primeira", { parentId: PARENT_ID, progress: 40 });
    const successor = task(SUCCESSOR_ID, "Segunda", {
      parentId: PARENT_ID,
      position: 1,
      startDate: "2026-08-31",
      endDate: "2026-08-31",
    });
    const dependency: TaskDependency = {
      id: "40000000-0000-4000-8000-000000000001",
      projectId: PROJECT_ID,
      predecessorId: CHILD_ID,
      successorId: SUCCESSOR_ID,
      type: "FS",
      lagDays: 0,
      createdAt: NOW,
      updatedAt: NOW,
    };

    const projection = buildGanttProjection(
      [parent, child, successor],
      [parent, child, successor],
      [dependency],
    );

    expect(projection.tasks).toHaveLength(3);
    expect(projection.tasks.find(({ id }) => id === PARENT_ID)?.type).toBe("summary");
    expect(projection.tasks.find(({ id }) => id === PARENT_ID)?.text).toBe("1. Resumo");
    expect(localDateToDateOnly(projection.tasks.find(({ id }) => id === PARENT_ID)?.end as Date)).toBe("2026-09-01");
    expect(projection.tasks.find(({ id }) => id === PARENT_ID)?.duration).toBeUndefined();
    expect(projection.tasks.find(({ id }) => id === PARENT_ID)?.workDuration).toBe(2);
    expect(projection.tasks.find(({ id }) => id === PARENT_ID)?.open).toBe(true);
    expect(projection.tasks.find(({ id }) => id === CHILD_ID)?.open).toBe(false);
    expect(projection.tasks.find(({ id }) => id === CHILD_ID)?.parent).toBe(PARENT_ID);
    expect(projection.tasks.find(({ id }) => id === PARENT_ID)?.hierarchyLevel).toBe(0);
    expect(projection.tasks.find(({ id }) => id === CHILD_ID)?.hierarchyLevel).toBe(1);
    expect(projection.tasks.find(({ id }) => id === CHILD_ID)?.progress).toBe(40);
    expect(projection.links).toEqual([
      expect.objectContaining({ source: CHILD_ID, target: SUCCESSOR_ID, type: "e2s" }),
    ]);
  });

  it("separa tarefas sem cronograma e destaca semana e feriado", () => {
    const unscheduled = task(CHILD_ID, "Sem data", {
      startDate: null,
      endDate: null,
      durationDays: null,
    });
    const projection = buildGanttProjection([unscheduled], [unscheduled], []);
    expect(projection.tasks).toHaveLength(0);
    expect(projection.unscheduledCount).toBe(1);

    const calendar: Calendar = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Padrão",
      workingDays: [1, 2, 3, 4, 5],
      exceptions: [{
        id: "50000000-0000-4000-8000-000000000001",
        calendarId: "00000000-0000-4000-8000-000000000001",
        date: "2026-09-07",
        isWorkingDay: false,
        name: "Independência",
        createdAt: NOW,
        updatedAt: NOW,
      }],
      isDefault: true,
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(ganttCalendarClass(calendar, dateOnlyToLocalDate("2026-08-29"))).toBe("chronoproject-gantt-weekend");
    expect(ganttCalendarClass(calendar, dateOnlyToLocalDate("2026-09-07"))).toBe("chronoproject-gantt-holiday");
    expect(ganttCalendarClass(calendar, dateOnlyToLocalDate("2026-08-28"))).toBe("");
  });

  it("não abre uma tarefa-resumo filtrada quando nenhum filho está projetado", () => {
    const parent = task(PARENT_ID, "Resumo");
    const hiddenChild = task(CHILD_ID, "Filho fora do filtro", { parentId: PARENT_ID });

    const projection = buildGanttProjection([parent], [parent, hiddenChild], []);

    expect(projection.tasks).toEqual([
      expect.objectContaining({ id: PARENT_ID, type: "summary", open: false }),
    ]);
  });
});
