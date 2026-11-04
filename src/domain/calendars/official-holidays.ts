export const OFFICIAL_HOLIDAY_SOURCE = "Catálogo local do Chrono Project — feriados nacionais e estaduais brasileiros";

export type OfficialHolidayKind = "public" | "bank" | "optional";

export interface OfficialHoliday {
  readonly date: string;
  readonly name: string;
  readonly kind: OfficialHolidayKind;
  readonly rule: string;
}

interface HolidayRule {
  readonly month?: number;
  readonly day?: number;
  readonly offsetFromEaster?: number;
  readonly firstSundayInMarch?: true;
  readonly sundayAfterFixedDate?: true;
  readonly name: string;
  readonly kind?: OfficialHolidayKind;
  readonly fromYear?: number;
  readonly toYear?: number;
}

const fixed = (month: number, day: number, name: string, kind: OfficialHolidayKind = "public", fromYear?: number, toYear?: number): HolidayRule => ({
  month,
  day,
  name,
  kind,
  ...(fromYear === undefined ? {} : { fromYear }),
  ...(toYear === undefined ? {} : { toYear }),
});
const afterEaster = (offsetFromEaster: number, name: string, kind: OfficialHolidayKind = "public"): HolidayRule => ({ offsetFromEaster, name, kind });

const NATIONAL_RULES: readonly HolidayRule[] = [
  fixed(1, 1, "Confraternização Universal"), afterEaster(-48, "Carnaval", "bank"), afterEaster(-47, "Carnaval", "bank"), afterEaster(-46, "Carnaval", "optional"), afterEaster(-2, "Sexta-Feira Santa"), fixed(4, 21, "Dia de Tiradentes"), fixed(5, 1, "Dia do Trabalho"), afterEaster(60, "Corpus Christi", "bank"), fixed(9, 7, "Dia da Independência"), fixed(10, 12, "Nossa Senhora Aparecida"), fixed(11, 2, "Finados"), fixed(11, 15, "Proclamação da República"), fixed(11, 20, "Dia da Consciência Negra", "public", 2024), fixed(12, 24, "Véspera de Natal", "optional"), fixed(12, 25, "Natal"), fixed(12, 31, "Véspera de Ano-Novo", "optional"),
];

const STATE_RULES: Readonly<Record<string, readonly HolidayRule[]>> = {
  AC: [fixed(1, 12, "Dia do evangélico", "public", 2004), fixed(3, 8, "Alusivo ao Dia Internacional da Mulher", "public", 2001), fixed(6, 15, "Aniversário do estado", "public", 1964), fixed(9, 5, "Dia da Amazônia", "public", 2004), fixed(11, 17, "Assinatura do Tratado de Petrópolis", "optional", 2012)],
  AL: [fixed(6, 24, "São João", "public", 1993), fixed(6, 29, "São Pedro", "public", 1993), fixed(9, 16, "Emancipação política"), fixed(11, 20, "Morte de Zumbi dos Palmares", "public", 1995)],
  AM: [fixed(9, 5, "Elevação do Amazonas à categoria de província", "public", 1977), fixed(11, 20, "Dia da Consciência Negra", "public", 2010, 2023)],
  AP: [fixed(3, 19, "Dia de São José", "public", 2002), fixed(9, 13, "Criação do Território Federal")], BA: [fixed(7, 2, "Independência da Bahia")], CE: [fixed(3, 25, "Data magna do estado", "public", 2011)],
  DF: [fixed(4, 21, "Fundação de Brasília"), fixed(11, 30, "Dia do Evangélico", "public", 1995)], ES: [afterEaster(8, "Dia de Nossa Senhora da Penha")], GO: [fixed(7, 26, "Fundação da Cidade de Goiás"), fixed(10, 24, "Lançamento da pedra fundamental de Goiânia")],
  MA: [fixed(7, 28, "Adesão do Maranhão à independência do Brasil", "public", 1964)], MG: [fixed(4, 21, "Data magna do estado")], MS: [fixed(10, 11, "Criação do estado", "public", 1979)], MT: [fixed(11, 20, "Dia da Consciência Negra", "public", 2002, 2023)],
  PA: [fixed(8, 15, "Adesão do Grão-Pará à independência do Brasil", "public", 1996)], PB: [fixed(7, 26, "Homenagem à memória do ex-presidente João Pessoa"), fixed(8, 5, "Nossa Senhora das Neves", "public", 1967)],
  PE: [{ firstSundayInMarch: true, name: "Revolução Pernambucana de 1817", fromYear: 2009 }], PI: [fixed(10, 19, "Dia do Piauí", "public", 1937)], PR: [fixed(12, 19, "Emancipação política do estado do Paraná", "public", 1962)],
  RJ: [afterEaster(-47, "Carnaval"), fixed(4, 23, "Dia de São Jorge", "public", 2008), fixed(11, 20, "Dia da Consciência Negra", "public", 2002, 2023)], RN: [fixed(10, 3, "Mártires de Cunhaú e Uruaçu", "public", 2006)],
  RO: [fixed(1, 4, "Criação do estado", "public", 2010), fixed(6, 18, "Dia do evangélico", "public", 2001)], RR: [fixed(10, 5, "Criação do estado")], RS: [fixed(9, 20, "Proclamação da República Rio-Grandense")],
  SC: [{ month: 8, day: 11, sundayAfterFixedDate: true, name: "Dia de Santa Catarina", fromYear: 2005 }, { month: 11, day: 25, sundayAfterFixedDate: true, name: "Dia de Santa Catarina de Alexandria", fromYear: 2005 }],
  SE: [fixed(7, 8, "Emancipação política de Sergipe")], SP: [fixed(7, 9, "Revolução Constitucionalista", "public", 1997), fixed(11, 20, "Dia da Consciência Negra", "public", 2023, 2023)],
  TO: [fixed(3, 18, "Autonomia do Estado", "public", 1998), fixed(9, 8, "Nossa Senhora da Natividade", "public", 1993), fixed(10, 5, "Criação do estado", "public", 1989)],
};

