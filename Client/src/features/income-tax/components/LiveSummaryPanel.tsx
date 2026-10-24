import React from "react";
import { useTranslation } from "react-i18next";
import { useWizard } from "../context/WizardContext";
import { formatINR } from "../utils/formatINR";
import { calculateHraExemption } from "../utils/calculateHraExemption";
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export const LiveSummaryPanel: React.FC = () => {
  const { t } = useTranslation();
  const { formData, effectiveAnnualSalary, activeRules } = useWizard();

  const totalOtherIncome = formData.otherIncome || 0;
  const grossTotal = effectiveAnnualSalary + totalOtherIncome;

  const standardDeductionNew = activeRules?.newRegime?.standardDeduction ?? 75000;
  const standardDeductionOld = activeRules?.oldRegime?.standardDeduction ?? 50000;

  const liveHra = formData.hasHra
    ? calculateHraExemption(
        {
          basicSalary: formData.hraBasicSalary || 0,
          hraReceived: formData.hraReceived || 0,
          rentPaid: formData.hraRentPaid || 0,
          isMetro: formData.hraIsMetro || false,
        },
        activeRules?.oldRegime?.hra
      )
    : 0;

  const totalDeductionsEntered =
    (formData.sec80C || 0) +
    (formData.sec80CCD1B || 0) +
    (formData.sec80D_selfFamily || 0) +
    (formData.sec80D_parents || 0) +
    (formData.homeLoanInterest || 0) +
    liveHra;

  const ageLabels = {
    below60: t("incomeTax.age.below60.title", "Below 60"),
    senior: t("incomeTax.age.senior.title", "60 to 79 (Senior)"),
    superSenior: t("incomeTax.age.superSenior.title", "80+ (Super Senior)"),
  };

  return (
    <aside
      aria-label="Summary so far"
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Calculator className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t("incomeTax.summary.title", "Your Summary So Far")}
          </h3>
          <p className="text-[11px] text-slate-400">
            {formData.taxYear} • {ageLabels[formData.ageGroup]}
          </p>
        </div>
      </div>

      {/* Figures Breakdown */}
      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>{t("incomeTax.summary.salaryIncome", "Gross Salary (Annual)")}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatINR(effectiveAnnualSalary, { prefixSymbol: true })}
          </span>
        </div>

        {totalOtherIncome > 0 && (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>{t("incomeTax.summary.otherIncome", "Other Income")}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatINR(totalOtherIncome, { prefixSymbol: true })}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center font-bold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>{t("incomeTax.summary.grossTotal", "Gross Total Income")}</span>
          <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">
            {formatINR(grossTotal, { prefixSymbol: true })}
          </span>
        </div>

        {/* Standard deduction callout */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Standard Deduction (New)</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              -{formatINR(Math.min(standardDeductionNew, effectiveAnnualSalary), { prefixSymbol: true })}
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Standard Deduction (Old)</span>
            <span className="font-semibold tabular-nums">
              -{formatINR(Math.min(standardDeductionOld, effectiveAnnualSalary), { prefixSymbol: true })}
            </span>
          </div>
        </div>

        {/* Deductions Claimed */}
        {totalDeductionsEntered > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>{t("incomeTax.summary.deductionsOld", "Total Old Regime Deductions")}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatINR(totalDeductionsEntered, { prefixSymbol: true })}
              </span>
            </div>
            {liveHra > 0 && (
              <p className="text-[10px] text-slate-400">
                Includes HRA Exemption: {formatINR(liveHra, { prefixSymbol: true })}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Budget 2025 Ready</span>
        </div>
        Tax rebate up to ₹12,00,000 in New Regime gives ₹0 tax for middle class earners.
      </div>
    </aside>
  );
};

export default LiveSummaryPanel;
