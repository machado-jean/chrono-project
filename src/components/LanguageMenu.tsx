import { SUPPORTED_LANGUAGES, useLanguage } from "../i18n/language";

export function LanguageMenu() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <details className="workspace-menu language-menu" name="workspace-menu">
      <summary>{t("language.menu")}</summary>
      <div className="workspace-menu-popover language-menu-popover" role="group" aria-label={t("language.select")}>
        {SUPPORTED_LANGUAGES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-current={language === candidate ? "true" : undefined}
            onClick={(event) => {
              setLanguage(candidate);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            <span>{candidate === "pt-BR" ? t("language.ptBR") : t("language.en")}</span>
            {language === candidate ? <span aria-hidden="true">✓</span> : null}
          </button>
        ))}
      </div>
    </details>
  );
}
