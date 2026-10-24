import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import i18n from "../../../i18n";
import { WizardProvider } from "../context/WizardContext";
import IncomeTaxPage from "../../../pages/income-tax/IncomeTaxPage";
import ResultPage from "../../../pages/income-tax/ResultPage";
import { setupFetchMock, createMockComparisonResult } from "../../../test/mockTaxData";

beforeEach(() => {
  window.sessionStorage.clear();
  setupFetchMock();
  i18n.changeLanguage("en");
});

describe("I18n Language Switching and Completeness", () => {
  it("renders correctly in English by default without raw keys", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/income-tax"]}>
        <WizardProvider>
          <IncomeTaxPage />
        </WizardProvider>
      </MemoryRouter>
    );

    // English headings
    expect(await screen.findByText(/income tax calculator & comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1: about you/i)).toBeInTheDocument();
    expect(screen.getByText(/select your age group/i)).toBeInTheDocument();

    // Verify no untranslated keys exist in DOM
    const textContent = container.textContent || "";
    expect(textContent).not.toMatch(/\bincomeTax\.[a-zA-Z0-9_.]+\b/);
    expect(textContent).not.toMatch(/\bcommon\.[a-zA-Z0-9_.]+\b/);
  });

  it("switches to Hindi and renders simple, natural Hindi without raw keys", async () => {
    await act(async () => {
      await i18n.changeLanguage("hi");
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/income-tax"]}>
        <WizardProvider>
          <IncomeTaxPage />
        </WizardProvider>
      </MemoryRouter>
    );

    // Natural Hindi headings
    expect(await screen.findByText(/इनकम टैक्स कैलकुलेटर और तुलना/i)).toBeInTheDocument();
    expect(screen.getByText(/चरण 1: अपने बारे में बताएं/i)).toBeInTheDocument();
    expect(screen.getByText(/अपनी आयु सीमा चुनें/i)).toBeInTheDocument();

    // Verify no raw i18n keys appear in Hindi
    const textContent = container.textContent || "";
    expect(textContent).not.toMatch(/\bincomeTax\.[a-zA-Z0-9_.]+\b/);
    expect(textContent).not.toMatch(/\bcommon\.[a-zA-Z0-9_.]+\b/);
  });

  it("renders the Result Page in Hindi with natural terms and without raw keys", async () => {
    await act(async () => {
      await i18n.changeLanguage("hi");
    });

    const mockResult = createMockComparisonResult();
    window.sessionStorage.setItem("taxgenie_income_tax_result", JSON.stringify(mockResult));
    setupFetchMock(mockResult);

    const { container } = render(
      <MemoryRouter initialEntries={["/income-tax/result"]}>
        <WizardProvider>
          <ResultPage />
        </WizardProvider>
      </MemoryRouter>
    );

    // Verify Hindi savings banner
    expect(await screen.findByText(/नई टैक्स व्यवस्था में आप ₹1,59,900 बचाते हैं/i)).toBeInTheDocument();
    expect(screen.getAllByText(/नई टैक्स व्यवस्था/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/पुरानी टैक्स व्यवस्था/i)).toBeInTheDocument();

    // Verify no untranslated keys exist
    const textContent = container.textContent || "";
    expect(textContent).not.toMatch(/\bincomeTax\.[a-zA-Z0-9_.]+\b/);
    expect(textContent).not.toMatch(/\btax\.[a-zA-Z0-9_.]+\b/);
  });
});
