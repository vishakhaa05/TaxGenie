/**
 * Standard Indian State and Union Territory GST State Codes.
 *
 * NOTE: Supply type here is simplified based on seller state vs buyer state.
 * Special cases (exports, SEZ units, deemed exports, reverse charge) are out of scope.
 * // TODO: verify list against gst.gov.in
 */

export interface GstState {
  code: string;
  name: string;
}

// Official 2-digit state codes under the Indian Goods and Services Tax Act
export const GST_STATES: readonly GstState[] = [
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
  { code: "25", name: "Daman and Diu" }, // legacy code
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" }, // legacy code
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
] as const;

export const VALID_STATE_CODES = new Set(GST_STATES.map((s) => s.code));

/**
 * Normalizes state input (either 2-digit code or full state name) into 2-digit code.
 */
export function normalizeStateCode(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // If 2-digit code
  if (/^\d{2}$/.test(trimmed)) {
    return VALID_STATE_CODES.has(trimmed) ? trimmed : null;
  }

  // Lookup by name (case-insensitive substring/match)
  const lower = trimmed.toLowerCase();
  const matched = GST_STATES.find(
    (s) =>
      s.name.toLowerCase() === lower ||
      s.name.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        lower.replace(/[^a-z0-9]/g, "")
  );

  return matched ? matched.code : null;
}

/**
 * Check if two state inputs represent the same state (Intra-state supply).
 */
export function isSameState(stateA: string, stateB: string): boolean {
  const codeA = normalizeStateCode(stateA);
  const codeB = normalizeStateCode(stateB);

  if (codeA && codeB) {
    return codeA === codeB;
  }

  // Fallback to direct lowercase trimmed string comparison
  return stateA.trim().toLowerCase() === stateB.trim().toLowerCase();
}
