import React from "react";
import { useTranslation } from "react-i18next";
import { formatINR } from "../utils/formatINR";
import { Lightbulb, ArrowRight } from "lucide-react";

interface BreakEvenCardProps {
  breakEven: number | null;
  recommended: "new" | "old" | "same";
  className?: string;
}

export const BreakEvenCard: React.FC<BreakEvenCardProps> = ({
  breakEven,
  recommended,
  className = "",
}) => {
  const { t } = useTranslation();

  // Show only when new regime wins and a break-even amount exists
  if (recommended !== "new" || breakEven === null || breakEven <= 0) {
    return null;
  }

  const formattedBreakEven = formatINR(breakEven, { prefixSymbol: true });

  return (
    <div
      role="region"
      aria-label="Break-even tax hint"
      className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-100 shadow-xs flex items-start gap-4 ${className}`}
    >
      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
          {t("incomeTax.breakEven.title", "Want to make the Old Regime better?")}
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {t("incomeTax.breakEven.message", {
            amount: formattedBreakEven,
            defaultValue: `You would need about ${formattedBreakEven} in total deductions for the Old Regime to be better.`,
          })}
        </p>
      </div>
    </div>
  );
};

export default BreakEvenCard;
