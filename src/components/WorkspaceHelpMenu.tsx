import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";
import { useEffect, useRef, useState } from "react";

import { version as packagedVersion } from "../../package.json";
import {
  CHRONO_PROJECT_OFFLINE_INSTALLER_URL,
} from "../domain/updates/release";
import { ModalDialog } from "./ModalDialog";
import { useLanguage } from "../i18n/language";

let automaticUpdateCheck: Promise<Update | null> | null = null;

function checkForUpdatesAtStartup(): Promise<Update | null> {
  automaticUpdateCheck ??= check({ timeout: 15_000 });
  return automaticUpdateCheck;
}

interface WorkspaceHelpMenuProps {
  readonly automatic?: boolean;
}

export function WorkspaceHelpMenu({ automatic = true }: WorkspaceHelpMenuProps) {
  const { language, t } = useLanguage();
  const english = language === "en";
  const [appVersion, setAppVersion] = useState(packagedVersion);
  const [checking, setChecking] = useState(automatic);
  const [installing, setInstalling] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [checkedCurrent, setCheckedCurrent] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let active = true;
    void getVersion()
      .then((version) => {
        if (active) setAppVersion(version);
      })
      .catch(() => {
        // O navegador de desenvolvimento usa a versão do pacote como fallback.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!automatic) return;
    let active = true;
    void checkForUpdatesAtStartup()
      .then((update) => {
        if (!active || update === null) return;
        setAvailableUpdate(update);
        if (menuRef.current !== null) menuRef.current.open = true;
      })
      .catch(() => {
        // Falha de rede na inicialização não interrompe o uso offline.
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [automatic]);

  useEffect(() => {
    const openShortcuts = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.key === "/") {
        event.preventDefault();
        setShowShortcuts(true);
      }
    };
    document.addEventListener("keydown", openShortcuts);
    return () => { document.removeEventListener("keydown", openShortcuts); };
  }, []);

  const checkForUpdates = async (): Promise<void> => {
    setChecking(true);
    setAvailableUpdate(null);
    setCheckedCurrent(false);
    setProgress(null);
    setError(null);
    try {
      const update = await check({ timeout: 15_000 });
      setAvailableUpdate(update);
      setCheckedCurrent(update === null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : english ? "Unable to check for updates. Check your connection." : "Não foi possível verificar atualizações. Confira sua conexão.",
      );
    } finally {
      setChecking(false);
    }
  };

  const installUpdate = async (): Promise<void> => {
    if (availableUpdate === null) return;
    setInstalling(true);
    setError(null);
    let downloaded = 0;
    let total: number | undefined;
    const onProgress = (event: DownloadEvent): void => {
      if (event.event === "Started") {
        total = event.data.contentLength;
        setProgress(english ? "Downloading update…" : "Baixando atualização…");
      } else if (event.event === "Progress") {
        downloaded += event.data.chunkLength;
        setProgress(total === undefined || total === 0
          ? (english ? "Downloading update…" : "Baixando atualização…")
          : `${english ? "Downloading update…" : "Baixando atualização…"} ${String(Math.min(100, Math.round((downloaded / total) * 100)))}%`);
      } else {
        setProgress(english ? "Download complete. Preparing installation…" : "Download concluído. Preparando instalação…");
      }
    };
    try {
      await availableUpdate.downloadAndInstall(onProgress);
      setProgress(english ? "Update installed. Restarting Chrono Project…" : "Atualização instalada. Reiniciando o Chrono Project…");
      await relaunch();
    } catch (reason) {
      setError(english
        ? "Unable to install update."
        : reason instanceof Error
          ? `Não foi possível instalar a atualização: ${reason.message}`
          : "Não foi possível instalar a atualização.");
      setProgress(null);
      setInstalling(false);
    }
  };

  const openInstaller = async (url: string): Promise<void> => {
    try {
      await openUrl(url);
    } catch {
      setError(english ? "Unable to open the default browser to download the update." : "Não foi possível abrir o navegador padrão para baixar a atualização.");
    }
  };

  return (
    <>
    <details ref={menuRef} className="workspace-menu help-menu" name="workspace-menu">
      <summary>{t("menu.help")}</summary>
      <div className="workspace-menu-popover help-menu-popover">
        <strong>{t("help.quickGuide")}</strong>
        <p>{t("help.tableGuide")}</p>
        <p>{t("help.viewsGuide")}</p>
        <p>{t("help.calendarGuide")}</p>
        <button
          className="shortcuts-menu-button"
          type="button"
          aria-keyshortcuts="Control+/"
          onClick={() => { setShowShortcuts(true); }}
        >
          {t("help.shortcuts")}
          <kbd>Ctrl + /</kbd>
        </button>
        <hr />
        <section className="update-check" aria-labelledby="update-check-title">
          <strong id="update-check-title">{t("help.updates")}</strong>
          <small>{t("help.installedVersion")} {appVersion}</small>
          <small>{t("help.autoCheck")}</small>
          <button type="button" disabled={checking} onClick={() => { void checkForUpdates(); }}>
            {checking ? t("help.checking") : t("help.checkUpdates")}
          </button>
          <div className="update-check-result" aria-live="polite">
            {availableUpdate === null ? null : (
              <>
                <p>{t("help.updateAvailablePrefix")} {availableUpdate.version} {t("help.updateAvailableSuffix")}</p>
                <button type="button" disabled={installing} onClick={() => { void installUpdate(); }}>
                  {installing ? t("help.updating") : t("help.downloadInstall")}
                </button>
                <button className="text-update-button" type="button" onClick={() => { void openInstaller(CHRONO_PROJECT_OFFLINE_INSTALLER_URL); }}>
                  {t("help.downloadOffline")}
                </button>
              </>
            )}
            {checkedCurrent ? <p>{t("help.currentVersion")} ({appVersion}).</p> : null}
            {progress === null ? null : <p>{progress}</p>}
            {error === null ? null : <p className="update-check-error" role="alert">{error}</p>}
          </div>
        </section>
        <hr />
        <small>{t("help.offline")}</small>
        <small>{t("help.licenses")}</small>
      </div>
    </details>
    {showShortcuts ? (
      <ModalDialog
        className="portability-modal compact shortcuts-dialog"
        labelledBy="keyboard-shortcuts-title"
        describedBy="keyboard-shortcuts-description"
        onClose={() => { setShowShortcuts(false); }}
      >
        <header>
          <div>
            <h2 id="keyboard-shortcuts-title">{t("help.shortcutsTitle")}</h2>
            <p id="keyboard-shortcuts-description">{t("help.shortcutsDescription")}</p>
          </div>
          <button type="button" aria-label={t("help.closeShortcuts")} onClick={() => { setShowShortcuts(false); }}>×</button>
        </header>
        <dl className="shortcut-list">
          <div><dt><kbd>Ctrl + /</kbd></dt><dd>{english ? "Open this shortcut list" : "Abrir esta lista de atalhos"}</dd></div>
          <div><dt><kbd>Ctrl + Z</kbd></dt><dd>{english ? "Undo the last saved task edit" : "Desfazer a última edição salva de tarefa"}</dd></div>
          <div><dt><kbd>Ctrl + Shift + Z</kbd></dt><dd>{english ? "Redo the last undone edit" : "Refazer a última edição desfeita"}</dd></div>
          <div><dt><kbd>Ctrl + Shift + L</kbd></dt><dd>{english ? "Lock or unlock the selected Table tasks" : "Travar ou destravar as tarefas selecionadas na Tabela"}</dd></div>
          <div><dt><kbd>Esc</kbd></dt><dd>{english ? "Close a menu, dialog, or task details" : "Fechar menu, diálogo ou detalhes da tarefa"}</dd></div>
          <div><dt><kbd>Tab</kbd></dt><dd>{english ? "Move forward through controls" : "Avançar entre os controles"}</dd></div>
          <div><dt><kbd>Shift + Tab</kbd></dt><dd>{english ? "Move back to the previous control" : "Voltar ao controle anterior"}</dd></div>
          <div><dt><kbd>Enter</kbd> / <kbd>Space</kbd></dt><dd>{english ? "Activate the focused button or control" : "Ativar o botão ou controle em foco"}</dd></div>
          <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>{english ? "Switch between Table, Kanban, and Gantt" : "Alternar entre Tabela, Kanban e Gantt"}</dd></div>
          <div><dt><kbd>Home</kbd> / <kbd>End</kbd></dt><dd>{english ? "Go to the first or last view" : "Ir para a primeira ou última visualização"}</dd></div>
        </dl>
        <footer><button type="button" data-dialog-initial-focus onClick={() => { setShowShortcuts(false); }}>{t("app.close")}</button></footer>
      </ModalDialog>
    ) : null}
    </>
  );
}
