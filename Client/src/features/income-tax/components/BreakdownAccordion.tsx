import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { RegimeResult, TaxStep } from "../types";
import { formatINR } from "../utils/formatINR";
import SlabTable from "./SlabTable";
import { ChevronDown, ChevronUp, Layers, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakdownAccordionProps {
  newRegime: RegimeResult;
  oldRegime: RegimeResult;
  className?: string;
}

export const BreakdownAccordion: React.FC<BreakdownAccordionProps> = ({
  newRegime,
  oldRegime,
  className = "",
}) => {
  const { t } = useTranslation();
  const [openRegime, setOpenRegime] = useState<"new" | "old" | "none">("new");

  const toggleAccordion = (regime: "new" | "old") => {
    setOpenRegime((prev) => (prev === regime ? "none" : regime));
  };

  const renderStepsTimeline = (regime: RegimeResult) => {
    return (
      <div className="space-y-4">
        {/* Slabs Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("incomeTax.result.slabBreakdownTitle", "Tax Slab Calculation")}
          </h4>
          <SlabTable slabs={regime.slabBreakdown} />
        </div>

        {/* Engine Steps as Vertical Timeline */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("incomeTax.result.calculationStepsTitle", "Calculation Sequence")}
          </h4>
          <ol className="relative border-l border-indigo-200 dark:border-indigo-900/60 ml-3 space-y-3.5 text-xs">
            {regime.steps.map((step, idx) => {
              const stepTitle = t(step.stepKey, {
                ...step.descriptionParams,
                defaultValue: step.stepKey.split(".").pop(),
              });

              return (
                <li key={idx} className="ml-5">
                  <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {stepTitle}
                    </span>
                    <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatINR(step.value, { prefixSymbol: true })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-500" />
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
          {t("incomeTax.result.howWeCalculated", "How We Calculated This")}
        </h3>
      </div>

      <div className="space-y-3">
        {/* New Regime Accordion Item */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleAccordion("new")}
            aria-expanded={openRegime === "new"}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {t("incomeTax.result.newAccordionTitle", "New Regime Calculation Breakdown")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatINR(newRegime.totalTax, { prefixSymbol: true })}
              </span>
              {openRegime === "new" ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {openRegime === "new" && (
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
              {renderStepsTimeline(newRegime)}
            </div>
          )}
        </div>

        {/* Old Regime Accordion Item */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleAccordion("old")}
            aria-expanded={openRegime === "old"}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {t("incomeTax.result.oldAccordionTitle", "Old Regime Calculation Breakdown")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-sm text-sky-600 dark:text-sky-400 tabular-nums">
                {formatINR(oldRegime.totalTax, { prefixSymbol: true })}
              </span>
              {openRegime === "old" ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {openRegime === "old" && (
            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
              {renderStepsTimeline(oldRegime)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreakdownAccordion;
