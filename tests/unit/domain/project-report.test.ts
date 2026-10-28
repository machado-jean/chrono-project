import { writeFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { Project } from "../../../src/domain/projects/project";
import { buildProjectPdfDefinition, generateProjectPdf } from "../../../src/domain/reporting/project-report-pdf";
import { buildGanttSvgPages } from "../../../src/domain/reporting/project-report-gantt-svg";
import { buildProjectReport, type ProjectPdfOptions } from "../../../src/domain/reporting/project-report";
import type { TaskDependency } from "../../../src/domain/scheduling/dependency";
import type { Task } from "../../../src/domain/tasks/task";

const PROJECT_ID = "10000000-0000-4000-8000-000000000001";
const PARENT_ID = "20000000-0000-4000-8000-000000000001";
const CHILD_ID = "20000000-0000-4000-8000-000000000002";
const NOW = "2026-09-08T12:00:00.000Z";

const project: Project = {
  id: PROJECT_ID,
  name: "Implantação Chrono Project",
  description: "Plano de validação",
  status: "ACTIVE",
  calendarId: "30000000-0000-4000-8000-000000000001",
  position: 0,
  isArchived: false,
  criticalPathEnabled: false,
  createdAt: NOW,
  updatedAt: NOW,
};

function task(overrides: Partial<Task>): Task {
  return {
    id: PARENT_ID,
    code: null,
    projectId: PROJECT_ID,
    parentId: null,
    calendarId: null,
    title: "Planejar entrega",
    description: null,
    status: "IN_PROGRESS",
    priority: "HIGH",
    progress: 50,
    startDate: "2026-09-08",
    endDate: "2026-09-10",
    durationDays: 3,
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

const tasks = [
  task({}),
  task({
    id: CHILD_ID,
    parentId: PARENT_ID,
    title: "Validar relatório",
    status: "COMPLETED",
    priority: "NORMAL",
    progress: 100,
    completedDate: "2026-09-10",
    startDate: "2026-09-09",
    endDate: "2026-09-09",
    durationDays: 1,
  }),
];

const dependencies: readonly TaskDependency[] = [{
  id: "40000000-0000-4000-8000-000000000001",
  projectId: PROJECT_ID,
  predecessorId: PARENT_ID,
  successorId: CHILD_ID,
  type: "FS",
  lagDays: 2,
  createdAt: NOW,
  updatedAt: NOW,
}];

const options: ProjectPdfOptions = {
  format: "REPORT",
  scope: "ALL",
  pageSize: "A4",
  includeDetails: false,
  timelineStart: null,
  timelineEnd: null,
};

const criticalPath = {
  available: true,
  reason: null,
  projectEndDate: "2026-09-10",
  targetEndDate: "2026-09-12",
  projectTargetSlackDays: 2,
  tasks: [
    { taskId: PARENT_ID, totalSlackDays: 0, isCritical: true, isNearCritical: false },
    { taskId: CHILD_ID, totalSlackDays: 2, isCritical: false, isNearCritical: true },
  ],
} as const;

describe("relatório PDF de projeto", () => {
  it("preserva hierarquia, resumo, indicadores e predecessoras", () => {
    const report = buildProjectReport({ project, tasks, dependencies, options, generatedAt: NOW, criticalPath });

    expect(report.rows.map((row) => row.label)).toEqual([
      "1. Planejar entrega",
      "1.1. Validar relatório",
    ]);
    expect(report.rows[0]?.isSummary).toBe(true);
    expect(report.rows[1]?.predecessors).toEqual(["1. Planejar entrega +2d"]);
    expect(report.statusCounts.IN_PROGRESS).toBe(1);
    expect(report.statusCounts.COMPLETED).toBe(1);
    expect(report.averageProgress).toBe(75);
    expect(report.timelineStart).toBe("2026-09-08");
    expect(report.timelineEnd).toBe("2026-09-10");
    expect(report.rows[0]?.criticality?.isCritical).toBe(true);
    expect(report.rows[1]?.criticality?.totalSlackDays).toBe(2);
  });

  it("limita o relatório à projeção visível quando solicitado", () => {
    const report = buildProjectReport({
      project,
      tasks,
      dependencies,
      visibleTaskIds: new Set([PARENT_ID]),
      options: { ...options, scope: "VISIBLE" },
      generatedAt: NOW,
    });

    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]?.id).toBe(PARENT_ID);
  });

  it("rejeita um intervalo de cronograma invertido", () => {
    expect(() => buildProjectReport({
      project,
      tasks,
      dependencies,
      options: { ...options, timelineStart: "2026-09-10", timelineEnd: "2026-09-08" },
    })).toThrow("data final do cronograma PDF");
  });

  it("cria definição completa e um PDF válido no cliente", async () => {
    const report = buildProjectReport({ project, tasks, dependencies, options, generatedAt: NOW, criticalPath });
    const definition = buildProjectPdfDefinition(report);
    const bytes = await generateProjectPdf(report);
    const artifactPath = process.env.CHRONO_PROJECT_PDF_ARTIFACT;
    if (artifactPath !== undefined) await writeFile(artifactPath, bytes);

    expect(definition.pageOrientation).toBe("landscape");
    expect(definition.content).toBeInstanceOf(Array);
    expect(JSON.stringify(definition)).toContain(">TER</text>");
    expect(JSON.stringify(definition)).toContain(">08</text>");
    expect(JSON.stringify(definition)).toContain(">QUA</text>");
    expect(JSON.stringify(definition)).toContain(">09</text>");
    expect(JSON.stringify(definition)).toContain('<path d=');
    expect(JSON.stringify(definition)).toContain('fill=\\"#F3F6FA\\"');
    expect(JSON.stringify(definition)).toContain("Indicadores do cronograma");
    expect(JSON.stringify(definition)).toContain("#A92D26");
    expect(JSON.stringify(definition)).toContain("#7957C8");
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(10_000);
  });

  it("repete o cabeçalho do Gantt em todas as páginas", () => {
    const paginatedTasks = Array.from({ length: 19 }, (_, index) => task({
      id: `20000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
      parentId: null,
      title: `Atividade de cronograma ${String(index + 1)}`,
      position: index,
    }));
    const report = buildProjectReport({ project, tasks: paginatedTasks, dependencies: [], options, generatedAt: NOW });
    const pages = buildGanttSvgPages(report);

    expect(pages).toHaveLength(2);
    expect(pages.every((page) => page.svg.includes(">Atividade</text>"))).toBe(true);
    expect(pages.every((page) => page.svg.includes(">TER</text>"))).toBe(true);
  });
});
