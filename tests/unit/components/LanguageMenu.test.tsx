import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LanguageMenu } from "../../../src/components/LanguageMenu";
import { LanguageProvider, useLanguage } from "../../../src/i18n/language";

function renderLanguageMenu() {
  return render(<LanguageProvider><LanguageMenu /></LanguageProvider>);
}

describe("LanguageMenu", () => {
  afterEach(() => {
    window.localStorage.removeItem("chrono-project.language");
  });

  it("starts in Brazilian Portuguese and persists an English selection", () => {
    renderLanguageMenu();

    expect(screen.getByText("Idioma")).toBeTruthy();
    fireEvent.click(screen.getByText("Idioma"));
    fireEvent.click(screen.getByText("English"));

    expect(screen.getByText("Language")).toBeTruthy();
    expect(window.localStorage.getItem("chrono-project.language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("restores the saved language on a new render", () => {
    window.localStorage.setItem("chrono-project.language", "en");
    renderLanguageMenu();

    expect(screen.getByText("Language")).toBeTruthy();
  });

  it("changes translated content immediately", () => {
    function Sample() {
      const { t } = useLanguage();
      return <p>{t("app.loading")}</p>;
    }
    render(<LanguageProvider><LanguageMenu /><Sample /></LanguageProvider>);

    fireEvent.click(screen.getByText("Idioma"));
    fireEvent.click(screen.getByText("English"));

    expect(screen.getByText("Loading your workspace…")).toBeTruthy();
  });
});
