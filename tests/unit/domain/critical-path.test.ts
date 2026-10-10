import { describe, expect, it } from "vitest";

import { DEFAULT_CALENDAR_ID, type Calendar } from "../../../src/domain/calendars/calendar";
import { analyzeCriticalPath } from "../../../src/domain/scheduling/critical-path";
import type { TaskDependency } from "../../../src/domain/scheduling/dependency";
import type { Task } from "../../../src/domain/tasks/task";

const PROJECT_ID = "10000000-0000-4000-8000-000000000001";
const NOW = "2026-10-07T12:00:00.000Z";
const calendar: Calendar = {
  id: DEFAULT_CALENDAR_ID,
  name: "Padrão",
  workingDays: [1, 2, 3, 4, 5],
  exceptions: [],
  isDefault: true,
  createdAt: NOW,
  updatedAt: NOW,
};

function task(id: string, startDate: string, endDate: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    code: null,
    projectId: PROJECT_ID,
    parentId: null,
    calendarId: null,
    title: id,
    description: null,
    status: "NOT_STARTED",
    priority: "NORMAL",
    progress: 0,
    startDate,
    endDate,
    durationDays: 1,
    deadlineDate: null,
    completedDate: null,
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

function dependency(id: string, predecessorId: string, successorId: string): TaskDependency {
  return { id, projectId: PROJECT_ID, predecessorId, successorId, type: "FS", lagDays: 0, createdAt: NOW, updatedAt: NOW };
}

describe("caminho crítico", () => {
  it("marca a cadeia que controla o fim e calcula a folga de tarefas independentes", () => {
    const a = task("20000000-0000-4000-8000-000000000001", "2026-10-05", "2026-10-05");
    const b = task("20000000-0000-4000-8000-000000000002", "2026-10-05", "2026-10-09");
    const c = task("20000000-0000-4000-8000-000000000003", "2026-10-05", "2026-10-07");
    const result = analyzeCriticalPath({
      tasks: [a, b, c],
      dependencies: [dependency("30000000-0000-4000-8000-000000000001", a.id, b.id)],
      calendars: [calendar],
      projectCalendarId: calendar.id,
    });

    expect(result.available).toBe(true);
    expect(result.projectEndDate).toBe("2026-10-09");
    expect(result.tasks.find(({ taskId }) => taskId === a.id)?.isCritical).toBe(true);
    expect(result.tasks.find(({ taskId }) => taskId === b.id)?.isCritical).toBe(true);
    expect(result.tasks.find(({ taskId }) => taskId === c.id)?.totalSlackDays).toBe(2);
    expect(result.tasks.find(({ taskId }) => taskId === c.id)?.isNearCritical).toBe(true);
  });

  it("explica quando não existe rede de dependências suficiente", () => {
    const result = analyzeCriticalPath({
      tasks: [task("20000000-0000-4000-8000-000000000001", "2026-10-05", "2026-10-05")],
      dependencies: [],
      calendars: [calendar],
      projectCalendarId: calendar.id,
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain("dependências");
  });

  it("projeta a criticidade de descendentes na tarefa-resumo", () => {
    const summary = task("20000000-0000-4000-8000-000000000010", "2026-10-05", "2026-10-09");
    const a = task("20000000-0000-4000-8000-000000000011", "2026-10-05", "2026-10-05", { parentId: summary.id });
    const b = task("20000000-0000-4000-8000-000000000012", "2026-10-05", "2026-10-09");
    const result = analyzeCriticalPath({
      tasks: [summary, a, b],
      dependencies: [dependency("30000000-0000-4000-8000-000000000011", a.id, b.id)],
      calendars: [calendar],
      projectCalendarId: calendar.id,
    });

    expect(result.tasks.find(({ taskId }) => taskId === summary.id)?.isCritical).toBe(true);
  });

  it("expande uma predecessora-resumo para a folha que controla seu término", () => {
    const summary = task("20000000-0000-4000-8000-000000000040", "2026-10-05", "2026-10-07");
    const early = task("20000000-0000-4000-8000-000000000041", "2026-10-05", "2026-10-05", { parentId: summary.id });
    const controlling = task("20000000-0000-4000-8000-000000000042", "2026-10-07", "2026-10-07", { parentId: summary.id });
    const successor = task("20000000-0000-4000-8000-000000000043", "2026-10-07", "2026-10-09");
    const result = analyzeCriticalPath({
      tasks: [summary, early, controlling, successor],
      dependencies: [dependency("30000000-0000-4000-8000-000000000040", summary.id, successor.id)],
      calendars: [calendar],
      projectCalendarId: calendar.id,
    });

    expect(result.available).toBe(true);
    expect(result.tasks.find(({ taskId }) => taskId === controlling.id)?.isCritical).toBe(true);
    expect(result.tasks.find(({ taskId }) => taskId === early.id)?.totalSlackDays).toBe(4);
  });

  it("identifica a predecessora controladora entre relações múltiplas", () => {
    const early = task("20000000-0000-4000-8000-000000000021", "2026-10-05", "2026-10-05");
    const controlling = task("20000000-0000-4000-8000-000000000022", "2026-10-07", "2026-10-07", { schedulingMode: "MANUAL" });
    const successor = task("20000000-0000-4000-8000-000000000023", "2026-10-07", "2026-10-09");
    const result = analyzeCriticalPath({
      tasks: [early, controlling, successor],
      dependencies: [
        dependency("30000000-0000-4000-8000-000000000021", early.id, successor.id),
        dependency("30000000-0000-4000-8000-000000000022", controlling.id, successor.id),
      ],
      calendars: [calendar],
      projectCalendarId: calendar.id,
    });

    expect(result.tasks.find(({ taskId }) => taskId === early.id)?.totalSlackDays).toBe(2);
    expect(result.tasks.find(({ taskId }) => taskId === controlling.id)?.isCritical).toBe(true);
    expect(result.tasks.find(({ taskId }) => taskId === successor.id)?.isCritical).toBe(true);
  });

  it("respeita lag e feriado no calendário efetivo", () => {
    const holidayCalendar: Calendar = {
      ...calendar,
      exceptions: [{
        id: "40000000-0000-4000-8000-000000000001",
        calendarId: calendar.id,
        date: "2026-10-06",
        isWorkingDay: false,
        name: "Feriado",
        createdAt: NOW,
        updatedAt: NOW,
      }],
    };
    const predecessor = task("20000000-0000-4000-8000-000000000031", "2026-10-05", "2026-10-05");
    const successor = task("20000000-0000-4000-8000-000000000032", "2026-10-07", "2026-10-09");
    const relation = { ...dependency("30000000-0000-4000-8000-000000000031", predecessor.id, successor.id), lagDays: 1 };
    const result = analyzeCriticalPath({
      tasks: [predecessor, successor],
      dependencies: [relation],
      calendars: [holidayCalendar],
      projectCalendarId: holidayCalendar.id,
    });

    expect(result.tasks.every(({ isCritical }) => isCritical)).toBe(true);
  });

  it("mantém o caminho crítico e calcula separadamente a margem positiva da meta", () => {
    const predecessor = task("20000000-0000-4000-8000-000000000051", "2026-10-05", "2026-10-05");
    const successor = task("20000000-0000-4000-8000-000000000052", "2026-10-05", "2026-10-09");
    const result = analyzeCriticalPath({
      tasks: [predecessor, successor],
      dependencies: [dependency("30000000-0000-4000-8000-000000000051", predecessor.id, successor.id)],
      calendars: [calendar],
      projectCalendarId: calendar.id,
      targetEndDate: "2026-10-13",
    });

    expect(result.projectEndDate).toBe("2026-10-09");
    expect(result.targetEndDate).toBe("2026-10-13");
    expect(result.projectTargetSlackDays).toBe(2);
    expect(result.tasks.find(({ taskId }) => taskId === successor.id)?.totalSlackDays).toBe(0);
    expect(result.tasks.find(({ taskId }) => taskId === successor.id)?.isCritical).toBe(true);
  });

  it("mantém o caminho crítico e informa atraso global quando a meta é anterior", () => {
    const predecessor = task("20000000-0000-4000-8000-000000000061", "2026-10-05", "2026-10-05");
    const successor = task("20000000-0000-4000-8000-000000000062", "2026-10-05", "2026-10-09");
    const result = analyzeCriticalPath({
      tasks: [predecessor, successor],
      dependencies: [dependency("30000000-0000-4000-8000-000000000061", predecessor.id, successor.id)],
      calendars: [calendar],
      projectCalendarId: calendar.id,
      targetEndDate: "2026-10-08",
    });

    expect(result.projectEndDate).toBe("2026-10-09");
    expect(result.targetEndDate).toBe("2026-10-08");
    expect(result.projectTargetSlackDays).toBe(-1);
    expect(result.tasks.find(({ taskId }) => taskId === successor.id)?.totalSlackDays).toBe(0);
    expect(result.tasks.find(({ taskId }) => taskId === successor.id)?.isCritical).toBe(true);
  });

  it("não altera a criticidade das tarefas quando somente a meta muda", () => {
    const criticalStart = task("20000000-0000-4000-8000-000000000071", "2026-10-05", "2026-10-05");
    const criticalEnd = task("20000000-0000-4000-8000-000000000072", "2026-10-06", "2026-10-09");
    const shorterBranch = task("20000000-0000-4000-8000-000000000073", "2026-10-05", "2026-10-07");
    const input = {
      tasks: [criticalStart, criticalEnd, shorterBranch],
      dependencies: [dependency("30000000-0000-4000-8000-000000000071", criticalStart.id, criticalEnd.id)],
      calendars: [calendar],
      projectCalendarId: calendar.id,
    };

    const earlyTarget = analyzeCriticalPath({ ...input, targetEndDate: "2026-10-08" });
    const lateTarget = analyzeCriticalPath({ ...input, targetEndDate: "2026-10-13" });

    expect(earlyTarget.tasks).toEqual(lateTarget.tasks);
    expect(earlyTarget.projectTargetSlackDays).toBe(-1);
    expect(lateTarget.projectTargetSlackDays).toBe(2);
    expect(lateTarget.tasks.find(({ taskId }) => taskId === shorterBranch.id)?.totalSlackDays).toBe(2);
  });
});

