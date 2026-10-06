export type EditableTextControl = HTMLInputElement | HTMLTextAreaElement;

export interface TextSelection {
  readonly control: EditableTextControl;
  readonly start: number;
  readonly end: number;
}

const SELECTABLE_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel", "password"]);

export function isEditableTextControl(target: EventTarget | null): target is EditableTextControl {
  return target instanceof HTMLTextAreaElement || (
    target instanceof HTMLInputElement && SELECTABLE_INPUT_TYPES.has(target.type)
  );
}

export function selectionFromControl(control: EditableTextControl): TextSelection {
  return {
    control,
    start: control.selectionStart ?? control.value.length,
    end: control.selectionEnd ?? control.value.length,
  };
}

function setNativeValue(control: EditableTextControl, value: string): void {
  const prototype = control instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(control, value);
  control.dispatchEvent(new Event("input", { bubbles: true }));
}

export function replaceTextSelection(selection: TextSelection, replacement: string): void {
  const { control, start, end } = selection;
  setNativeValue(control, `${control.value.slice(0, start)}${replacement}${control.value.slice(end)}`);
  control.focus();
  const cursor = start + replacement.length;
  control.setSelectionRange(cursor, cursor);
}

function clipboard(): Clipboard {
  const candidate: unknown = Reflect.get(navigator, "clipboard");
  if (
    typeof candidate !== "object" ||
    candidate === null ||
    !("readText" in candidate) ||
    !("writeText" in candidate)
  ) {
    throw new Error("A área de transferência não está disponível neste ambiente.");
  }
  return candidate as Clipboard;
}

export async function copyTextSelection(selection: TextSelection, cut: boolean): Promise<void> {
  const selected = selection.control.value.slice(selection.start, selection.end);
  if (selected.length === 0) return;
  await clipboard().writeText(selected);
  if (cut && !selection.control.disabled && !selection.control.readOnly) {
    replaceTextSelection(selection, "");
  }
}

export async function pasteTextSelection(selection: TextSelection): Promise<void> {
  if (selection.control.disabled || selection.control.readOnly) return;
  replaceTextSelection(selection, await clipboard().readText());
}

export async function copyControlValue(control: HTMLInputElement | HTMLSelectElement): Promise<void> {
  const value = control instanceof HTMLSelectElement
    ? control.selectedOptions.item(0)?.text ?? control.value
    : control.type === "checkbox" || control.type === "radio"
      ? control.checked ? "Marcado" : "Desmarcado"
      : control.value;
  await clipboard().writeText(value);
}

export function clipboardErrorMessage(error: unknown): string {
  const detail = error instanceof Error && error.message.trim().length > 0
    ? ` ${error.message}`
    : "";
  return `Não foi possível acessar a área de transferência.${detail}`;
}
