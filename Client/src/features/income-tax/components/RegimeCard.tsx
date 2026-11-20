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
  const title = isNew ? "New regime" : "Old regime";

  // Compute monthly equivalent
  const taxPerMonth = Math.round(result.totalTax / 12);

  return (
    <div
      className={cn(
        "rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between shadow-xs",
        isNew
          ? "bg-[#E6F5EE] dark:bg-[#132B23] border-[#A7F3D0] dark:border-[#1E4638] text-[#064E3B] dark:text-[#34D399]"
          : "bg-[#FEE2E2] dark:bg-[#2B1518] border-[#FECDD3] dark:border-[#4A1E24] text-[#991B1B] dark:text-[#F87171]",
        className
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full",
              isRecommended
                ? "bg-[#0B3B2C] dark:bg-[#10B981] text-white"
                : "bg-white/80 dark:bg-black/30 text-current border border-current/20"
            )}
          >
            {isRecommended ? "Recommended ✓" : "Alternative Option"}
          </span>

          <span className="text-[11px] font-semibold opacity-75">
            {isNew ? "FY 2026-27 (New Rules)" : "Old Tax Regime"}
          </span>
        </div>

        <h3 className="text-xl font-black capitalize tracking-tight">
          {title}
        </h3>

        {/* Large Bold Total Tax */}
        <div className="my-4">
          <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">
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
          <span className="text-xs font-bold opacity-80 mt-1 block">
            {result.effectiveRate.toFixed(1)}% of your income
          </span>
        </div>

        {/* Metric Table Breakdown (Matching Screen 4 in Mockup) */}
        <div className="pt-3 border-t border-current/15 space-y-2 text-xs">
          <div className="flex justify-between items-center opacity-90">
            <span>Taxable income</span>
            <span className="font-bold">{formatINR(result.taxableIncome, { prefixSymbol: true })}</span>
          </div>
          <div className="flex justify-between items-center opacity-90">
            <span>Tax before rebate</span>
            <span className="font-bold">{formatINR(result.taxBeforeRebate, { prefixSymbol: true })}</span>
          </div>
          <div className="flex justify-between items-center opacity-90">
            <span>Rebate (u/s 87A)</span>
            <span className="font-bold">
              {result.rebate87A > 0 ? `-${formatINR(result.rebate87A, { prefixSymbol: true })}` : "₹0"}
            </span>
          </div>
          <div className="flex justify-between items-center opacity-90">
            <span>Cess (4%)</span>
            <span className="font-bold">{formatINR(result.cess, { prefixSymbol: true })}</span>
          </div>
          <div className="flex justify-between items-center opacity-90">
            <span>Effective rate</span>
            <span className="font-bold">{result.effectiveRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center opacity-90 pt-1 border-t border-current/10 font-bold">
            <span>Tax per month</span>
            <span>{formatINR(taxPerMonth, { prefixSymbol: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegimeCard;
