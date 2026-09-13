import { describe, expect, it } from "vitest";

import { DEFAULT_CALENDAR_ID, type Calendar } from "../../../src/domain/calendars/calendar";
import {
  compareTaskWithBaseline,
  createBaselineBundle,
  taskScheduleHealth,
} from "../../../src/domain/planning/baseline";
import type { Task } from "../../../src/domain/tasks/task";

const NOW = "2026-09-10T12:00:00.000Z";
const PROJECT_ID = "10000000-0000-4000-8000-000000000001";
const TASK_ID = "20000000-0000-4000-8000-000000000001";
const calendar: Calendar = {
  id: DEFAULT_CALENDAR_ID,
  name: "Calendário padrão",
  workingDays: [1, 2, 3, 4, 5],
  exceptions: [],
  isDefault: true,
  createdAt: NOW,
  updatedAt: NOW,
};

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: TASK_ID,
    code: null,
    projectId: PROJECT_ID,
    parentId: null,
    calendarId: null,
    title: "Planejar entrega",
    description: null,
    status: "IN_PROGRESS",
    priority: "NORMAL",
    progress: 30,
    startDate: "2026-09-08",
    endDate: "2026-09-10",
    durationDays: 3,
    deadlineDate: "2026-09-14",
    schedulingMode: "AUTO",
    position: 0,
    assignee: null,
    tags: [],
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("controle do plano", () => {
  it("registra uma fotografia imutável com estrutura e progresso", () => {
    const bundle = createBaselineBundle(PROJECT_ID, "Plano aprovado", [task()], NOW);

    expect(bundle.baseline).toMatchObject({ projectId: PROJECT_ID, name: "Plano aprovado", isActive: true });
    expect(bundle.tasks).toEqual([expect.objectContaining({
      taskId: TASK_ID,
      outline: "1",
      startDate: "2026-09-08",
      endDate: "2026-09-10",
      durationDays: 3,
      progress: 30,
    })]);
  });

  it("calcula antecipação e atraso em dias úteis sem contar a data de origem", () => {
    const baseline = createBaselineBundle(PROJECT_ID, "Plano", [task()], NOW).tasks[0] ?? null;
    const delayed = compareTaskWithBaseline(
      task({ startDate: "2026-09-10", endDate: "2026-09-15", durationDays: 4, progress: 40 }),
      baseline,
      calendar,
      "2026-09-10",
    );
    const earlier = compareTaskWithBaseline(
      task({ startDate: "2026-09-07", endDate: "2026-09-09" }),
      baseline,
      calendar,
      "2026-09-10",
    );

    expect(delayed).toMatchObject({ startVarianceDays: 2, endVarianceDays: 3, durationVarianceDays: 1, progressVariance: 10 });
    expect(earlier.endVarianceDays).toBe(-1);
  });

  it("classifica prazo sem alterar cronograma ou tarefas encerradas", () => {
    expect(taskScheduleHealth(task(), "2026-09-10")).toBe("ON_TRACK");
    expect(taskScheduleHealth(task({ endDate: "2026-09-15" }), "2026-09-10")).toBe("AT_RISK");
    expect(taskScheduleHealth(task({ deadlineDate: "2026-09-09" }), "2026-09-10")).toBe("OVERDUE");
    expect(taskScheduleHealth(task({ deadlineDate: "2026-09-09", status: "COMPLETED" }), "2026-09-10")).toBe("ON_TRACK");
    expect(taskScheduleHealth(task({ deadlineDate: null }), "2026-09-10")).toBe("NO_DEADLINE");
  });
});
