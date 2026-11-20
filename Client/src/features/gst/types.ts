export type GstMode = "add" | "remove";
export type SupplyType = "intra" | "inter";

export interface GstState {
  code: string;
  name: string;
}

export interface GstRulesConfig {
  supportedRates: number[];
  defaultRate: number;
}

export interface CalculateGstInput {
  amount: number; // in Rupees
  rate: number; // e.g. 0, 5, 18, 40
  mode: GstMode; // "add" | "remove"
  sellerState: string;
  buyerState: string;
  taxYear?: string;
}

export interface GstResult {
  base: number; // Rupees (2 decimal places)
  gstAmount: number; // Rupees
  cgst: number; // Rupees
  sgst: number; // Rupees
  igst: number; // Rupees
  total: number; // Rupees
  supplyType: SupplyType;
  rate: number;
  basePaise: number;
  gstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  amountInWords?: string;
}

export interface GstMetaResponse {
  states: GstState[];
  supportedRates: number[];
  defaultRate: number;
}

export interface CommonGstItem {
  id: string;
  name_en: string;
  name_hi: string;
  rate: number;
  category: string;
  hsn?: string;
  verified: boolean;
}

export interface RecentCalculationItem {
  id: string;
  timestamp: number;
  amount: number;
  rate: number;
  mode: GstMode;
  sellerState: string;
  buyerState: string;
  result: GstResult;
}

export interface CompareRateRow {
  rate: number;
  base: number;
  gstAmount: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  differenceFromCurrent: number;
}
