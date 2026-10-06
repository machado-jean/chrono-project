import { useEffect, useRef, useState } from "react";

import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import {
  clipboardErrorMessage,
  copyControlValue,
  copyTextSelection,
  isEditableTextControl,
  pasteTextSelection,
  selectionFromControl,
  type TextSelection,
} from "./text-clipboard";

interface FormContext {
  readonly control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  readonly selection: TextSelection | null;
  readonly x: number;
  readonly y: number;
}

function isFormControl(target: EventTarget | null): target is FormContext["control"] {
  return target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement;
}

export function TextContextMenu() {
  const [context, setContext] = useState<FormContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const originRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const open = (event: globalThis.MouseEvent): void => {
      if (event.defaultPrevented || !isFormControl(event.target)) return;
      event.preventDefault();
      originRef.current = event.target;
      setError(null);
      setContext({
        control: event.target,
        selection: isEditableTextControl(event.target) ? selectionFromControl(event.target) : null,
        x: event.clientX,
        y: event.clientY,
      });
    };
    document.addEventListener("contextmenu", open);
    return () => { document.removeEventListener("contextmenu", open); };
  }, []);

  const reportClipboardFailure = (reason: unknown): void => {
    setError(clipboardErrorMessage(reason));
    originRef.current?.focus();
  };
  const runClipboardAction = (action: () => Promise<void>): void => {
    void action().catch(reportClipboardFailure).finally(() => { originRef.current?.focus(); });
  };

  let items: readonly ContextMenuItem[] = [];
  if (context !== null && context.selection !== null) {
    const { selection } = context;
    const selected = selection.control.value.slice(selection.start, selection.end);
    const readOnly = selection.control.disabled || selection.control.readOnly;
    items = [
    {
      id: "cut",
      label: "Recortar",
      disabled: selected.length === 0 || readOnly,
        onSelect: () => { runClipboardAction(() => copyTextSelection(selection, true)); },
    },
    {
      id: "copy",
      label: "Copiar",
      disabled: selected.length === 0,
        onSelect: () => { runClipboardAction(() => copyTextSelection(selection, false)); },
    },
    {
      id: "paste",
      label: "Colar",
      disabled: readOnly,
        onSelect: () => { runClipboardAction(() => pasteTextSelection(selection)); },
    },
    {
      id: "select-all",
      label: "Selecionar tudo",
        onSelect: () => { selection.control.focus(); selection.control.select(); },
    },
    ];
  } else if (context !== null && !(context.control instanceof HTMLTextAreaElement)) {
    const control = context.control;
    items = [{
      id: "copy-value",
      label: control instanceof HTMLSelectElement ? "Copiar opção" : "Copiar valor",
      disabled: control.value.length === 0,
      onSelect: () => { runClipboardAction(() => copyControlValue(control)); },
    }];
  }

  return (
    <>
      {context === null ? null : (
        <ContextMenu
          ariaLabel="Edição de campo"
          heading="Editar campo"
          items={items}
          returnFocusRef={originRef}
          x={context.x}
          y={context.y}
          onClose={() => { setContext(null); }}
        />
      )}
      {error === null ? null : <div className="clipboard-error-toast" role="alert">{error}</div>}
    </>
  );
}