export const BRAZILIAN_STATES = [["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"], ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"]].map(([code, name]) => ({ code, name })) as readonly { readonly code: string; readonly name: string }[];

function formatDate(date: Date): string { return date.toISOString().slice(0, 10); }
function utcDate(year: number, month: number, day: number): Date { return new Date(Date.UTC(year, month - 1, day)); }
function addDays(date: Date, days: number): Date { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }

function easterSunday(year: number): Date {
  const goldenNumber = year % 19;
  const century = Math.floor(year / 100);
  const yearWithinCentury = year % 100;
  const leapCentury = Math.floor(century / 4);
  const centuryRemainder = century % 4;
  const moonCorrection = Math.floor((century + 8) / 25);
  const epactCorrection = Math.floor((century - moonCorrection + 1) / 3);
  const epact = (19 * goldenNumber + century - leapCentury - epactCorrection + 15) % 30;
  const leapYear = Math.floor(yearWithinCentury / 4);
  const weekdayRemainder = yearWithinCentury % 4;
  const weekday = (32 + 2 * centuryRemainder + 2 * leapYear - epact - weekdayRemainder) % 7;
  const correction = Math.floor((goldenNumber + 11 * epact + 22 * weekday) / 451);
  const month = Math.floor((epact + weekday - 7 * correction + 114) / 31);
  const day = ((epact + weekday - 7 * correction + 114) % 31) + 1;
  return utcDate(year, month, day);
}

function dateForRule(year: number, rule: HolidayRule): Date {
  if (rule.offsetFromEaster !== undefined) return addDays(easterSunday(year), rule.offsetFromEaster);
  if (rule.firstSundayInMarch === true) { const marchFirst = utcDate(year, 3, 1); return addDays(marchFirst, (7 - marchFirst.getUTCDay()) % 7); }
  if (rule.month === undefined || rule.day === undefined) throw new Error("Regra de feriado inválida.");
  const date = utcDate(year, rule.month, rule.day);
  return rule.sundayAfterFixedDate === true ? addDays(date, (7 - date.getUTCDay()) % 7) : date;
}

function addRule(result: Map<string, OfficialHoliday>, year: number, rule: HolidayRule): void {
  if ((rule.fromYear !== undefined && year < rule.fromYear) || (rule.toYear !== undefined && year > rule.toYear)) return;
  const date = formatDate(dateForRule(year, rule)); const current = result.get(date);
  if (current === undefined) result.set(date, { date, name: rule.name, kind: rule.kind ?? "public", rule: rule.offsetFromEaster === undefined ? "fixed" : `easter ${String(rule.offsetFromEaster)}` });
  else if (!current.name.includes(rule.name)) result.set(date, { ...current, name: `${current.name} / ${rule.name}` });
}

export function officialHolidays(years: readonly number[], stateCode: string | null): Promise<readonly OfficialHoliday[]> {
  const byDate = new Map<string, OfficialHoliday>(); const stateRules = stateCode === null ? [] : (STATE_RULES[stateCode] ?? []);
  for (const year of [...new Set(years)].sort()) { for (const rule of NATIONAL_RULES) addRule(byDate, year, rule); for (const rule of stateRules) addRule(byDate, year, rule); }
  return Promise.resolve([...byDate.values()].sort((left, right) => left.date.localeCompare(right.date)));
}

export function scheduleYears(tasks: readonly { readonly startDate: string | null; readonly endDate: string | null }[], fallbackYear = new Date().getFullYear()): readonly number[] {
  const years = new Set<number>(); for (const task of tasks) { if (task.startDate !== null) years.add(Number(task.startDate.slice(0, 4))); if (task.endDate !== null) years.add(Number(task.endDate.slice(0, 4))); }
  return years.size === 0 ? [fallbackYear] : [...years].sort();
}
