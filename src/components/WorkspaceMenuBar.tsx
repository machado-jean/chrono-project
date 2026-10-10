import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

import chronoMark from "../assets/chrono-mark.png";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WindowControls } from "./WindowControls";

function toggleMaximized(): void {
  if (isTauri()) {
    void getCurrentWindow().toggleMaximize();
  }
}

interface WorkspaceMenuBarProps {
  readonly children: ReactNode;
  readonly sidebarCollapsed: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly onToggleSidebar: () => void;
  readonly onGoBack: () => void;
  readonly onGoForward: () => void;
}

export function WorkspaceMenuBar({
  children,
  sidebarCollapsed,
  canGoBack,
  canGoForward,
  onToggleSidebar,
  onGoBack,
  onGoForward,
}: WorkspaceMenuBarProps) {
  const menuBarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeMenusOutside = (event: PointerEvent): void => {
      const menuBar = menuBarRef.current;
      if (menuBar === null || !(event.target instanceof Node) || menuBar.contains(event.target)) return;
      for (const menu of menuBar.querySelectorAll<HTMLDetailsElement>("details.workspace-menu[open]")) {
        menu.open = false;
      }
    };
    document.addEventListener("pointerdown", closeMenusOutside, { capture: true });
    return () => { document.removeEventListener("pointerdown", closeMenusOutside, { capture: true }); };
  }, []);

  const closeOpenMenu = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== "Escape") return;
    const openMenu = event.currentTarget.querySelector<HTMLDetailsElement>("details[open]");
    if (openMenu === null) return;

    event.preventDefault();
    openMenu.open = false;
    const summary = Array.from(openMenu.children).find(
      (child): child is HTMLElement => child instanceof HTMLElement && child.tagName === "SUMMARY",
    );
    summary?.focus();
  };

  return (
    <nav ref={menuBarRef} className="workspace-menu-bar" aria-label="Menu principal" onKeyDown={closeOpenMenu}>
      <div className="window-navigation" aria-label="Navegação do aplicativo">
        <button
          type="button"
          aria-label={sidebarCollapsed ? "Mostrar projetos" : "Recolher projetos"}
          title={sidebarCollapsed ? "Mostrar projetos" : "Recolher projetos"}
          onClick={onToggleSidebar}
        >
          <img className="sidebar-toggle-logo" src={chronoMark} alt="" />
        </button>
        <span className="window-navigation-divider" aria-hidden="true" />
        <button type="button" aria-label="Projeto anterior" title="Projeto anterior" disabled={!canGoBack} onClick={onGoBack}>←</button>
        <button type="button" aria-label="Próximo projeto" title="Próximo projeto" disabled={!canGoForward} onClick={onGoForward}>→</button>
      </div>
      {children}
      <div
        className="window-drag-region"
        data-tauri-drag-region
        aria-hidden="true"
        onDoubleClick={toggleMaximized}
      />
      <WindowControls />
    </nav>
  );
}
