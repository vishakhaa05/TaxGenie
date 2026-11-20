import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactReduxContext } from "react-redux";
import {
  Bookmark,
  Sparkles,
  Download,
  RotateCcw,
  Edit3,
  X,
  LogIn,
  Bot,
  ShieldAlert,
} from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";

import { useWizard } from "@/features/income-tax/context/WizardContext";
import { useAuth } from "@/auth/useAuth";
import { SaveDialog } from "@/features/calculations/SaveDialog";

interface ActionModalsProps {
  onEditAnswers: () => void;
  onStartOver: () => void;
  className?: string;
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  onEditAnswers,
  onStartOver,
  className = "",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formData, result } = useWizard();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const bestTax =
    result?.recommended === "new"
      ? result.newRegime.totalTax
      : result?.oldRegime?.totalTax;

  const grossIncome =
    (Number(formData.salaryAmount) || 0) + (Number(formData.otherIncome) || 0);

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };


  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Action Button Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onEditAnswers}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>{t("incomeTax.actions.editAnswers", "Edit answers")}</span>
          </button>

          <button
            type="button"
            onClick={onStartOver}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("incomeTax.actions.startOver", "Start over")}</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveClick}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98",
              savedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30"
            )}
          >
            <Bookmark className="w-4 h-4 text-indigo-500" />
            <span>
              {savedSuccess
                ? t("common.saved", "Saved ✓")
                : t("incomeTax.actions.save", "Save calculation")}
            </span>
          </button>

          {/* Ask AI button */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-sm shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t("incomeTax.actions.askAi", "Ask AI about this result")}</span>
          </button>

          {/* Download PDF button (Disabled with tooltip) */}
          <div className="relative inline-flex items-center">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 cursor-not-allowed opacity-75"
            >
              <Download className="w-4 h-4" />
              <span>{t("incomeTax.actions.downloadPdf", "Download PDF")}</span>
            </button>
            <div className="ml-1.5">
              <InfoTooltip content={t("common.comingSoon", "Coming soon in upcoming release")} />
            </div>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t("common.disclaimer", "Estimates only. Please consult a CA before filing.")}</span>
        </p>
      </div>

      {/* Real Save Dialog */}
      <SaveDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        type="income_tax"
        inputs={formData}
        taxYear={formData.taxYear || "2026-27"}
        summaryInfo={{
          grossIncome,
          bestTax,
          recommendedRegime: result?.recommended,
        }}
        onSaved={() => {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }}
      />


      {/* AI Advisor Modal (Phase 7 placeholder) */}
      {showAiModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("incomeTax.modals.aiTitle", "TaxGenie AI Advisor")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t(
                  "incomeTax.modals.aiSubtitle",
                  "Personalized AI tax advice and deduction optimization will arrive in Phase 7! You can also explore the AI Advisor tab in the sidebar."
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiModal(false);
                  navigate("/ai-advisor");
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("incomeTax.modals.openAdvisor", "Open AI Advisor")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionModals;
