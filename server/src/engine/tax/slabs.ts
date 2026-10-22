import { EngineValidationError } from "../shared/errors";
import { roundHalfUp } from "../shared/rounding";
import { TaxSlabRule, SlabBreakdownItem } from "./types";

export interface SlabTaxCalculationResult {
  totalTax: number;
  breakdown: SlabBreakdownItem[];
}

/**
 * Pure slab tax calculator.
 * Iterates through sequential slabs, treating `upTo: null` as infinity.
 * Uses integer whole rupees and roundHalfUp for intermediate slab tax.
 */
export function calculateSlabTax(
  taxableIncome: number,
  slabs: TaxSlabRule[]
): SlabTaxCalculationResult {
  if (
    typeof taxableIncome !== "number" ||
    Number.isNaN(taxableIncome) ||
    !Number.isFinite(taxableIncome)
  ) {
    throw new EngineValidationError(
      `Taxable income must be a valid finite number, got: ${taxableIncome}`,
      "INVALID_TAXABLE_INCOME",
      "taxableIncome"
    );
  }

  if (taxableIncome < 0) {
    throw new EngineValidationError(
      `Taxable income cannot be negative, got: ${taxableIncome}`,
      "NEGATIVE_TAXABLE_INCOME",
      "taxableIncome"
    );
  }

  if (!Array.isArray(slabs) || slabs.length === 0) {
    throw new EngineValidationError(
      "Slabs must be a non-empty array of tax slab rules",
      "INVALID_SLABS"
    );
  }

  let totalTax = 0;
  let previousUpTo = 0;
  const breakdown: SlabBreakdownItem[] = [];

  for (const slab of slabs) {
    const from = previousUpTo;
    const upTo = slab.upTo;

    let taxableAmountInSlab = 0;
    let slabTax = 0;

    if (taxableIncome > from) {
      if (upTo === null) {
        taxableAmountInSlab = taxableIncome - from;
      } else {
        const slabCeiling = Math.min(taxableIncome, upTo);
        taxableAmountInSlab = Math.max(0, slabCeiling - from);
      }

      slabTax = roundHalfUp((taxableAmountInSlab * slab.rate) / 100);
      totalTax += slabTax;
    }

    breakdown.push({
      from,
      upTo,
      rate: slab.rate,
      taxableAmount: taxableAmountInSlab,
      tax: slabTax,
    });

    if (upTo === null) {
      break;
    }
    previousUpTo = upTo;
  }

  return {
    totalTax,
    breakdown,
  };
}
