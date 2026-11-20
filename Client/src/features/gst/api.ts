import { apiClient } from "@/app/api-client";
import {
  CalculateGstInput,
  GstMetaResponse,
  GstResult,
  GstState,
} from "./types";

// Standard Fallback GST States (Official 2-digit codes)
export const FALLBACK_GST_STATES: readonly GstState[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
];

export const FALLBACK_GST_RATES = [0, 5, 18, 40];
export const DEFAULT_GST_RATE = 18;

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

let cachedMeta: GstMetaResponse | null = null;

/**
 * Fetch statutory GST rates and state list once and cache them.
 */
export async function fetchGstMeta(taxYear: string = "2026-27"): Promise<GstMetaResponse> {
  if (cachedMeta) {
    return cachedMeta;
  }

  try {
    const res = await fetch(`${BASE_URL}/gst/meta?taxYear=${encodeURIComponent(taxYear)}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        cachedMeta = json.data as GstMetaResponse;
        return cachedMeta;
      }
    }
  } catch (err) {
    // Silently fall back to statutory defaults if API is not yet loaded or in tests
  }

  // Fallback if endpoint is unreachable
  cachedMeta = {
    states: [...FALLBACK_GST_STATES],
    supportedRates: FALLBACK_GST_RATES,
    defaultRate: DEFAULT_GST_RATE,
  };
  return cachedMeta;
}

/**
 * Direct async call to calculate GST with AbortController signal support.
 */
export async function calculateGstApi(
  input: CalculateGstInput,
  signal?: AbortSignal
): Promise<GstResult> {
  const res = await fetch(`${BASE_URL}/gst/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  const body = await res.json();

  if (!res.ok || !body.success) {
    const err = new Error(body?.error?.message || "Failed to calculate GST");
    (err as any).code = body?.error?.code || "CALCULATION_ERROR";
    (err as any).details = body?.error?.details;
    (err as any).rate = body?.error?.rate;
    throw err;
  }

  return body.data as GstResult;
}

// RTK Query endpoints injection
export const gstApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getGstMeta: builder.query<{ success: boolean; data: GstMetaResponse }, string | void>({
      query: (taxYear = "2026-27") => `/gst/meta?taxYear=${taxYear}`,
      providesTags: ["tax"],
    }),
    calculateGst: builder.mutation<{ success: boolean; data: GstResult }, CalculateGstInput>({
      query: (body) => ({
        url: "/gst/calculate",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetGstMetaQuery, useCalculateGstMutation } = gstApi;

export async function validateGstinOnServer(gstin: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/gst/validate-gstin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstin }),
    });
    const body = await res.json();
    if (res.ok && body.success && body.data) {
      return body.data;
    }
    return { valid: false, reason: body?.error?.message || "Invalid GSTIN format" };
  } catch (err: any) {
    return { valid: false, reason: err.message || "Failed to validate GSTIN" };
  }
}

