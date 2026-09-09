/* eslint-disable @typescript-eslint/restrict-template-expressions -- SVG numeric attributes are serialized intentionally. */
import { addCalendarDays, calendarDaysBetween, weekday } from "../calendars/date-only";
import type { ProjectReport, ProjectReportRow } from "./project-report";

const WIDTH = 760;
const LABEL_WIDTH = 220;
const TIMELINE_WIDTH = WIDTH - LABEL_WIDTH;
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 20;
const ROWS_PER_PAGE = 18;
const WEEKDAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"] as const;

export interface GanttSvgPage { readonly svg: string; readonly width: number }

function xml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function barRange(row: ProjectReportRow, start: string, end: string, dayWidth: number): { x: number; width: number } | null {
  if (row.startDate === null || row.endDate === null || row.endDate < start || row.startDate > end) return null;
  const visibleStart = row.startDate < start ? start : row.startDate;
  const visibleEnd = row.endDate > end ? end : row.endDate;
  return {
    x: LABEL_WIDTH + calendarDaysBetween(start, visibleStart) * dayWidth,
    width: Math.max(2, (calendarDaysBetween(visibleStart, visibleEnd) + 1) * dayWidth),
  };
}

function pageSvg(rows: readonly ProjectReportRow[], allRows: readonly ProjectReportRow[], start: string, end: string): string {
  const days = Math.max(1, calendarDaysBetween(start, end) + 1);
  const dayWidth = TIMELINE_WIDTH / days;
  const height = HEADER_HEIGHT + rows.length * ROW_HEIGHT;
  const rowIndex = new Map(rows.map((row, index) => [row.id, index]));
  const allRowsById = new Map(allRows.map((row) => [row.id, row]));
  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">`,
    `<rect width="${WIDTH}" height="${height}" fill="#fff"/><rect width="${WIDTH}" height="${HEADER_HEIGHT}" fill="#162235"/>`,
    `<text x="8" y="26" fill="#fff" font-family="Arial" font-size="9" font-weight="700">Atividade</text>`];

  for (let index = 0; index < days; index += 1) {
    const date = addCalendarDays(start, index);
    const x = LABEL_WIDTH + index * dayWidth;
    const weekend = weekday(date) >= 6;
    const fill = weekend ? "#E5E9F0" : index % 2 === 0 ? "#F3F6FA" : "#FFFFFF";
    parts.push(`<rect x="${x}" y="${HEADER_HEIGHT}" width="${dayWidth}" height="${height - HEADER_HEIGHT}" fill="${fill}"/>`);
    parts.push(`<rect x="${x}" width="${dayWidth}" height="${HEADER_HEIGHT}" fill="${weekend ? "#334155" : index % 2 === 0 ? "#1E2E45" : "#162235"}"/>`);
    parts.push(`<text x="${x + dayWidth / 2}" y="20" text-anchor="middle" fill="#fff" font-family="Arial" font-size="${days <= 31 ? 6 : 5}" font-weight="700">${WEEKDAYS[weekday(date) - 1]}</text>`);
    parts.push(`<text x="${x + dayWidth / 2}" y="32" text-anchor="middle" fill="#fff" font-family="Arial" font-size="${days <= 31 ? 7 : 5.5}">${date.slice(-2)}</text>`);
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#CBD2DC" stroke-width="0.35"/>`);
  }
  parts.push(`<line x1="${WIDTH}" y1="0" x2="${WIDTH}" y2="${height}" stroke="#CBD2DC" stroke-width="0.35"/>`);

  rows.forEach((row, index) => {
    const y = HEADER_HEIGHT + index * ROW_HEIGHT;
    parts.push(`<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" stroke="#D8DEE8" stroke-width="0.45"/>`);
    const label = row.label.length > 46 ? `${row.label.slice(0, 43)}…` : row.label;
    parts.push(`<text x="${8 + row.depth * 8}" y="${y + 13}" fill="#162235" font-family="Arial" font-size="8" ${row.isSummary ? 'font-weight="700"' : ""}>${xml(label)}</text>`);
  });

  rows.forEach((successor, successorIndex) => {
    const successorBar = barRange(successor, start, end, dayWidth);
    if (successorBar === null) return;
    const ySuccessor = HEADER_HEIGHT + successorIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
    for (const predecessorId of successor.predecessorIds) {
      const predecessor = allRowsById.get(predecessorId);
      const predecessorIndex = rowIndex.get(predecessorId);
      const predecessorBar = predecessor === undefined ? null : barRange(predecessor, start, end, dayWidth);
      if (predecessorBar === null || predecessorIndex === undefined) {
        parts.push(`<path d="M ${LABEL_WIDTH + 2} ${ySuccessor} H ${successorBar.x - 1}" fill="none" stroke="#667085" stroke-width="1" stroke-dasharray="3 2"/>`);
        parts.push(`<circle cx="${LABEL_WIDTH + 2}" cy="${ySuccessor}" r="2" fill="#667085"/>`);
        parts.push(`<path d="M ${successorBar.x - 4} ${ySuccessor - 3} L ${successorBar.x} ${ySuccessor} L ${successorBar.x - 4} ${ySuccessor + 3} Z" fill="#667085"/>`);
        continue;
      }
      const yPredecessor = HEADER_HEIGHT + predecessorIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      const fromX = predecessorBar.x + predecessorBar.width;
      const toX = successorBar.x;
      const elbowX = Math.max(fromX + 4, toX - 7);
      parts.push(`<path d="M ${fromX} ${yPredecessor} H ${elbowX} V ${ySuccessor} H ${toX - 1}" fill="none" stroke="#667085" stroke-width="1"/>`);
      parts.push(`<path d="M ${toX - 4} ${ySuccessor - 3} L ${toX} ${ySuccessor} L ${toX - 4} ${ySuccessor + 3} Z" fill="#667085"/>`);
    }
  });

  rows.forEach((row, index) => {
    const bar = barRange(row, start, end, dayWidth);
    if (bar === null) return;
    const y = HEADER_HEIGHT + index * ROW_HEIGHT + 5;
    const color = row.isSummary ? "#0F9F83" : "#2563EB";
    const progress = row.isSummary ? "#087565" : "#1E40AF";
    parts.push(`<rect x="${bar.x}" y="${y}" width="${bar.width}" height="10" rx="1.5" fill="${color}"/>`);
    parts.push(`<rect x="${bar.x}" y="${y}" width="${bar.width * row.progress / 100}" height="10" rx="1.5" fill="${progress}"/>`);
  });
  parts.push(`<line x1="0" y1="${height}" x2="${WIDTH}" y2="${height}" stroke="#D8DEE8" stroke-width="0.45"/></svg>`);
  return parts.join("");
}

export function buildGanttSvgPages(report: ProjectReport): readonly GanttSvgPage[] {
  if (report.timelineStart === null || report.timelineEnd === null) return [];
  const pages: GanttSvgPage[] = [];
  for (let index = 0; index < report.rows.length; index += ROWS_PER_PAGE) {
    const rows = report.rows.slice(index, index + ROWS_PER_PAGE);
    pages.push({ svg: pageSvg(rows, report.rows, report.timelineStart, report.timelineEnd), width: WIDTH });
  }
  return pages;
}
