import React from "react";
import { useTranslation } from "react-i18next";
import { formatINR } from "../utils/formatINR";
import { Lightbulb } from "lucide-react";

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
      className={`p-5 rounded-2xl bg-[#FEF3C7] dark:bg-[#2B2312] border border-[#FDE68A] dark:border-[#523F16] text-[#78350F] dark:text-[#FDE68A] shadow-xs flex items-start gap-3.5 ${className}`}
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-4 h-4" />
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
          Break-even hint
        </h4>
        <p className="text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/90 font-medium">
          You need to claim deductions worth at least <strong>{formattedBreakEven}</strong> (such as 80C, 80D, and HRA) for the Old regime to save you more tax.
        </p>
      </div>
    </div>
  );
};

export default BreakEvenCard;
