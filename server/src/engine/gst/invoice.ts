import { EngineValidationError, GstCalculationError } from "../shared/errors";
import { roundHalfUp } from "../shared/rounding";
import { amountInWords } from "./amountInWords";
import { paiseToRupees, rupeesToPaise } from "./money";
import { isSameState } from "./states";
import {
  InvoiceInput,
  InvoiceItemResult,
  InvoiceResult,
  InvoiceTaxSummaryItem,
  GstRulesConfig,
  SupplyType,
} from "./types";

/**
 * Pure invoice calculation engine.
 * Computes per-line amounts, grouped tax summary, subtotal, CGST/SGST/IGST breakdown,
 * round-off adjustment to the nearest rupee, and Indian amount in words.
 */
export function calculateInvoice(
  input: InvoiceInput,
  rules: GstRulesConfig
): InvoiceResult {
  const { items, sellerState, buyerState, priceIncludesGst } = input;

  if (!Array.isArray(items) || items.length === 0) {
    throw new EngineValidationError(
      "Invoice must contain at least one line item",
      "EMPTY_INVOICE_ITEMS",
      "items"
    );
  }

  if (!sellerState || typeof sellerState !== "string" || !sellerState.trim()) {
    throw new EngineValidationError(
      "Seller state is required for invoice tax determination",
      "MISSING_SELLER_STATE",
      "sellerState"
    );
  }

  if (!buyerState || typeof buyerState !== "string" || !buyerState.trim()) {
    throw new EngineValidationError(
      "Buyer state is required for invoice tax determination",
      "MISSING_BUYER_STATE",
      "buyerState"
    );
  }

  const isIntra = isSameState(sellerState, buyerState);
  const supplyType: SupplyType = isIntra ? "intra" : "inter";

  const lineResults: InvoiceItemResult[] = [];
  const taxSummaryMap = new Map<
    number,
    {
      taxablePaise: number;
      cgstPaise: number;
      sgstPaise: number;
      igstPaise: number;
      totalGstPaise: number;
    }
  >();

  let subtotalPaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;

  const isBillOfSupply = input.documentType === "bill_of_supply";

  for (const item of items) {
    const itemName = item.name?.trim() || item.description?.trim();
    if (!itemName) {
      throw new EngineValidationError(
        "Each invoice item must have a valid name or description",
        "INVALID_ITEM_NAME",
        "name"
      );
    }

    if (
      typeof item.quantity !== "number" ||
      Number.isNaN(item.quantity) ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new EngineValidationError(
        `Item "${itemName}" quantity must be a positive number, got: ${item.quantity}`,
        "INVALID_QUANTITY",
        "quantity"
      );
    }

    if (
      typeof item.unitPrice !== "number" ||
      Number.isNaN(item.unitPrice) ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0
    ) {
      throw new EngineValidationError(
        `Item "${itemName}" unit price must be a non-negative number, got: ${item.unitPrice}`,
        "INVALID_UNIT_PRICE",
        "unitPrice"
      );
    }

    if (!rules.supportedRates.includes(item.rate)) {
      throw new GstCalculationError(
        `Item "${itemName}" has unsupported GST rate: ${item.rate}%. Allowed rates: ${rules.supportedRates.join(", ")}%`,
        "UNSUPPORTED_GST_RATE",
        item.rate
      );
    }

    let discountRupees = 0;
    if (item.discountType === "percent" && typeof item.discountValue === "number") {
      discountRupees = (item.quantity * item.unitPrice * item.discountValue) / 100;
    } else if (typeof item.discount === "number") {
      discountRupees = item.discount;
    } else if (item.discountType === "amount" && typeof item.discountValue === "number") {
      discountRupees = item.discountValue;
    }

    if (discountRupees < 0) {
      throw new EngineValidationError(
        `Item "${itemName}" discount cannot be negative`,
        "INVALID_DISCOUNT",
        "discount"
      );
    }

    const unitPricePaise = rupeesToPaise(item.unitPrice);
    const discountPaise = rupeesToPaise(discountRupees);
    const grossLinePaise = roundHalfUp(item.quantity * unitPricePaise);

    let taxablePaise: number;
    let lineGstPaise: number;
    let totalLinePaise: number;

    if (isBillOfSupply) {
      taxablePaise = Math.max(0, grossLinePaise - discountPaise);
      lineGstPaise = 0;
      totalLinePaise = taxablePaise;
    } else if (priceIncludesGst) {
      totalLinePaise = Math.max(0, grossLinePaise - discountPaise);
      taxablePaise = roundHalfUp((totalLinePaise * 100) / (100 + item.rate));
      lineGstPaise = totalLinePaise - taxablePaise;
    } else {
      taxablePaise = Math.max(0, grossLinePaise - discountPaise);
      lineGstPaise = roundHalfUp((taxablePaise * item.rate) / 100);
      totalLinePaise = taxablePaise + lineGstPaise;
    }

    let lineCgstPaise = 0;
    let lineSgstPaise = 0;
    let lineIgstPaise = 0;

    if (!isBillOfSupply) {
      if (isIntra) {
        lineCgstPaise = Math.floor(lineGstPaise / 2);
        lineSgstPaise = lineGstPaise - lineCgstPaise;
      } else {
        lineIgstPaise = lineGstPaise;
      }
    }

    subtotalPaise += taxablePaise;
    totalCgstPaise += lineCgstPaise;
    totalSgstPaise += lineSgstPaise;
    totalIgstPaise += lineIgstPaise;

    lineResults.push({
      name: itemName,
      description: itemName,
      hsnOrSac: item.hsnOrSac,
      quantity: item.quantity,
      unit: item.unit || "NOS",
      unitPrice: item.unitPrice,
      discount: paiseToRupees(discountPaise),
      taxableValue: paiseToRupees(taxablePaise),
      rate: isBillOfSupply ? 0 : item.rate,
      gstAmount: paiseToRupees(lineGstPaise),
      cgst: paiseToRupees(lineCgstPaise),
      sgst: paiseToRupees(lineSgstPaise),
      igst: paiseToRupees(lineIgstPaise),
      total: paiseToRupees(totalLinePaise),
    });

    // Update tax summary group
    const summaryRate = isBillOfSupply ? 0 : item.rate;
    const summary = taxSummaryMap.get(summaryRate) || {
      taxablePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalGstPaise: 0,
    };
    summary.taxablePaise += taxablePaise;
    summary.cgstPaise += lineCgstPaise;
    summary.sgstPaise += lineSgstPaise;
    summary.igstPaise += lineIgstPaise;
    summary.totalGstPaise += lineGstPaise;
    taxSummaryMap.set(summaryRate, summary);
  }

  const taxSummary: InvoiceTaxSummaryItem[] = Array.from(
    taxSummaryMap.entries()
  )
    .sort(([rateA], [rateB]) => rateA - rateB)
    .map(([rate, s]) => ({
      rate,
      taxableAmount: paiseToRupees(s.taxablePaise),
      cgst: paiseToRupees(s.cgstPaise),
      sgst: paiseToRupees(s.sgstPaise),
      igst: paiseToRupees(s.igstPaise),
      totalGst: paiseToRupees(s.totalGstPaise),
    }));

  const totalGstPaise = totalCgstPaise + totalSgstPaise + totalIgstPaise;
  const totalBeforeRoundOffPaise = subtotalPaise + totalGstPaise;

  // Round-off to the nearest integer rupee
  const nearestRupeePaise = roundHalfUp(totalBeforeRoundOffPaise / 100) * 100;
  const roundOffPaise = nearestRupeePaise - totalBeforeRoundOffPaise;
  const grandTotalPaise = nearestRupeePaise;
  const grandTotalRupees = grandTotalPaise / 100;

  return {
    items: lineResults,
    taxSummary,
    subtotal: paiseToRupees(subtotalPaise),
    totalCgst: paiseToRupees(totalCgstPaise),
    totalSgst: paiseToRupees(totalSgstPaise),
    totalIgst: paiseToRupees(totalIgstPaise),
    totalGst: paiseToRupees(totalGstPaise),
    totalBeforeRoundOff: paiseToRupees(totalBeforeRoundOffPaise),
    roundOff: paiseToRupees(roundOffPaise),
    grandTotal: grandTotalRupees,
    amountInWords: amountInWords(grandTotalRupees),
    supplyType,
    documentType: input.documentType || "tax_invoice",
  };
}
