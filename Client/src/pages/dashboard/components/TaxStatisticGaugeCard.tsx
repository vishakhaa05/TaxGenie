import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { formatRupeesINR } from "@/features/gst/utils/money";

interface TaxStatisticGaugeCardProps {
  savings: number;
  grossIncome: number;
  newTax: number;
  oldTax: number;
  deductions: number;
  isSample?: boolean;
}

export const TaxStatisticGaugeCard: React.FC<TaxStatisticGaugeCardProps> = ({
  savings,
  grossIncome,
  newTax,
  oldTax,
  deductions,
  isSample,
}) => {
  const { t } = useTranslation();

  // Percentage calculations for gauge arcs
  const p1 = Math.min(100, Math.max(20, (grossIncome > 0 ? (grossIncome / 2500000) * 100 : 75)));
  const p2 = Math.min(100, Math.max(15, (deductions > 0 ? (deductions / 400000) * 100 : 60)));
  const p3 = Math.min(100, Math.max(10, (oldTax > 0 ? (oldTax / 500000) * 100 : 45)));
  const p4 = Math.min(100, Math.max(10, (savings > 0 ? (savings / 200000) * 100 : 80)));

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-[#16192E] text-white border border-[#23274A] shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 relative z-10">
        <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300">
          {t("dashboard.productStatistic", "PRODUCT STATISTIC / TAX SAVINGS")}
        </h3>
        {isSample && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Sample Baseline
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto py-2 relative z-10">
        {/* Left: Concentric Racetrack Horseshoe Gauge Arcs */}
        <div className="md:col-span-7 flex justify-center md:justify-start">
          <svg
            viewBox="0 0 240 140"
            className="w-full max-w-[240px] h-auto drop-shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            {/* Track 1: Outer Cyan (Gross Income) */}
            <path
              d="M 200,20 L 70,20 A 50,50 0 0 0 70,120 L 200,120"
              fill="none"
              stroke="#1F2449"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 200,20 L 70,20 A 50,50 0 0 0 70,120 L 190,120"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="340"
              strokeDashoffset={340 - (340 * (p1 / 100))}
              className="transition-all duration-1000 ease-out"
            />
            <circle cx="200" cy="20" r="5" fill="#06B6D4" />
            <circle cx="190" cy="120" r="5" fill="#06B6D4" />

            {/* Track 2: Yellow/Gold (Deductions) */}
            <path
              d="M 185,36 L 70,36 A 34,34 0 0 0 70,104 L 185,104"
              fill="none"
              stroke="#1F2449"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 185,36 L 70,36 A 34,34 0 0 0 70,104 L 175,104"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="260"
              strokeDashoffset={260 - (260 * (p2 / 100))}
              className="transition-all duration-1000 ease-out"
            />
            <circle cx="185" cy="36" r="5" fill="#FBBF24" />
            <circle cx="175" cy="104" r="5" fill="#FBBF24" />

            {/* Track 3: Coral/Pink (Tax Payable) */}
            <path
              d="M 170,52 L 70,52 A 18,18 0 0 0 70,88 L 170,88"
              fill="none"
              stroke="#1F2449"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 170,52 L 70,52 A 18,18 0 0 0 70,88 L 155,88"
              fill="none"
              stroke="#F43F5E"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="180"
              strokeDashoffset={180 - (180 * (p3 / 100))}
              className="transition-all duration-1000 ease-out"
            />
            <circle cx="170" cy="52" r="5" fill="#F43F5E" />
            <circle cx="155" cy="88" r="5" fill="#F43F5E" />

            {/* Track 4: Inner Indigo/Purple (Net Savings) */}
            <path
              d="M 155,68 L 70,68 A 2,2 0 0 0 70,72 L 155,72"
              fill="none"
              stroke="#6366F1"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle cx="155" cy="70" r="4.5" fill="#818CF8" />

            {/* Track End Labels A, B, C, D */}
            <text x="212" y="24" fill="#94A3B8" fontSize="10" fontWeight="bold">A</text>
            <text x="198" y="40" fill="#94A3B8" fontSize="10" fontWeight="bold">B</text>
            <text x="182" y="56" fill="#94A3B8" fontSize="10" fontWeight="bold">C</text>
            <text x="168" y="73" fill="#94A3B8" fontSize="10" fontWeight="bold">D</text>
          </svg>
        </div>

        {/* Right: Metrics & Badges */}
        <div className="md:col-span-5 space-y-3 text-left">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {formatRupeesINR(savings || 112500)}
              </span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                <span>+18%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tax saved under FY 2026-27 optimized regime
            </p>
          </div>

          {/* Metric Dots */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="text-slate-300 font-medium">New: {formatRupeesINR(newTax || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-300 font-medium">Old: {formatRupeesINR(oldTax || 112500)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-slate-300 font-medium">80C: {formatRupeesINR(deductions || 150000)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-slate-300 font-medium">Rebate: ₹60,000</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#23274A] text-[11px] text-slate-400">
        Section 87A rebate of ₹60,000 makes income up to ₹12 Lakh zero tax under New Regime.
      </div>
    </div>
  );
};

export default TaxStatisticGaugeCard;
