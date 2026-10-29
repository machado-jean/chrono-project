import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "../tasks/task";
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

function formatDate(value: string | null): string {
  if (value === null) return "-";
  const [year, month, day] = value.split("-");
  return year === undefined || month === undefined || day === undefined
    ? value
    : `${day}/${month}/${year}`;
}

function formatGeneratedAt(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function reportHeader(report: ProjectReport, subtitle: string): PdfNode[] {
  return [
    {
      columns: [
        { stack: [{ text: "CHRONO PROJECT", style: "brand" }, { text: report.project.name, style: "title" }] },
        { text: `Gerado em ${formatGeneratedAt(report.generatedAt)}`, style: "generated", alignment: "right" },
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
  const total = report.rows.length;
  const period = report.timelineStart === null || report.timelineEnd === null
    ? "Sem datas"
    : `${formatDate(report.timelineStart)} a ${formatDate(report.timelineEnd)}`;
  return [
    {
      table: {
        widths: ["*", "*", "*", "*"],
        body: [[
          metricCard("Atividades", String(total), `${String(report.scheduledCount)} agendadas`),
          metricCard("Conclusão média", `${String(report.averageProgress)}%`, "Todas as atividades"),
          metricCard("Concluídas", String(report.statusCounts.COMPLETED), `${String(report.statusCounts.BLOCKED)} bloqueadas`),
          metricCard("Período", period, "Cronograma considerado"),
        ]],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 16],
    },
    {
      columns: [
        distributionChart(
          "Distribuição por status",
          TASK_STATUSES.map((status, index) => ({
            label: TASK_STATUS_LABELS[status],
            value: report.statusCounts[status],
            color: STATUS_COLORS[index] ?? COLORS.blue,
          })),
          total,
        ),
        distributionChart(
          "Distribuição por prioridade",
          TASK_PRIORITIES.map((priority, index) => ({
            label: TASK_PRIORITY_LABELS[priority],
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
  const analysis = report.criticalPath;
  if (analysis?.available !== true) return [];
  const criticalCount = report.rows.filter((row) => row.criticality?.isCritical === true).length;
  const nearCriticalCount = report.rows.filter((row) => row.criticality?.isNearCritical === true).length;
  const target = analysis.targetEndDate === null
    ? "Sem prazo-limite global"
    : `Meta ${formatDate(analysis.targetEndDate)}${analysis.projectTargetSlackDays === null ? "" : ` · ${analysis.projectTargetSlackDays >= 0 ? "+" : ""}${String(analysis.projectTargetSlackDays)}d`}`;

  return [
    { text: "Indicadores do cronograma", style: "sectionSmall", margin: [0, 0, 0, 7] },
    {
      columns: [
        {
          columns: [
            { text: `Crítica · folga zero (${String(criticalCount)})`, style: "criticalLegendCritical" },
          ],
        },
        {
          columns: [
            { text: `Quase crítica · 1–2 dias de folga (${String(nearCriticalCount)})`, style: "criticalLegendNear" },
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

function taskLabelCell(row: ProjectReport["rows"][number]): PdfNode {
  const marker = row.criticality?.isCritical === true
    ? { text: "[Crítica] ", style: "criticalMarker" }
    : row.criticality?.isNearCritical === true
      ? { text: "[Quase crítica] ", style: "nearCriticalMarker" }
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
  const includeBaseline = report.options.includeBaseline !== false && report.rows.some(
    (row) => row.baselineStartDate !== null || row.baselineEndDate !== null,
  );
  const healthLabel = (health: ProjectReport["rows"][number]["health"]): string => ({
    NO_DEADLINE: "Sem prazo",
    ON_TRACK: "No prazo",
    AT_RISK: "Em risco",
    OVERDUE: "Atrasada",
    COMPLETED_LATE: "Concluída com atraso",
    CANCELLED: "Cancelada",
  })[health];
  const headers = [
    "Atividade", "Status", "Início", "Fim",
    ...(includeBaseline ? ["Início planejado", "Fim planejado", "Desvio"] : []),
    "Prazo", "Saúde", "%", "Predecessoras",
  ];
  const body: PdfNode[][] = [
    headers.map(
      (text) => ({ text, style: "tableHeader", fillColor: COLORS.ink, color: COLORS.white }),
    ),
    ...report.rows.map((row) => [
      taskLabelCell(row),
      row.statusLabel,
      formatDate(row.startDate),
      formatDate(row.endDate),
      ...(includeBaseline ? [
        formatDate(row.baselineStartDate),
        formatDate(row.baselineEndDate),
        row.endVarianceDays === null ? "-" : `${row.endVarianceDays > 0 ? "+" : ""}${String(row.endVarianceDays)}d`,
      ] : []),
      formatDate(row.deadlineDate),
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
  if (!report.options.includeDetails) return [];
  const detailed = report.rows.filter(
    (row) => row.description !== null || row.notes !== null || row.tags.length > 0 || row.assignee !== null,
  );
  if (detailed.length === 0) return [];
  return [
    { text: "Detalhes das atividades", style: "section", margin: [0, 14, 0, 8] },
    ...detailed.map((row) => ({
      stack: [
        { text: row.label, style: "detailTitle" },
        row.assignee === null ? null : { text: `Responsável: ${row.assignee}`, style: "detailMeta" },
        row.tags.length === 0 ? null : { text: `Tags: ${row.tags.join(", ")}`, style: "detailMeta" },
        row.description === null ? null : { text: row.description, margin: [0, 4, 0, 0] },
        row.notes === null ? null : { text: `Observações: ${row.notes}`, margin: [0, 4, 0, 0], color: COLORS.muted },
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
    return { text: "Nenhuma atividade agendada para exibir no cronograma.", style: "empty" };
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
    item("TASK", "Tarefa"),
    item("SUMMARY", "Resumo"),
    item("CRITICAL", "Crítica"),
    item("NEAR", "Quase crítica"),
    item("WEEKEND", "Fim de semana"),
    item("DEPENDENCY", "Dependência"),
  ];
  if (includesBaseline) items.push(item("BASELINE", "Plano de referência"));
  return {
    columns: items,
    columnGap: 7,
    margin: [0, 0, 0, 7],
  };
}

export function buildProjectPdfDefinition(report: ProjectReport): PdfDefinition {
  const content: PdfNode[] = [...reportHeader(report, "Relatório de planejamento")];
  if (report.options.format === "REPORT") content.push(...summarySection(report));
  content.push(...criticalPathSection(report));
  if (report.options.format === "REPORT" || report.options.format === "TASKS") {
    content.push({ text: "Atividades", style: "section", margin: [0, 4, 0, 8] }, taskTable(report));
    content.push(...detailSections(report));
  }
  if (report.options.format === "REPORT" || report.options.format === "GANTT") {
    content.push({
      text: "Cronograma Gantt",
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
      subject: "Relatório local de planejamento",
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
        { text: "Chrono Project - planejamento local", margin: [28, 0, 0, 0] },
        { text: `Página ${String(currentPage)} de ${String(pageCount)}`, alignment: "right", margin: [0, 0, 28, 0] },
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
