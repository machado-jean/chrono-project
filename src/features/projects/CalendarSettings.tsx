import { useState, type SyntheticEvent } from "react";

import {
  CONTINUOUS_CALENDAR_ID,
  type Calendar,
  type CalendarException,
  type Weekday,
} from "../../domain/calendars/calendar";
import {
  BRAZILIAN_STATES,
  OFFICIAL_HOLIDAY_SOURCE,
  officialHolidays,
  type OfficialHoliday,
} from "../../domain/calendars/official-holidays";
import { useLanguage } from "../../i18n/language";

interface CalendarSettingsProps {
  readonly calendar: Calendar;
  readonly disabled: boolean;
  readonly usedYears: readonly number[];
  readonly onSave: (calendar: Calendar) => Promise<boolean>;
}

export function CalendarSettings({ calendar, disabled, usedYears, onSave }: CalendarSettingsProps) {
  const { language, t } = useLanguage();
  const english = language === "en";
  const weekdays: readonly { readonly value: Weekday; readonly label: string }[] = english
    ? [{ value: 1, label: "Mon" }, { value: 2, label: "Tue" }, { value: 3, label: "Wed" }, { value: 4, label: "Thu" }, { value: 5, label: "Fri" }, { value: 6, label: "Sat" }, { value: 7, label: "Sun" }]
    : [{ value: 1, label: "Seg" }, { value: 2, label: "Ter" }, { value: 3, label: "Qua" }, { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" }, { value: 7, label: "Dom" }];
  const holidayKindLabel = english
    ? { public: "Public holiday", bank: "Bank holiday", optional: "Optional holiday" }
    : { public: "Feriado oficial", bank: "Feriado bancário", optional: "Ponto facultativo" };
  const [draft, setDraft] = useState(calendar);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionName, setExceptionName] = useState("");
  const [exceptionIsWorking, setExceptionIsWorking] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [stateCode, setStateCode] = useState<string>("");
  const [holidayPreview, setHolidayPreview] = useState<readonly OfficialHoliday[]>([]);
  const [selectedHolidayDates, setSelectedHolidayDates] = useState<ReadonlySet<string>>(new Set());
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const isContinuous = calendar.id === CONTINUOUS_CALENDAR_ID;

  const toggleWeekday = (weekday: Weekday): void => {
    setDraft((current) => ({
      ...current,
      workingDays: current.workingDays.includes(weekday)
        ? current.workingDays.filter((candidate) => candidate !== weekday)
        : [...current.workingDays, weekday].sort((left, right) => left - right),
    }));
    setDirty(true);
  };

  const addException = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const timestamp = new Date().toISOString();
    const exception: CalendarException = {
      id: crypto.randomUUID(),
      calendarId: draft.id,
      date: exceptionDate,
      isWorkingDay: exceptionIsWorking,
      name: exceptionName || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setDraft((current) => ({
      ...current,
      exceptions: [
        ...current.exceptions.filter((candidate) => candidate.date !== exceptionDate),
        exception,
      ].sort((left, right) => left.date.localeCompare(right.date)),
    }));
    setExceptionDate("");
    setExceptionName("");
    setExceptionIsWorking(false);
    setDirty(true);
  };

  const previewOfficialHolidays = async (): Promise<void> => {
    setIsLoadingHolidays(true);
    setHolidayError(null);
    try {
      const preview = await officialHolidays(usedYears, stateCode === "" ? null : stateCode);
      setHolidayPreview(preview);
      setSelectedHolidayDates(new Set(
        preview.filter((holiday) => holiday.kind === "public" && !draft.exceptions.some((item) => item.date === holiday.date))
          .map((holiday) => holiday.date),
      ));
    } catch {
      setHolidayError(english ? "The local holiday catalog could not be loaded." : "Não foi possível carregar o catálogo local de feriados.");
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  const addOfficialHolidays = (): void => {
    const timestamp = new Date().toISOString();
    const additions: CalendarException[] = holidayPreview
      .filter((holiday) => selectedHolidayDates.has(holiday.date))
      .map((holiday) => ({
        id: crypto.randomUUID(), calendarId: draft.id, date: holiday.date,
        isWorkingDay: false, name: holiday.name, createdAt: timestamp, updatedAt: timestamp,
      }));
    setDraft((current) => ({
      ...current,
      exceptions: [...current.exceptions, ...additions].sort((left, right) => left.date.localeCompare(right.date)),
    }));
    setHolidayPreview([]);
    setSelectedHolidayDates(new Set());
    if (additions.length > 0) setDirty(true);
  };

  return (
    <details className="workspace-menu calendar-settings" name="workspace-menu">
      <summary>
        <span>{t("menu.calendar")}</span>
      </summary>
      <div className="workspace-menu-popover calendar-settings-body">
        <div className="menu-panel-heading">
          <strong>{calendar.name}</strong>
          <small>{calendar.workingDays.length} {english ? "working days per week" : "dias de trabalho por semana"}</small>
        </div>
        <p className="calendar-scope-note">
          {english ? "Changes to this calendar apply to every project and task that uses it." : "Alterações neste calendário valem para todos os projetos e tarefas que o utilizam."}
        </p>
        {isContinuous ? (
          <p>{english ? "This built-in calendar considers every day available." : "Este calendário integrado considera todos os dias como disponíveis."}</p>
        ) : (
          <>
            <div className="calendar-weekdays" aria-label={english ? "Working days" : "Dias de trabalho"}>
              {weekdays.map(({ value, label }) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={draft.workingDays.includes(value)}
                    disabled={disabled}
                    onChange={() => { toggleWeekday(value); }}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="calendar-exceptions">
              <div>
                <h3>{english ? "Holidays and exceptions" : "Feriados e exceções"}</h3>
                <p>{english ? "An exception can block a working day or make a normally inactive date available." : "Uma exceção pode bloquear um dia útil ou liberar uma data normalmente inativa."}</p>
              </div>
              {draft.exceptions.length === 0 ? (
                <span className="muted-text">{english ? "No exceptions registered." : "Nenhuma exceção cadastrada."}</span>
              ) : (
                <ul>
                  {draft.exceptions.map((exception) => (
                    <li key={exception.id}>
                      <span>
                        <strong>{exception.date}</strong>
                        {exception.name === null ? "" : ` · ${exception.name}`}
                        {exception.isWorkingDay ? (english ? " · Available day" : " · Dia liberado") : (english ? " · Non-working" : " · Não útil")}
                      </span>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setDraft((current) => ({
                            ...current,
                            exceptions: current.exceptions.filter(
                              (candidate) => candidate.id !== exception.id,
                            ),
                          }));
                          setDirty(true);
                        }}
                      >{english ? "Remove" : "Remover"}</button>
                    </li>
                  ))}
                </ul>
              )}
              <form className="calendar-exception-form" onSubmit={addException}>
                <label>{english ? "Date" : "Data"}<input type="date" required value={exceptionDate} disabled={disabled} onChange={(event) => { setExceptionDate(event.target.value); }} /></label>
                <label>{english ? "Name" : "Nome"}<input placeholder={english ? "E.g. local holiday" : "Ex.: feriado local"} value={exceptionName} disabled={disabled} onChange={(event) => { setExceptionName(event.target.value); }} /></label>
                <label className="working-exception-toggle"><input type="checkbox" checked={exceptionIsWorking} disabled={disabled} onChange={(event) => { setExceptionIsWorking(event.target.checked); }} />{english ? "Make available as a working day" : "Liberar como dia útil"}</label>
                <button className="secondary-button" type="submit" disabled={disabled}>{english ? "Add exception" : "Adicionar exceção"}</button>
              </form>
              <div className="official-holiday-import">
                <div>
                  <h3>{english ? "Import official holidays" : "Importar feriados oficiais"}</h3>
                  <p>{english ? "Years used in this project:" : "Anos usados neste projeto:"} {usedYears.join(", ")}. {english ? "Municipal holidays can still be registered manually above." : "Municipais continuam sendo cadastrados manualmente acima."}</p>
                </div>
                <div className="official-holiday-actions">
                  <label>{english ? "State" : "UF"}<select value={stateCode} disabled={disabled} onChange={(event) => { setStateCode(event.target.value); setHolidayPreview([]); }}>
                    <option value="">{english ? "National only" : "Somente nacionais"}</option>
                    {BRAZILIAN_STATES.map((state) => <option key={state.code} value={state.code}>{state.name} ({state.code})</option>)}
                  </select></label>
                  <button className="secondary-button" type="button" disabled={disabled || isLoadingHolidays} onClick={() => { void previewOfficialHolidays(); }}>{isLoadingHolidays ? (english ? "Loading…" : "Carregando…") : (english ? "Preview" : "Gerar prévia")}</button>
                </div>
                {holidayError === null ? null : <p role="alert">{holidayError}</p>}
                {holidayPreview.length > 0 ? <>
                  <ul className="official-holiday-preview">
                    {holidayPreview.map((holiday) => {
                      const collision = draft.exceptions.some((item) => item.date === holiday.date);
                      return <li key={`${holiday.date}-${holiday.rule}`}>
                        <label><input type="checkbox" disabled={disabled || collision} checked={selectedHolidayDates.has(holiday.date)} onChange={(event) => {
                          setSelectedHolidayDates((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(holiday.date);
                            else next.delete(holiday.date);
                            return next;
                          });
                        }} /><span><strong>{holiday.date}</strong> · {holiday.name}<small>{holidayKindLabel[holiday.kind]}{collision ? (english ? " · already exists in the calendar" : " · já existe no calendário") : ""}</small></span></label>
                      </li>;
                    })}
                  </ul>
                  <button className="secondary-button" type="button" disabled={disabled || selectedHolidayDates.size === 0} onClick={addOfficialHolidays}>{english ? "Add selected holidays to calendar" : "Adicionar selecionados ao calendário"}</button>
                </> : null}
                <details className="holiday-license"><summary>{english ? "Catalog information" : "Informações do catálogo"}</summary><p>{OFFICIAL_HOLIDAY_SOURCE}. {english ? "The import works entirely offline; municipal holidays remain manual calendar exceptions." : "A importação funciona integralmente offline; feriados municipais continuam como exceções manuais do calendário."}</p></details>
              </div>
            </div>

            {dirty ? (
              <button
                className="primary-button"
                type="button"
                disabled={disabled || draft.workingDays.length === 0}
                onClick={() => { void onSave(draft).then((saved) => { if (saved) setDirty(false); }); }}
              >{english ? "Save calendar" : "Salvar calendário"}</button>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}
