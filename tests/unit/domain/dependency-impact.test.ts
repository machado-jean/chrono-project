import { describe, expect, it } from "vitest";

import { previewDependencyImpact } from "../../../src/domain/scheduling/dependency-impact";
import type { Calendar } from "../../../src/domain/calendars/calendar";
import type { TaskDependency } from "../../../src/domain/scheduling/dependency";
import type { Task } from "../../../src/domain/tasks/task";

const calendar: Calendar = {
  id: "00000000-0000-4000-8000-000000000001", name: "Padrão",
  workingDays: [1, 2, 3, 4, 5], exceptions: [], isDefault: true,
  createdAt: "2026-10-02T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z",
};

function task(id: string, title: string, parentId: string | null, startDate: string, endDate: string): Task {
  return {
    id, projectId: "10000000-0000-4000-8000-000000000001", parentId, title, description: null,
    status: "NOT_STARTED", priority: "NORMAL", progress: 0,
    startDate, endDate, durationDays: 1, schedulingMode: "AUTO",
    position: 0, calendarId: null, assignee: null, tags: [], notes: null,
    code: null, deadlineDate: null, completedDate: null,
    createdAt: "2026-10-02T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z",
  };
}

describe("previewDependencyImpact", () => {
  it("previews the successor movement caused by a summary predecessor", () => {
    const tasks = [
      task("20000000-0000-4000-8000-000000000001", "Resumo", null, "2026-10-02", "2026-10-05"),
      task("20000000-0000-4000-8000-000000000002", "Última etapa", "20000000-0000-4000-8000-000000000001", "2026-10-05", "2026-10-05"),
      task("20000000-0000-4000-8000-000000000003", "Sucessora", null, "2026-10-02", "2026-10-02"),
    ];
    const dependency: TaskDependency = {
      id: "30000000-0000-4000-8000-000000000001", projectId: "10000000-0000-4000-8000-000000000001",
      predecessorId: "20000000-0000-4000-8000-000000000001",
      successorId: "20000000-0000-4000-8000-000000000003", type: "FS", lagDays: 1,
      createdAt: "2026-10-02T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z",
    };

    const preview = previewDependencyImpact({
      tasks, dependencies: [], calendars: [calendar], projectCalendarId: calendar.id,
      dependency, action: "ADD",
    });

    expect(preview.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ taskId: "20000000-0000-4000-8000-000000000003", afterStartDate: "2026-10-06" }),
    ]));
  });
});
