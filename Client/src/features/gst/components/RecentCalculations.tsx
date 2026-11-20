import React from "react";
import { useTranslation } from "react-i18next";
import { History, RotateCcw, Trash2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecentCalculationItem } from "../types";
import { formatRupeesINR } from "../utils/money";

interface RecentCalculationsProps {
  items: RecentCalculationItem[];
  onUseAgain: (item: RecentCalculationItem) => void;
  onClear: () => void;
}

export const RecentCalculations: React.FC<RecentCalculationsProps> = ({
  items,
  onUseAgain,
  onClear,
}) => {
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5 pt-2 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t("gst.recentCalculations", "Recent Calculations (Session)")}
          </h4>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          title={t("gst.clearHistory", "Clear session history")}
        >
          <Trash2 className="w-3 h-3" />
          <span>{t("gst.clear", "Clear")}</span>
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs"
          >
            <div className="space-y-0.5 truncate pr-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {formatRupeesINR(item.result.total)}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                  {item.rate}% GST
                </span>
                <span className="text-[10px] uppercase font-medium text-slate-400">
                  {item.mode === "add" ? t("gst.addGst", "Add") : t("gst.removeGst", "Remove")}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                {t("gst.basePrice", "Base")}: {formatRupeesINR(item.result.base)} • {t("gst.tax", "GST")}: {formatRupeesINR(item.result.gstAmount)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUseAgain(item)}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t("gst.useAgain", "Use again")}</span>
            </button>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
        {t(
          "gst.sessionNotice",
          "Calculations are stored locally on this device for this session only (no login required)."
        )}
      </p>
    </div>
  );
};

export default RecentCalculations;
