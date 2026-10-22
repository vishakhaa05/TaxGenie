import { apiClient } from "@/app/api-client";
import { AutoPulledDeductions, CalculateTaxInput, TaxComparisonResult, TaxSlabConfig } from "./taxType";

export const taxAPI = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getTaxConfig: builder.query<{ success: boolean; config: TaxSlabConfig }, string | void>({
      query: (fy) => `/tax/config${fy ? `?financialYear=${fy}` : ""}`,
      providesTags: ["tax"],
    }),
    autoPullDeductions: builder.query<{ success: boolean; deductions: AutoPulledDeductions }, string | void>({
      query: (fy) => `/tax/auto-pull${fy ? `?financialYear=${fy}` : ""}`,
      providesTags: ["tax"],
    }),
    calculateTaxComparison: builder.mutation<{ success: boolean; comparison: TaxComparisonResult }, CalculateTaxInput>({
      query: (body) => ({
        url: "/tax/compare",
        method: "POST",
        body,
      }),
      invalidatesTags: ["tax"],
    }),
  }),
});

export const {
  useGetTaxConfigQuery,
  useAutoPullDeductionsQuery,
  useLazyAutoPullDeductionsQuery,
  useCalculateTaxComparisonMutation,
} = taxAPI;
