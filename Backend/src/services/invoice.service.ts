import { calculateInvoice } from "../engine/gst/invoice";
import { validateGstin } from "../engine/gst/gstin";
import { GstRulesConfig, InvoiceItemInput } from "../engine/gst/types";
import { RulesService } from "./rules.service";
import { BusinessProfileService } from "./business-profile.service";
import { CustomerService } from "./customer.service";
import { InvoiceNumberService, getIndianFinancialYear } from "./invoice-number.service";
import {
  countUserInvoices,
  createInvoice,
  findInvoiceByIdAndUser,
  updateInvoiceDraftByIdAndUser,
  deleteInvoiceDraftByIdAndUser,
  issueInvoiceByIdAndUser,
  updateInvoiceStatusByIdAndUser,
  listUserInvoices,
} from "../utils/localStore";

export class InvoiceService {
  private static async getRules(taxYear: string = "2026-27"): Promise<GstRulesConfig> {
    const rules = await RulesService.getRulesForYear(taxYear);
    return (
      rules?.gst || {
        supportedRates: [0, 5, 18, 40],
        defaultRate: 18,
      }
    );
  }

  public static async computeTotals(
    items: any[],
    sellerState: string,
    buyerState: string,
    priceIncludesGst: boolean,
    documentType: "tax_invoice" | "bill_of_supply" = "tax_invoice",
    taxYear: string = "2026-27"
  ) {
    const rules = await this.getRules(taxYear);

    const mappedItems: InvoiceItemInput[] = items.map((it) => {
      let unitPriceRupees = 0;
      if (typeof it.unitPrice === "number") {
        unitPriceRupees = it.unitPrice;
      } else if (typeof it.unitPricePaise === "number") {
        unitPriceRupees = it.unitPricePaise / 100;
      }

      return {
        name: it.description || it.name || "Item",
        description: it.description || it.name || "Item",
        hsnOrSac: it.hsnSac || it.hsnOrSac || undefined,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || "NOS",
        unitPrice: unitPriceRupees,
        rate: Number(it.gstRate ?? it.rate ?? 18),
        discountType: it.discountType || "amount",
        discountValue: Number(it.discountValue || 0),
        discount: Number(it.discount || 0),
      };
    });

    return calculateInvoice(
      {
        items: mappedItems,
        sellerState: sellerState || "27",
        buyerState: buyerState || sellerState || "27",
        priceIncludesGst: Boolean(priceIncludesGst),
        documentType,
      },
      rules
    );
  }

  public static async createDraft(userId: string, data: any) {
    const count = await countUserInvoices(userId);
    if (count >= 500) {
      const err: any = new Error("Invoice limit reached (maximum 500 invoices)");
      err.statusCode = 400;
      err.code = "LIMIT_REACHED";
      throw err;
    }

    const profile = await BusinessProfileService.getProfile(userId);

    let seller = profile
      ? {
          legalName: profile.legalName,
          tradeName: profile.tradeName || undefined,
          gstin: profile.gstin || undefined,
          pan: profile.pan || undefined,
          address: profile.address,
          state: profile.state,
          pincode: profile.pincode,
          phone: profile.phone || undefined,
          email: profile.email || undefined,
          signatureLabel: profile.signatureLabel || "Authorised Signatory",
        }
      : {
          legalName: "Business Name",
          address: "Address",
          state: "Maharashtra",
          pincode: "400001",
          signatureLabel: "Authorised Signatory",
        };

    let buyer = data.buyer;
    if (data.customerId) {
      const customer = await CustomerService.getCustomer(userId, data.customerId);
      buyer = {
        name: customer.name,
        gstin: customer.gstin || undefined,
        address: customer.address,
        state: customer.state,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
      };
    }

    if (!buyer || !buyer.name) {
      buyer = {
        name: "Cash Customer",
        address: "Address",
        state: seller.state || "Maharashtra",
      };
    }

    const documentType = data.documentType || "tax_invoice";
    const invoiceDateStr = data.invoiceDate || new Date().toISOString().slice(0, 10);
    const invoiceDateObj = new Date(invoiceDateStr);

    let dueDateStr = data.dueDate;
    if (!dueDateStr) {
      const termsDays = profile?.defaultPaymentTermsDays ?? 15;
      const dueObj = new Date(invoiceDateObj);
      dueObj.setDate(dueObj.getDate() + termsDays);
      dueDateStr = dueObj.toISOString().slice(0, 10);
    }

    const financialYear = getIndianFinancialYear(invoiceDateObj);

    // Recompute engine totals strictly on the server
    const engineResult = await this.computeTotals(
      data.items,
      seller.state,
      buyer.state,
      data.priceIncludesGst,
      documentType
    );

    const items = data.items.map((it: any) => ({
      description: it.description || it.name,
      hsnSac: it.hsnSac || undefined,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || "NOS",
      unitPricePaise:
        typeof it.unitPricePaise === "number"
          ? it.unitPricePaise
          : Math.round((Number(it.unitPrice) || 0) * 100),
      discountType: it.discountType || "amount",
      discountValue: Number(it.discountValue || 0),
      gstRate: Number(it.gstRate ?? it.rate ?? 18),
    }));

    return await createInvoice({
      userId,
      documentType,
      status: "draft",
      invoiceNumber: undefined,
      invoiceDate: invoiceDateStr,
      dueDate: dueDateStr,
      financialYear,
      seller,
      buyer,
      items,
      priceIncludesGst: Boolean(data.priceIncludesGst),
      engineResult,
      notes: data.notes ?? profile?.defaultNotes ?? undefined,
      terms: data.terms ?? profile?.defaultTerms ?? undefined,
      paymentDetailsText: data.paymentDetailsText ?? profile?.paymentDetailsText ?? undefined,
    });
  }

