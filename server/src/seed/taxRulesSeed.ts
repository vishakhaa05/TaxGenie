import fs from "fs";
import path from "path";
import TaxSlabConfigModel from "../models/tax-slab-config.model";

/**
 * FY 2026-27 Seed Loader
 * WARNING: These parameters must be re-verified on incometax.gov.in and gst.gov.in before official launch.
 */
export async function seedTaxRules() {
  const seedFilePath = path.join(__dirname, "taxRulesFY2026_27.json");
  const rawData = fs.readFileSync(seedFilePath, "utf-8");
  const seedData = JSON.parse(rawData);

  const existing = await TaxSlabConfigModel.findOne({
    financialYear: seedData.financialYear,
  });

  if (!existing) {
    await TaxSlabConfigModel.create({
      financialYear: seedData.financialYear,
      assessmentYear: seedData.assessmentYear,
      newRegime: {
        standardDeduction: seedData.newRegime.standardDeduction,
        rebateMaxIncome: seedData.newRegime.rebateMaxIncome,
        rebateAmount: seedData.newRegime.rebateAmount,
        slabs: seedData.newRegime.slabs.map((s: any) => ({
          minIncome: s.minIncome,
          maxIncome: s.maxIncome,
          rate: s.rate,
        })),
      },
      oldRegime: {
        standardDeduction: seedData.oldRegime.standardDeduction,
        max80C: seedData.oldRegime.deductionLimits.sec80C,
        slabs: seedData.oldRegime.slabsBelow60.map((s: any) => ({
          minIncome: s.minIncome,
          maxIncome: s.maxIncome,
          rate: s.rate,
        })),
      },
    });
    console.log(`[Seed] Seeded tax rules for ${seedData.financialYear}`);
  } else {
    console.log(`[Seed] Tax rules for ${seedData.financialYear} already present.`);
  }

  return seedData;
}

export default seedTaxRules;
