import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "../tasks/task";
import type { ProjectReport } from "./project-report";
import { buildGanttSvgPages } from "./project-report-gantt-svg";

type PdfNode = Readonly<Record<string, unknown>> | string;
type PdfDefinition = Readonly<Record<string, unknown>>;

const COLORS = {
  ink: "#162235",
  muted: "#5E6B7A",
  line: "#D8DEE8",
  blue: "#2563EB",
  blueDark: "#1E40AF",
  green: "#0F9F83",
  greenDark: "#087565",
  critical: "#A92D26",
  nearCritical: "#7957C8",
  softBlue: "#E8F0FF",
  softGray: "#F3F6FA",
  white: "#FFFFFF",
} as const;

const STATUS_COLORS = ["#94A3B8", "#2563EB", "#DC8A00", "#0F9F83", "#64748B"] as const;
const PRIORITY_COLORS = ["#94A3B8", "#2563EB", "#DC8A00", "#C2413B"] as const;

const PORTUGUESE_COPY = {
  generatedAt: "Gerado em", noDates: "Sem datas", dateRangeSeparator: "a", activities: "Atividades", scheduled: "agendadas",
  averageCompletion: "Conclusão média", allActivities: "Todas as atividades", completed: "Concluídas", blocked: "bloqueadas",
  period: "Período", scheduleConsidered: "Cronograma considerado", statusDistribution: "Distribuição por status",
  priorityDistribution: "Distribuição por prioridade", noGlobalDeadline: "Sem prazo-limite global", scheduleIndicators: "Indicadores do cronograma",
  criticalZeroSlack: "Crítica · folga zero", nearCriticalSlack: "Quase crítica · 1–2 dias de folga",
  target: "Meta", critical: "Crítica", nearCritical: "Quase crítica", noDeadline: "Sem prazo", onTrack: "No prazo",
  atRisk: "Em risco", overdue: "Atrasada", completedLate: "Concluída com atraso", cancelled: "Cancelada",
  task: "Atividade", status: "Status", start: "Início", end: "Fim", plannedStart: "Início planejado", plannedEnd: "Fim planejado",
  variance: "Desvio", deadline: "Prazo", health: "Saúde", predecessors: "Predecessoras", taskDetails: "Detalhes das atividades",
  assignee: "Responsável", notes: "Observações", noScheduledActivities: "Nenhuma atividade agendada para exibir no cronograma.",
  summary: "Resumo", weekend: "Fim de semana", dependency: "Dependência", baseline: "Plano de referência", planningReport: "Relatório de planejamento",
  ganttSchedule: "Cronograma Gantt", localPlanningReport: "Relatório local de planejamento", page: "Página", of: "de",
} as const;

const ENGLISH_COPY: { readonly [Key in keyof typeof PORTUGUESE_COPY]: string } = {
    generatedAt: "Generated on", noDates: "No dates", dateRangeSeparator: "to", activities: "Activities", scheduled: "scheduled",
    averageCompletion: "Average completion", allActivities: "All activities", completed: "Completed", blocked: "blocked",
    period: "Period", scheduleConsidered: "Schedule considered", statusDistribution: "Status distribution",
    priorityDistribution: "Priority distribution", noGlobalDeadline: "No global deadline", scheduleIndicators: "Schedule indicators",
    criticalZeroSlack: "Critical · zero slack", nearCriticalSlack: "Near critical · 1–2 days of slack",
    target: "Target", critical: "Critical", nearCritical: "Near critical", noDeadline: "No deadline", onTrack: "On track",
    atRisk: "At risk", overdue: "Overdue", completedLate: "Completed late", cancelled: "Cancelled",
    task: "Task", status: "Status", start: "Start", end: "End", plannedStart: "Planned start", plannedEnd: "Planned end",
    variance: "Variance", deadline: "Deadline", health: "Health", predecessors: "Predecessors", taskDetails: "Task details",
    assignee: "Assignee", notes: "Notes", noScheduledActivities: "No scheduled activities to display in the schedule.",
    summary: "Summary", weekend: "Weekend", dependency: "Dependency", baseline: "Baseline", planningReport: "Planning report",
    ganttSchedule: "Gantt schedule", localPlanningReport: "Local planning report", page: "Page", of: "of",
};

