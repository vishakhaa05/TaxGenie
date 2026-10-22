import { EngineValidationError, GstCalculationError } from "../shared/errors";
import { roundHalfUp } from "../shared/rounding";
import { paiseToRupees, rupeesToPaise } from "./money";
import { isSameState } from "./states";
import { CalculateGstInput, GstResult, GstRulesConfig, SupplyType } from "./types";

/**
 * Pure GST calculation engine.
 * Converts input amounts in Rupees into integer Paise immediately at the boundary.
 * All intermediate arithmetic operates on integers, guaranteeing zero floating-point imprecision.
 */
export function calculateGst(
  input: CalculateGstInput,
  rules: GstRulesConfig
): GstResult {
  const { amount, rate, mode, sellerState, buyerState } = input;

  if (
    typeof amount !== "number" ||
    Number.isNaN(amount) ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new EngineValidationError(
      `GST calculation amount must be a non-negative finite number, got: ${amount}`,
      "INVALID_AMOUNT",
      "amount"
    );
  }

  if (mode !== "add" && mode !== "remove") {
    throw new EngineValidationError(
      `GST mode must be either "add" or "remove", got: ${mode}`,
      "INVALID_MODE",
      "mode"
    );
  }

  if (!sellerState || typeof sellerState !== "string" || !sellerState.trim()) {
    throw new EngineValidationError(
      "Seller state is required for GST determination",
      "MISSING_SELLER_STATE",
      "sellerState"
    );
  }

  if (!buyerState || typeof buyerState !== "string" || !buyerState.trim()) {
    throw new EngineValidationError(
      "Buyer state is required for GST determination",
      "MISSING_BUYER_STATE",
      "buyerState"
    );
  }

  // Rate validation from rules
  if (!rules.supportedRates.includes(rate)) {
    throw new GstCalculationError(
      `GST rate ${rate}% is not supported in rules. Allowed rates: ${rules.supportedRates.join(", ")}%`,
      "UNSUPPORTED_GST_RATE",
      rate
    );
  }

  const amountPaise = rupeesToPaise(amount);

  let basePaise: number;
  let gstPaise: number;
  let totalPaise: number;

  if (mode === "add") {
    basePaise = amountPaise;
    gstPaise = roundHalfUp((basePaise * rate) / 100);
    totalPaise = basePaise + gstPaise;
  } else {
    // mode === "remove" (inclusive amount)
    totalPaise = amountPaise;
    basePaise = roundHalfUp((totalPaise * 100) / (100 + rate));
    gstPaise = totalPaise - basePaise;
  }

  // State determination (Intra vs Inter)
  const isIntra = isSameState(sellerState, buyerState);
  const supplyType: SupplyType = isIntra ? "intra" : "inter";

  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isIntra) {
    // If GST in paise is odd, floor half to CGST, remainder to SGST
    cgstPaise = Math.floor(gstPaise / 2);
    sgstPaise = gstPaise - cgstPaise;
  } else {
    igstPaise = gstPaise;
  }

  return {
    base: paiseToRupees(basePaise),
    gstAmount: paiseToRupees(gstPaise),
    cgst: paiseToRupees(cgstPaise),
    sgst: paiseToRupees(sgstPaise),
    igst: paiseToRupees(igstPaise),
    total: paiseToRupees(totalPaise),
    supplyType,
    rate,
    basePaise,
    gstPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalPaise,
  };
}
