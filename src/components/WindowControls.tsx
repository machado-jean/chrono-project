import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    let active = true;
    let stopListening: (() => void) | undefined;
    const appWindow = getCurrentWindow();
    const refreshMaximized = async (): Promise<void> => {
      try {
        const value = await appWindow.isMaximized();
        if (active) setMaximized(value);
      } catch {
        // Os controles continuam disponíveis mesmo sem consultar o estado inicial.
      }
    };
    void refreshMaximized();
    void appWindow.onResized(() => { void refreshMaximized(); }).then((unlisten) => {
      if (active) stopListening = unlisten;
      else unlisten();
    });
    return () => {
      active = false;
      stopListening?.();
    };
  }, []);

  const minimize = async (): Promise<void> => {
    if (isTauri()) await getCurrentWindow().minimize();
  };

  const toggleMaximize = async (): Promise<void> => {
    if (!isTauri()) return;
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
    setMaximized(await appWindow.isMaximized());
  };

  const close = async (): Promise<void> => {
    if (isTauri()) await getCurrentWindow().close();
  };

  return (
    <div className="window-controls" aria-label="Controles da janela">
      <button type="button" aria-label="Minimizar janela" title="Minimizar" onClick={() => { void minimize(); }}>
        <span className="window-control-minimize" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={maximized ? "Restaurar janela" : "Maximizar janela"}
        title={maximized ? "Restaurar" : "Maximizar"}
        onClick={() => { void toggleMaximize(); }}
      >
        <span className={`window-control-maximize${maximized ? " restored" : ""}`} aria-hidden="true" />
      </button>
      <button className="window-control-close" type="button" aria-label="Fechar janela" title="Fechar" onClick={() => { void close(); }}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
