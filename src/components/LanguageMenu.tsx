import { SUPPORTED_LANGUAGES, useLanguage } from "../i18n/language";

export function LanguageMenu() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <details className="workspace-menu language-menu" name="workspace-menu">
      <summary>{t("language.menu")}</summary>
      <div className="workspace-menu-popover language-menu-popover" role="radiogroup" aria-label={t("language.select")}>
        {SUPPORTED_LANGUAGES.map((candidate) => (
          <button
            className={language === candidate ? "selected" : ""}
            key={candidate}
            type="button"
            role="radio"
            aria-checked={language === candidate}
            onClick={(event) => {
              setLanguage(candidate);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            <span className="language-option-copy">
              <strong>{candidate === "pt-BR" ? t("language.ptBR") : t("language.en")}</strong>
              <small>{candidate === "pt-BR" ? "PT-BR" : "EN"}</small>
            </span>
            <span className="language-option-indicator" aria-hidden="true">{language === candidate ? "✓" : ""}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
