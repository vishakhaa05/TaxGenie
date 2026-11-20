import { listUserCalculations, listUserInvoices } from "../utils/localStore";

export interface DashboardSummaryResponse {
  isSample: boolean;
  isGuest: boolean;
  hasData: boolean;
  taxYear: string;
  userName?: string | undefined;
  kpis: {
    estimatedTax: {
      value: number;
      formattedValue: string;
      badgeText: string;
      badgeType: "positive" | "neutral" | "negative";
      sparklineData: number[];
      hasData: boolean;
    };
    taxSaved: {
      value: number;
      formattedValue: string;
      badgeText: string;
      percentSaved: number;
      sparklineData: number[];
      hasData: boolean;
    };
    gstCalculated: {
      value: number;
      formattedValue: string;
      badgeText: string;
      percentChangeVsLastMonth?: number | undefined;
      sparklineData: number[];
      hasData: boolean;
    };
  };
  charts: {
    regimeComparison: Array<{
      id: string;
      label: string;
      grossIncome: number;
      newTax: number;
      oldTax: number;
      recommended: "new" | "old";
    }>;
    taxOverTime: {
      months: string[];
      currentYearData: number[];
      previousYearData?: number[] | undefined;
      hasComparison: boolean;
    };
    incomeDonut: {
      salary: number;
      business: number;
      other: number;
      capitalGains: number;
      total: number;
      hasData: boolean;
    };
  };
  recentActivity: Array<{
    id: string;
    type: "income_tax" | "gst" | "invoice";
    name: string;
    date: string;
    amount: number;
    taxOrGst: number;
    badge: string;
    status: "Saved" | "Optimized" | "Draft" | "Issued" | "Paid" | "Cancelled" | string;
    route: string;
  }>;
}

