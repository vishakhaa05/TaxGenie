import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WizardProvider, useWizard, WizardContext } from "@/features/income-tax/context/WizardContext";
import HighlightBanner from "@/features/income-tax/components/HighlightBanner";
import RegimeCard from "@/features/income-tax/components/RegimeCard";
import BreakdownAccordion from "@/features/income-tax/components/BreakdownAccordion";
import ComparisonChart from "@/features/income-tax/components/ComparisonChart";
import BreakEvenCard from "@/features/income-tax/components/BreakEvenCard";
import WarningCallout from "@/features/income-tax/components/WarningCallout";
import ActionModals from "@/features/income-tax/components/ActionModals";
import { Calculator, ArrowRight, RotateCcw } from "lucide-react";

const ResultContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { result, goToStep, resetWizard } = useWizard();

  // If no result exists in context or sessionStorage, show friendly prompt to start calculation
  if (!result) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <Calculator className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("incomeTax.result.noResultTitle", "No Calculation Found Yet")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t(
              "incomeTax.result.noResultDesc",
              "Enter your income details in the 2-minute tax calculator to compare New vs Old tax regimes."
            )}
          </p>
        </div>
        <Link
          to="/income-tax"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <span>{t("incomeTax.result.startCalculationBtn", "Start Free Calculation")}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </Link>
      </div>
    );
  }

  const { newRegime, oldRegime, recommended, savings, breakEven } = result;

  const isNewRecommended = recommended === "new";
  const isOldRecommended = recommended === "old";

  // Combine warnings from both regimes
  const allWarnings = [...(newRegime.warnings || []), ...(oldRegime.warnings || [])];

  const handleEditAnswers = () => {
    navigate("/income-tax?step=2");
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Highlight Banner */}
      <HighlightBanner comparison={result} />

      {/* 2. Side-by-Side Regime Cards (Mobile stacks recommended first) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* On mobile, if Old is recommended, display Old first; otherwise New first */}
        <div className={isOldRecommended ? "order-2 md:order-1" : "order-1"}>
          <RegimeCard
            result={newRegime}
            isRecommended={isNewRecommended}
            className="h-full"
          />
        </div>

        <div className={isOldRecommended ? "order-1 md:order-2" : "order-2"}>
          <RegimeCard
            result={oldRegime}
            isRecommended={isOldRecommended}
            className="h-full"
          />
        </div>
      </div>

      {/* 3. Break-Even Deduction Hint (Only shown when New Regime wins & breakEven exists) */}
      <BreakEvenCard breakEven={breakEven} recommended={recommended} />

      {/* 4. Engine Warnings Callouts */}
      <WarningCallout warnings={allWarnings} />

      {/* 5. Comparison Chart */}
      <ComparisonChart newRegime={newRegime} oldRegime={oldRegime} />

      {/* 6. Expandable Breakdown Accordion ("How we calculated this") */}
      <BreakdownAccordion newRegime={newRegime} oldRegime={oldRegime} />

      {/* 7. Action Buttons & Disclaimer */}
      <ActionModals onEditAnswers={handleEditAnswers} onStartOver={resetWizard} />
    </div>
  );
};

export const ResultPage: React.FC = () => {
  const existing = React.useContext(WizardContext);
  if (existing) {
    return <ResultContent />;
  }
  return (
    <WizardProvider>
      <ResultContent />
    </WizardProvider>
  );
};

export default ResultPage;
