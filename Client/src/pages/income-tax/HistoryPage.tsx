import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTypedSelector } from "@/app/hook";
import { History, LogIn, Calculator, ArrowRight } from "lucide-react";

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const user = useTypedSelector((state) => state.auth.user);

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
        <History className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          {user
            ? t("incomeTax.history.noSavedTitle", "No Saved Calculations Yet")
            : t("incomeTax.history.loginTitle", "Login to See Saved Calculations")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {user
            ? t(
                "incomeTax.history.userDesc",
                "You haven't saved any tax calculations yet. Run a calculation and click 'Save' to track it here."
              )
            : t(
                "incomeTax.history.guestDesc",
                "Sign in to your TaxGenie account to view your calculation history, compare previous financial years, and access audit reports."
              )}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {!user && (
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{t("common.login", "Log In")}</span>
          </Link>
        )}

        <Link
          to="/income-tax"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <Calculator className="w-4 h-4 text-indigo-500" />
          <span>{t("incomeTax.history.newCalculation", "Calculate Now")}</span>
        </Link>
      </div>
    </div>
  );
};

export default HistoryPage;
