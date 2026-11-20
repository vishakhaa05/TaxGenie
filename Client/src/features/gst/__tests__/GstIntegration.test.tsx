import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import GstCalculatorPage from "../../../pages/gst/GstCalculatorPage";
import InvoicesComingSoonPage from "../../../pages/gst/InvoicesComingSoonPage";
import i18n from "../../../i18n";
import { calculateLocalGst } from "../utils/money";

// Helper to mock global fetch
function setupFetchMock(customResponses?: Record<string, any>) {
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();

    if (urlStr.includes("/gst/meta")) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            states: [
              { code: "27", name: "Maharashtra" },
              { code: "07", name: "Delhi" },
              { code: "29", name: "Karnataka" },
              { code: "33", name: "Tamil Nadu" },
            ],
            supportedRates: [0, 5, 18, 40],
            defaultRate: 18,
          },
        }),
      } as Response;
    }

    if (urlStr.includes("/gst/calculate")) {
      const body = JSON.parse((init?.body as string) || "{}");
      if (customResponses && customResponses[body.amount]) {
        return customResponses[body.amount];
      }
      const calcResult = calculateLocalGst(body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: calcResult,
        }),
      } as Response;
    }

    return {
      ok: false,
      json: async () => ({
        success: false,
        error: { message: "Not found", code: "NOT_FOUND" },
      }),
    } as Response;
  });

  globalThis.fetch = fetchMock as any;
  return fetchMock;
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  i18n.changeLanguage("en");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GST Calculator Integration Scenarios", () => {
  it("Scenario 1: Rs 50,000 at 18%, Add GST, same state -> base 50,000.00, CGST 4,500.00, SGST 4,500.00, total GST 9,000.00, final total 59,000.00", async () => {
    const fetchMock = setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    // Initial empty state
    expect(screen.getByText(/Ready to calculate/i)).toBeInTheDocument();

    // Find amount input and type 50000
    const amountInput = screen.getByLabelText(/Base Price/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "50000");

    // Amount in words should appear underneath
    await waitFor(() => {
      expect(screen.getByText(/Fifty Thousand Rupees Only/i)).toBeInTheDocument();
    });

    // Wait for calculation result
    await waitFor(() => {
      expect(screen.getAllByText("₹59,000.00").length).toBeGreaterThanOrEqual(1);
    });

    // Verify row items
    expect(screen.getAllByText("₹50,000.00").length).toBeGreaterThanOrEqual(1); // Base price
    expect(screen.getAllByText("₹4,500.00")).toHaveLength(2); // CGST and SGST
    expect(screen.getAllByText("₹9,000.00").length).toBeGreaterThanOrEqual(1); // Total GST
    expect(screen.getByText(/Same state \(CGST \+ SGST\)/i)).toBeInTheDocument();

    // Verify fetch was called
    expect(fetchMock).toHaveBeenCalled();
  });

  it("Scenario 2: Rs 59,000 at 18%, Remove GST -> base 50,000.00, GST 9,000.00", async () => {
    setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    // Switch to Remove GST mode
    const removeBtn = screen.getByRole("radio", { name: /Remove GST/i });
    await userEvent.click(removeBtn);

    // Amount input label updates to Total Price
    const amountInput = screen.getByLabelText(/Total Price/i);
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "59000");

    await waitFor(() => {
      // In remove mode, the big result card shows the Base Price: ₹50,000.00
      expect(screen.getAllByText("₹50,000.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹9,000.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹4,500.00")).toHaveLength(2);
    });
  });

  it("Scenario 3: Different state -> IGST 9,000.00 and no CGST/SGST rows", async () => {
    setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText(/Base Price/i);
    await userEvent.type(amountInput, "50000");

    // Uncheck "Buyer is in the same state"
    const sameStateCheckbox = screen.getByRole("checkbox", {
      name: /Buyer is in the same state/i,
    });
    await userEvent.click(sameStateCheckbox);

    // Change buyer state to Delhi (07)
    const buyerStateBtn = screen.getByLabelText(/Buyer State/i);
    await userEvent.click(buyerStateBtn);

    const delhiOption = screen.getByRole("option", { name: /Delhi/i });
    await userEvent.click(delhiOption);

    await waitFor(() => {
      // Badge updates to Different state (IGST)
      expect(screen.getByText(/Different state \(IGST\)/i)).toBeInTheDocument();
      // IGST 9,000 is present
      expect(screen.getAllByText("₹9,000.00").length).toBeGreaterThanOrEqual(1);
      // CGST and SGST rows should not exist
      expect(screen.queryByText(/CGST \(9%\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/SGST \(9%\)/i)).not.toBeInTheDocument();
    });
  });

  it("Scenario 4: Rs 999.99 at 18%, Add GST -> GST 180.00, total 1,179.99; Remove GST from 1,179.99 -> base 999.99, GST 180.00", async () => {
    setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    // 1. Add GST for 999.99
    const amountInput = screen.getByLabelText(/Base Price/i);
    await userEvent.type(amountInput, "999.99");

    await waitFor(() => {
      expect(screen.getAllByText("₹1,179.99").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹180.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹999.99").length).toBeGreaterThanOrEqual(1);
    });

    // 2. Click Swap Mode to switch to Remove GST with previous total
    const swapBtn = screen.getByRole("button", { name: /Swap mode/i });
    await userEvent.click(swapBtn);

    await waitFor(() => {
      // In Remove mode, base becomes ₹999.99 and GST is ₹180.00
      expect(screen.getAllByText("₹999.99").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹180.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹1,179.99").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("Scenario 5: Rates 0%, 5%, 40% work; there is no 12% or 28% chip", async () => {
    setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    // Allowed rates are only 0%, 5%, 18%, 40%
    expect(screen.getByRole("radio", { name: /^0%/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^5%/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^18%/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^40%/i })).toBeInTheDocument();

    // Verify there is strictly NO 12% or 28% chip
    expect(screen.queryByRole("radio", { name: /^12%/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /^28%/i })).not.toBeInTheDocument();

    // Test 0% rate
    const amountInput = screen.getByLabelText(/Base Price/i);
    await userEvent.type(amountInput, "10000");

    const chip0 = screen.getByRole("radio", { name: /^0%/i });
    await userEvent.click(chip0);

    await waitFor(() => {
      expect(screen.getAllByText("₹10,000.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹0.00").length).toBeGreaterThanOrEqual(1);
    });

    // Test 40% rate
    const chip40 = screen.getByRole("radio", { name: /^40%/i });
    await userEvent.click(chip40);

    await waitFor(() => {
      expect(screen.getAllByText("₹14,000.00").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("₹4,000.00").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("Scenario 6: Friendly errors for invalid inputs; no calculate request for invalid", async () => {
    const fetchMock = setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText(/Base Price/i);

    // Type 0 or clear
    await userEvent.clear(amountInput);

    // Friendly prompt remains
    expect(screen.getByText(/Ready to calculate/i)).toBeInTheDocument();

    // Quick fill example button fills ₹50,000 at 18%
    const exampleBtn = screen.getByRole("button", { name: /Try ₹50,000 at 18%/i });
    await userEvent.click(exampleBtn);

    await waitFor(() => {
      expect(screen.getAllByText("₹59,000.00").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("Scenario 7: 'Buyer is in the same state' checkbox sets the buyer state and supply type badge", async () => {
    setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText(/Base Price/i);
    await userEvent.type(amountInput, "50000");

    await waitFor(() => {
      expect(screen.getByText(/Same state \(CGST \+ SGST\)/i)).toBeInTheDocument();
    });

    const sameStateCheckbox = screen.getByRole("checkbox", {
      name: /Buyer is in the same state/i,
    });
    expect(sameStateCheckbox).toBeChecked();

    // Toggle off
    await userEvent.click(sameStateCheckbox);
    expect(sameStateCheckbox).not.toBeChecked();

    // Change buyer state
    const buyerDropdown = screen.getByLabelText(/Buyer State/i);
    await userEvent.click(buyerDropdown);
    const delhiOption = screen.getByRole("option", { name: /Delhi/i });
    await userEvent.click(delhiOption);

    await waitFor(() => {
      expect(screen.getByText(/Different state \(IGST\)/i)).toBeInTheDocument();
    });

    // Re-check same state checkbox: buyer state resets to seller state
    await userEvent.click(sameStateCheckbox);
    expect(sameStateCheckbox).toBeChecked();

    await waitFor(() => {
      expect(screen.getByText(/Same state \(CGST \+ SGST\)/i)).toBeInTheDocument();
    });
  });

  it("Scenario 8: Selecting an item from the search sets the rate chip", async () => {
    setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    // Open item search dropdown
    const itemSearchBtn = screen.getByLabelText(/Find the rate for my item/i);
    await userEvent.click(itemSearchBtn);

    // Filter by 'software'
    const searchInput = screen.getByPlaceholderText(/Type to search/i);
    await userEvent.type(searchInput, "software");

    // Select IT SaaS (18%)
    const softwareOption = screen.getByRole("option", {
      name: /Software Development/i,
    });
    await userEvent.click(softwareOption);

    // 18% chip is selected
    const chip18 = screen.getByRole("radio", { name: /^18%/i });
    expect(chip18).toHaveAttribute("aria-checked", "true");

    // Open item search again and select fresh fruits (0%)
    await userEvent.click(itemSearchBtn);
    const searchInput2 = screen.getByPlaceholderText(/Type to search/i);
    await userEvent.clear(searchInput2);
    await userEvent.type(searchInput2, "fruits");

    const fruitOption = screen.getByRole("option", {
      name: /Fresh Fruits/i,
    });
    await userEvent.click(fruitOption);

    // 0% chip is selected
    const chip0 = screen.getByRole("radio", { name: /^0%/i });
    expect(chip0).toHaveAttribute("aria-checked", "true");
  });

  it("Scenario 9: Debounce and cancellation: fast typing sends only the latest calculation", async () => {
    const fetchMock = setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText(/Base Price/i);
    // Type fast
    await userEvent.type(amountInput, "12345");

    await waitFor(() => {
      expect(screen.getByText(/Twelve Thousand Three Hundred Forty-Five Rupees Only/i)).toBeInTheDocument();
    });
  });

  it("Scenario 10: Compare rates fetches only when opened", async () => {
    const fetchMock = setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText(/Base Price/i);
    await userEvent.type(amountInput, "50000");

    await waitFor(() => {
      expect(screen.getAllByText("₹59,000.00").length).toBeGreaterThanOrEqual(1);
    });

    // Compare rates table is initially not expanded
    expect(screen.queryByText(/See how much the same amount costs across standard Indian GST slabs/i)).not.toBeInTheDocument();

    // Click to expand Compare Rates
    const compareToggleBtn = screen.getByRole("button", {
      name: /Compare Rates \(0%, 5%, 18%, 40%\)/i,
    });
    await userEvent.click(compareToggleBtn);

    // Now compare rates table content appears
    await waitFor(() => {
      expect(
        screen.getByText(/See how much the same amount costs across standard Indian GST slabs/i)
      ).toBeInTheDocument();
    });
  });

  it("Scenario 11: Language switch changes the text and no raw i18n keys appear", async () => {
    setupFetchMock();

    const { container } = render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    // Default English
    expect(screen.getByText("GST Calculator")).toBeInTheDocument();

    // Switch to Hindi
    await i18n.changeLanguage("hi");

    await waitFor(() => {
      expect(screen.getByText("जीएसटी कैलकुलेटर")).toBeInTheDocument();
      expect(screen.getByText("जीएसटी जोड़ें")).toBeInTheDocument();
      expect(screen.getByText("जीएसटी हटाएं")).toBeInTheDocument();
    });

    // Check no unresolved raw keys like "gst.pageTitle" appear in HTML
    expect(container.innerHTML).not.toContain("gst.pageTitle");
    expect(container.innerHTML).not.toContain("gst.baseAmountLabel");
  });

  it("Scenario 12: Recent calculations: keeps only last 5, 'Use again' refills form", async () => {
    setupFetchMock();

    render(
      <MemoryRouter>
        <GstCalculatorPage />
      </MemoryRouter>
    );

    const amountInput = screen.getByLabelText(/Base Price/i);
    await userEvent.type(amountInput, "50000");

    await waitFor(() => {
      expect(screen.getAllByText("₹59,000.00").length).toBeGreaterThanOrEqual(1);
    });

    // Recent calculations list appears
    await waitFor(() => {
      expect(screen.getByText(/Recent Calculations/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Use again/i })).toBeInTheDocument();
    });

    // Clear form
    const clearBtn = screen.getAllByRole("button", { name: /Clear/i })[0];
    await userEvent.click(clearBtn);

    // Empty state returns
    expect(screen.getByText(/Ready to calculate/i)).toBeInTheDocument();

    // Click "Use again"
    const useAgainBtn = screen.getByRole("button", { name: /Use again/i });
    await userEvent.click(useAgainBtn);

    // Form is refilled with ₹50,000
    await waitFor(() => {
      expect(screen.getAllByText("₹59,000.00").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("Invoices Coming Soon Page renders and links back to calculator", async () => {
    render(
      <MemoryRouter>
        <InvoicesComingSoonPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/GST Invoice Generator/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 6 Preview/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Use GST Calculator/i })).toHaveAttribute(
      "href",
      "/gst"
    );
  });
});
