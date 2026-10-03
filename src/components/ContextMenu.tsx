import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly danger?: boolean;
  readonly separatorBefore?: boolean;
  readonly onSelect: () => void;
}

interface ContextMenuProps {
  readonly ariaLabel: string;
  readonly heading?: string;
  readonly items: readonly ContextMenuItem[];
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly x: number;
  readonly y: number;
  readonly onClose: () => void;
}

export function ContextMenu({
  ariaLabel,
  heading,
  items,
  returnFocusRef,
  x,
  y,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)')?.focus();

    const closeOutside = (event: PointerEvent): void => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      onClose();
    };
    const closeOnResize = (): void => { onClose(); };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("resize", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [onClose]);

  const closeAndRestoreFocus = (): void => {
    onClose();
    returnFocusRef?.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)'),
    );
    if (buttons.length === 0) return;
    event.preventDefault();
    const currentIndex = buttons.findIndex((button) => button === document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = buttons.length - 1;
    if (event.key === "ArrowDown") nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % buttons.length;
    if (event.key === "ArrowUp") nextIndex = currentIndex < 0 ? buttons.length - 1 : (currentIndex - 1 + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  };

  const estimatedHeight = 48 + items.length * 34;
  const left = Math.max(8, Math.min(x, window.innerWidth - 268));
  const top = Math.max(8, Math.min(y, window.innerHeight - estimatedHeight - 8));

  return createPortal(
    <div
      ref={menuRef}
      className="app-context-menu"
      role="menu"
      aria-label={ariaLabel}
      style={{ left, top }}
      onKeyDown={handleKeyDown}
    >
      {heading === undefined ? null : <strong>{heading}</strong>}
      {items.map((item) => (
        <button
          className={`${item.danger === true ? "danger-menu-item" : ""}${item.separatorBefore === true ? " menu-separator" : ""}`}
          key={item.id}
          role="menuitem"
          type="button"
          disabled={item.disabled}
          onClick={() => {
            onClose();
            item.onSelect();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
