import React from "react";
import { useTranslation } from "react-i18next";
import { formatRupeesINR } from "../utils/money";

interface GstSplitBarProps {
  base: number;
  gstAmount: number;
  total: number;
}

export const GstSplitBar: React.FC<GstSplitBarProps> = ({
  base,
  gstAmount,
  total,
}) => {
  const { t } = useTranslation();

  if (total <= 0) return null;

  const basePercent = Math.min(100, Math.max(0, (base / total) * 100));
  const gstPercent = Math.min(100, Math.max(0, (gstAmount / total) * 100));

  const baseDisplayPercent = Math.round(basePercent);
  const gstDisplayPercent = Math.round(gstPercent);

  const ariaDescription = `Visual split: Base price is ${baseDisplayPercent}% (${formatRupeesINR(
    base
  )}), GST is ${gstDisplayPercent}% (${formatRupeesINR(gstAmount)}) of total ${formatRupeesINR(
    total
  )}`;

  return (
    <div className="space-y-2 select-none" role="region" aria-label="Base vs GST proportion">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
        <span>{t("gst.splitOverview", "Price Composition")}</span>
        <span className="text-[11px] font-normal text-slate-400">
          {baseDisplayPercent}% {t("gst.base", "Base")} • {gstDisplayPercent}% {t("gst.tax", "GST")}
        </span>
      </div>

      {/* Stacked bar */}
      <div
        role="img"
        aria-label={ariaDescription}
        className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5"
      >
        <div
          style={{ width: `${basePercent}%` }}
          className="h-full rounded-l-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 min-w-[6px]"
          title={`${t("gst.basePrice", "Base Price")}: ${formatRupeesINR(base)} (${baseDisplayPercent}%)`}
        />
        {gstAmount > 0 && (
          <div
            style={{ width: `${gstPercent}%` }}
            className="h-full rounded-r-full bg-sky-500 dark:bg-sky-400 transition-all duration-300 min-w-[6px]"
            title={`${t("gst.totalGst", "Total GST")}: ${formatRupeesINR(gstAmount)} (${gstDisplayPercent}%)`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500 shrink-0" />
          <span>
            {t("gst.basePrice", "Base Price")}:{" "}
            <strong className="text-slate-700 dark:text-slate-200 tabular-nums">
              {formatRupeesINR(base)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 dark:bg-sky-400 shrink-0" />
          <span>
            {t("gst.totalGst", "Total GST")}:{" "}
            <strong className="text-slate-700 dark:text-slate-200 tabular-nums">
              {formatRupeesINR(gstAmount)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default GstSplitBar;