  public static async updateDraft(userId: string, id: string, data: any) {
    const existing = await findInvoiceByIdAndUser(id, userId);
    if (!existing) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    if (existing.status !== "draft") {
      const err: any = new Error("Only draft invoices can be edited");
      err.statusCode = 400;
      err.code = "INVOICE_NOT_EDITABLE";
      throw err;
    }

    const seller = data.seller || existing.seller;
    let buyer = data.buyer || existing.buyer;
    if (data.customerId) {
      const customer = await CustomerService.getCustomer(userId, data.customerId);
      buyer = {
        name: customer.name,
        gstin: customer.gstin || undefined,
        address: customer.address,
        state: customer.state,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
      };
    }

    const items = (data.items || existing.items).map((it: any) => ({
      description: it.description || it.name,
      hsnSac: it.hsnSac || undefined,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || "NOS",
      unitPricePaise:
        typeof it.unitPricePaise === "number"
          ? it.unitPricePaise
          : Math.round((Number(it.unitPrice) || 0) * 100),
      discountType: it.discountType || "amount",
      discountValue: Number(it.discountValue || 0),
      gstRate: Number(it.gstRate ?? it.rate ?? 18),
    }));

    const documentType = data.documentType || existing.documentType;
    const priceIncludesGst =
      data.priceIncludesGst !== undefined ? Boolean(data.priceIncludesGst) : existing.priceIncludesGst;

    const engineResult = await this.computeTotals(
      items,
      seller.state,
      buyer.state,
      priceIncludesGst,
      documentType
    );

    const invoiceDateStr = data.invoiceDate || existing.invoiceDate;
    const financialYear = getIndianFinancialYear(new Date(invoiceDateStr));

    const updates = {
      documentType,
      invoiceDate: invoiceDateStr,
      dueDate: data.dueDate || existing.dueDate,
      financialYear,
      seller,
      buyer,
      items,
      priceIncludesGst,
      engineResult,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      terms: data.terms !== undefined ? data.terms : existing.terms,
      paymentDetailsText:
        data.paymentDetailsText !== undefined ? data.paymentDetailsText : existing.paymentDetailsText,
    };

    return await updateInvoiceDraftByIdAndUser(id, userId, updates);
  }

  public static async deleteDraft(userId: string, id: string) {
    const existing = await findInvoiceByIdAndUser(id, userId);
    if (!existing) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    if (existing.status !== "draft") {
      const err: any = new Error("Issued, paid, or cancelled invoices cannot be deleted");
      err.statusCode = 400;
      err.code = "INVOICE_NOT_EDITABLE";
      throw err;
    }

    return await deleteInvoiceDraftByIdAndUser(id, userId);
  }

  public static async issueInvoice(userId: string, id: string) {
    const existing = await findInvoiceByIdAndUser(id, userId);
    if (!existing) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    if (existing.status !== "draft") {
      const err: any = new Error("Invoice is already issued");
      err.statusCode = 400;
      err.code = "INVOICE_ALREADY_ISSUED";
      throw err;
    }

    const profile = await BusinessProfileService.getProfile(userId);
    if (!profile) {
      const err: any = new Error("Business profile must be configured before issuing an invoice");
      err.statusCode = 400;
      err.code = "PROFILE_REQUIRED";
      throw err;
    }

    // Statutory Check: Tax Invoice requires valid seller GSTIN
    if (existing.documentType === "tax_invoice") {
      if (!profile.gstin || !validateGstin(profile.gstin).valid) {
        const err: any = new Error(
          "A GST-registered seller with a valid GSTIN is required to issue a Tax Invoice. Please issue a Bill of Supply instead."
        );
        err.statusCode = 400;
        err.code = "SELLER_GSTIN_REQUIRED";
        throw err;
      }
    }

    // Validate buyer GSTIN if provided
    if (existing.buyer?.gstin && existing.buyer.gstin.trim()) {
      const validation = validateGstin(existing.buyer.gstin.trim());
      if (!validation.valid) {
        const err: any = new Error("Recipient GSTIN is invalid");
        err.statusCode = 400;
        err.code = "GSTIN_INVALID";
        throw err;
      }
    }

    // Refresh seller snapshot from latest profile
    const seller = {
      legalName: profile.legalName,
      tradeName: profile.tradeName || undefined,
      gstin: profile.gstin || undefined,
      pan: profile.pan || undefined,
      address: profile.address,
      state: profile.state,
      pincode: profile.pincode,
      phone: profile.phone || undefined,
      email: profile.email || undefined,
      signatureLabel: profile.signatureLabel || "Authorised Signatory",
    };

    const invoiceDate = new Date(existing.invoiceDate);
    const { invoiceNumber, financialYear } = await InvoiceNumberService.generateNextNumber(
      userId,
      profile,
      invoiceDate
    );

    // Recompute totals with fresh engine run
    const engineResult = await this.computeTotals(
      existing.items,
      seller.state,
      existing.buyer.state,
      existing.priceIncludesGst,
      existing.documentType
    );

    const updateData = {
      invoiceNumber,
      financialYear,
      seller,
      engineResult,
    };

    return await issueInvoiceByIdAndUser(id, userId, updateData);
  }

