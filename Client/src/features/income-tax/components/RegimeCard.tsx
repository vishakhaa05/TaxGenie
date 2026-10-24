import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CountUp from "react-countup";
import { RegimeResult } from "../types";
import { formatINR } from "../utils/formatINR";
import { CheckCircle2, TrendingDown, Percent, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegimeCardProps {
  result: RegimeResult;
  isRecommended: boolean;
  className?: string;
}

export const RegimeCard: React.FC<RegimeCardProps> = ({
  result,
  isRecommended,
  className = "",
}) => {
  const { t } = useTranslation();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const isNew = result.regime === "new";
  const title = isNew
    ? t("incomeTax.result.newRegimeTitle", "New Tax Regime (Section 115BAC)")
    : t("incomeTax.result.oldRegimeTitle", "Old Tax Regime");

  return (
    <div
      className={cn(
        "relative rounded-3xl p-5 sm:p-7 border transition-all duration-300 flex flex-col justify-between shadow-xs",
        isRecommended
          ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
          : "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800",
        className
      )}
    >
      <div>
        {/* Recommended Badge / Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full",
              isRecommended
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            )}
          >
            {isRecommended
              ? t("incomeTax.result.recommendedBadge", "Recommended ✓")
              : t("incomeTax.result.alternativeBadge", "Alternative Option")}
          </span>

          <span className="text-[11px] font-semibold text-slate-400">
            {isNew ? "Budget 2025" : "Chapter VI-A"}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isNew
            ? t("incomeTax.result.newSub", "Standard deduction ₹75,000 + 87A rebate")
            : t("incomeTax.result.oldSub", "Itemized deductions 80C, 80D, HRA & 87A rebate")}
        </p>

        {/* Large Bold Total Tax */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center sm:text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t("incomeTax.result.totalTaxLabel", "Total Tax Payable")}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 tabular-nums">
            {prefersReducedMotion ? (
              formatINR(result.totalTax, { prefixSymbol: true })
            ) : (
              <span>
                ₹
                <CountUp
                  end={result.totalTax}
                  duration={1.2}
                  separator=","
                  formattingFn={(val) => formatINR(val)}
                />
              </span>
            )}
          </div>

          {/* Effective Rate and Monthly Equivalent */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {t("incomeTax.result.effectiveRate", "Effective rate")}:{" "}
                <strong className="text-slate-900 dark:text-slate-100">
                  {result.effectiveRatePercent}%
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {t("incomeTax.result.monthlyRate", "Monthly")}:{" "}
                <strong className="text-slate-900 dark:text-slate-100">
                  {formatINR(result.monthlyTax, { prefixSymbol: true })}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Breakdown Table */}
        <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex justify-between items-center py-1.5 text-slate-600 dark:text-slate-400">
            <span>{t("incomeTax.result.grossIncome", "Gross Total Income")}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatINR(result.grossIncome, { prefixSymbol: true })}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 text-slate-600 dark:text-slate-400">
            <span>{t("incomeTax.result.stdDeduction", "Standard Deduction")}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              -{formatINR(result.standardDeductionApplied, { prefixSymbol: true })}
            </span>
          </div>

          {!isNew && (
            <div className="flex justify-between items-center py-1.5 text-slate-600 dark:text-slate-400">
              <span>{t("incomeTax.result.chapterVIA", "Chapter VI-A Deductions")}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                -
                {formatINR(
                  Object.values(result.deductionsApplied || {}).reduce((a, b) => a + b, 0),
                  { prefixSymbol: true }
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-1.5 font-bold text-slate-900 dark:text-slate-100">
            <span>{t("incomeTax.result.taxableIncome", "Net Taxable Income")}</span>
            <span className="tabular-nums">
              {formatINR(result.taxableIncome, { prefixSymbol: true })}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 text-slate-600 dark:text-slate-400">
            <span>{t("incomeTax.result.taxBeforeRebate", "Tax Computed (Slabs)")}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatINR(result.taxBeforeRebate, { prefixSymbol: true })}
            </span>
          </div>

          {result.rebateApplied > 0 && (
            <div className="flex justify-between items-center py-1.5 text-slate-600 dark:text-slate-400">
              <span>{t("incomeTax.result.rebate87A", "Rebate u/s 87A")}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                -{formatINR(result.rebateApplied, { prefixSymbol: true })}
              </span>
            </div>
          )}

          {result.marginalReliefApplied > 0 && (
            <div className="flex justify-between items-center py-1.5 text-slate-600 dark:text-slate-400">
              <span>{t("incomeTax.result.marginalRelief", "Marginal Relief Adjustment")}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                -{formatINR(result.marginalReliefApplied, { prefixSymbol: true })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-1.5 text-slate-600 dark:text-slate-400">
            <span>{t("incomeTax.result.cess", "Health & Education Cess (4%)")}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              +{formatINR(result.cess, { prefixSymbol: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegimeCard;
