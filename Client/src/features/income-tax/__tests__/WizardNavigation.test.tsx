import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WizardProvider } from "../context/WizardContext";
import IncomeTaxPage from "../../../pages/income-tax/IncomeTaxPage";
import ResultPage from "../../../pages/income-tax/ResultPage";
import { setupFetchMock } from "../../../test/mockTaxData";

beforeEach(() => {
  window.sessionStorage.clear();
  setupFetchMock();
});

describe("Wizard Navigation & Interaction", () => {
  it("keeps answers when navigating Back and Next", async () => {


    render(
      <MemoryRouter initialEntries={["/income-tax"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax" element={<IncomeTaxPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Wait for rules to load and Step 1 to be visible
    expect(await screen.findByText(/step 1: about you/i)).toBeInTheDocument();

    // Step 1: Select Senior Citizen (60 to 79)
    const seniorCard = await screen.findByRole("radio", { name: /60 to 79/i });
    await userEvent.click(seniorCard);

    // Click Next to go to Step 2
    const nextBtn = screen.getByRole("button", { name: /next/i });
    await userEvent.click(nextBtn);

    // On Step 2: verify we are on Income step
    expect(await screen.findByText(/step 2: your income/i)).toBeInTheDocument();

    // Type salary amount
    const salaryInput = screen.getByTestId("salary-amount-input") as HTMLInputElement;
    await userEvent.clear(salaryInput);
    await userEvent.type(salaryInput, "1200000");

    // Click Back to Step 1
    const backBtn = screen.getByRole("button", { name: /back/i });
    await userEvent.click(backBtn);

    // Verify on Step 1 that Senior citizen is still selected
    expect(await screen.findByText(/step 1: about you/i)).toBeInTheDocument();
    const seniorCardBack = screen.getByRole("radio", { name: /60 to 79/i });
    expect(seniorCardBack.getAttribute("aria-checked")).toBe("true");

    // Go back to Step 2 and verify salary is kept
    const nextBtn2 = screen.getByRole("button", { name: /next/i });
    await userEvent.click(nextBtn2);

    expect(await screen.findByText(/step 2: your income/i)).toBeInTheDocument();
    const salaryInput2 = screen.getByTestId("salary-amount-input") as HTMLInputElement;
    expect(salaryInput2.value).toBe("12,00,000");
  }, 15000);


  it("shows HRA fields only when HRA toggle is turned ON", async () => {
    window.sessionStorage.setItem(
      "taxgenie_income_tax_wizard",
      JSON.stringify({
        ageGroup: "below60",
        taxYear: "2026-27",
        salaryPeriod: "yearly",
        salaryAmount: 1200000,
        otherIncome: 0,
      })
    );

    render(
      <MemoryRouter initialEntries={["/income-tax?step=3"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax" element={<IncomeTaxPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Wait for step 3 to render
    expect(await screen.findByText(/step 3: deductions/i)).toBeInTheDocument();

    // Initially, Rent paid input should not be visible
    expect(screen.queryByLabelText(/rent paid/i)).not.toBeInTheDocument();

    // Toggle HRA on
    const hraToggle = screen.getByRole("switch", {
      name: /i get house rent allowance toggle/i,
    });
    await userEvent.click(hraToggle);

    // Now HRA fields should appear
    expect(await screen.findByText(/rent paid \(yearly\)/i)).toBeInTheDocument();
    expect(screen.getByText(/basic salary \(yearly\)/i)).toBeInTheDocument();
    expect(screen.getByText(/hra received \(yearly\)/i)).toBeInTheDocument();
  });

  it("displays gentle amber notice and caps progress meter when 80C exceeds limit", async () => {
    window.sessionStorage.setItem(
      "taxgenie_income_tax_wizard",
      JSON.stringify({
        ageGroup: "below60",
        taxYear: "2026-27",
        salaryPeriod: "yearly",
        salaryAmount: 1500000,
        otherIncome: 0,
      })
    );

    render(
      <MemoryRouter initialEntries={["/income-tax?step=3"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax" element={<IncomeTaxPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Wait for step 3 to load
    expect(await screen.findByText(/step 3: deductions/i)).toBeInTheDocument();

    const sec80CInput = (await screen.findByTestId(
      "currency-input-sec80c"
    )) as HTMLInputElement;
    await userEvent.clear(sec80CInput);
    await userEvent.type(sec80CInput, "200000");

    // Notice should appear indicating cap
    expect(
      await screen.findByText(/only ₹1,50,000 counts/i)
    ).toBeInTheDocument();
    // Meter text shows used amount
    expect(
      screen.getByText(/₹1,50,000 of ₹1,50,000 used/i)
    ).toBeInTheDocument();
  });

  it("navigates directly to Result when 'Skip - I have no deductions' is clicked", async () => {
    window.sessionStorage.setItem(
      "taxgenie_income_tax_wizard",
      JSON.stringify({
        ageGroup: "below60",
        taxYear: "2026-27",
        salaryPeriod: "yearly",
        salaryAmount: 1500000,
        otherIncome: 0,
      })
    );

    render(
      <MemoryRouter initialEntries={["/income-tax?step=3"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax" element={<IncomeTaxPage />} />
            <Route path="/income-tax/result" element={<ResultPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/step 3: deductions/i)).toBeInTheDocument();

    const skipBtn = await screen.findByRole("button", {
      name: /skip - i have no deductions/i,
    });
    await userEvent.click(skipBtn);

    // Should navigate to Result Page and show savings banner
    await waitFor(
      () => {
        expect(screen.getByText(/you save/i)).toBeInTheDocument();
        expect(screen.getByText(/new tax regime/i)).toBeInTheDocument();
        expect(screen.getByText(/old tax regime/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
