import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface RateChipsProps {
  rates: number[];
  selectedRate: number;
  onChange: (rate: number) => void;
  disabled?: boolean;
}

export const RateChips: React.FC<RateChipsProps> = ({
  rates = [0, 5, 18, 40],
  selectedRate,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    let nextIndex = index;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (index + 1) % rates.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (index - 1 + rates.length) % rates.length;
    }

    if (nextIndex !== index) {
      const nextRate = rates[nextIndex];
      if (nextRate !== undefined) {
        onChange(nextRate);
        chipRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label={t("gst.rateLabel", "GST Rate")}
        className="grid grid-cols-4 gap-2.5 sm:gap-3"
      >
        {rates.map((rate, index) => {
          const isSelected = selectedRate === rate;
          return (
            <button
              key={rate}
              ref={(el) => {
                chipRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(rate)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "flex flex-col items-center justify-center py-3 sm:py-3.5 px-2 rounded-xl border text-center transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isSelected
                  ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-base sm:text-lg font-bold tabular-nums">
                {rate}%
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                {rate === 0
                  ? t("gst.rateNil", "Nil / Exempt")
                  : rate === 18
                  ? t("gst.rateStandard", "Standard")
                  : rate === 40
                  ? t("gst.rateSpecial", "Special")
                  : t("gst.rateTier", "Concessional")}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 px-0.5 leading-relaxed">
        {t(
          "gst.rateHint",
          "Most goods and services use 5% or 18%. Check the rate for your item below."
        )}
      </p>
    </div>
  );
};

export default RateChips;
