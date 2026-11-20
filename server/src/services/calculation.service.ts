import {
  countUserCalculations,
  saveCalculation,
  listUserCalculations,
  findCalculationByIdAndUser,
  updateCalculationName,
  deleteCalculationByIdAndUser,
} from "../utils/localStore";
import { RulesService } from "./rules.service";
import { compareRegimes } from "../engine/tax/compare";
import { calculateGst } from "../engine/gst/calculate";
import { taxCalculateSchema, gstCalculateSchema } from "../validators/engine.validator";
import { SaveCalculationSchemaType, ListCalculationsQueryType } from "../validators/calculation.validator";

function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
}

export async function saveCalculationService(
  userId: string,
  body: SaveCalculationSchemaType
): Promise<any> {
  const count = await countUserCalculations(userId);
  if (count >= 100) {
    throw {
      statusCode: 400,
      code: "LIMIT_REACHED",
      message: "You have reached the maximum limit of 100 saved calculations. Please delete older calculations to save new ones.",
    };
  }

  const { type, inputs } = body;
  const taxYear = body.taxYear || inputs.taxYear || "2026-27";

  let resultSnapshot: any;
  let summary: any;
  let rulesVersion = "2026-27-v1";
  let generatedName = body.name?.trim();

  if (type === "income_tax") {
    // Normalize ageGroup
    let ageGroup = inputs.ageGroup || "below60";
    if (ageGroup === "general") ageGroup = "below60";
    if (ageGroup === "senior60to79") ageGroup = "senior";
    if (ageGroup === "superSenior80plus") ageGroup = "superSenior";

    // 1. Re-validate inputs through engine Zod schema
    const validatedInputs = taxCalculateSchema.parse({
      ...inputs,
      ageGroup,
      taxYear,
    });

    // 2. Fetch current active rules for the requested tax year
    const rules = await RulesService.getRulesForYear(taxYear);
    if (!rules) {
      throw {
        statusCode: 404,
        code: "TAX_YEAR_NOT_FOUND",
        message: `Tax rules for year ${taxYear} not found.`,
      };
    }
    rulesVersion = rules.taxYear;

    // 3. Server-side recomputation with pure statutory engine
    const comparison = compareRegimes(validatedInputs, rules);
    resultSnapshot = comparison;

    // Gross income calculation
    const grossIncome =
      Number(validatedInputs.salaryIncome || 0) +
      Number(validatedInputs.otherIncome || 0);

    const bestTax =
      comparison.recommended === "new"
        ? comparison.newRegime.totalTax
        : comparison.oldRegime.totalTax;

    const otherTax =
      comparison.recommended === "new"
        ? comparison.oldRegime.totalTax
        : comparison.newRegime.totalTax;

    summary = {
      grossIncome,
      recommendedRegime: comparison.recommended,
      bestTax,
      otherTax,
      savings: comparison.savings,
    };

    if (!generatedName) {
      generatedName = `Income Tax FY ${taxYear} - ₹${formatIndianNumber(grossIncome)}`;
    }
  } else if (type === "gst") {
    // Normalize mode and state
    let mode = inputs.mode || "add";
    if (mode === "exclusive") mode = "add";
    if (mode === "inclusive") mode = "remove";

    const sellerState = inputs.sellerState || "27-Maharashtra";
    const buyerState = inputs.buyerState || (inputs.sameState ? sellerState : "27-Maharashtra");

    // 1. Re-validate inputs through engine Zod schema
    const validatedInputs = gstCalculateSchema.parse({
      ...inputs,
      mode,
      sellerState,
      buyerState,
      taxYear,
    });

    const rules = await RulesService.getRulesForYear(taxYear);
    const gstRules = rules?.gst || {
      supportedRates: [0, 5, 18, 40],
      defaultRate: 18,
    };

    // 2. Server-side recomputation with pure GST engine
    const gstResult = calculateGst(validatedInputs, gstRules);
    resultSnapshot = gstResult;

    summary = {
      amount: validatedInputs.amount,
      rate: gstResult.rate,
      mode: validatedInputs.mode,
      gstAmount: gstResult.gstAmount,
      total: gstResult.total,
    };

    if (!generatedName) {
      generatedName = `GST ${gstResult.rate}% - ₹${formatIndianNumber(validatedInputs.amount)}`;
    }

  } else {
    throw {
      statusCode: 400,
      code: "INVALID_CALCULATION_TYPE",
      message: "Unsupported calculation type.",
    };
  }

  const record = await saveCalculation({
    userId,
    type,
    taxYear,
    name: generatedName,
    inputs,
    result: resultSnapshot,
    rulesVersion,
    summary,
  });

  return record;
}

