export type InvoiceDocumentType = "tax_invoice" | "bill_of_supply";
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

export interface InvoiceItem {
  id?: string;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  unitPrice: number; // in Rupees for UI
  unitPricePaise?: number; // in Paise for backend
  discountType: "percent" | "amount";
  discountValue: number;
  gstRate: number; // 0, 5, 18, 40
}

export interface InvoiceSellerSnapshot {
  legalName: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  address: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  signatureLabel?: string;
}

export interface InvoiceBuyerSnapshot {
  name: string;
  gstin?: string;
  address: string;
  state: string;
  email?: string;
  phone?: string;
}

export interface InvoiceTaxSummaryItem {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
}

export interface InvoiceEngineResult {
  items: Array<{
    name: string;
    description?: string;
    hsnOrSac?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discount: number;
    taxableValue: number;
    rate: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  }>;
  taxSummary: InvoiceTaxSummaryItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  totalBeforeRoundOff: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  supplyType: "intra" | "inter";
  documentType?: InvoiceDocumentType;
}

export interface Invoice {
  _id: string;
  id?: string;
  userId: string;
  documentType: InvoiceDocumentType;
  status: InvoiceStatus;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate: string;
  financialYear: string;
  seller: InvoiceSellerSnapshot;
  buyer: InvoiceBuyerSnapshot;
  items: InvoiceItem[];
  priceIncludesGst: boolean;
  engineResult: InvoiceEngineResult;
  notes?: string;
  terms?: string;
  paymentDetailsText?: string;
  paidAt?: string;
  cancelledAt?: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  _id?: string;
  userId?: string;
  legalName: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  address: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  invoicePrefix: string;
  numberPadding: number;
  resetEachFinancialYear: boolean;
  defaultPaymentTermsDays: number;
  defaultNotes?: string;
  defaultTerms?: string;
  paymentDetailsText?: string;
  signatureLabel?: string;
}

export interface Customer {
  _id: string;
  id?: string;
  name: string;
  gstin?: string;
  address: string;
  state: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

export interface MonthlySummaryRow {
  month: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
  invoiceCount: number;
  rateBreakdown: Record<string, { taxable: number; gst: number }>;
}