function formatINR(val: number): string {
  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(val || 0)}`;
}

/**
 * Compute Real Dashboard Summary from User's Saved Calculations & Invoices
 */
export async function getDashboardSummaryService(
  userId: string | null,
  taxYear: string = "2026-27"
): Promise<DashboardSummaryResponse> {
  const normTaxYear = taxYear.replace("2026-2027", "2026-27");

  // Logged-out state: return sample visual baseline with isSample: true
  if (!userId) {
    return getSampleDashboardSummary(normTaxYear);
  }

  // Fetch all calculations and invoices for user
  const { calculations: allCalcs } = await listUserCalculations(userId, { limit: 100 });
  const { invoices: allInvoices } = await listUserInvoices(userId, { limit: 100 });

  if (allCalcs.length === 0 && allInvoices.length === 0) {
    return getEmptyDashboardSummary(normTaxYear);
  }

  // Filter calculations by tax year
  const taxCalcsInYear = allCalcs.filter(
    (c) => c.type === "income_tax" && (c.taxYear === normTaxYear || c.taxYear === taxYear)
  );

  const allTaxCalcs = allCalcs.filter((c) => c.type === "income_tax");
  const allGstCalcs = allCalcs.filter((c) => c.type === "gst");

  // 1. KPI 1: Estimated tax (best regime) of most recent saved income tax calculation in tax year
  const latestTaxCalc = taxCalcsInYear[0] || allTaxCalcs[0];
  const hasTaxData = Boolean(latestTaxCalc);

  let bestTax = 0;
  let recommendedRegime = "new";
  let taxSavings = 0;
  let percentSaved = 0;

  if (latestTaxCalc) {
    bestTax = latestTaxCalc.summary?.bestTax ?? 0;
    recommendedRegime = latestTaxCalc.summary?.recommendedRegime || "new";
    taxSavings = latestTaxCalc.summary?.savings ?? 0;
    const otherTax = latestTaxCalc.summary?.otherTax ?? 0;
    if (otherTax > 0) {
      percentSaved = Math.round((taxSavings / otherTax) * 100);
    }
  }

  // Sparkline of last 7 income tax calculations (oldest to newest)
  const last7TaxCalcs = [...(taxCalcsInYear.length ? taxCalcsInYear : allTaxCalcs)]
    .slice(0, 7)
    .reverse();
  const taxSparkline = last7TaxCalcs.map((c) => c.summary?.bestTax ?? 0);
  const savingsSparkline = last7TaxCalcs.map((c) => c.summary?.savings ?? 0);

  // 2. KPI 3: GST collected this month (from issued and paid invoices)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;

  const eligibleInvoices = allInvoices.filter(
    (inv) => inv.status === "issued" || inv.status === "paid"
  );

  let gstThisMonth = 0;
  let gstLastMonth = 0;

  eligibleInvoices.forEach((inv) => {
    const invDateStr = inv.invoiceDate || "";
    const totalGst = Number(inv.engineResult?.totalGst || 0);

    if (invDateStr.startsWith(currentMonthStr)) {
      gstThisMonth += totalGst;
    } else if (invDateStr.startsWith(prevMonthStr)) {
      gstLastMonth += totalGst;
    }
  });

  let percentChangeGst: number | undefined = undefined;
  if (gstLastMonth > 0) {
    percentChangeGst = Math.round(((gstThisMonth - gstLastMonth) / gstLastMonth) * 100);
  }

  // Sparkline = weekly sums for the last 8 weeks
  const eightWeeksSparkline = Array(8).fill(0);
  const nowMs = now.getTime();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  eligibleInvoices.forEach((inv) => {
    const invDate = new Date(inv.invoiceDate || inv.createdAt);
    const diffMs = nowMs - invDate.getTime();
    if (diffMs >= 0) {
      const weekAgo = Math.floor(diffMs / oneWeekMs);
      if (weekAgo >= 0 && weekAgo < 8) {
        const sparklineIdx = 7 - weekAgo;
        eightWeeksSparkline[sparklineIdx] += Number(inv.engineResult?.totalGst || 0);
      }
    }
  });

  const hasInvoiceData = eligibleInvoices.length > 0;

  // 3. Chart: Old vs New regime (last 6 saved income tax calculations)
  const last6TaxCalcs = [...allTaxCalcs].slice(0, 6).reverse();
  const regimeComparison = last6TaxCalcs.map((c, i) => {
    const isNew = c.summary?.recommendedRegime === "new";
    const best = c.summary?.bestTax || 0;
    const other = c.summary?.otherTax || 0;
    return {
      id: String(c._id || c.id || i),
      label: `₹${formatINR(c.summary?.grossIncome || 0).replace("₹", "")}`,
      grossIncome: c.summary?.grossIncome || 0,
      newTax: isNew ? best : other,
      oldTax: isNew ? other : best,
      recommended: (c.summary?.recommendedRegime || "new") as "new" | "old",
    };
  });

  // 4. Chart: Tax over time (Monthly trend for selected tax year)
  const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const currentYearMonthly = Array(12).fill(0);
  const prevYearMonthly = Array(12).fill(0);

  let hasPrevYearData = false;

  allTaxCalcs.forEach((c) => {
    const date = new Date(c.createdAt);
    const m = date.getMonth(); // 0 = Jan, 3 = Apr
    const fyIdx = (m + 9) % 12; // Apr=0, May=1... Mar=11

    if (c.taxYear === normTaxYear || (!c.taxYear && c === latestTaxCalc)) {
      currentYearMonthly[fyIdx] = Math.max(currentYearMonthly[fyIdx], c.summary?.bestTax || 0);
    } else {
      prevYearMonthly[fyIdx] = Math.max(prevYearMonthly[fyIdx], c.summary?.bestTax || 0);
      hasPrevYearData = true;
    }
  });

  // 5. Donut: Where your income comes from
  let incomeDonut = {
    salary: 0,
    business: 0,
    other: 0,
    capitalGains: 0,
    total: 0,
    hasData: false,
  };

  if (latestTaxCalc && latestTaxCalc.inputs) {
    const inp = latestTaxCalc.inputs;
    const salary = Number(inp.incomeFromSalary || inp.grossSalary || 0);
    const business = Number(inp.incomeFromBusiness || 0);
    const other = Number(inp.incomeFromOtherSources || 0) + Number(inp.incomeFromHouseProperty || 0);
    const cg =
      Number(inp.capitalGains?.shortTerm15 || 0) +
      Number(inp.capitalGains?.shortTerm20 || 0) +
      Number(inp.capitalGains?.longTerm10 || 0) +
      Number(inp.capitalGains?.longTerm125 || 0) +
      Number(inp.capitalGains?.longTerm20 || 0);
    const total = salary + business + other + cg;

    if (total > 0) {
      incomeDonut = {
        salary,
        business,
        other,
        capitalGains: cg,
        total,
        hasData: true,
      };
    }
  }

  // 6. Recent Activity: merge saved calculations and invoices (latest 8, newest first)
  const mergedActivity: Array<{
    id: string;
    type: "income_tax" | "gst" | "invoice";
    name: string;
    date: string;
    createdAt: string;
    amount: number;
    taxOrGst: number;
    badge: string;
    status: string;
    route: string;
  }> = [];

  allCalcs.forEach((c) => {
    const isTax = c.type === "income_tax";
    const amount = isTax ? c.summary?.grossIncome || 0 : c.summary?.amount || 0;
    const taxOrGst = isTax ? c.summary?.bestTax || 0 : c.summary?.gstAmount || 0;

    mergedActivity.push({
      id: String(c._id || c.id),
      type: c.type,
      name: c.name,
      date: new Date(c.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      createdAt: c.createdAt,
      amount,
      taxOrGst,
      badge: isTax
        ? `${c.summary?.recommendedRegime === "new" ? "New" : "Old"} Regime`
        : `${c.summary?.rate}% GST`,
      status: "Saved",
      route: isTax ? `/income-tax/result?savedId=${c._id || c.id}` : `/gst?savedId=${c._id || c.id}`,
    });
  });

  allInvoices.forEach((inv) => {
    const buyerName = inv.buyer?.name || "Customer";
    const title = inv.invoiceNumber ? `${inv.invoiceNumber} - ${buyerName}` : `Draft - ${buyerName}`;

    mergedActivity.push({
      id: String(inv._id || inv.id),
      type: "invoice",
      name: title,
      date: new Date(inv.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      createdAt: inv.createdAt,
      amount: Number(inv.engineResult?.grandTotal || 0),
      taxOrGst: Number(inv.engineResult?.totalGst || 0),
      badge: inv.documentType === "bill_of_supply" ? "Bill of Supply" : "Tax Invoice",
      status: inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "Draft",
      route: `/invoices/${inv._id || inv.id}`,
    });
  });

  mergedActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentActivity = mergedActivity.slice(0, 8);

  return {
    isSample: false,
    isGuest: false,
    hasData: true,
    taxYear: normTaxYear,
    kpis: {
      estimatedTax: {
        value: bestTax,
        formattedValue: formatINR(bestTax),
        badgeText: hasTaxData
          ? recommendedRegime === "new"
            ? "New Regime (Lower)"
            : "Old Regime (Lower)"
          : "No Data",
        badgeType: "positive",
        sparklineData: taxSparkline.length ? taxSparkline : [0],
        hasData: hasTaxData,
      },
      taxSaved: {
        value: taxSavings,
        formattedValue: formatINR(taxSavings),
        badgeText: taxSavings > 0 ? `${percentSaved}% Saved` : "Optimal",
        percentSaved,
        sparklineData: savingsSparkline.length ? savingsSparkline : [0],
        hasData: hasTaxData && taxSavings > 0,
      },
      gstCalculated: {
        value: gstThisMonth,
        formattedValue: formatINR(gstThisMonth),
        badgeText: hasInvoiceData
          ? percentChangeGst !== undefined
            ? `${percentChangeGst >= 0 ? "+" : ""}${percentChangeGst}% vs last month`
            : "This Month"
          : "Create your first invoice",
        percentChangeVsLastMonth: percentChangeGst,
        sparklineData: eightWeeksSparkline,
        hasData: hasInvoiceData,
      },
    },
    charts: {
      regimeComparison,
      taxOverTime: {
        months: monthLabels,
        currentYearData: currentYearMonthly,
        previousYearData: hasPrevYearData ? prevYearMonthly : undefined,
        hasComparison: hasPrevYearData,
      },
      incomeDonut,
    },
    recentActivity,
  };
}

/**
 * Empty Dashboard for Logged-In User with 0 calculations
 */
function getEmptyDashboardSummary(taxYear: string): DashboardSummaryResponse {
  return {
    isSample: false,
    isGuest: false,
    hasData: false,
    taxYear,
    kpis: {
      estimatedTax: {
        value: 0,
        formattedValue: "₹0",
        badgeText: "No Calculations Yet",
        badgeType: "neutral",
        sparklineData: [0, 0, 0, 0, 0, 0, 0],
        hasData: false,
      },
      taxSaved: {
        value: 0,
        formattedValue: "₹0",
        badgeText: "0%",
        percentSaved: 0,
        sparklineData: [0, 0, 0, 0, 0, 0, 0],
        hasData: false,
      },
      gstCalculated: {
        value: 0,
        formattedValue: "₹0",
        badgeText: "Create your first invoice",
        sparklineData: [0, 0, 0, 0, 0, 0, 0, 0],
        hasData: false,
      },
    },
    charts: {
      regimeComparison: [],
      taxOverTime: {
        months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
        currentYearData: Array(12).fill(0),
        hasComparison: false,
      },
      incomeDonut: {
        salary: 0,
        business: 0,
        other: 0,
        capitalGains: 0,
        total: 0,
        hasData: false,
      },
    },
    recentActivity: [],
  };
}

/**
 * Sample Dashboard for Logged-Out / Guest Users
 */
function getSampleDashboardSummary(taxYear: string): DashboardSummaryResponse {
  return {
    isSample: true,
    isGuest: true,
    hasData: true,
    taxYear,
    kpis: {
      estimatedTax: {
        value: 125000,
        formattedValue: "₹1,25,000",
        badgeText: "New Regime (Sample)",
        badgeType: "positive",
        sparklineData: [180000, 165000, 150000, 140000, 132000, 128000, 125000],
        hasData: true,
      },
      taxSaved: {
        value: 62400,
        formattedValue: "₹62,400",
        badgeText: "33% Saved (Sample)",
        percentSaved: 33,
        sparklineData: [20000, 32000, 45000, 50000, 56000, 60000, 62400],
        hasData: true,
      },
      gstCalculated: {
        value: 42800,
        formattedValue: "₹42,800",
        badgeText: "+14% vs last mo (Sample)",
        percentChangeVsLastMonth: 14,
        sparklineData: [8500, 9200, 11200, 10500, 9800, 12000, 13300, 14200],
        hasData: true,
      },
    },
    charts: {
      regimeComparison: [
        { id: "s1", label: "₹10L", grossIncome: 1000000, newTax: 52000, oldTax: 78000, recommended: "new" },
        { id: "s2", label: "₹15L", grossIncome: 1500000, newTax: 140000, oldTax: 187200, recommended: "new" },
        { id: "s3", label: "₹20L", grossIncome: 2000000, newTax: 270000, oldTax: 322400, recommended: "new" },
        { id: "s4", label: "₹25L", grossIncome: 2500000, newTax: 420000, oldTax: 468000, recommended: "new" },
      ],
      taxOverTime: {
        months: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
        currentYearData: [12000, 15000, 18000, 25000, 35000, 52000, 68000, 85000, 95000, 110000, 120000, 125000],
        previousYearData: [15000, 18000, 22000, 30000, 42000, 60000, 78000, 95000, 110000, 130000, 145000, 155000],
        hasComparison: true,
      },
      incomeDonut: {
        salary: 1200000,
        business: 200000,
        other: 60000,
        capitalGains: 40000,
        total: 1500000,
        hasData: true,
      },
    },
    recentActivity: [
      {
        id: "sample_1",
        type: "income_tax",
        name: "FY 2026-27 Salaried Tax Analysis",
        date: "Today",
        amount: 1500000,
        taxOrGst: 140000,
        badge: "New Regime",
        status: "Saved",
        route: "/income-tax",
      },
      {
        id: "sample_2",
        type: "gst",
        name: "Software Consulting Invoice GST",
        date: "Yesterday",
        amount: 85000,
        taxOrGst: 15300,
        badge: "18% GST",
        status: "Saved",
        route: "/gst",
      },
    ],
  };
}