export async function listCalculationsService(
  userId: string,
  query: ListCalculationsQueryType
): Promise<any> {
  const result = await listUserCalculations(userId, query);
  return {
    ...result,
    pagination: {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    },
  };
}

export async function getCalculationByIdService(
  id: string,
  userId: string
): Promise<any> {
  const calc = await findCalculationByIdAndUser(id, userId);
  if (!calc) {
    // Security: Return 404, not 403, for other users' records (IDOR protection)
    throw {
      statusCode: 404,
      code: "CALCULATION_NOT_FOUND",
      message: "Calculation not found.",
    };
  }
  return calc;
}

export async function renameCalculationService(
  id: string,
  userId: string,
  name: string
): Promise<any> {
  const updated = await updateCalculationName(id, userId, name);
  if (!updated) {
    throw {
      statusCode: 404,
      code: "CALCULATION_NOT_FOUND",
      message: "Calculation not found.",
    };
  }
  return updated;
}

export async function deleteCalculationService(
  id: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const deleted = await deleteCalculationByIdAndUser(id, userId);
  if (!deleted) {
    throw {
      statusCode: 404,
      code: "CALCULATION_NOT_FOUND",
      message: "Calculation not found.",
    };
  }
  return {
    success: true,
    message: "Calculation deleted successfully.",
  };
}

export async function recalculateService(
  id: string,
  userId: string
): Promise<any> {
  const saved = await findCalculationByIdAndUser(id, userId);
  if (!saved) {
    throw {
      statusCode: 404,
      code: "CALCULATION_NOT_FOUND",
      message: "Calculation not found.",
    };
  }

  let currentResult: any;
  let rulesChanged = false;

  if (saved.type === "income_tax") {
    const rules = await RulesService.getRulesForYear(saved.taxYear);
    if (!rules) {
      throw {
        statusCode: 404,
        code: "TAX_YEAR_NOT_FOUND",
        message: `Tax rules for year ${saved.taxYear} not found.`,
      };
    }
    const validatedInputs = taxCalculateSchema.parse({
      ...saved.inputs,
      taxYear: saved.taxYear,
    });
    currentResult = compareRegimes(validatedInputs, rules);

    const oldTax =
      saved.result?.recommended === "new"
        ? saved.result?.newRegime?.totalTax
        : saved.result?.oldRegime?.totalTax;
    const newTax =
      currentResult.recommended === "new"
        ? currentResult.newRegime?.totalTax
        : currentResult.oldRegime?.totalTax;

    rulesChanged = oldTax !== newTax || saved.rulesVersion !== rules.taxYear;
  } else {
    const validatedInputs = gstCalculateSchema.parse(saved.inputs);
    const rules = await RulesService.getRulesForYear(saved.taxYear);
    const gstRules = rules?.gst || {
      supportedRates: [0, 5, 18, 40],
      defaultRate: 18,
    };
    currentResult = calculateGst(validatedInputs, gstRules);
    rulesChanged = saved.result?.total !== currentResult.total;
  }

  return {
    calculationId: id,
    savedResult: saved.result,
    currentResult,
    original: saved.result,
    current: currentResult,
    rulesChanged,
    inputs: saved.inputs,
    name: saved.name,
    type: saved.type,
    taxYear: saved.taxYear,
  };
}
