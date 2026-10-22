import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Filter, Calendar, Plus, Check, FileSpreadsheet } from "lucide-react";

interface ToolbarRowProps {
  activeTaxYear?: string;
  onTaxYearChange?: (year: string) => void;
}

export const ToolbarRow: React.FC<ToolbarRowProps> = ({
  activeTaxYear = "2026-2027",
  onTaxYearChange,
}) => {
  const { t } = useTranslation();
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedRegimeFilter, setSelectedRegimeFilter] = useState<string>("all");

  const taxYears = [
    { id: "2026-2027", label: "FY 2026-27 (AY 2027-28) - Budget 2025" },
    { id: "2025-2026", label: "FY 2025-26 (AY 2026-27)" },
    { id: "2024-2025", label: "FY 2024-25 (AY 2025-26)" },
  ];

  const currentYearObj = taxYears.find((y) => y.id === activeTaxYear) || taxYears[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
      {/* Left side: Filter & Year selector */}
      <div className="flex items-center gap-2.5">
        {/* Filter button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFilterDropdown(!showFilterDropdown);
              setShowYearDropdown(false);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>{t("common.filters")}</span>
            {selectedRegimeFilter !== "all" && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>

          {showFilterDropdown && (
            <div className="absolute left-0 mt-2 w-48 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-40 text-xs">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Filter by Regime
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegimeFilter("all");
                  setShowFilterDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left ${
                  selectedRegimeFilter === "all"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>All Calculations</span>
                {selectedRegimeFilter === "all" && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegimeFilter("new");
                  setShowFilterDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left ${
                  selectedRegimeFilter === "new"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>New Regime Only</span>
                {selectedRegimeFilter === "new" && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegimeFilter("old");
                  setShowFilterDropdown(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left ${
                  selectedRegimeFilter === "old"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>Old Regime Only</span>
                {selectedRegimeFilter === "old" && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Tax Year Selector (styled like date-range picker) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowFilterDropdown(false);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{currentYearObj.label.split(" - ")[0]}</span>
          </button>

          {showYearDropdown && (
            <div className="absolute left-0 mt-2 w-72 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-40 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Assessment Period
              </div>
              {taxYears.map((year) => (
                <button
                  key={year.id}
                  type="button"
                  onClick={() => {
                    onTaxYearChange?.(year.id);
                    setShowYearDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    activeTaxYear === year.id
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{year.label}</span>
                  {activeTaxYear === year.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        <Link
          to="/reports"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
          <span>Upload Statement CSV</span>
        </Link>

        <Link
          to="/tax-calculator"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t("common.newCalculation")}</span>
        </Link>
      </div>
    </div>
  );
};

export default ToolbarRow;
