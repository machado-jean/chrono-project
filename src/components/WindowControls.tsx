import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/language";

export function WindowControls() {
  const { t } = useLanguage();
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
    <div className="window-controls" aria-label={t("window.controls")}>
      <button type="button" aria-label={t("window.minimize")} title={t("window.minimize")} onClick={() => { void minimize(); }}>
        <span className="window-control-minimize" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={maximized ? t("window.restore") : t("window.maximize")}
        title={maximized ? t("window.restore") : t("window.maximize")}
        onClick={() => { void toggleMaximize(); }}
      >
        <span className={`window-control-maximize${maximized ? " restored" : ""}`} aria-hidden="true" />
      </button>
      <button className="window-control-close" type="button" aria-label={t("window.close")} title={t("window.close")} onClick={() => { void close(); }}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
