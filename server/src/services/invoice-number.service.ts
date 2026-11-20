import { getNextInvoiceNumber } from "../utils/localStore";

export function getIndianFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 3 = Apr
  const year = date.getFullYear();
  if (month >= 3) {
    // April to Dec
    const nextYearShort = String((year + 1) % 100).padStart(2, "0");
    return `${year}-${nextYearShort}`;
  } else {
    // Jan to March
    const yearShort = String(year % 100).padStart(2, "0");
    return `${year - 1}-${yearShort}`;
  }
}

export class InvoiceNumberService {
  public static async generateNextNumber(
    userId: string,
    profile: {
      invoicePrefix?: string | undefined;
      numberPadding?: number | undefined;
      resetEachFinancialYear?: boolean | undefined;
    },
    invoiceDate: Date = new Date()
  ): Promise<{ invoiceNumber: string; financialYear: string }> {
    const prefix = (profile.invoicePrefix || "INV").trim().toUpperCase();
    const padding = profile.numberPadding && profile.numberPadding >= 1 ? profile.numberPadding : 4;
    const reset = profile.resetEachFinancialYear !== false;
    const financialYear = getIndianFinancialYear(invoiceDate);

    const counterKey = reset ? `${prefix}-${financialYear}` : `${prefix}-ALL`;
    const nextSeq = await getNextInvoiceNumber(userId, counterKey);

    const numberPart = String(nextSeq).padStart(padding, "0");
    const invoiceNumber = `${prefix}-${numberPart}`;

    if (invoiceNumber.length > 16) {
      const err: any = new Error(
        `Generated invoice number "${invoiceNumber}" exceeds maximum allowed length of 16 characters.`
      );
      err.statusCode = 400;
      err.code = "INVOICE_NUMBER_TOO_LONG";
      throw err;
    }

    return { invoiceNumber, financialYear };
  }
}
