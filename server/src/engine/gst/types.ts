/**
 * Pure calculation engine types for Indian Goods & Services Tax (GST).
 * Internal engine calculates in whole integer PAISE to completely eliminate floating-point drift.
 */

export type GstMode = "add" | "remove";
export type SupplyType = "intra" | "inter";

export interface GstRulesConfig {
  supportedRates: number[]; // [0, 5, 18, 40]
  defaultRate: number; // 18
}

export interface CalculateGstInput {
  amount: number; // in Rupees
  rate: number; // percentage e.g. 0, 5, 18, 40
  mode: GstMode; // "add" or "remove"
  sellerState: string; // state name or 2-digit code
  buyerState: string; // state name or 2-digit code
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
  // Exact integer paise values
  basePaise: number;
  gstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
}

export interface InvoiceItemInput {
  name?: string | undefined;
  description?: string | undefined;
  hsnOrSac?: string | undefined;
  quantity: number;
  unit?: string | undefined;
  unitPrice: number; // in Rupees
  rate: number; // percentage
  discount?: number | undefined; // total line discount in Rupees (default 0)
  discountType?: "percent" | "amount" | undefined;
  discountValue?: number | undefined;
}

export interface InvoiceInput {
  items: InvoiceItemInput[];
  sellerState: string;
  buyerState: string;
  priceIncludesGst: boolean;
  documentType?: "tax_invoice" | "bill_of_supply" | undefined;
}

export interface InvoiceItemResult {
  name: string;
  description?: string | undefined;
  hsnOrSac?: string | undefined;
  quantity: number;
  unit?: string | undefined;
  unitPrice: number;
  discount: number;
  taxableValue: number;
  rate: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface InvoiceTaxSummaryItem {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
}

export interface InvoiceResult {
  items: InvoiceItemResult[];
  taxSummary: InvoiceTaxSummaryItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  totalBeforeRoundOff: number;
  roundOff: number; // round-off to nearest rupee (+0.xx or -0.xx)
  grandTotal: number; // in whole rupees
  amountInWords: string;
  supplyType: SupplyType;
  documentType?: "tax_invoice" | "bill_of_supply" | undefined;
}

export interface GstinValidationResult {
  valid: boolean;
  reason?:
    | "INVALID_LENGTH"
    | "INVALID_FORMAT"
    | "INVALID_STATE_CODE"
    | "INVALID_CHECKSUM"
    | undefined;
  details?:
    | {
        stateCode: string;
        stateName?: string | undefined;
        pan: string;
        entityNumber: string;
        checksum: string;
      }
    | undefined;
}