  public static async markPaid(userId: string, id: string) {
    const existing = await findInvoiceByIdAndUser(id, userId);
    if (!existing) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    if (existing.status === "draft") {
      const err: any = new Error("Draft invoice cannot be marked as paid");
      err.statusCode = 400;
      err.code = "INVOICE_NOT_ISSUED";
      throw err;
    }

    if (existing.status === "cancelled") {
      const err: any = new Error("Cancelled invoice cannot be marked as paid");
      err.statusCode = 400;
      err.code = "INVOICE_CANCELLED";
      throw err;
    }

    return await updateInvoiceStatusByIdAndUser(id, userId, "paid", "paidAt");
  }

  public static async markUnpaid(userId: string, id: string) {
    const existing = await findInvoiceByIdAndUser(id, userId);
    if (!existing) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    if (existing.status !== "paid") {
      return existing;
    }

    return await updateInvoiceStatusByIdAndUser(id, userId, "issued", "paidAt");
  }

  public static async cancelInvoice(userId: string, id: string) {
    const existing = await findInvoiceByIdAndUser(id, userId);
    if (!existing) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    if (existing.status === "draft") {
      const err: any = new Error("Draft invoices cannot be cancelled; delete them instead");
      err.statusCode = 400;
      err.code = "CANNOT_CANCEL_DRAFT";
      throw err;
    }

    if (existing.status === "cancelled") {
      return existing;
    }

    return await updateInvoiceStatusByIdAndUser(id, userId, "cancelled", "cancelledAt");
  }

  public static async duplicateInvoice(userId: string, id: string) {
    const existing = await findInvoiceByIdAndUser(id, userId);
    if (!existing) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const profile = await BusinessProfileService.getProfile(userId);
    const termsDays = profile?.defaultPaymentTermsDays ?? 15;
    const dueObj = new Date();
    dueObj.setDate(dueObj.getDate() + termsDays);
    const dueDateStr = dueObj.toISOString().slice(0, 10);

    return await this.createDraft(userId, {
      documentType: existing.documentType,
      buyer: existing.buyer,
      items: existing.items,
      priceIncludesGst: existing.priceIncludesGst,
      invoiceDate: todayStr,
      dueDate: dueDateStr,
      notes: existing.notes,
      terms: existing.terms,
      paymentDetailsText: existing.paymentDetailsText,
    });
  }

  public static async getInvoice(userId: string, id: string) {
    const invoice = await findInvoiceByIdAndUser(id, userId);
    if (!invoice) {
      const err: any = new Error("Invoice not found");
      err.statusCode = 404;
      err.code = "INVOICE_NOT_FOUND";
      throw err;
    }

    const isOverdue =
      invoice.status === "issued" &&
      invoice.dueDate &&
      new Date(invoice.dueDate) < new Date(new Date().toISOString().slice(0, 10));

    return {
      ...invoice,
      isOverdue,
    };
  }

  public static async listInvoices(
    userId: string,
    options: {
      status?: string | undefined;
      q?: string | undefined;
      from?: string | undefined;
      to?: string | undefined;
      customerId?: string | undefined;
      sort?: string | undefined;
      page?: number | undefined;
      limit?: number | undefined;
    } = {}
  ) {
    const result = await listUserInvoices(userId, options);
    const todayStr = new Date().toISOString().slice(0, 10);

    const mapped = result.invoices.map((inv) => ({
      ...inv,
      isOverdue:
        inv.status === "issued" &&
        inv.dueDate &&
        new Date(inv.dueDate) < new Date(todayStr),
    }));

    return {
      ...result,
      invoices: mapped,
    };
  }
}
