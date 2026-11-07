import { describe, expect, it } from "vitest";

import { officialHolidays, scheduleYears } from "../../../src/domain/calendars/official-holidays";

describe("feriados oficiais brasileiros", () => {
  it("carrega feriados nacionais móveis e fixos em português", async () => {
    const holidays = await officialHolidays([2026], null);
    expect(holidays).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: "2026-04-03", name: "Sexta-Feira Santa", kind: "public" }),
      expect.objectContaining({ date: "2026-09-07", name: "Dia da Independência", kind: "public" }),
    ]));
    expect(holidays.every((holiday) => ["public", "bank", "optional"].includes(holiday.kind))).toBe(true);
  });

  it("inclui o feriado estadual da UF escolhida", async () => {
    const holidays = await officialHolidays([2026], "SP");
    expect(holidays).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: "2026-07-09", name: "Revolução Constitucionalista" }),
    ]));
  });

  it("calcula regras móveis estaduais sem depender de catálogo externo", async () => {
    const espiritoSanto = await officialHolidays([2026], "ES");
    const pernambuco = await officialHolidays([2026], "PE");

    expect(espiritoSanto).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: "2026-04-13", name: "Dia de Nossa Senhora da Penha" }),
    ]));
    expect(pernambuco).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: "2026-03-01", name: "Revolução Pernambucana de 1817" }),
    ]));
  });

  it("aplica vigências do feriado nacional da Consciência Negra", async () => {
    const beforeNationalLaw = await officialHolidays([2023], null);
    const afterNationalLaw = await officialHolidays([2024], null);

    expect(beforeNationalLaw).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ date: "2023-11-20" }),
    ]));
    expect(afterNationalLaw).toEqual(expect.arrayContaining([
      expect.objectContaining({ date: "2024-11-20", name: "Dia da Consciência Negra" }),
    ]));
  });

  it("limita a prévia aos anos usados e aplica fallback ao projeto sem datas", () => {
    expect(scheduleYears([
      { startDate: "2026-12-20", endDate: "2027-01-10" },
      { startDate: "2026-02-01", endDate: "2026-02-02" },
    ], 2030)).toEqual([2026, 2027]);
    expect(scheduleYears([], 2030)).toEqual([2030]);
  });
});
