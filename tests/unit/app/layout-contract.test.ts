import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(resolve(process.cwd(), "src/app/App.css"), "utf8");

describe("contrato de rolagem das visualizações", () => {
  it("mantém filtros ancorados depois da rolagem inicial do projeto", () => {
    expect(stylesheet).toMatch(/\.task-filters\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/s);
    expect(stylesheet).toMatch(/\.project-workspace\s*\{[^}]*--project-header-scroll-space:/s);
    expect(stylesheet).toMatch(/\.task-table th\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;/s);
    expect(stylesheet).toMatch(/\.table-scroll-shell\s*\{[^}]*grid-template-rows:\s*var\(--table-viewport-height[^}]*18px[^}]*transition:\s*height/s);
  });

  it("mantém a barra horizontal nativa do Gantt fora da área rolável", () => {
    expect(stylesheet).toMatch(/\.gantt-horizontal-scrollbar\s*\{[^}]*grid-row:\s*2;[^}]*overflow-x:\s*auto;/s);
    expect(stylesheet).toMatch(/\.gantt-layout\s*\{[^}]*grid-template-rows:\s*var\(--gantt-chart-height\)\s+24px;/s);
    expect(stylesheet).toMatch(/\.gantt-chart-shell\s*\{[^}]*transition:\s*height/s);
  });
});