function copy(report: ProjectReport): typeof ENGLISH_COPY {
  return report.options.language === "en" ? ENGLISH_COPY : PORTUGUESE_COPY;
}

function formatDate(value: string | null, language: ProjectReport["options"]["language"]): string {
  if (value === null) return "-";
  const [year, month, day] = value.split("-");
  return year === undefined || month === undefined || day === undefined
    ? value
    : language === "en" ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

function formatGeneratedAt(value: string, language: ProjectReport["options"]["language"]): string {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function statusLabel(report: ProjectReport, status: TaskStatus): string {
  return report.options.language === "en"
    ? ({ NOT_STARTED: "Not started", IN_PROGRESS: "In progress", BLOCKED: "Blocked", COMPLETED: "Completed", CANCELLED: "Cancelled" } as const)[status]
    : ({ NOT_STARTED: "Não iniciada", IN_PROGRESS: "Em andamento", BLOCKED: "Bloqueada", COMPLETED: "Concluída", CANCELLED: "Cancelada" } as const)[status];
}

function priorityLabel(report: ProjectReport, priority: TaskPriority): string {
  return report.options.language === "en"
    ? ({ LOW: "Low", NORMAL: "Normal", HIGH: "High", CRITICAL: "Critical" } as const)[priority]
    : ({ LOW: "Baixa", NORMAL: "Normal", HIGH: "Alta", CRITICAL: "Crítica" } as const)[priority];
}

function reportHeader(report: ProjectReport, subtitle: string): PdfNode[] {
  const text = copy(report);
  return [
    {
      columns: [
        { stack: [{ text: "CHRONO PROJECT", style: "brand" }, { text: report.project.name, style: "title" }] },
        { text: `${text.generatedAt} ${formatGeneratedAt(report.generatedAt, report.options.language)}`, style: "generated", alignment: "right" },
      ],
      margin: [0, 0, 0, 4],
    },
    { text: subtitle, style: "subtitle", margin: [0, 0, 0, 14] },
  ];
}

function metricCard(label: string, value: string, note: string): PdfNode {
  return {
    stack: [
      { text: label, style: "metricLabel" },
      { text: value, style: "metricValue" },
      { text: note, style: "metricNote" },
    ],
    fillColor: COLORS.softGray,
    margin: [10, 8, 10, 8],
  };
}

function distributionChart(
  title: string,
  entries: readonly { readonly label: string; readonly value: number; readonly color: string }[],
  total: number,
): PdfNode {
  return {
    stack: [
      { text: title, style: "sectionSmall", margin: [0, 0, 0, 7] },
      ...entries.map((entry) => ({
        columns: [
          { text: entry.label, width: 85, style: "chartLabel" },
          {
            width: "*",
            canvas: [
              { type: "rect", x: 0, y: 2, w: 150, h: 8, color: COLORS.softGray },
              {
                type: "rect",
                x: 0,
                y: 2,
                w: total === 0 ? 0 : Math.max(2, 150 * entry.value / total),
                h: 8,
                color: entry.color,
              },
            ],
          },
          { text: String(entry.value), width: 22, alignment: "right", style: "chartValue" },
        ],
        margin: [0, 0, 0, 5],
      })),
    ],
  };
}

function summarySection(report: ProjectReport): PdfNode[] {
  const text = copy(report);
  const total = report.rows.length;
  const period = report.timelineStart === null || report.timelineEnd === null
    ? text.noDates
    : `${formatDate(report.timelineStart, report.options.language)} ${text.dateRangeSeparator} ${formatDate(report.timelineEnd, report.options.language)}`;
  return [
    {
      table: {
        widths: ["*", "*", "*", "*"],
        body: [[
          metricCard(text.activities, String(total), `${String(report.scheduledCount)} ${text.scheduled}`),
          metricCard(text.averageCompletion, `${String(report.averageProgress)}%`, text.allActivities),
          metricCard(text.completed, String(report.statusCounts.COMPLETED), `${String(report.statusCounts.BLOCKED)} ${text.blocked}`),
          metricCard(text.period, period, text.scheduleConsidered),
        ]],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 16],
    },
    {
      columns: [
        distributionChart(
          text.statusDistribution,
          TASK_STATUSES.map((status, index) => ({
            label: statusLabel(report, status),
            value: report.statusCounts[status],
            color: STATUS_COLORS[index] ?? COLORS.blue,
          })),
          total,
        ),
        distributionChart(
          text.priorityDistribution,
          TASK_PRIORITIES.map((priority, index) => ({
            label: priorityLabel(report, priority),
            value: report.priorityCounts[priority],
            color: PRIORITY_COLORS[index] ?? COLORS.blue,
          })),
          total,
        ),
      ],
      columnGap: 28,
      margin: [0, 0, 0, 16],
    },
  ];
}

function criticalPathSection(report: ProjectReport): PdfNode[] {
  const text = copy(report);
  const analysis = report.criticalPath;
  if (analysis?.available !== true) return [];
  const criticalCount = report.rows.filter((row) => row.criticality?.isCritical === true).length;
  const nearCriticalCount = report.rows.filter((row) => row.criticality?.isNearCritical === true).length;
  const target = analysis.targetEndDate === null
    ? text.noGlobalDeadline
    : `${text.target} ${formatDate(analysis.targetEndDate, report.options.language)}${analysis.projectTargetSlackDays === null ? "" : ` · ${analysis.projectTargetSlackDays >= 0 ? "+" : ""}${String(analysis.projectTargetSlackDays)}d`}`;

  return [
    { text: text.scheduleIndicators, style: "sectionSmall", margin: [0, 0, 0, 7] },
    {
      columns: [
        {
          columns: [
            { text: `${text.criticalZeroSlack} (${String(criticalCount)})`, style: "criticalLegendCritical" },
          ],
        },
        {
          columns: [
            { text: `${text.nearCriticalSlack} (${String(nearCriticalCount)})`, style: "criticalLegendNear" },
          ],
        },
        { text: target, style: "criticalLegendMeta", alignment: "right" },
      ],
      columnGap: 10,
      fillColor: COLORS.softGray,
      margin: [0, 0, 0, 14],
    },
  ];
}

function taskLabelCell(report: ProjectReport, row: ProjectReport["rows"][number]): PdfNode {
  const english = report.options.language === "en";
  const marker = row.criticality?.isCritical === true
    ? { text: english ? "[Critical] " : "[Crítica] ", style: "criticalMarker" }
    : row.criticality?.isNearCritical === true
      ? { text: english ? "[Near critical] " : "[Quase crítica] ", style: "nearCriticalMarker" }
      : null;
  return {
    text: [
      ...(marker === null ? [] : [marker]),
      row.isSummary ? { text: row.label, style: "summaryTaskLabel" } : { text: row.label },
    ],
    margin: [row.depth * 7, 0, 0, 0],
  };
}

function taskTable(report: ProjectReport): PdfNode {
  const text = copy(report);
  const includeBaseline = report.options.includeBaseline !== false && report.rows.some(
    (row) => row.baselineStartDate !== null || row.baselineEndDate !== null,
  );
  const healthLabel = (health: ProjectReport["rows"][number]["health"]): string => ({
    NO_DEADLINE: text.noDeadline, ON_TRACK: text.onTrack, AT_RISK: text.atRisk, OVERDUE: text.overdue,
    COMPLETED_LATE: text.completedLate, CANCELLED: text.cancelled,
  })[health];
  const headers = [
    text.task, text.status, text.start, text.end,
    ...(includeBaseline ? [text.plannedStart, text.plannedEnd, text.variance] : []),
    text.deadline, text.health, "%", text.predecessors,
  ];
  const body: PdfNode[][] = [
    headers.map(
      (text) => ({ text, style: "tableHeader", fillColor: COLORS.ink, color: COLORS.white }),
    ),
    ...report.rows.map((row) => [
      taskLabelCell(report, row),
      row.statusLabel,
      formatDate(row.startDate, report.options.language),
      formatDate(row.endDate, report.options.language),
      ...(includeBaseline ? [
        formatDate(row.baselineStartDate, report.options.language),
        formatDate(row.baselineEndDate, report.options.language),
        row.endVarianceDays === null ? "-" : `${row.endVarianceDays > 0 ? "+" : ""}${String(row.endVarianceDays)}d`,
      ] : []),
      formatDate(row.deadlineDate, report.options.language),
      healthLabel(row.health),
      `${String(row.progress)}%`,
      row.predecessors.length === 0 ? "-" : row.predecessors.join(", "),
    ]),
  ];
  return {
    table: {
      headerRows: 1,
      widths: includeBaseline
        ? [130, 55, 45, 45, 45, 45, 34, 45, 45, 28, "*"]
        : [170, 65, 52, 52, 52, 48, 28, "*"],
      body,
    },
    layout: "lightHorizontalLines",
    fontSize: 7.5,
  };
}

function detailSections(report: ProjectReport): PdfNode[] {
  const text = copy(report);
  if (!report.options.includeDetails) return [];
  const detailed = report.rows.filter(
    (row) => row.description !== null || row.notes !== null || row.tags.length > 0 || row.assignee !== null,
  );
  if (detailed.length === 0) return [];
  return [
    { text: text.taskDetails, style: "section", margin: [0, 14, 0, 8] },
    ...detailed.map((row) => ({
      stack: [
        { text: row.label, style: "detailTitle" },
        row.assignee === null ? null : { text: `${text.assignee}: ${row.assignee}`, style: "detailMeta" },
        row.tags.length === 0 ? null : { text: `Tags: ${row.tags.join(", ")}`, style: "detailMeta" },
        row.description === null ? null : { text: row.description, margin: [0, 4, 0, 0] },
        row.notes === null ? null : { text: `${text.notes}: ${row.notes}`, margin: [0, 4, 0, 0], color: COLORS.muted },
      ].filter((node) => node !== null),
      margin: [0, 0, 0, 10],
      unbreakable: true,
    })),
  ];
}

/* Superseded by the paginated SVG renderer below. Kept out of the bundle by
function ganttCell(row: ProjectReportRow, start: string, end: string): PdfNode {
  const width = 470;
  const timelineDays = Math.max(1, calendarDaysBetween(start, end) + 1);
  if (row.startDate === null || row.endDate === null || row.endDate < start || row.startDate > end) {
    return { text: "Fora do período ou sem cronograma", color: COLORS.muted, fontSize: 7 };
  }

  const visibleStart = row.startDate < start ? start : row.startDate;
  const visibleEnd = row.endDate > end ? end : row.endDate;
  const x = width * calendarDaysBetween(start, visibleStart) / timelineDays;
  const taskWidth = Math.max(2, width * (calendarDaysBetween(visibleStart, visibleEnd) + 1) / timelineDays);
  const color = row.isSummary ? COLORS.green : COLORS.blue;
  const progressColor = row.isSummary ? COLORS.greenDark : COLORS.blueDark;
  const dayWidth = width / timelineDays;
  const calendarGrid = Array.from({ length: timelineDays }, (_, index) => {
    const date = addCalendarDays(start, index);
    return weekday(date) >= 6
      ? { type: "rect", x: index * dayWidth, y: 0, w: dayWidth, h: 14, color: "#E8ECF2" }
      : null;
  }).filter((node) => node !== null);
  const verticalLines = Array.from({ length: timelineDays + 1 }, (_, index) => ({
    type: "line",
    x1: index * dayWidth,
    y1: 0,
    x2: index * dayWidth,
    y2: 14,
    lineWidth: index % 7 === 0 ? 0.45 : 0.2,
    lineColor: index % 7 === 0 ? "#AAB4C2" : COLORS.line,
  }));
  return {
    canvas: [
      { type: "rect", x: 0, y: 2, w: width, h: 10, color: COLORS.softGray },
      ...calendarGrid,
      ...verticalLines,
      { type: "rect", x, y: 2, w: taskWidth, h: 10, color },
      { type: "rect", x, y: 2, w: taskWidth * row.progress / 100, h: 10, color: progressColor },
    ],
  };
}

const WEEKDAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"] as const;

function ganttTimelineHeader(start: string, end: string): PdfNode {
  const timelineDays = Math.max(1, calendarDaysBetween(start, end) + 1);
  const dayWidth = 470 / timelineDays;
  const cells = Array.from({ length: timelineDays }, (_, index) => {
    const date = addCalendarDays(start, index);
    const day = date.slice(-2);
    const isWeekend = weekday(date) >= 6;
    return {
      stack: [
        { text: WEEKDAY_LABELS[weekday(date) - 1], bold: true, fontSize: timelineDays <= 31 ? 5.5 : 4.5 },
        { text: day, fontSize: timelineDays <= 31 ? 6 : 5 },
      ],
      alignment: "center",
      fillColor: isWeekend ? "#334155" : COLORS.ink,
      color: COLORS.white,
      margin: [0, 2, 0, 2],
    };
  });
  return {
    table: {
      widths: Array.from({ length: timelineDays }, () => dayWidth),
      body: [cells],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0.25,
      vLineColor: () => "#64748B",
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

*/
function ganttTable(report: ProjectReport): PdfNode {
  if (report.timelineStart === null || report.timelineEnd === null) {
    return { text: copy(report).noScheduledActivities, style: "empty" };
  }
  return {
    stack: buildGanttSvgPages(report).map((page, index) => ({
      svg: page.svg,
      width: page.width,
      ...(index === 0 ? {} : { pageBreak: "before" }),
    })),
  };
}

function ganttLegend(report: ProjectReport): PdfNode {
  const text = copy(report);
  const includesBaseline = report.options.includeBaseline !== false && report.rows.some(
    (row) => row.baselineStartDate !== null || row.baselineEndDate !== null,
  );
  const sample = (kind: "TASK" | "SUMMARY" | "CRITICAL" | "NEAR" | "WEEKEND" | "DEPENDENCY" | "BASELINE"): PdfNode => {
    const rectangle = (color: string): readonly Record<string, unknown>[] => [
      { type: "rect", x: 2, y: 2, w: 16, h: 9, color },
    ];
    if (kind === "TASK") return { width: 22, canvas: rectangle(COLORS.blue) };
    if (kind === "SUMMARY") return { width: 22, canvas: rectangle(COLORS.green) };
    if (kind === "WEEKEND") return { width: 22, canvas: rectangle("#E5E9F0") };
    if (kind === "BASELINE") return { width: 22, canvas: [{ type: "line", x1: 2, y1: 6.5, x2: 18, y2: 6.5, lineColor: COLORS.muted, lineWidth: 2.5 }] };
    if (kind === "DEPENDENCY") {
      return { width: 22, canvas: [
        { type: "line", x1: 2, y1: 6.5, x2: 18, y2: 6.5, lineColor: COLORS.muted, lineWidth: 1.25 },
        { type: "line", x1: 14, y1: 2.5, x2: 18, y2: 6.5, lineColor: COLORS.muted, lineWidth: 1.25 },
        { type: "line", x1: 14, y1: 10.5, x2: 18, y2: 6.5, lineColor: COLORS.muted, lineWidth: 1.25 },
      ] };
    }
    const color = kind === "CRITICAL" ? COLORS.critical : COLORS.nearCritical;
    return { width: 22, canvas: [
      { type: "rect", x: 2, y: 1, w: 16, h: 11, color: COLORS.white, lineColor: color, lineWidth: 2.25, ...(kind === "NEAR" ? { dash: { length: 2, space: 1 } } : {}) },
    ] };
  };
  const item = (kind: Parameters<typeof sample>[0], label: string): PdfNode => ({
    columns: [
      sample(kind),
      { text: label, style: "ganttLegendText" },
    ],
    width: "auto",
  });
  const items: PdfNode[] = [
    item("TASK", text.task), item("SUMMARY", text.summary), item("CRITICAL", text.critical),
    item("NEAR", text.nearCritical), item("WEEKEND", text.weekend), item("DEPENDENCY", text.dependency),
  ];
  if (includesBaseline) items.push(item("BASELINE", text.baseline));
  return {
    columns: items,
    columnGap: 7,
    margin: [0, 0, 0, 7],
  };
}

export function buildProjectPdfDefinition(report: ProjectReport): PdfDefinition {
  const text = copy(report);
  const content: PdfNode[] = [...reportHeader(report, text.planningReport)];
  if (report.options.format === "REPORT") content.push(...summarySection(report));
  content.push(...criticalPathSection(report));
  if (report.options.format === "REPORT" || report.options.format === "TASKS") {
    content.push({ text: text.activities, style: "section", margin: [0, 4, 0, 8] }, taskTable(report));
    content.push(...detailSections(report));
  }
  if (report.options.format === "REPORT" || report.options.format === "GANTT") {
    content.push({
      text: text.ganttSchedule,
      style: "section",
      margin: [0, 4, 0, 8],
      ...(report.options.format === "REPORT" ? { pageBreak: "before" } : {}),
    });
    content.push(ganttLegend(report));
    content.push(ganttTable(report));
  }

  return {
    pageSize: report.options.pageSize,
    pageOrientation: "landscape",
    pageMargins: [28, 34, 28, 30],
    info: {
      title: `${report.project.name} - Chrono Project`,
      author: "Chrono Project",
      subject: text.localPlanningReport,
    },
    content,
    defaultStyle: { font: "Roboto", fontSize: 8.5, color: COLORS.ink },
    styles: {
      brand: { fontSize: 8, bold: true, color: COLORS.blue, characterSpacing: 1.2 },
      title: { fontSize: 19, bold: true, color: COLORS.ink },
      subtitle: { fontSize: 9, color: COLORS.muted },
      generated: { fontSize: 7.5, color: COLORS.muted },
      section: { fontSize: 13, bold: true, color: COLORS.ink },
      sectionSmall: { fontSize: 10, bold: true, color: COLORS.ink },
      metricLabel: { fontSize: 7, bold: true, color: COLORS.muted },
      metricValue: { fontSize: 15, bold: true, color: COLORS.ink, margin: [0, 3, 0, 2] },
      metricNote: { fontSize: 6.5, color: COLORS.muted },
      chartLabel: { fontSize: 7, color: COLORS.muted },
      chartValue: { fontSize: 7, bold: true },
      criticalLegendCritical: { fontSize: 7.5, color: COLORS.critical },
      criticalLegendNear: { fontSize: 7.5, color: COLORS.nearCritical },
      criticalLegendMeta: { fontSize: 7.5, color: COLORS.muted },
      criticalMarker: { bold: true, color: COLORS.critical },
      nearCriticalMarker: { bold: true, color: COLORS.nearCritical },
      summaryTaskLabel: { bold: true },
      ganttLegendText: { fontSize: 7.2, color: COLORS.muted },
      tableHeader: { fontSize: 7.5, bold: true },
      detailTitle: { fontSize: 9, bold: true, color: COLORS.ink },
      detailMeta: { fontSize: 7, color: COLORS.muted },
      empty: { fontSize: 10, color: COLORS.muted, italics: true },
    },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `Chrono Project - ${text.localPlanningReport.toLocaleLowerCase(report.options.language === "en" ? "en-US" : "pt-BR")}`, margin: [28, 0, 0, 0] },
        { text: `${text.page} ${String(currentPage)} ${text.of} ${String(pageCount)}`, alignment: "right", margin: [0, 0, 28, 0] },
      ],
      fontSize: 7,
      color: COLORS.muted,
    }),
  };
}

export async function generateProjectPdf(report: ProjectReport): Promise<Uint8Array> {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.addVirtualFileSystem(fonts);
  return pdfMake
    .createPdf(buildProjectPdfDefinition(report) as unknown as TDocumentDefinitions)
    .getBuffer();
}
