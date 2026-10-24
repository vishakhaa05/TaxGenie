import React from "react";
import { useTranslation } from "react-i18next";
import { ComparisonResult } from "../types";
import { formatINR } from "../utils/formatINR";
import { Sparkles, Trophy, CheckCircle2, Equal } from "lucide-react";
import { cn } from "@/lib/utils";

interface HighlightBannerProps {
  comparison: ComparisonResult;
}

export const HighlightBanner: React.FC<HighlightBannerProps> = ({ comparison }) => {
  const { t } = useTranslation();
  const { recommended, savings, newRegime, oldRegime } = comparison;

  const bothZero = newRegime.totalTax === 0 && oldRegime.totalTax === 0;

  if (bothZero) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
              {t("incomeTax.result.noTaxTitle", "Zero Tax to Pay Under Either Regime! 🎉")}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300/90 mt-0.5">
              {t(
                "incomeTax.result.noTaxSubtitle",
                "Your taxable income is fully covered by statutory deductions and Section 87A rebate."
              )}
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm shrink-0 self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4" />
          <span>₹0 Total Tax</span>
        </div>
      </div>
    );
  }

  const isNewBetter = recommended === "new";
  const isOldBetter = recommended === "old";
  const isSame = recommended === "same";

  const formattedSavings = formatINR(savings, { prefixSymbol: true });

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "p-5 sm:p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300",
        isSame
          ? "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
          : "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
      )}
    >
      <div className="flex items-start sm:items-center gap-3.5">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
            isSame
              ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {isSame ? <Equal className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
        </div>

        <div className="space-y-1">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">
            {isNewBetter &&
              t("incomeTax.result.saveWithNew", {
                savings: formattedSavings,
                defaultValue: `You save ${formattedSavings} with the New Regime`,
              })}
            {isOldBetter &&
              t("incomeTax.result.saveWithOld", {
                savings: formattedSavings,
                defaultValue: `You save ${formattedSavings} with the Old Regime`,
              })}
            {isSame &&
              t("incomeTax.result.bothSame", {
                defaultValue: "Both regimes result in the exact same tax liability",
              })}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 opacity-90">
            {isNewBetter &&
              t(
                "incomeTax.result.newExpl",
                "The New Regime offers wider slabs, higher standard deduction (₹75k), and full tax rebate up to ₹12 Lakhs."
              )}
            {isOldBetter &&
              t(
                "incomeTax.result.oldExpl",
                "Your eligible itemized deductions (80C, 80D, HRA, Home Loan) outweigh the lower rates of the New Regime."
              )}
            {isSame &&
              t(
                "incomeTax.result.sameExpl",
                "You can choose either regime based on your future deduction plans."
              )}
          </p>
        </div>
      </div>

      {!isSame && savings > 0 && (
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t("incomeTax.result.annualSavings", "Annual Tax Savings")}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
            {formattedSavings}
          </span>
        </div>
      )}
    </div>
  );
};

export default HighlightBanner;
