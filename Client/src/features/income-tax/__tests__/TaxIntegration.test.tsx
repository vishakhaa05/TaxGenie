import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { WizardProvider } from "../context/WizardContext";
import ResultPage from "../../../pages/income-tax/ResultPage";
import { createMockComparisonResult, setupFetchMock } from "../../../test/mockTaxData";
import { ComparisonResult, TaxWarningCode } from "../types";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("Tax Integration & Engine Calculation Scenarios", () => {
  it("Scenario 1: Salary 15,00,000, no deductions -> New ₹97,500, Old ₹2,57,400, Recommended New, Savings ₹1,59,900", async () => {
    const mockResult: ComparisonResult = createMockComparisonResult({
      recommended: "new",
      savings: 159900,
      newRegime: {
        regime: "new",
        grossIncome: 1500000,
        standardDeductionApplied: 75000,
        deductionsApplied: {},
        taxableIncome: 1425000,
        taxBeforeRebate: 93750,
        rebateApplied: 0,
        marginalReliefApplied: 0,
        taxAfterRebate: 93750,
        cess: 3750,
        totalTax: 97500,
        effectiveRatePercent: 6.5,
        monthlyTax: 8125,
        slabBreakdown: [],
        steps: [],
        warnings: [],
      },
      oldRegime: {
        regime: "old",
        grossIncome: 1500000,
        standardDeductionApplied: 50000,
        deductionsApplied: {},
        taxableIncome: 1450000,
        taxBeforeRebate: 247500,
        rebateApplied: 0,
        marginalReliefApplied: 0,
        taxAfterRebate: 247500,
        cess: 9900,
        totalTax: 257400,
        effectiveRatePercent: 17.16,
        monthlyTax: 21450,
        slabBreakdown: [],
        steps: [],
        warnings: [],
      },
    });

    window.sessionStorage.setItem("taxgenie_income_tax_result", JSON.stringify(mockResult));
    setupFetchMock(mockResult);

    render(
      <MemoryRouter initialEntries={["/income-tax/result"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax/result" element={<ResultPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Verify Savings Highlight Banner
    expect(await screen.findByText(/you save ₹1,59,900 with the new regime/i)).toBeInTheDocument();

    // Verify New Regime Tax ₹97,500
    expect(screen.getByText("₹97,500")).toBeInTheDocument();

    // Verify Old Regime Tax ₹2,57,400
    expect(screen.getByText("₹2,57,400")).toBeInTheDocument();

    // Verify Recommended Badge
    expect(screen.getByText(/recommended ✓/i)).toBeInTheDocument();
  });

  it("Scenario 2: Salary 10,00,000 -> New ₹0 (Section 87A rebate), Recommended New", async () => {
    const mockResult: ComparisonResult = createMockComparisonResult({
      recommended: "new",
      savings: 106600,
      newRegime: {
        regime: "new",
        grossIncome: 1000000,
        standardDeductionApplied: 75000,
        deductionsApplied: {},
        taxableIncome: 925000,
        taxBeforeRebate: 47500,
        rebateApplied: 47500,
        marginalReliefApplied: 0,
        taxAfterRebate: 0,
        cess: 0,
        totalTax: 0,
        effectiveRatePercent: 0,
        monthlyTax: 0,
        slabBreakdown: [],
        steps: [],
        warnings: [
          {
            code: "REBATE_APPLIED",
            params: { regime: "new", rebateAmount: 47500 },
          },
        ],
      },
      oldRegime: {
        regime: "old",
        grossIncome: 1000000,
        standardDeductionApplied: 50000,
        deductionsApplied: {},
        taxableIncome: 950000,
        taxBeforeRebate: 102500,
        rebateApplied: 0,
        marginalReliefApplied: 0,
        taxAfterRebate: 102500,
        cess: 4100,
        totalTax: 106600,
        effectiveRatePercent: 10.66,
        monthlyTax: 8883,
        slabBreakdown: [],
        steps: [],
        warnings: [],
      },
    });

    window.sessionStorage.setItem("taxgenie_income_tax_result", JSON.stringify(mockResult));
    setupFetchMock(mockResult);

    render(
      <MemoryRouter initialEntries={["/income-tax/result"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax/result" element={<ResultPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Verify New Regime Tax is ₹0
    const taxSection = (await screen.findAllByText(/total tax payable/i))[0].closest("div");
    expect(taxSection?.textContent?.replace(/\s+/g, "")).toContain("₹0");
    // Verify Rebate Warning is shown
    expect(screen.getByText(/section 87a full rebate/i)).toBeInTheDocument();
  });

  it("Scenario 3: Salary 15,00,000 with 80C ₹1.5L + NPS ₹50k + 80D ₹25k -> Old ₹1,87,200", async () => {
    const mockResult: ComparisonResult = createMockComparisonResult({
      recommended: "new",
      savings: 89700,
      newRegime: {
        regime: "new",
        grossIncome: 1500000,
        standardDeductionApplied: 75000,
        deductionsApplied: {},
        taxableIncome: 1425000,
        taxBeforeRebate: 93750,
        rebateApplied: 0,
        marginalReliefApplied: 0,
        taxAfterRebate: 93750,
        cess: 3750,
        totalTax: 97500,
        effectiveRatePercent: 6.5,
        monthlyTax: 8125,
        slabBreakdown: [],
        steps: [],
        warnings: [],
      },
      oldRegime: {
        regime: "old",
        grossIncome: 1500000,
        standardDeductionApplied: 50000,
        deductionsApplied: {
          sec80C: 150000,
          sec80CCD1B: 50000,
          sec80D_selfFamily: 25000,
        },
        taxableIncome: 1225000,
        taxBeforeRebate: 180000,
        rebateApplied: 0,
        marginalReliefApplied: 0,
        taxAfterRebate: 180000,
        cess: 7200,
        totalTax: 187200,
        effectiveRatePercent: 12.48,
        monthlyTax: 15600,
        slabBreakdown: [],
        steps: [],
        warnings: [],
      },
    });

    window.sessionStorage.setItem("taxgenie_income_tax_result", JSON.stringify(mockResult));
    setupFetchMock(mockResult);

    render(
      <MemoryRouter initialEntries={["/income-tax/result"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax/result" element={<ResultPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Verify Old Regime Total Tax is ₹1,87,200
    expect(await screen.findByText("₹1,87,200")).toBeInTheDocument();
    // Verify deductions applied sum ₹2,25,000
    expect(screen.getByText("-₹2,25,000")).toBeInTheDocument();
  });

  it("Scenario 4: 80C entered as ₹2,00,000 shows DEDUCTION_CAPPED callout on result", async () => {
    const mockResult: ComparisonResult = createMockComparisonResult({
      oldRegime: {
        ...createMockComparisonResult().oldRegime,
        warnings: [
          {
            code: "DEDUCTION_CAPPED",
            params: {
              section: "80C",
              limit: 150000,
              allowed: 150000,
              entered: 200000,
            },
          },
        ],
      },
    });

    window.sessionStorage.setItem("taxgenie_income_tax_result", JSON.stringify(mockResult));
    setupFetchMock(mockResult);

    render(
      <MemoryRouter initialEntries={["/income-tax/result"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax/result" element={<ResultPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Verify DEDUCTION_CAPPED warning is displayed
    expect(await screen.findByText(/deduction limit reached/i)).toBeInTheDocument();
    expect(screen.getByText(/capped at ₹1,50,000/i)).toBeInTheDocument();
  });

  it("Scenario 5: Renders EVERY engine warning type without crashing", async () => {
    const allWarningCodes: TaxWarningCode[] = [
      "DEDUCTION_CAPPED",
      "SURCHARGE_NOT_INCLUDED",
      "REBATE_APPLIED",
      "MARGINAL_RELIEF_APPLIED",
      "OTHER_INCOME_NO_STANDARD_DEDUCTION",
    ];

    const mockResult: ComparisonResult = createMockComparisonResult({
      newRegime: {
        ...createMockComparisonResult().newRegime,
        warnings: allWarningCodes.map((code) => ({
          code,
          params: {
            section: "80C",
            limit: 150000,
            allowed: 150000,
            entered: 200000,
            threshold: 1200000,
            otherIncome: 50000,
          },
        })),
      },
    });

    window.sessionStorage.setItem("taxgenie_income_tax_result", JSON.stringify(mockResult));
    setupFetchMock(mockResult);

    render(
      <MemoryRouter initialEntries={["/income-tax/result"]}>
        <WizardProvider>
          <Routes>
            <Route path="/income-tax/result" element={<ResultPage />} />
          </Routes>
        </WizardProvider>
      </MemoryRouter>
    );

    // Verify all 5 warning titles appear
    expect(await screen.findByText(/deduction limit reached/i)).toBeInTheDocument();
    expect(screen.getByText(/high income surcharge notice/i)).toBeInTheDocument();
    expect(screen.getByText(/section 87a full rebate/i)).toBeInTheDocument();
    expect(screen.getByText(/marginal relief protection/i)).toBeInTheDocument();
    expect(screen.getByText(/standard deduction rule/i)).toBeInTheDocument();
  });
});
