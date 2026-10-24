import { apiClient } from "@/app/api-client";
import { ComparisonResult, TaxInput, TaxYearRules } from "./types";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[] | string>;
  };
}

export const incomeTaxApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getRulesForYear: builder.query<{ success: boolean; data: TaxYearRules }, string>({
      query: (taxYear) => `/rules/${taxYear}`,
      providesTags: ["tax"],
    }),
    calculateTax: builder.mutation<
      { success: boolean; data: ComparisonResult },
      TaxInput
    >({
      query: (body) => ({
        url: "/tax/calculate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["tax"],
    }),
  }),
});

export const {
  useGetRulesForYearQuery,
  useLazyGetRulesForYearQuery,
  useCalculateTaxMutation,
} = incomeTaxApi;

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * Direct async helper to fetch statutory rules without requiring Redux context.
 */
export async function fetchRulesDirect(taxYear: string = "2026-27"): Promise<TaxYearRules> {
  const res = await fetch(`${BASE_URL}/rules/${encodeURIComponent(taxYear)}`, {
    headers: { "Content-Type": "application/json" },
  });

  const body = await res.json();
  if (!res.ok || !body.success) {
    const errorMsg = body?.error?.message || `Failed to fetch rules for tax year ${taxYear}`;
    const err = new Error(errorMsg);
    (err as any).code = body?.error?.code || "RULES_FETCH_ERROR";
    (err as any).details = body?.error?.details;
    throw err;
  }

  return body.data as TaxYearRules;
}

/**
 * Direct async helper to call pure tax calculate endpoint.
 */
export async function calculateTaxDirect(input: TaxInput): Promise<ComparisonResult> {
  const res = await fetch(`${BASE_URL}/tax/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await res.json();
  if (!res.ok || !body.success) {
    const errorMsg = body?.error?.message || "Failed to calculate taxes";
    const err = new Error(errorMsg);
    (err as any).code = body?.error?.code || "CALCULATION_ERROR";
    (err as any).details = body?.error?.details;
    throw err;
  }

  return body.data as ComparisonResult;
}
