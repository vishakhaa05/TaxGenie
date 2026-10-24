import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { WizardProvider, useWizard, WizardContext } from "@/features/income-tax/context/WizardContext";
import Stepper from "@/components/ui/Stepper";
import AgeStep from "@/features/income-tax/steps/AgeStep";
import IncomeStep from "@/features/income-tax/steps/IncomeStep";
import DeductionsStep from "@/features/income-tax/steps/DeductionsStep";
import LiveSummaryPanel from "@/features/income-tax/components/LiveSummaryPanel";
import { RotateCcw, AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const WizardContent: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentStep,
    goToStep,
    resetWizard,
    isLoadingRules,
    rulesError,
    retryFetchRules,
    isCalculating,
  } = useWizard();

  const stepperItems = [
    {
      id: 1,
      label: t("incomeTax.steps.age", "Age & Year"),
      description: t("incomeTax.steps.ageDesc", "Taxpayer profile"),
    },
    {
      id: 2,
      label: t("incomeTax.steps.income", "Income"),
      description: t("incomeTax.steps.incomeDesc", "Salary & other"),
    },
    {
      id: 3,
      label: t("incomeTax.steps.deductions", "Deductions"),
      description: t("incomeTax.steps.deductionsDesc", "Old regime saves"),
    },
    {
      id: 4,
      label: t("incomeTax.steps.result", "Result"),
      description: t("incomeTax.steps.resultDesc", "New vs Old"),
    },
  ];

  if (isLoadingRules) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-44 rounded-2xl md:col-span-2" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (rulesError) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t("incomeTax.rulesError.title", "Unable to Load Tax Rules")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {rulesError}
          </p>
        </div>
        <button
          type="button"
          onClick={retryFetchRules}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("common.retry", "Retry")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Top Header Bar with Reset link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {t("incomeTax.calculatorTitle", "Income Tax Calculator & Comparison")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "incomeTax.calculatorTagline",
              "Find out how much you pay under the New vs Old tax regimes for FY 2026-27 in under 2 minutes."
            )}
          </p>
        </div>

        {/* Start Over button */}
        <button
          type="button"
          onClick={resetWizard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("incomeTax.startOver", "Start over")}</span>
        </button>
      </div>

      {/* Stepper Component */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
        <Stepper
          steps={stepperItems}
          currentStep={currentStep}
          onStepClick={(id) => id < currentStep && goToStep(id)}
        />
      </div>

      {/* Main Content Grid: Wizard on Left (max-w), Summary on Right on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Wizard Main Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xs">
          {currentStep === 1 && <AgeStep />}
          {currentStep === 2 && <IncomeStep />}
          {currentStep === 3 && <DeductionsStep />}
        </div>

        {/* Desktop Sticky Summary Panel */}
        <div className="hidden lg:block lg:col-span-4 sticky top-6">
          <LiveSummaryPanel />
        </div>
      </div>
    </div>
  );
};

export const IncomeTaxPage: React.FC = () => {
  const existing = useContext(WizardContext);
  if (existing) {
    return <WizardContent />;
  }
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
};

export default IncomeTaxPage;
