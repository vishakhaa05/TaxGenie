import { apiFetch } from "@/auth/api";

export interface CalculationSummary {
  grossIncome?: number;
  recommendedRegime?: "new" | "old";
  bestTax?: number;
  otherTax?: number;
  savings?: number;
  amount?: number;
  rate?: number;
  mode?: "add" | "remove";
  gstAmount?: number;
  total?: number;
}

export interface CalculationItem {
  id: string;
  _id?: string;
  userId: string;
  type: "income_tax" | "gst";
  taxYear: string;
  name: string;
  inputs: Record<string, any>;
  result: Record<string, any>;
  rulesVersion?: string;
  summary: CalculationSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ListCalculationsResponse {
  calculations: CalculationItem[];
  total: number;
  page: number;
  totalPages: number;
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface RecalculateResponse {
  calculationId: string;
  savedResult: any;
  currentResult: any;
  original: any;
  current: any;
  rulesChanged: boolean;
  inputs: Record<string, any>;
  name: string;
  type: "income_tax" | "gst";
  taxYear: string;
}

export interface DashboardSummaryData {
  isSample: boolean;
  isGuest: boolean;
  hasData: boolean;
  taxYear: string;
  userName?: string;
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
      percentChangeVsLastMonth?: number;
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
      previousYearData?: number[];
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
    status: "Saved" | "Optimized";
    route: string;
  }>;
}

/**
 * Save calculation with server-side engine recomputation
 */
export async function saveCalculationApi(payload: {
  type: "income_tax" | "gst";
  inputs: Record<string, any>;
  name?: string;
  taxYear?: string;
}) {
  return apiFetch<CalculationItem>("/calculations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * List calculations with filters, search, sort, and pagination
 */
export async function listCalculationsApi(params: {
  type?: "income_tax" | "gst";
  taxYear?: string;
  q?: string;
  sort?: "latest" | "oldest" | "amount_desc" | "amount_asc";
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.taxYear) query.set("taxYear", params.taxYear);
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiFetch<ListCalculationsResponse>(`/calculations${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

/**
 * Get calculation by ID
 */
export async function getCalculationByIdApi(id: string) {
  return apiFetch<CalculationItem>(`/calculations/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

/**
 * Rename a calculation
 */
export async function renameCalculationApi(id: string, name: string) {
  return apiFetch<CalculationItem>(`/calculations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

/**
 * Delete a calculation
 */
export async function deleteCalculationApi(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/calculations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * Recalculate calculation with current active rules
 */
export async function recalculateCalculationApi(id: string) {
  return apiFetch<RecalculateResponse>(`/calculations/${encodeURIComponent(id)}/recalculate`, {
    method: "POST",
  });
}

/**
 * Fetch real dashboard summary data from server
 */
export async function getDashboardSummaryApi(taxYear: string = "2026-27") {
  return apiFetch<DashboardSummaryData>(`/dashboard/summary?taxYear=${encodeURIComponent(taxYear)}`, {
    method: "GET",
  });
}
