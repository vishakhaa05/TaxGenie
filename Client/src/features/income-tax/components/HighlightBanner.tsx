import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ComparisonResult } from "../types";
import { formatINR } from "../utils/formatINR";
import { Sparkles, Trophy, CheckCircle2, Bookmark, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HighlightBannerProps {
  comparison: ComparisonResult;
  onSave?: () => void;
}

export const HighlightBanner: React.FC<HighlightBannerProps> = ({ comparison, onSave }) => {
  const { t } = useTranslation();
  const { recommended, savings, newRegime, oldRegime } = comparison;
  const [saved, setSaved] = useState(false);

  const bothZero = newRegime.totalTax === 0 && oldRegime.totalTax === 0;
  const isNewBetter = recommended === "new";
  const isOldBetter = recommended === "old";
  const isSame = recommended === "same";

  const formattedSavings = formatINR(savings, { prefixSymbol: true });

  const handleSaveClick = () => {
    setSaved(true);
    if (onSave) onSave();
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="p-6 sm:p-8 rounded-3xl bg-[#0B3B2C] dark:bg-[#0D3B2E] text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-in fade-in duration-300"
    >
      <div className="space-y-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 block">
          Recommendation
        </span>
        <div className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          {bothZero ? "₹0 Tax to Pay" : formattedSavings}
        </div>
        <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
          {bothZero
            ? "Your taxable income is fully covered by standard deductions and Section 87A rebate."
            : isNewBetter
            ? "The New regime saves you more tax this year"
            : isOldBetter
            ? "The Old regime saves you more tax due to your claimed deductions"
            : "Both regimes result in the exact same tax liability"}
        </p>
      </div>

      <div className="shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onClick={handleSaveClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5A823] hover:bg-[#C88F15] text-[#0B3B2C] font-extrabold text-xs shadow-md transition-all cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-800" /> : <Bookmark className="w-4 h-4" />}
          <span>{saved ? "Calculation saved ✓" : "Save calculation"}</span>
        </button>
      </div>
    </div>
  );
};

export default HighlightBanner;
