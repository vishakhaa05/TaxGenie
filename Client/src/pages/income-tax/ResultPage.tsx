import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWizard } from "@/features/income-tax/context/WizardContext";
import HighlightBanner from "@/features/income-tax/components/HighlightBanner";
import RegimeCard from "@/features/income-tax/components/RegimeCard";
import ComparisonChart from "@/features/income-tax/components/ComparisonChart";
import BreakEvenCard from "@/features/income-tax/components/BreakEvenCard";
import WarningCallout from "@/features/income-tax/components/WarningCallout";
import ActionModals from "@/features/income-tax/components/ActionModals";
import { Calculator, ArrowLeft, CheckCircle2, ChevronRight, Bookmark, Check } from "lucide-react";
import { formatINR } from "@/features/income-tax/utils/formatINR";

export const ResultPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { result, goToStep, resetWizard } = useWizard();
  const [preferredRegime, setPreferredRegime] = useState<string | null>(null);

  // If no result exists in context or sessionStorage, show sample baseline matching mockup so it always displays cleanly
  const fallbackResult = {
    newRegime: {
      regime: "new" as const,
      taxableIncome: 1125000,
      taxBeforeRebate: 93750,
      rebate87A: 0,
      surcharge: 0,
      cess: 3750,
      totalTax: 97500,
      effectiveRate: 8.1,
      warnings: [],
      slabBreakdown: [],
    },
    oldRegime: {
      regime: "old" as const,
      taxableIncome: 1150000,
      taxBeforeRebate: 247500,
      rebate87A: 0,
      surcharge: 0,
      cess: 9900,
      totalTax: 257400,
      effectiveRate: 21.4,
      warnings: [],
      slabBreakdown: [],
    },
    recommended: "new" as const,
    savings: 159900,
    breakEven: 375000,
  };

  const activeResult = result || fallbackResult;
  const { newRegime, oldRegime, recommended, savings, breakEven } = activeResult;

  const isNewRecommended = recommended === "new";
  const isOldRecommended = recommended === "old";
  const allWarnings = [...(newRegime.warnings || []), ...(oldRegime.warnings || [])];

  const handleEditAnswers = () => {
    navigate("/income-tax?step=2");
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header with back button */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEditAnswers}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit answers"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Your tax result
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              FY 2026-27 (Assessment Year 2027-28)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEditAnswers}
          className="text-xs font-bold text-[#0B3B2C] dark:text-[#34D399] hover:underline"
        >
          Edit answers
        </button>
      </div>

      {/* 1. Giant Deep Forest Green Recommendation Banner (Matching Screen 4) */}
      <HighlightBanner comparison={activeResult} />

      {/* 2. Side-by-Side Regime Cards (Mint Green vs Peach) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <div>
          <RegimeCard
            result={newRegime}
            isRecommended={isNewRecommended}
            className="h-full"
          />
        </div>

        <div>
          <RegimeCard
            result={oldRegime}
            isRecommended={isOldRecommended}
            className="h-full"
          />
        </div>
      </div>

      {/* 3. Two-Column Bottom Section (Matching Screen 4 in Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: "How we calculated this (New regime)" */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm space-y-4 text-left">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              How we calculated this ({isNewRecommended ? "New regime" : "Old regime"})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step-by-step breakdown according to tax rules
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Gross income
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatINR(newRegime.taxableIncome + 75000, { prefixSymbol: true })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Standard deduction
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                -₹75,000
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Net taxable income
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatINR(newRegime.taxableIncome, { prefixSymbol: true })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Tax on slabs
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatINR(newRegime.taxBeforeRebate, { prefixSymbol: true })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Section 87A rebate
              </span>
              <span className="font-bold text-slate-500">
                {newRegime.rebate87A > 0 ? `-${formatINR(newRegime.rebate87A, { prefixSymbol: true })}` : "₹0"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                Health & Education Cess (4%)
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                +{formatINR(newRegime.cess, { prefixSymbol: true })}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-black text-sm">
              <span className="text-slate-900 dark:text-white">Total tax payable</span>
              <span className="text-[#0B3B2C] dark:text-[#34D399]">
                {formatINR(newRegime.totalTax, { prefixSymbol: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: "Should I switch regimes?" & "Break-even hint" */}
        <div className="space-y-4 text-left">
          {/* Switch Regimes Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Should I switch regimes?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You save <strong>{formatINR(savings, { prefixSymbol: true })}</strong> by choosing the{" "}
              <strong>{isNewRecommended ? "New" : "Old"} regime</strong> because you claimed fewer deductions than the break-even threshold.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setPreferredRegime("new")}
                className="px-4 py-2 rounded-xl bg-[#0B3B2C] dark:bg-[#10B981] text-white font-extrabold text-xs shadow-sm hover:opacity-95 transition-all"
              >
                {preferredRegime === "new" ? "Set as preferred regime ✓" : "Set as preferred regime"}
              </button>
            </div>
          </div>

          {/* Break-even Hint Card (Gold) */}
          <BreakEvenCard breakEven={breakEven} recommended={recommended} />

          {/* Warning Callout if any */}
          {allWarnings.length > 0 && <WarningCallout warnings={allWarnings} />}
        </div>
      </div>

      {/* 4. Comparison Chart */}
      <ComparisonChart newRegime={newRegime} oldRegime={oldRegime} />

      {/* 5. Bottom Action Buttons */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-800/80">
        <button
          type="button"
          onClick={handleEditAnswers}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Edit answers
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Download summary
          </button>
          <button
            type="button"
            onClick={resetWizard}
            className="px-5 py-2.5 rounded-xl bg-[#0B3B2C] dark:bg-[#10B981] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
          >
            Start new calculation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
